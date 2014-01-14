<?php
class Jetpack_Google_Font_Provider extends Jetpack_Font_Provider {

	const API_BASE = 'https://www.googleapis.com/webfonts/v1/webfonts';

	public $id = 'google';

	public function get_api_url( $path = '', $args = array() ) {
		$url = self::API_BASE . $path;
		$args['key'] = $this->get_api_key();
		return add_query_arg( $args, $url );
	}

	public function api_request( $method = 'GET', $path = '', $args = array() ) {
		$url = $this->get_api_url( $path );
		$args['method'] = $method;
		$request = wp_remote_request( $url, $args );
		return $request;
	}

	public function api_get( $path = '', $args = array() ) {
		return $this->api_request( 'GET', $path = '', $args );
	}

	public function api_post( $path = '', $data = array(), $args = array() ) {
		$args['body'] = $data;
		return $this->api_request( 'GET', $path = '', $args );
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
	 * Get all available fonts from this provider. You will likely need to implement
	 * fetching from an API to do this.
	 * @return array An array of fonts. See HACKING.md for the format of each font.
	 */
	public function get_fonts() {
		if ( $fonts = $this->get_cached_fonts() ) {
			return $fonts;
		}


	}

	/**
	 * We need this for our abstract class extension but with Google we have no need for saving to
	 * an API since it's completely free.
	 * @param  array $fonts     An array of fonts.
	 * @return boolean|WP_Error true on success, WP_Error instance on failure.
	 */
	public function save_fonts( $fonts ) {
		// it always works!
		return true;
	}
}