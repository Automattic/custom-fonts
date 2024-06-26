<?php

abstract class Jetpack_Font_Provider {

	/**
	 * Cached font lists expire after this duration
	 * @var integer
	 */
	public $transient_timeout = 43200; // 12 hours

	/**
	 * Change this to force a refresh of the cached font list in
	 * production. Useful for when our `format_font` schema changes.
	 */
	protected $api_version = 1;

	/**
	 * REQUIRED for the api_* functions to work, unless you override them.
	 * @var string
	 */
	protected $api_base = '';

	/**
	 * REQUIRED if your API uses an HTTP header for authentication. Use a sprintf-style
	 * string like `X-TOKEN: %s` or `Authorization: Bearer %s`.
	 * @var string
	 */
	protected $api_auth_header;

	/**
	 * An ID for your module. Will be used in various places.
	 * Ideally keep it short, like 'google' or 'typekit'.
	 * @var string
	 */
	public $id = 'your-module-id';

	/**
	 * Holds the Jetpack_Fonts manager object
	 * @var object
	 */
	private $manager;

	/**
	 * If this provider needs and API key to function (likely), then an admin UI will be created for it.
	 * You can alternately do define( $module_class . 'FONTS_API_KEY' )
	 * @var boolean
	 */
	public $needs_api_key = true;

	/**
	 * Constructor
	 * @param Jetpack_Fonts $custom_fonts Manager instance
	 */
	public function __construct( Jetpack_Fonts $custom_fonts ) {
		$this->manager = $custom_fonts;
	}

	/**
	 * A method that can be overridden to conditionally disable/enable this
	 * provider. If it returns false, the provider will not be used to render
	 * fonts on a page and its fonts will not be available in the customizer.
	 *
	 * @return boolean True if the provider can be used to offer and render fonts.
	 */
	public function is_active() {
		return true;
	}

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
	 * @return array A list of fonts. See HACKING.md for the format of each font.
	 */
	abstract public function get_fonts();

	/**
	 * Return a string-keyed array of additional data that this provider needs to
	 * bootstrap into the JavaScript for the preview. Whatever is returned by this
	 * function will be available in the preview under
	 * `_JetpackFonts.providerData`.
	 * @return array Additional data for the preview JavaScript
	 */
	public function get_additional_data() {
		return array();
	}

	/**
	 * Get a saved value for this provider.
	 * @param string $name    The name of the value to fetch.
	 * @param bool   $default Optional default value if nothing is found.
	 * @return mixed The option value on success, $default on failure
	 */
	public function get( $name, $default = false ) {
		$name = $this->id . '_' . $name;
		return $this->manager->get( $name, $default );
	}

	/**
	 * Set a saved value for this provider.
	 * @param string $name    The name of the value to save.
	 * @param mixed  $value   The value to save.
	 * @return bool  True if option value has changed, false if not or if update failed
	 */
	public function set( $name, $value ) {
		$name = $this->id . '_' . $name;
		return $this->manager->set( $name, $value );
	}

	/**
	 * Deletes a saved value for this provider
	 * @param  string $name The option name to delete
	 * @return void
	 */
	public function delete( $name ) {
		$name = $this->id . '_' . $name;
		return $this->manager->delete( $name );
	}

	/**
	 * Get available fonts from this provider, including a provider param
	 * @param  boolean $use_whitelist Whether or not to use the whitelist
	 * @return array                  Font associative arrays for provider
	 */
	public function get_fonts_with_provider( $use_whitelist = true ) {
		if ( ! $this->is_active() ) {
			return array();
		}
		$fonts = array();
		foreach( $this->get_fonts() as $font ) {
			if ( $use_whitelist && ! $this->in_whitelist( $font ) ) {
				continue;
			}
			$font['provider'] = $this->id;
			$fonts[] = $font;
		}
		return $fonts;
	}

	public function in_whitelist( $font ) {
		$whitelist = $this->get_whitelist();
		if ( empty( $whitelist ) ) {
			return true;
		}
		return in_array( $font['id'] ?? null, $whitelist );
	}

	public function get_whitelist() {
		static $whitelist = array();
		if ( ! isset( $whitelist[ static::class ] ) ) {
			$whitelist[ static::class ] = apply_filters( 'jetpack_fonts_whitelist_' . $this->id, array() );
		}
		return $whitelist[ static::class ];
	}

