<?php
class Jetpack_Google_Font_Provider extends Jetpack_Font_Provider {

	protected $api_base = 'https://www.googleapis.com/webfonts/v1/webfonts';

	public $id = 'google';

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

	public function format_font( $font ) {
		$formatted = array(
			'id'   => urlencode( $font['family'] ),
			'name' => $font['family'],
			'fvds' => $this->variants_to_fvds( $font['variants'] ),
			'subsets' => $font['subsets']
		);
		return $formatted;
	}

	private function variants_to_fvds( $variants ) {
		$fvds = array();
		foreach( $variants as $variant ) {
			$fvd = $this->variant_to_fvd( $variant );
			$fvds[ $fvd ] = $this->fvd_to_variant_name( $fvd );
		}
		return $fvds;
	}

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
	 * @return null
	 */
	public function render_fonts( $fonts ) {
		$base = '//fonts.googleapis.com/css?family=';
		$api_fonts = array();
		foreach( $fonts as $font ) {
			$api_fonts[] = $font['id'] . ':' . $this->fvds_to_api_string( $font['fvds'] );
		}
		$api_url = $base . implode( '|', $api_fonts );
		wp_enqueue_style( 'jetpack-' .$this->id . '-fonts', $api_url, array(), null );
	}

	/**
	 * Take a list of fonts and return the list with a `css_name` property
	 * on each font array for rendering CSS rules.
	 * @param array  $fonts List of fonts
	 * @return array List of fonts with a `css_name` property.
	 */
	public function font_list_with_css_names( $fonts ) {
		foreach( $fonts as $i => $font ) {
			$font_data = $this->get_font( $font['id'] );
			$fonts[ $i ]['css_name'] = $font_data['name'];
		}
		return $fonts;
	}

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
	 * @param  array $fonts     A list of fonts.
	 * @return boolean|WP_Error true on success, WP_Error instance on failure.
	 */
	public function save_fonts( $fonts ) {
		// it always works!
		return true;
	}
}