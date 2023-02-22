<?php
/*
Plugin Name: Custom Fonts
Plugin URI: https://automattic.com/
Description: Easily preview and add fonts to your WordPress site
Version: 2.1.0
Author: Matt Wiebe
Author URI: https://automattic.com/
*/

/**
 * Copyright (c) 2014 Automattic. All rights reserved.
 *
 * Released under the GPL license
 * http://www.opensource.org/licenses/gpl-license.php
 *
 * This is an add-on for WordPress
 * http://wordpress.org/
 *
 * **********************************************************************
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * **********************************************************************
 */

class Jetpack_Fonts {

	const OPTION = 'jetpack_fonts';

	/**
	 * Holds basic data on our registered providers.
	 * @var array
	 */
	private $registered_providers = array();

	/**
	 * Holds instantiated Jetpack_Font_Provider providers
	 * @var array
	 */
	private $providers = array();

	/**
	 * Holds the Jetpack_Fonts_Css_Generator instance
	 */
	private $generator;

	/**
	 * Extra settings beyond `selected_fonts`
	 */
	private $extra_settings = array();

	/**
	 * Keys to delete from settings during the next save
	 */
	private $removed_settings = array();

	/**
	 * Holds the previous setting, used later to see if anything needs to be
	 * saved with an external provider's API
	 */
	private $previous_setting;

	/**
	 * Holds the single instance of this object
	 * @var null|object
	 */
	private static $instance;

	/**
	 * Retrieve the single instance of this class, creating if
	 * not previously instantiated.
	 *
	 * @return object Jetpack_Fonts instance
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Kicks things off on the init hook, loading what's needed
	 * @return void
	 */
	public function init() {
		require_once __DIR__ . '/annotation-compat.php';
		add_action( 'setup_theme', array( $this, 'register_providers' ), 11 );
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_render_fonts' ) );
		add_action( 'customize_register', array( $this, 'register_controls' ) );
		add_action( 'customize_register', array( $this, 'maybe_prepopulate_option' ), 0 );
		add_action( 'customize_preview_init', array( $this, 'add_preview_scripts' ) );
		add_action( 'customize_save_after', array( $this, 'apply_settings' ), 0 );
		add_action( 'customize_save_after', array( $this, 'maybe_save_fonts' ) );

		// Load the deprecated typkit font mapper.
		require_once dirname( __FILE__ ) . '/providers/deprecated-typekit.php';
	}

	public function add_preview_scripts() {
		$this->get_generator()->get_rules();
		if ( ! $this->get_generator()->has_rules() ) {
			return;
		}

		/**
		 * Filters the Google Fonts API URL.
		 *
		 * @param string $url The Google Fonts API URL.
		 */
		$api_url = apply_filters( 'custom_fonts_google_fonts_api_url', 'https://fonts.googleapis.com/css' );

		wp_register_script( 'webfonts', plugins_url( 'js/webfont.js', __FILE__ ), array(), '20221206', true );
		wp_localize_script( 'webfonts', 'WebFontConfig', array( 'api_url' => $api_url ) );

		wp_enqueue_script( 'jetpack-fonts-preview', plugins_url( 'js/jetpack-fonts-preview.js', __FILE__ ), array( 'backbone', 'webfonts' ), '20221208', true );
		wp_localize_script( 'jetpack-fonts-preview', '_JetpackFonts', array(
			'types' => $this->get_generator()->get_rule_types(),
			'annotations' => $this->get_generator()->get_rules(),
			'providerData' => $this->get_provider_additional_data()
		));
	}

	/**
	 * Register our Customizer bits
	 *
	 * Does nothing if there are no annotations for the current theme
	 *
	 * @param  object $wp_customize WP_Customize_Manager instance
	 * @return void
	 */
	public function register_controls( $wp_customize ) {
		$this->get_generator()->get_rules();
		if ( ! $this->get_generator()->has_rules() ) {
			return;
		}
		require_once dirname( __FILE__ ) . '/fonts-customize-control.php';
		$wp_customize->add_section( 'jetpack_fonts', array(
			'title' =>    __( 'Fonts' ),
			'priority' => 52
		) );

		$setting_options = array(
			'type'       => 'option',
			'transport'  => 'postMessage',
			'sanitize_js_callback' => array( $this, 'prepare_for_js' ),
			'sanitize_callback' => array( $this, 'sanitize_fonts' )
		);

		$wp_customize->add_setting( self::OPTION . '[selected_fonts]', $setting_options );

		$wp_customize->add_control( new Jetpack_Fonts_Control( $wp_customize, 'jetpack_fonts', array(
			'settings'      => self::OPTION . '[selected_fonts]',
			'section'       => 'jetpack_fonts',
			'label'         => __( 'Fonts' ),
			'jetpack_fonts' => $this
		) ) );
	}

