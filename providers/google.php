<?php
class Jetpack_Google_Font_Provider extends Jetpack_Font_Provider {

	protected $api_base = 'https://www.googleapis.com/webfonts/v1/webfonts';

	public $id = 'google';

	/**
	 * Constructor
	 * @param Jetpack_Fonts $custom_fonts Manager instance
	 */
	public function __construct( Jetpack_Fonts $custom_fonts ) {
		parent::__construct( $custom_fonts );
		add_filter( 'jetpack_fonts_whitelist_' . $this->id, array( $this, 'default_whitelist' ), 9 );
	}

	public function get_additional_data() {
		return array(
			'googleSubsetString' => $this->get_font_subset_string()
		);
	}

	public function body_font_whitelist(){
		return array(
			'Alegreya',
			'Alegreya+Sans',
			'Anonymous+Pro',
			'Arimo',
			'Exo+2',
			'Gentium+Book+Basic',
			'Karla',
			'Lato',
			'Lora',
			'Libre+Baskerville',
			'Merriweather',
			'Merriweather+Sans',
			'Noticia+Text',
			'Noto+Sans',
			'Noto+Serif',
			'Open+Sans',
			'PT+Sans',
			'PT+Serif',
			'Quattrocento+Sans',
			'Source+Code+Pro',
			'Source+Sans+Pro',
			'Ubuntu',
			'Vollkorn',
		);
	}

	public function headings_font_whitelist(){
		return array(
			'Abril+Fatface',
			'Cherry+Swash',
			'Cinzel',
			'Fondamento',
			'Lobster+Two',
			'Montserrat',
			'Muli',
			'Oswald',
			'Playfair+Display',
			'Roboto+Slab',
			'Tangerine',
		);
	}

	public function default_whitelist( $whitelist ) {
		$all_fonts = array_merge ( $this->body_font_whitelist(), $this->headings_font_whitelist() );
		return $all_fonts;
	}