	/**
	 * Get a single font from our listing of fonts.
	 * @param  string $id Font id for this provider
	 * @return array|false     Font object if found, false if not.
	 */
	public function get_font( $id ) {
		$filtered = wp_list_filter( $this->get_fonts_with_provider(), compact( 'id' ) );
		return empty( $filtered ) ? false : array_shift( $filtered );
	}

	/**
	 * If this provider's fonts can be rendered using WebFontLoader
	 * (https://github.com/typekit/webfontloader), then instead of implementing
	 * `render_fonts`, you can implement this function to return an associative
	 * array of the data required for calling `WebFont.load`.
	 *
	 * For example, to use a Google font, this function should return
	 *
	 * ```
	 * array( 'google' => array( 'families' => array( 'Droid Sans:300,700' ) ) );
	 * ```
	 *
	 * @param array $fonts The fonts to be loaded.
	 * @return array|null The object to be included in `WebFontConfig` or null if not using WebFontLoader.
	 */
	public function get_webfont_config_option( $fonts ) {
		return;
	}

	/**
	 * Render selected fonts. Called during `wp_enqueue_scripts`
	 */
	abstract public function render_fonts( $fonts );


	/**
	 * Get an API URL, based on $this->api_base.
	 * @param  string $path Path into the API, relative to $this->api_base.
	 * @param  array  $args A list of GET param args that will be added to the URL
	 * @param  string $key  The GET param the API key should be submitted with. Pass an empty string
	 *                      if the key shouldn't be added (eg Auth in a header)
	 * @return string       api url
	 */
	public function get_api_url( $path = '', $args = array(), $key = 'key' ) {
		$url = $this->api_base . $path;
		if ( $key ) {
			$args[ $key ] = $this->get_api_key();
		}
		return add_query_arg( $args, $url );
	}

	/**
	 * Make an API request to the provider API
	 * @param  string $method HTTP method to call
	 * @param  string $path   Path relative to $this->api_base to call
	 * @param  array  $args   Args that will be passed to @see wp_remote_request()
	 * @return array|WP_Error Return value of @see wp_remote_request()
	 */
	public function api_request( $method = 'GET', $path = '', $args = array() ) {
		$url = $this->get_api_url( $path );
		$args['method'] = $method;
		if ( $this->api_auth_header ) {
			if ( ! isset( $args['header'] ) ) {
				$args['header'] = array();
			}
			$header = sprintf( $this->api_auth_header, $this->get_api_key() );
			$header = explode( ':', $header );
			$args['header'][ $header[0] ] = $header[1];
		}
		$response = wp_remote_request( $url, $args );
		return $response;
	}

	/**
	 * Shortcut for making a GET request
	 * @param  string $path   @see $this->api_request()
	 * @param  array  $args   @see $this->api_request()
	 * @return array|WP_Error @see $this->api_request()
	 */
	public function api_get( $path = '', $args = array() ) {
		return $this->api_request( 'GET', $path = '', $args );
	}

	/**
	 * Shortcut for making a POST request
	 * @param  string $path   @see $this->api_request()
	 * @param  array  $data   An array of POST data to be sent in the request body
	 * @param  array  $args   @see $this->api_request()
	 * @return array|WP_Error @see $this->api_request()
	 */
	public function api_post( $path = '', $data = array(), $args = array() ) {
		$args['body'] = $data;
		return $this->api_request( 'GET', $path = '', $args );
	}

	/**
	 * Converts a Font Variant Description to a human-readable font variant name.
	 * @param  string $fvd two character fvd
	 * @return string      Font variant name
	 */
	protected function fvd_to_variant_name( $fvd ) {
		$map = self::fvd_to_variant_name_map();
		return $map[ $fvd ];
	}

