<?php
class Jetpack_Google_Font_Provider extends Jetpack_Font_Provider {

	const API_BASE = 'https://www.googleapis.com/webfonts/v1/webfonts';

	public $id = 'google';

	public function get_api_url( $path = '', $args = array() ) {
		$url = self::API_BASE . $path;
		$args['key'] = $this->get_api_key();
		return add_query_arg( $args, $url );
	}

	public function api_request( $method = 'GET', $path = '', $args = array(), $headers = array() ) {
		$url = $this->get_api_url( $path );
		$args['method'] = $method;
		$args['headers'] = $headers;
		$request = wp_remote_request( $url, $args );
		return $request;
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
		$fonts = $this->get_cached_fonts();
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