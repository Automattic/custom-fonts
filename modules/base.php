<?php

abstract class Jetpack_Custom_Fonts_Module {

	/**
	 * An ID for your module. Will be used in various places.
	 * Ideally keep it short, like 'google' or 'typekit'.
	 * @var string
	 */
	public $id = 'your-module-id';

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
	 * Get all available fonts from this provider
	 * @return array An array of fonts. See HACKING.md for the format of each font.
	 */
	public function get_fonts() {

	}

	/**
	 * Save one or more fonts of this type to the provider's API. Note that the
	 * actual font data is saved centrally by the plugin: this is only to save
	 * to some form of provider "kit".
	 * @param  array $fonts     An array of fonts. An empty array will delete fonts from the API.
	 *                          See HACKING.md for the format of each font.
	 * @return boolean|WP_Error true on success, WP_Error instance on failure.
	 */
	public function save_fonts( $fonts ) {
	}
}