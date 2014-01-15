<?php

abstract class Jetpack_Font_Provider {

	const API_KEYS_OPTION = 'jetpack_api_keys';

	public $transient_timeout = 43200; // 12 hours

	/**
	 * An ID for your module. Will be used in various places.
	 * Ideally keep it short, like 'google' or 'typekit'.
	 * @var string
	 */
	public $id = 'your-module-id';

	/**
	 * If this provider needs and API key to function (likely), then an admin UI will be created for it.
	 * You can alternately do define( $module_class . 'FONTS_API_KEY' )
	 * @var boolean
	 */
	public $needs_api_key = true;

	/**
	 * The URL for your frontend customizer script. Underscore and jQuery
	 * will be called as dependencies.
	 * @return string
	 */
	abstract public function customizer_frontend_script_url();

	/**
	 * The URL for your admin customizer script to enable your control.
	 * Backbone, Underscore, and jQuery will be called as dependencies.
	 * @return string
	 */
	abstract public function customizer_admin_script_url();

	/**
	 * Get all available fonts from this provider. You will likely need to implement
	 * fetching from an API to do this.
	 * @return array An array of fonts. See HACKING.md for the format of each font.
	 */
	abstract public function get_fonts();

	/**
	 * A constant can be optionally set for the API key. The UI for adding a key won't be needed
	 * in that case.
	 * @return string|bool The API key if one is set, false if not.
	 */
	public function get_api_key_constant() {
		// allow a constant for the API key without needing the UI.
		$constant = 'JETPACK_' . strtoupper( $this->id ) . '_FONTS_API_KEY';
		return defined( $constant ) ? constant( $constant ) : false;
	}

	/**
	 * APIs need keys. This gets one that is supplied either by a constant, the UI managed
	 * by the central plugin, or returns an empty string if neither are available.
	 * @return string|bool The API key on success, false on failure
	 */
	public function get_api_key() {
		if ( $constant = $this->get_api_key_constant() ) {
			return $constant;
		}

		$keys = get_option( self::API_KEYS_OPTION, array() );
		if ( isset( $keys[ $this->id ] ) ) {
			return $keys[ $this->id ];
		}

		return false;
	}

	/**
	 * Is this API currently available?
	 * @return boolean
	 */
	public function is_api_available() {
		$constant = 'JETPACK_' . strtoupper( $this->id ) . '_FONTS_DISABLED';
		if ( defined( $constant ) && true === constant( $constant ) ) {
			return false;
		}
		// otherwise, go with presence of API key, which return false if there isn't one
		return $this->get_api_key();
	}

	/**
	 * Save one or more fonts of this type to the provider's API. Note that the
	 * actual font data is saved centrally by the plugin: this is only to save
	 * to some form of provider "kit".
	 * @param  array $fonts     An array of fonts. An empty array will delete fonts from the API.
	 *                          See HACKING.md for the format of each font.
	 * @return boolean|WP_Error true on success, WP_Error instance on failure.
	 */
	abstract public function save_fonts( $fonts );

	/**
	 * Get a cache ID. Used in @see get_cached_fonts() and @see set_cached_fonts()
	 * @return string Cache ID.
	 */
	private function get_cache_id() {
		return 'jetpack_' . $this->id . '_fonts_list';
	}

	/**
	 * Most providers will want to cache a list of fonts rather than hitting the provider's
	 * API every time.
	 * @return array|boolean Cached fonts on successful cache hit, false on failure
	 */
	protected function get_cached_fonts() {
		return get_transient( $this->get_cache_id() );
	}

	/**
	 * Store a provider's list of fonts
	 * @return boolean Fonts successfully cached
	protected function set_cached_fonts( $fonts ) {
		return set_transient( $this->get_cache_id(), $fonts, $this->transient_timeout );
	}
	/**
	 * @return boolean Font cache successfully flushed
		return delete_transient( $this->get_cache_id() );
	}
}