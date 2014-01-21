<?php

abstract class Jetpack_Font_Provider {

	/**
	 * Cached font lists expire after this duration
	 * @var integer
	 */
	public $transient_timeout = 43200; // 12 hours

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
	 * Holds the Jetpack_Custom_Fonts manager object
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
	 * @param Jetpack_Custom_Fonts $custom_fonts Manager instance
	 */
	public function __construct( Jetpack_Custom_Fonts $custom_fonts ) {
		$this->manager = $custom_fonts;
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
	 * Get a single font from our listing of fonts.
	 * @param  string $id Font id for this provider
	 * @return array|false     Font object if found, false if not.
	 */
	public function get_font( $id ) {
		$filtered = wp_list_filter( $this->get_fonts(), compact( 'id' ) );
		return empty( $filtered ) ? false : array_shift( $filtered );
	}

	/**
	 * Render selected fonts. Called during `wp_enqueue_scripts`
	 */
	abstract public function render_fonts( $fonts );

	/**
	 * Take a list of fonts and return the list with a `css_name` property
	 * on each font array for rendering CSS rules. Provide a font stack if possible.
	 */
	abstract public function font_list_with_css_names( $fonts );


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
		$style = substr( $fvd, 0, 1 );
		$weight = substr( $fvd, 1, 1 );

		// we don't prepend "regular" to Oblique or Italic
		if ( '4' === $weight && 'n' !== $style ) {
			return 'o' === $style ? 'Oblique' : 'Italic';
		}

		$map = array(
			'1' => 'Hairline',
			'2' => 'Thin',
			'3' => 'Light',
			'4' => 'Regular',
			'5' => 'Medium',
			'6' => 'Semibold',
			'7' => 'Bold',
			'8' => 'Heavy',
			'9' => 'Black'
		);
		$name = $map[ $weight ];

		if ( 'i' === $style ) {
			$name .= ' Italic';
		} elseif ( 'o' === $style ) {
			$name .= ' Oblique';
		}
		return $name;
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

		if ( $key = $this->manager->get( $$this->id . '_api_key' ) ) {
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
	 * @param  array $fonts     An list of fonts. An empty list will delete fonts from the API.
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
	 * @param array $fonts List of processed fonts
	 * @return boolean Fonts successfully cached
	 */
	protected function set_cached_fonts( $fonts ) {
		return set_transient( $this->get_cache_id(), $fonts, $this->transient_timeout );
	}

	/**
	 * Flush the cached list of fonts. Useful if the provider has updated the list but
	 * your WP install isn't showing them yet.
	 * @return boolean Font cache successfully flushed
	 */
	public function flush_cached_fonts() {
		return delete_transient( $this->get_cache_id() );
	}
}