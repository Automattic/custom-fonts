<?php

class Jetpack_Fonts_Css_Generator {

	const CSS_FONT_SIZE_VALUE_RX = '/((\d*\.(\d+))|(\d+))([A-Za-z]{2,3}|%)/';

	/**
	 * Holds allowed font category types. @see `jetpack_fonts_rule_types` action
	 * @var array
	 */
	private $rule_types = array();

	/**
	 * Holds font rules added for a theme.
	 * @var array
	 */
	private $rules = array();

	/**
	 * Holds font pairs added.
	 * @var array
	 */
	private $pairs = array();

	/**
	 * Holds the separator to use when printing font CSS.
	 * @var string
	 */
	private $sep = '';

	/**
	 * The selector prefix.
	 *
	 * @var string
	 */
	private $selector_prefix;

	/**
	 * Constructor
	 */
	public function __construct( $selector_prefix = '.wf-active' ) {
		require_once( __DIR__ . '/lib/Fvd.php' );

		$this->selector_prefix = trim( $selector_prefix ) . ' ';

		$default_types = array(
			array(
				'id'        => 'site-title',
				'name'      => __( 'Site Title' ),
				'bodyText'  => true,
				'fvdAdjust' => true,
				'sizeRange' => 3
			),
			array(
				'id'        => 'body-text',
				'name'      => __( 'Base Font' ),
				'bodyText'  => true,
				'fvdAdjust' => false,
				'sizeRange' => 3
			),
			array(
				'id'        => 'headings',
				'name'      => __( 'Headings' ),
				'bodyText'  => false,
				'fvdAdjust' => true,
				'sizeRange' => 10
			)
		);
		$this->rule_types = apply_filters( 'jetpack_fonts_rule_types', $default_types );

		foreach( $this->rule_types as $type ) {
			$this->rules[ $type['id'] ] = array();
		}

		add_action( 'jetpack_fonts_pairs', array( $this, 'default_pairs' ), 9 );

		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$this->sep = "\n";
		}
	}

	/**
	 * Main public method for adding font rules for a theme.
	 *
	 * Each theme can add multilple rules on the `jetpack_fonts_rules` action
	 * @param array $rule Rule array.
	 */
	public function add_rule( $rule ) {
		$this->validate_rule( $rule );
		$type = $rule['type'];
		unset( $rule['type'] );
		$rule = array_merge( array( 'media_query' => '' ), $rule );
		$this->rules[ $type ][] = $rule;
	}

	/**
	 * Whether or not there are rules currently set
	 * @return bool
	 */
	public function has_rules() {
		foreach( array_values( $this->rules ) as $rules ) {
			if ( ! empty( $rules ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Get the current theme's font rules.
	 * @return array
	 */
	public function get_rules() {
		// If we already have rules, bail and return 'em
		if ( $this->has_rules() ) {
			return $this->rules;
		}

		// Load from a theme's annotation file
		$location = get_stylesheet_directory() . '/inc/jetpack-fonts.php';
		$location = apply_filters( 'jetpack_fonts_annotations_src', $location );
		if ( file_exists( $location ) ) {
			include_once $location;
		} else if ( is_child_theme() ) {
			$location = get_template_directory() . '/inc/jetpack-fonts.php';
			if ( file_exists( $location ) ) {
				include_once $location;
			}
		}

		// annotation files hook into this to add rules
		do_action( 'jetpack_fonts_rules', $this );
		return $this->rules;
	}

	/**
	 * Ensures that every font rule contains what is required for a font rule. Throws Exception if not.
	 * @param  array $rule Font rule.
	 * @return void
	 */
	private function validate_rule( $rule ) {
		foreach( array( 'type', 'selector', 'rules') as $key ) {
			if ( ! isset( $rule[ $key ] ) ) {
				throw new Exception( 'You must supply a \'' . $key . '\' attribute on your rule.' );
			}
		}
		if ( ! in_array( $rule['type'], $this->get_allowed_types() ) ) {
			throw new Exception( 'Your type of '. $rule['type'] . ' is not allowed. Use one of ' . implode( ', ', $this->get_allowed_types() ) . '.' );
		}
		if ( ! is_array( $rule['rules'] ) || empty( $rule['rules'] ) ) {
			throw new Exception( 'You must supply at least one array in the $rule[\'rules\'] array.' );
		}
		if ( (bool) count( array_filter( array_keys( $rule['rules'] ), 'is_string') ) ) {
			throw new Exception( 'You must supply at least one numeric indexed array in the $rule[\'rules\'] array.' );
		}
	}

	/**
	 * Get a specific rule type by id.
	 * @param  string $type_id  They type id to look up
	 * @return array|bool       The rule type array on success, false on failure to find
	 */
	public function get_rule_type( $type_id ) {
		$filtered = wp_list_filter( $this->rule_types, array( 'id' => $type_id ) );
		if ( ! empty( $filtered ) ) {
			return array_shift( $filtered );
		}
		return false;
	}

	public function get_rule_types() {
		return $this->rule_types;
	}

	public function get_allowed_types() {
		return wp_list_pluck( $this->rule_types, 'id' );
	}

	public function get_pairs() {
		if ( ! did_action( 'jetpack_fonts_pairs' ) ) {
			do_action( 'jetpack_fonts_pairs', $this );
		}
		return $this->pairs;
	}

	public function add_pair( $pair ) {
		if ( $pair = $this->validate_pair( $pair ) ) {
			$this->pairs[] = $pair;
		}
	}

	public function default_pairs() {
		include dirname( __FILE__ ) . '/default-font-pairs.php';
	}

	protected function validate_pair( $pair ) {
		return array_map( array( $this, 'validate_pair_font' ), $pair );
	}

	protected function validate_pair_font( $font ) {
		foreach( array( 'type', 'provider', 'id' ) as $key ) {
			if ( ! isset( $font[ $key ] ) ) {
				throw new Exception( 'You must supply a \'' . $key . '\' attribute on your font.' );
			}
		}
		if ( ! in_array( $font['type'], $this->get_allowed_types() ) ) {
			throw new Exception( 'Your type of '. $font['type'] . 'is not allowed. Use one of ' . implode( ',', $this->get_allowed_types() ) . '.' );
		}

		if ( ! isset( $font['fvds'] ) || ! is_array( $font['fvds'] ) ) {
			switch( $font['type'] ) {
				case 'body-text' :
					$font['fvds'] = array( 'n4', 'i4', 'n7', 'i7' );
					break;
				case 'headings' :
					if ( isset( $font['fvds'] ) && is_string( $font['fvds'] ) ) {
						$font['fvds'] = (array) $font['fvds'];
					} else {
						$font['currentFvd'] = 'n4';
						$font['fvds'] = array( 'n4' );
					}
			}
		}
		return $font;
	}

	/**
	 * Returns Font CSS for current set of selected fonts and rules.
	 * @param  array $fonts list of selected fonts
	 * @return string       CSS for selected fonts
	 */
	public function get_css( $fonts ) {
		$css = $this->sep;
		$supplied_types = wp_list_pluck( $fonts, 'type' );
		if ( in_array( 'headings', $supplied_types ) && ! in_array( 'site-title', $supplied_types ) ) {
			array_push( $supplied_types, 'site-title' );
		}
		foreach ( $this->get_rules() as $type => $rules ) {
			if ( empty( $rules ) || ! in_array( $type, $supplied_types ) ) {
				continue;
			}
			$font = $this->list_entry_item_by( $fonts, array( 'type' => $type ) );
			// If there is no site-title setting, assume it's actually headings
			if ( ! $font && $type === 'site-title' ) {
				$font = $this->list_entry_item_by( $fonts, array( 'type' => 'headings' ) );
			}
			if ( ! $font ) {
				continue;
			}
			$rule_type = $this->list_entry_item_by( $this->get_rule_types(), array( 'id' => $type ) );
			$css .= $this->do_rules( $font, $rules, $rule_type );
		}
		return $css;
	}

	/**
	 * Like wp_list_filter, except the first matching item is returned.
	 * @param  array $list     An array of objects to filter
	 * @param array $args An array of key => value arguments to match against each object
	 * @return mixed The first found object is successful, false if not.
	 */
	private function list_entry_item_by( $list, $args ) {
		$result = wp_list_filter( $list, $args );
		if ( ! empty( $result ) ) {
			return array_shift( $result );
		}
		return false;
	}

	/**
	 * Return CSS for a specific type of font rules.
	 * @param  array $font      Specified font for this set of rules
	 * @param  array $rules     Declared rules for this font rule
	 * @param  array $rule_type This set of $rules's type info
	 * @return string           CSS for this font + rules
	 */
	private function do_rules( $font, $rules, $rule_type ) {
		$css_rules = array();
		foreach ( $rules as $rule ) {
			$css = $this->css_rules( $rule['rules'], $font, $rule_type );
			if ( empty ( $css ) ) {
				continue;
			}
			$css = $this->css_open( $rule ) . $css . $this->css_close( $rule );
			array_push( $css_rules, $css );
		}
		return implode( $this->sep, $css_rules );
	}

	/**
	 * Return CSS property and value pairs for a set of rules and a font.
	 * @param  array $rules CSS property and value rules
	 * @param  array $font  A font for this font type
	 * @return string       CSS (property: value)s
	 */
	private function css_rules( $rules, $font, $type ) {
		$css_rules = array();
		$declaration_sep = ';' . $this->sep;
		$rule_sep = $this->sep ? ': ' : ':';
		$indent = $this->sep ? "\t" : '';
		$rules = $this->shim_rules_for_type( $rules, $type );
		foreach( $rules as $rule ) {
			switch( $rule['property'] ) {
				case 'font-family':
					$value = $this->maybe_font_stack( $font );
					break;
				case 'font-weight':
					$value = $this->pick_weight( $font, $rule['value'] );
					break;
				case 'font-size':
					$value = $this->maybe_scale_font( $font, $rule['value'] );
					break;
				case 'font-style':
					$value = $this->pick_style( $font, $rule['value'] );
					break;
				default:
					$value = false;
			}
			if ( $value ) {
				$css_rules[] = $indent . $rule['property'] . $rule_sep . $value;
			}
		}
		return implode( $declaration_sep, $css_rules );
	}

	public function maybe_font_stack( $font ) {
		$font_names = explode( ',', str_replace( '"', '', $font['cssName'] ) );
		$generic = $font['genericFamily'];
		$final_font_names = array();

		// Add quotes to every font just in case
		foreach( $font_names as $font_name ) {
			array_push( $final_font_names, '"' . $font_name . '"' );
		}
		// Allow other plugins to modify the font stack
		$final_font_names = apply_filters( 'jetpack_fonts_font_families_css', $final_font_names, $font );
		// Assume that the generic family includes quotes
		if ( ! empty( $generic ) ) {
			array_push( $final_font_names, $generic );
		}
		return implode( ',', $final_font_names );
	}

	private function shim_rules_for_type( $rules, $type ) {
		$needs_style = ! $this->list_entry_item_by( $rules, array( 'property' => 'font-style' ) );
		$needs_weight = ! $this->list_entry_item_by( $rules, array( 'property' => 'font-weight' ) );
		if ( $needs_style ) {
			array_push( $rules, array( 'property' => 'font-style', 'value' => 'normal' ) );
		}
		if ( $needs_weight ) {
			array_push( $rules, array( 'property' => 'font-weight', 'value' => 'normal' ) );
		}
		return $rules;
	}

	private function maybe_scale_font( $font, $value ) {
		if ( ! isset( $font['size'] ) || ! $font['size'] ) {
			return false;
		}
		$matches = array();
		if ( ! preg_match( self::CSS_FONT_SIZE_VALUE_RX, $value, $matches ) ) {
			return false;
		}
		$scale = (int) $font['size'] * 0.06 + 1;
		$units = $matches[5];
		if ( ! empty( $matches[4] ) ) {
			// Integer size
			$new_value = intval( $matches[4] );
			$precision = ( $new_value > 9 ) ? 1 : 3;
		} else {
			// Floating point value
			$new_value = floatval( $matches[2] );
			$precision = strlen( $matches[3] ) + 1;
		}
		$new_value = round( $new_value * $scale, $precision );
		return (string) $new_value . $units;
	}

	private function pick_weight( $font, $default_weight ) {
		if ( ! $this->is_font_adjustable( $font ) ) {
			return;
		}
		if ( !empty( $font['currentFvd'] ) ) {
			return $this->get_weight_from_fvd( $font['currentFvd'] );
		}
		if ( $default_weight ) {
			return $default_weight;
		}
		if ( array_key_exists( 'fvds', $font ) && is_array( $font['fvds'] ) ) {
			$weights = array_map( array( $this, 'get_weight_from_fvd' ), $font['fvds'] );
			asort( $weights );
			return array_shift( $weights );
		}
		return '400';
	}

	private function is_font_adjustable( $font ) {
		$type = $this->get_rule_type( $font['type'] );
		return ( true === $type['fvdAdjust'] );
	}


	private function get_weight_from_fvd( $fvd ) {
		try {
			$parsed = kevintweber\KtwFvd\Fvd::Parse( $fvd );
			if ( $parsed && $parsed[ 'font-weight' ] ) {
				return $parsed[ 'font-weight' ];
			}
		} catch( Exception $e ) {
			// fall back to the default
		}
		return '400';
	}

	private function pick_style( $font, $default_style ) {
		if ( ! $this->is_font_adjustable( $font ) ) {
			return;
		}
		if ( !empty( $font['currentFvd'] ) ) {
			return $this->get_style_from_fvd( $font['currentFvd'] );
		}
		if ( $default_style ) {
			return $default_style;
		}
		return 'normal';
	}

	private function get_style_from_fvd( $fvd ) {
		try {
			$parsed = kevintweber\KtwFvd\Fvd::Parse( $fvd );
			if ( $parsed && $parsed[ 'font-style' ] ) {
				return $parsed[ 'font-style' ];
			}
		} catch( Exception $e ) {
			// fall back to the default
		}
		return 'normal';
	}


	private function generate_selector( $selector_group ) {
		$selectors = preg_split( '/,\s*/', $selector_group );
		$new_selectors = array();
		foreach( $selectors as $selector ) {
			$new_selectors[] = $this->selector_prefix . $selector;
		}
		return implode( ', ', $new_selectors );
	}

	/**
	 * Open a CSS selector.
	 * @param  array $rule CSS rule
	 * @return string      Opening of a CSS selector
	 */
	private function css_open( $rule ) {
		$ret = '';
		if ( $rule['media_query'] ) {
			$ret .= '@media ' . $rule['media_query'] . '{' . $this->sep;
		}
		$ret .= $this->generate_selector( $rule['selector'] ) . '{' . $this->sep;
		return $ret;
	}

	/**
	 * Close a CSS selector.
	 * @param  array $rule CSS rule
	 * @return string      Closing of a CSS selector
	 */
	private function css_close( $rule ) {
		$ret = $this->sep;
		if ( $rule['media_query'] ) {
			$ret .= '}' . $this->sep;
		}
		$ret .= '}' . $this->sep;
		return $ret;
	}

}