	/**
	 * Grab the previous option value before the Customizer gets its grubby fingers in everything
	 * @return void
	 */
	public function maybe_prepopulate_option() {
		if ( ! is_customize_preview() ) {
			return;
		}
		$this->previous_setting = get_option( self::OPTION, array() );

		if ( $this->previous_setting
			&& ( isset( $this->previous_setting['typekit_kit_id'] ) || $this->has_typekit_font_selected() )
			&& ! isset( $this->previous_setting['deprecated_typekit_fonts'] ) ) {
			$this->set( 'deprecated_typekit_fonts', $this->previous_setting['selected_fonts'] );
		}
	}

	/**
	 * Check to see if site has typekit fonts selected.
	 * @return boolean True if typekit font selected.
	 */
	private function has_typekit_font_selected() {
		if ( ! isset( $this->previous_setting ) || ! isset( $this->previous_setting['selected_fonts'] ) ) {
			return false;
		}
		foreach ( $this->previous_setting['selected_fonts'] as $font ) {
			if ( 'typekit' === $font['provider'] ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Get the previous font setting. Might have to have stored it because of the Customizer.
	 * @return array Previously set fonts.
	 */
	private function get_previous_fonts() {
		if ( is_customize_preview() ) {
			$opt = $this->previous_setting;
		} else {
			$opt = get_option( self::OPTION, array() );
		}

		if ( isset( $opt['selected_fonts'] ) ) {
			return $opt['selected_fonts'];
		}
		return array();
	}

	/**
	 * Fire up the font saving logic to pass changes along to providers for further processing.
	 */
	public function maybe_save_fonts() {
		$this->disable_option_filters();
		$current_fonts = $this->get_fonts();
		$this->save_fonts( $current_fonts );
	}

	/**
	 * Turns off the option filters added by the Customizer's setting madness
	 */
	public function disable_option_filters() {
		remove_all_filters( 'option_' . self::OPTION );
		remove_all_filters( 'default_option_' . self::OPTION );
	}

	/**
	 * Applies extra fonts settings to the Customizer setting on shutdown.
	 *
	 * Since some Providers may set settings not included in `selected_fonts`,
	 * this allows applying those extra settings. Adding or modifying these
	 * settings is done using the `Jetpack_Fonts::set` method.
	 *
	 */
	public function apply_settings() {
		// we need to remove all option filters the Customizer has added because of its aggregated
		// multidimensional array nonsense. Otherwise: infinite loops once we try to fetch the option.
		// Related: https://core.trac.wordpress.org/ticket/35451
		$this->disable_option_filters();
		$settings = get_option( self::OPTION );

		if ( ! is_array( $settings ) || ( empty( $this->extra_settings ) && empty( $this->removed_settings ) ) ) {
			return;
		}

		if ( is_array( $this->extra_settings ) ) {
			$settings = array_merge( $settings, $this->extra_settings );
		}
		if ( is_array( $this->removed_settings ) ) {
			foreach( $this->removed_settings as $key ) {
				if ( isset( $settings[ $key ] ) ) {
					unset( $settings[ $key ] );
				}
			}
		}

		update_option( self::OPTION, $settings );
	}

	/**
	 * Render fonts and font CSS if we have any fonts saved.
	 *
	 * Must be called inside wp_head or wp_enqueue_scripts action hook because it
	 * outputs a CSS style block to the page.
	 *
	 * * @param bool $force  force the fonts to display in a customize preview
	 * */
	public function maybe_render_fonts( $force = false ) {
		if ( ( is_customize_preview() && ! $force ) || ! $this->get_fonts() || ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) ) {
			return;
		}

		$webfont_options = $this->get_webfont_options();

		if ( count( $webfont_options ) > 0 ) {
			$this->output_webfont_loader( $webfont_options );
		}

		// Render the CSS onto the page to activate the font properties
		$this->render_font_css();
	}

	/**
	 * Enqueue the webfont js.
	 *
	 * @return void
	 */
	public function enqueue_fonts() {
		$config = $this->get_webfont_options();
		$config['api_url'] = apply_filters( 'custom_fonts_google_fonts_api_url', 'https://fonts.googleapis.com/css' );

		wp_register_script( 'webfonts', plugins_url( 'js/webfont.js', __FILE__ ), array(), '20221206', true );
		wp_localize_script( 'webfonts', 'WebFontConfig', $config );

		wp_enqueue_script( 'webfonts' );
	}

	public function get_webfont_options() {
		$webfont_options = array();

		// Give each Provider a chance to render its own fonts and/or return
		// configuration options for WebFontLoader.
		foreach ( $this->provider_keyed_fonts() as $provider_id => $fonts_for_provider ) {
			$provider = $this->get_provider( $provider_id );
			if ( $provider ) {
				if ( ! $provider->is_active() ) {
					continue;
				}
				$provider->render_fonts( $fonts_for_provider );

				$webfont_option = $provider->get_webfont_config_option( $fonts_for_provider );
				if ( isset( $webfont_option ) && is_array( $webfont_option ) && ! empty( $webfont_option ) ) {
					$webfont_options = array_merge( $webfont_options, $webfont_option );
				}
			}
		}

		return $webfont_options;
	}

	public function output_webfont_loader( $config ) {
		/**
		 * Filters the Google Fonts API URL.
		 *
		 * @param string $url The Google Fonts API URL.
		 */
		$config['api_url'] = apply_filters( 'custom_fonts_google_fonts_api_url', 'https://fonts.googleapis.com/css' );

		$config = json_encode( $config );
		$url = plugins_url( 'js/webfont.js', __FILE__ );
		/** @phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped */
		echo
		<<<EMBED
<script type="text/javascript">
  WebFontConfig = {$config};
  (function() {
    var wf = document.createElement('script');
    wf.src = '{$url}';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
	})();
</script>
EMBED;
	}

	public function render_font_css() {
		echo '<style id="jetpack-custom-fonts-css">';
		/** @phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped */
		echo $this->get_font_css();
		echo "</style>\n";
	}

	public function get_font_css() {
		$fonts_for_css = array();
		foreach ( $this->provider_keyed_fonts() as $provider_id => $fonts_for_provider ) {
			$provider = $this->get_provider( $provider_id );
			if ( $provider ) {
				if ( ! $provider->is_active() ) {
					continue;
				}

				$fonts_for_css = array_merge( $fonts_for_css, $fonts_for_provider );
			}
		}

		return $this->get_generator()->get_css( $fonts_for_css );
	}

	private function provider_keyed_fonts() {
		$fonts = $this->get_fonts();
		$fonts = $this->add_generic_families( $fonts );
		$keyed = array();

		foreach ( $fonts as $font ) {
			if ( 'typekit' === $font['provider'] ) {
				$font = Jetpack_Fonts_Typekit_Font_Mapper::get_mapped_google_font( $font );
			}
			$provider = $font['provider'];
			if ( ! isset( $keyed[ $provider ] ) ) {
				$keyed[ $provider ] = array( $font );
				continue;
			}
			array_push( $keyed[ $provider ], $font );
		}
		return $keyed;
	}

	private function add_generic_families( $fonts ) {
		foreach( $fonts as $key => $font ) {
			$provider = $this->get_provider( $font['provider'] );
			if ( ! $provider ) {
				continue;
			}
			$font_data = $provider->get_font( $font['id'] );
			if ( $font_data ) {
				$fonts[ $key ]['genericFamily'] = $font_data['genericFamily'];
			} else {
				$fonts[ $key ]['genericFamily'] = 'sans-serif';
			}
		}
		return $fonts;
	}

	/**
	 * Gets all available fonts from all active registered providers.
	 */
	public function get_available_fonts() {
		$fonts = array();
		foreach( array_keys( $this->registered_providers ) as $id ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider || ! $provider->is_active() ) {
				continue;
			}
			$fonts = array_merge( $fonts, $provider->get_fonts_with_provider() );
		}
		usort( $fonts, array( $this, 'sort_by_display_name') );
		return $fonts;
	}

	public function get_provider_additional_data() {
		$additional_data = array();
		foreach( array_keys( $this->registered_providers ) as $id ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider || ! $provider->is_active() ) {
				continue;
			}
			$additional_data = array_merge( $additional_data, $provider->get_additional_data() );
		}
		return $additional_data;
	}