	public static function fvd_to_variant_name_map() {
		return array(
			'n1' => _x( 'Thin', 'font-style' ),
			'i1' => _x( 'Thin Italic', 'font-style' ),
			'o1' => _x( 'Thin Oblique', 'font-style' ),
			'n2' => _x( 'Extra Light', 'font-style' ),
			'i2' => _x( 'Extra Light Italic', 'font-style' ),
			'o2' => _x( 'Extra Light Oblique', 'font-style' ),
			'n3' => _x( 'Light', 'font-style' ),
			'i3' => _x( 'Light Italic', 'font-style' ),
			'o3' => _x( 'Light Oblique', 'font-style' ),
			'n4' => _x( 'Regular', 'font-style' ),
			'i4' => _x( 'Italic', 'font-style' ),
			'o4' => _x( 'Oblique', 'font-style' ),
			'n5' => _x( 'Medium', 'font-style' ),
			'i5' => _x( 'Medium Italic', 'font-style' ),
			'o5' => _x( 'Medium Oblique', 'font-style' ),
			'n6' => _x( 'Semibold', 'font-style' ),
			'i6' => _x( 'Semibold Italic', 'font-style' ),
			'o6' => _x( 'Semibold Oblique', 'font-style' ),
			'n7' => _x( 'Bold', 'font-style' ),
			'i7' => _x( 'Bold Italic', 'font-style' ),
			'o7' => _x( 'Bold Oblique', 'font-style' ),
			'n8' => _x( 'Extra Bold', 'font-style' ),
			'i8' => _x( 'Extra Bold Italic', 'font-style' ),
			'o8' => _x( 'Extra Bold Oblique', 'font-style' ),
			'n9' => _x( 'Ultra Bold', 'font-style' ),
			'i9' => _x( 'Ultra Bold Italic', 'font-style' ),
			'o9' => _x( 'Ultra Bold Oblique', 'font-style' )
		);
	}

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

		if ( $key = $this->manager->get( $this->id . '_api_key' ) ) {
			return $key;
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
	 * @param  array $fonts  A list of fonts.
	 * @return array         A potentially modified list of fonts.
	 */
	abstract public function save_fonts( $fonts );

	/**
	 * Get a cache ID. Used in @see get_cached_fonts() and @see set_cached_fonts()
	 * @return string Cache ID.
	 */
	private function get_cache_id() {
		return "jetpack_{$this->id}_{$this->api_version}_fonts_list";
	}

	/**
	 * Most providers will want to cache a list of fonts rather than hitting the provider's
	 * API every time.
	 * @param  bool $use_fallback Use the JSON fallback, if available.
	 * @return array|boolean      Cached fonts on successful cache hit, false on failure
	 */
	protected function get_cached_fonts( $use_fallback = true ) {
		static $fonts = array();
		if ( isset( $fonts[ static::class ] ) && is_array( $fonts[ static::class ] ) && count( $fonts[ static::class ] ) ) {
			return $fonts;
		}
		// Fallback to a JSON file in the same directory to deal with API outages when needed.
		// Use `wp custom-fonts static-cache set` to port the currently cached fonts into
		// the static JSON file.
		$fallback_file = dirname( __FILE__ ) . '/' . $this->id . '.json';
		if ( $use_fallback && is_readable( $fallback_file ) ) {
			$data = json_decode( file_get_contents( $fallback_file ), true );
			if ( is_array( $data ) && count( $data ) ) {
				$fonts[ static::class ] = $data;
				return $data;
			}
		}
		return get_site_transient( $this->get_cache_id() );
	}

	/**
	 * Writes a cached JSON file representing the current state of caching, to be
	 * used to bypass our internal caching and not expire. Useful when APIs are down.
	 * @return  boolean file successfully written
	 */
	public function write_cached_json() {
		$fallback_file = dirname( __FILE__ ) . '/' . $this->id . '.json';
		$data = $this->get_cached_fonts( false );
		if ( ! $data || empty( $data  ) ) {
			return false;
		}
		$success = file_put_contents( $fallback_file, json_encode( $data ) );
		if ( false === $success ) {
			return false;
		}
		return true;
	}

	/**
	 * Deletes the cached JSON file so we return to using periodic API polling.
	 * @return  boolean file successfully deleted
	 */
	public function delete_cached_json() {
		$fallback_file = dirname( __FILE__ ) . '/' . $this->id . '.json';
		if ( is_readable( $fallback_file ) ) {
			return unlink( $fallback_file );
		}
		return false;
	}

	/**
	 * Store a provider's list of fonts
	 * @param array $fonts List of processed fonts
	 * @return boolean Fonts successfully cached
	 */
	protected function set_cached_fonts( $fonts ) {
		return set_site_transient( $this->get_cache_id(), $fonts, $this->transient_timeout );
	}

	/**
	 * Flush the cached list of fonts. Useful if the provider has updated the list but
	 * your WP install isn't showing them yet.
	 * @return boolean Font cache successfully flushed
	 */
	public function flush_cached_fonts() {
		return delete_site_transient( $this->get_cache_id() );
	}
}