	/**
	 * Retrieve fonts from the API
	 * @return array List of fonts
	 */
	public function retrieve_fonts() {
		$response = $this->api_get();
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}
		$fonts = wp_remote_retrieve_body( $response );
		$fonts = json_decode( $fonts, true );
		$fonts = array_map( array( $this, 'format_font' ), $fonts['items'] );
		return $fonts;
	}

	// TEMP
	public function get_api_key() {
		return 'AIzaSyBUK3PeqSEzwPNIyg94dBQpziFOPvm7-aA';
	}

	/**
	 * Converts a font from API format to internal format.
	 * @param  array $font API font
	 * @return array       Formatted font
	 */
	public function format_font( $font ) {
		$formatted = array(
			'id'   => urlencode( $font['family'] ),
			'cssName' => $font['family'],
			'displayName' => $font['family'],
			'fvds' => $this->variants_to_fvds( $font['variants'] ),
			'subsets' => $font['subsets'],
			'bodyText' => in_array( urlencode( $font['family'] ), $this->body_font_whitelist() )
		);
		return $formatted;
	}

	/**
	 * Converts API variants to Font Variant Descriptions
	 * @param  array $variants
	 * @return array           FVDs
	 */
	private function variants_to_fvds( $variants ) {
		$fvds = array();
		foreach( $variants as $variant ) {
			array_push( $fvds, $this->variant_to_fvd( $variant ) );
		}
		return $fvds;
	}

	/**
	 * Convert an API variant to a Font Variant Description
	 * @param  string $variant API variant
	 * @return string          FVD
	 */
	private function variant_to_fvd( $variant ) {
		$variant = strtolower( $variant );

		if ( false !== strpos( $variant, 'italic' ) ) {
			$style = 'i';
			$weight = str_replace( 'italic', '', $variant );
		} elseif ( false !== strpos( $variant, 'oblique' ) ) {
			$style = 'o';
			$weight = str_replace( 'oblique', '', $variant );
		} else {
			$style = 'n';
			$weight = $variant;
		}

		if ( 'regular' === $weight || 'normal' === $weight || '' === $weight ) {
			$weight = '400';
		}
		$weight = substr( $weight, 0, 1 );
		return $style . $weight;
	}

	/**
	 * Adds an appropriate Google Fonts stylesheet to the page. Will not be called
	 * with an empty array.
	 * @param  array $fonts List of fonts.
	 * @return void
	 */
	public function render_fonts( $fonts ) {
	}

	public function get_webfont_config_option( $fonts ) {
		return array( 'google' => array( 'families' => $this->convert_fonts_to_families( $fonts ) ) );
	}

	/**
	 * Return an array of string versions of the font choices as used by the
	 * Google API's JavaScript function.
	 *
	 * Example output: `[ 'Lato:400,100italic:latin,latin-ext', 'Open+Sans:400italic,400,600:latin,latin-ext' ]`
	 *
	 * @param array $fonts The list of fonts to convert.
	 * @return array The `families` strings expected by Google.
	 */
	public function convert_fonts_to_families( $fonts ) {
		$api_fonts = array();
		foreach( $fonts as $font ) {
			if ( isset( $font['currentFvd'] ) ) {
				$current_variant = [ $font['currentFvd'] ];
			} else {
				$current_variant = [ 'n4', 'i4', 'n7', 'i7' ];
			}
			$family = $font['id'] . ':' . $this->fvds_to_api_string( $current_variant );
			$subsets = $this->get_font_subset_string();
			if ( strlen( $subsets ) > 0 ) {
				$family .= ':' . $subsets;
			}
			array_push( $api_fonts, $family );
		}
		return $api_fonts;
	}

	/**
	 * Return the Google API URL used by render_fonts
	 * @param array $fonts List of fonts.
	 * @return string   The URL
	 */
	public function get_fonts_api_url( $fonts ) {
		$base = '//fonts.googleapis.com/css?family=';
		$api_fonts = array();
		foreach( $fonts as $font ) {
			if ( isset( $font['currentFvd'] ) ) {
				$current_variant = [ $font['currentFvd'] ];
			} else {
				$current_variant = [ 'n4', 'i4', 'n7', 'i7' ];
			}
			$api_fonts[] = $font['id'] . ':' . $this->fvds_to_api_string( $current_variant );
		}
		$api_url = $base . implode( '|', $api_fonts );
		$subsets = $this->get_font_subset_string();
		if ( strlen( $subsets ) > 0 ) {
			$api_url .= '&subset=' . urlencode( $subsets );
		}
		return $api_url;
	}

	/**
	 * Return the subset string for the current subset specified in the
	 * translation file for the string `no-subset`.
	 * @return string  The subset string for use by get_fonts_api_url
	 */
	public function get_font_subset_string() {
		$subset_string = 'latin,latin-ext';
		$subset = _x( 'no-subset', 'Add new subset (greek, cyrillic, devanagari, vietnamese)', 'custom-fonts' );
		if ( 'cyrillic' === $subset ) {
			$subset_string .= ',cyrillic,cyrillic-ext';
		} elseif ( 'greek' === $subset ) {
			$subset_string .= ',greek,greek-ext';
		} elseif ( 'devanagari' === $subset ) {
			$subset_string .= ',devanagari';
		} elseif ( 'vietnamese' === $subset ) {
			$subset_string .= ',vietnamese';
		}
		return $subset_string;
	}

	/**
	 * Convert FVDs to an API string for variants.
	 * @param  array $fvds FVDs
	 * @return string      API variants
	 */
	private function fvds_to_api_string( $fvds ) {
		$to_return = array();
		foreach( $fvds as $fvd ) {
			switch ( $fvd ) {
				case 'n4':
					$to_return[] = 'r'; break;
				case 'i4':
					$to_return[] = 'i'; break;
				case 'n7':
					$to_return[] = 'b'; break;
				case 'i7':
					$to_return[] = 'bi'; break;
				default:
					$style = substr( $fvd, 1, 1 ) . '00';
					if ( 'i' === substr( $fvd, 0, 1 ) ) {
						$style .= 'i';
					}
					$to_return[] = $style;
			}
		}
		return implode( ',', $to_return );
	}

	/**
	 * The URL for your frontend customizer script. Underscore and jQuery
	 * will be called as dependencies.
	 * @return string
	 */
	public function customizer_frontend_script_url() {

	}

	/**
	 * The URL for your admin customizer script to enable your control.
	 * Backbone, Underscore, and jQuery will be called as dependencies.
	 * @return string
	 */
	public function customizer_admin_script_url() {

	}

	/**
	 * Get all available fonts from Google.
	 * @return array A list of fonts.
	 */
	public function get_fonts() {
		if ( $fonts = $this->get_cached_fonts() ) {
			return $fonts;
		}
		$fonts = $this->retrieve_fonts();
		if ( $fonts ) {
			$this->set_cached_fonts( $fonts );
			return $fonts;
		}
		return array();
	}

	/**
	 * We need this for our abstract class extension but with Google we have no need for saving to
	 * an API since it's completely free.
	 * @param  array $fonts  A list of fonts.
	 * @return array         A potentially modified list of fonts.
	 */
	public function save_fonts( $fonts ) {
		return $fonts;
	}
}