	public function get_all_fonts() {
		$fonts = array();
		foreach( array_keys( $this->registered_providers ) as $id ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider || ! $provider->is_active() ) {
				continue;
			}
			$fonts = array_merge( $fonts, $provider->get_fonts_with_provider( false ) );
		}
		usort( $fonts, array( $this, 'sort_by_display_name') );
		return $fonts;
	}

	public function set_static_caches() {
		$ok = array();
		$fail = array();
		foreach( array_keys( $this->registered_providers ) as $id ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider ) {
				continue;
			}
			$value = $provider->write_cached_json();
			if ( $value ) {
				$ok[] = $provider->id;
			} else {
				$fail[] = $provider->id;
			}
		}
		return compact( 'ok', 'fail' );
	}

	public function delete_static_caches() {
		$ok = array();
		$fail = array();
		foreach( array_keys( $this->registered_providers ) as $id ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider ) {
				continue;
			}
			$value = $provider->delete_cached_json();
			if ( $value ) {
				$ok[] = $provider->id;
			} else {
				$fail[] = $provider->id;
			}
		}
		return compact( 'ok', 'fail' );
	}

	public function sort_by_display_name( $a, $b ) {
		return $a['displayName'] > $b['displayName'] ? 1 : -1;
	}

	/**
	 * Hook for registering font providers
	 * @return void
	 */
	public function register_providers() {
		$provider_dir = dirname( __FILE__ ) . '/providers/';
		// first ensure the abstract class is loaded
		require_once( $provider_dir . 'base.php' );
		$this->register_provider( 'google', 'Jetpack_Google_Font_Provider', $provider_dir . 'google.php' );
		do_action( 'jetpack_fonts_register', $this );
	}

	/**
	 * Get a provider's instance. Instantiates the instance if needed.
	 * @param  string $name    Provider ID
	 * @return object|boolean  Provider instance if successful, false if not.
	 */
	public function get_provider( $name ) {
		if ( isset( $this->providers[ $name ] ) ) {
			return $this->providers[ $name ];
		}
		if ( isset( $this->registered_providers[ $name ] ) ) {
			require_once $this->registered_providers[ $name ]['file'];
			$class = $this->registered_providers[ $name ]['class'];
			$this->providers[ $name ] = new $class( $this );
			return $this->providers[ $name ];
		}
		return false;
	}

	/**
	 * Public function for registering a font provider module
	 * @param  string $id    The ID of the font module. Must match $class::$id
	 * @param  string $class The name of the class that extends Jetpack_Font_Provider
	 * @param  string $file  File holding the module's class
	 * @return void
	 */
	public function register_provider( $id, $class, $file ) {
		if ( ! file_exists( $file ) ) {
			throw new Exception( "Custom Fonts provider $class does not exist at $file", 1 );
		}
		$this->registered_providers[ $id ] = compact( 'class', 'file' );
	}

	/**
	 * Validates a font before saving it, reducing it to only the needed fields.
	 * @param  array
	 * @return bool|array Validated and reduced font. False if font is invalid.
	 */
	public function validate_font( $font = array() ) {
		$font_type = $this->get_generator()->get_rule_type( $font['type'] );
		if ( ! $font_type ) {
			return false;
		}
		$provider = $this->get_provider( $font['provider'] );
		if ( ! $provider ) {
			return false;
		}
		$font_data = $provider->get_font( $font['id'] );
		if ( ! $font_data ) {
			return false;
		}

		$whitelist = array( 'id', 'type', 'provider', 'cssName', 'size' );

		if ( $font_type['fvdAdjust'] ) {
			$whitelist[] = 'currentFvd';
		}
		$return = array();
		foreach( $font as $key => $value ) {
			if ( in_array( $key, $whitelist ) ) {
				if ( 'currentFvd' === $key ) {
					$value = $this->valid_or_closest_fvd_for_font( $value, $font_data['fvds'] );
				}
				$return[ $key ] = $value;
			}
		}

		// if we didn't get an fvd set for a heading-type font, fudge one with a good guess
		if ( $font_type['fvdAdjust'] && ! isset( $return['currentFvd'] ) ) {
			$return['currentFvd'] = $this->valid_or_closest_fvd_for_font( 'n4', $font_data['fvds'] );
		}
		return $return;
	}

	/**
	 * Returns the valid desired fvd, or the closest available one, for the selected font
	 * @param  string $fvd the fvd
	 * @param  string $fvds the font's allowed fvds
	 * @return string The valid or closest fvd for the font
	 */
	private function valid_or_closest_fvd_for_font( $fvd, $fvds ) {
		if ( in_array( $fvd, $fvds ) ) {
			return $fvd;
		}
		// try n4
		if ( in_array( 'n4', $fvds ) ) {
			return 'n4';
		}
		// cycle up
		$i = '1';
		while ( $i <= 9 ) {
			$try = 'n' . $i;
			$i++;
			if ( in_array( $try, $fvds ) ) {
				return $try;
			}
		}
		// shrug
		return $fvd;
	}

	/**
	 * Get the CSS generator, instantiating if needed
	 * @return object Jetpack_Fonts_Css_Generator instance
	 */
	public function get_generator() {
		if ( ! $this->generator ) {
			require_once dirname( __FILE__ ) . '/css-generator.php';
			$this->generator = new Jetpack_Fonts_Css_Generator;
		}
		return $this->generator;
	}

	/**
	 * Save a group of fonts
	 * @param  array $fonts Array of fonts
	 * @param  bool $force  Force fonts to save through their providers, even if nothing has changed
	 * @return array $fonts the fonts to save
	 */
	public function save_fonts( $fonts, $force = false ) {
		$fonts = $this->sanitize_fonts( $fonts );
		$previous_fonts = $this->sanitize_fonts( $this->prepare_for_js( $this->get_previous_fonts() ) );

		$fonts_to_save = array();

		// looping through registered providers to ensure only provider'ed fonts are saved
		foreach( array_keys( $this->registered_providers ) as $provider_id ) {
			$fonts_with_provider = wp_list_filter( $fonts, array( 'provider' => $provider_id ) );
			$previous_fonts_with_provider = wp_list_filter( $previous_fonts, array( 'provider' => $provider_id ) );

			// anything new to update?
			if ( $force || $fonts_with_provider !== $previous_fonts_with_provider ) {
				$provider = $this->get_provider( $provider_id );
				if ( ! $provider || ! $provider->is_active() ) {
					continue;
				}

				$fonts_with_provider = $provider->save_fonts( $fonts_with_provider );
			}

			$fonts_to_save = array_merge( $fonts_to_save, $fonts_with_provider );
		}

		do_action( 'jetpack_fonts_save', $fonts_to_save );

		$this->set( 'selected_fonts', $fonts_to_save );

		return $fonts_to_save;
	}

	private function get_and_validate_fonts_with_provider( $fonts, $provider_id ) {
		$fonts_with_provider = wp_list_filter( $fonts, array( 'provider' => $provider_id ) );
		$validated_fonts = array_filter( array_map( array( $this, 'validate_font' ), $fonts_with_provider ) );
		return $validated_fonts;
	}

	/**
	 * Sanitize callback to ensure only the correct fonts are saved.
	 * @param  array $fonts  List of fonts
	 * @return array         List of sanitized fonts
	 */
	public function sanitize_fonts( $fonts ) {
		$sanitized_fonts = array();

		// looping through registered providers to ensure only provider'ed fonts are saved
		foreach( array_keys( $this->registered_providers ) as $provider_id ) {
			$sanitized_fonts = array_merge( $sanitized_fonts, $this->get_and_validate_fonts_with_provider( $fonts, $provider_id ) );
		}

		return $sanitized_fonts;
	}

	/**
	 * Get the currently saved fonts, if any.
	 * @return mixed
	 */
	public function get_fonts() {
		return $this->get( 'selected_fonts' );
	}

	/**
	 * Decorate saved fonts for Customizer sessions
	 * @param array $fonts  basic saved fonts
	 * @return array        decorated saved fonts
	 */
	public function prepare_for_js( $fonts ) {
		$fonts_for_js = array();
		if ( ! is_array( $fonts ) ) {
			return $fonts_for_js;
		}
		foreach( $fonts as $font ) {
			if ( 'typekit' === $font['provider'] ) {
				$font = Jetpack_Fonts_Typekit_Font_Mapper::get_mapped_google_font( $font );
			}
			$provider  = $this->get_provider( $font['provider'] );
			$font_type = $this->get_generator()->get_rule_type( $font['type'] );
			if ( ! $provider || ! $font_type ) {
				continue;
			}
			$font_data = $provider->get_font( $font['id'] );
			if ( ! $font_data || ! is_array( $font_data ) ) {
				continue;
			}
			$font = array_merge( $font, $font_data );

			if ( ! $font_type['fvdAdjust'] && isset( $font['currentFvd'] ) ) {
				unset( $font['currentFvd'] );
			}

			$font['fontFamilies'] = $this->get_generator()->maybe_font_stack( $font );

			array_push( $fonts_for_js, $font );
		}
		return $fonts_for_js;
	}

	/**
	 * Saves a member to our single option.
	 * @param  array $fonts An array of font objects
	 * @return void
	 */
	public function set( $key, $data ) {
		$opt = get_option( self::OPTION, array() );
		$opt[ $key ] = $data;
		update_option( self::OPTION, $opt );
		$this->extra_settings[ $key ] = $data;
		if ( isset( $this->removed_settings[ $key ] ) ) {
			unset( $this->removed_settings[ $key ] );
		}
	}

	/**
	 * Get a member of our single option.
	 * @param  string $key     The option key to retrieve
	 * @param  mixed  $default Optional. The default value to return if nothing is found.
	 * @return mixed           The option value on success, $default on failure.
	 */
	public function get( $key, $default = false ) {
		$opt = get_option( self::OPTION, array() );
		if ( is_array( $opt ) && isset( $opt[ $key ] ) ) {
			return $opt[ $key ];
		}
		return $default;
	}

	/**
	 * Deletes a member of our single option
	 * @param  string $key The option key to delete
	 * @return void
	 */
	public function delete( $key ) {
		$opt = get_option( self::OPTION, array() );
		if ( isset( $opt[ $key ] ) ) {
			unset( $opt[ $key ] );
		}
		if ( isset( $this->extra_settings[ $key ] ) ) {
			unset( $this->extra_settings[ $key ] );
		}
		update_option( self::OPTION, $opt );
		array_push( $this->removed_settings, $key );
	}

	/**
	 * Delete all cached fonts. Handy for forcing a rebuild of all of them.
	 * @return boolean
	 */
	public function flush_all_cached_fonts() {
		foreach( array_keys( $this->registered_providers ) as $id ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider || ! $provider->is_active() ) {
				continue;
			}
			$provider->flush_cached_fonts();
		}
		return true;
	}

	/**
	 * Repopulate all cached fonts. This will prime the font cache with a fresh fetch from the remote APIs.
	 * @return boolean
	 */
	public function repopulate_all_cached_fonts() {
		$this->flush_all_cached_fonts();
		foreach( array_keys( $this->registered_providers ) as $id ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider ) {
				continue;
			}
			$provider->get_fonts();
		}
		$all_fonts = $this->get_available_fonts();
		return ! empty( $all_fonts );
	}

	/**
	 * Fires when the plugin is activated
	 * @return void
	 */
	public static function on_activate() {
		self::get_instance();
	}

	/**
	 * Fires when the plugin is deactivated
	 * @return void
	 */
	public static function on_deactivate() {
		self::get_instance();
	}

	/**
	 * Silence is golden
	 */
	public function __construct( Jetpack_Fonts_Css_Generator $generator = null ) {
		$this->generator = $generator;
	}
}

if ( function_exists( 'add_action' ) ) {
	// Hook things up geddit hooks.
	add_action( 'setup_theme', array( Jetpack_Fonts::get_instance(), 'init' ), 9 );
	register_activation_hook( __FILE__, array( 'Jetpack_Fonts', 'on_activate' ) );
	register_deactivation_hook( __FILE__, array( 'Jetpack_Fonts', 'on_deactivate' ) );
}

// Hey wp-cli is fun
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	include dirname( __FILE__ ) . '/wp-cli-command.php';
}

require_once __DIR__ . '/gutenberg-integration.php';
