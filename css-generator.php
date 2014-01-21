<?php

class Jetpack_Custom_Fonts_Css_Generator {

	/**
	 * Holds allowed font category types. @see `jetpack_custom_fonts_rule_types` action
	 * @var array
	 */
	private $allowed_types = array();

	/**
	 * Holds font rules added for a theme.
	 * @var array
	 */
	private $rules = array();

	/**
	 * Holds the separaotr to use when printing font CSS.
	 * @var string
	 */
	private $sep = '';

	/**
	 * Constructor
	 */
	public function __construct(){
		$default_types = array( 'body-text', 'headings' );
		$this->allowed_types = apply_filters( 'jetpack_custom_fonts_rule_types', $default_types );
		foreach( $this->allowed_types as $type ) {
			$this->rules[ $type ] = array();
		}
		if ( defined( 'SCRIPT_DEGUG' ) && SCRIPT_DEGUG ) {
			$this->sep = "\n";
		}
	}

	/**
	 * Main public method for adding font rules for a theme.
	 *
	 * Each theme can add multilple rules on the `jetpack_custom_fonts_rules` action
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
	 * Get the current theme's font rules.
	 * @return array
	 */
	public function get_rules() {
		## TEMP !
		'twentyfourteen' === get_stylesheet() && require_once( __DIR__ . '/annotations.php' );
		do_action( 'jetpack_custom_fonts_rules', $this );
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
		if ( ! in_array( $rule['type'], $this->allowed_types ) ) {
			throw new Exception( 'Your type of '. $rule['type'] . 'is not allowed. Use one of ' . implode( ',', $this->allowed_types ) . '.' );
		}
		if ( ! is_array( $rule['rules'] ) || empty( $rule['rules'] ) ) {
			throw new Exception( 'You must supply at least one array in the $rule[\'rules\'] array.' );
		}
	}

	/**
	 * Returns Font CSS for current set of selected fonts and rules.
	 * @param  array $fonts list of selected fonts
	 * @return string       CSS for selected fonts
	 */
	public function get_css( $fonts ) {
		$css = '';
		$supplied_types =  wp_list_pluck( $fonts, 'type' );
		foreach ( $this->get_rules() as $type => $rules ) {
			if ( empty( $rules ) || ! in_array( $type, $supplied_types) ) {
				continue;
			}
			$font = wp_list_filter( $fonts, array( 'type' => $type ) );
			$font = array_shift( $font );
			$css .= $this->do_rules( $font, $rules );
		}
		return $css;
	}

	/**
	 * Return CSS for a specific type of font rules.
	 * @param  array $font  Specified font for this set of rules
	 * @param  array $rules Declared rules for this font rule
	 * @return string       CSS for this font + rules
	 */
	private function do_rules( $font, $rules ) {
		$css_rules = array();
		foreach ( $rules as $rule ) {
			$css  = $this->css_open( $rule );
			$css .= $this->css_rules( $rule['rules'], $font );
			$css .= $this->css_close( $rule );
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
	private function css_rules( $rules, $font ) {
		$css_rules = array();
		$rule_sep = $this->sep ? ";\n" : ';';
		foreach( $rules as $rule ) {
			switch( $rule['property'] ) {
				case 'font-family' :
					$value = $font['css_name'] . ',' . $rule['value'];
					break;
				default:
					$value = false;
			}
			if ( $value ) {
				$css_rules[] = $rule['property'] . ':' . $value;
			}
		}
		return implode( $rule_sep, $css_rules );
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
		$ret .= $rule['selector'] . '{' . $this->sep;
		return $ret;
	}

	/**
	 * Close a CSS selector.
	 * @param  array $rule CSS rule
	 * @return string      Closing of a CSS selector
	 */
	private function css_close( $rule ) {
		$ret = '';
		if ( $rule['media_query'] ) {
			$ret .= '}' . $this->sep;
		}
		$ret .= '}' . $this->sep;
		return $ret;
	}

}