<?php
/*
Plugin Name: Custom Fonts
Plugin URI: http://automattic.com/
Description: Easily preview and add fonts to your WordPress site
Version: 0.1
Author: Matt Wiebe
Author URI: http://automattic.com/
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
	 * Holds the single instance of this object
	 * @var null|object
	 */
	private static $instance;

	/**
	 * Retrieve the single instance of this class, creating if
	 * not previously instantiated.
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
		spl_autoload_register( array( $this, 'autoloader' ) );
		add_action( 'setup_theme', array( $this, 'register_providers' ), 11 );
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_render_fonts' ) );
		add_action( 'customize_register', array( $this, 'register_controls' ) );
		add_action( 'customize_preview_init', array( $this, 'add_preview_scripts' ) );
	}

	public function add_preview_scripts() {
		wp_register_script( 'webfonts', plugins_url( 'js/webfont.js', __FILE__ ), array(), '20150510', true );
		wp_enqueue_script( 'jetpack-fonts-preview', plugins_url( 'js/jetpack-fonts-preview.js', __FILE__ ), array( 'backbone', 'webfonts' ), '20150510', true );
		wp_localize_script( 'jetpack-fonts-preview', '_JetpackFonts', array(
			'types' => $this->get_generator()->get_rule_types(),
			'annotations' => $this->get_generator()->get_rules(),
			'providerData' => $this->get_provider_additional_data()
		));
	}

	/**
	 * Automatically load the provider classes when needed. spl_autoload_register callback.
	 * @param  string $class class name
	 * @return void
	 */
	public function autoloader( $class ) {
		if ( 'Jetpack_Fonts_Css_Generator' === $class ) {
			return include dirname( __FILE__ ) . '/css-generator.php';
		}
		foreach( $this->registered_providers as $id => $provider ) {
			if ( $provider['class'] === $class ) {
				return include $provider['file'];
			}
		}
	}

	/**
	 * Register our Customizer bits
	 * @param  object $wp_customize WP_Customize_Manager instance
	 * @return void
	 */
	public function register_controls( $wp_customize ) {
		require dirname( __FILE__ ) . '/fonts-customize-control.php';
		$wp_customize->add_section( 'jetpack_fonts', array(
			'title' =>    __( 'Fonts' ),
			'priority' => 52
		) );
		$wp_customize->add_setting( self::OPTION . '[selected_fonts]', array(
			'type'                 => 'option',
			'transport'            => 'postMessage',
			'sanitize_callback'    => array( $this, 'save_fonts' ),
			'sanitize_js_callback' => array( $this, 'prepare_for_js' )
		) );
		$wp_customize->add_control( new Jetpack_Fonts_Control( $wp_customize, 'jetpack_fonts', array(
			'settings'      => self::OPTION . '[selected_fonts]',
			'section'       => 'jetpack_fonts',
			'label'         => __( 'Fonts' ),
			'jetpack_fonts' => $this
		) ) );
	}

	/** Renders fonts and font CSS if we have any fonts. */
	public function maybe_render_fonts() {
		if ( ! $this->get_fonts() || is_customize_preview() ) {
			return;
		}

		add_action( 'wp_head', array( $this, 'render_font_css' ), 11 );

		foreach ( $this->provider_keyed_fonts() as $provider_id => $fonts_for_provider ) {
			$provider = $this->get_provider( $provider_id );
			if ( $provider ) {
				if ( ! $provider->is_active() ) {
					continue;
				}
				$provider->render_fonts( $fonts_for_provider );
			}

		}
	}

	public function render_font_css() {
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
		echo '<style id="jetpack-custom-fonts-css">';
		echo $this->get_generator()->get_css( $fonts_for_css );
		echo "</style>\n";
	}

	private function provider_keyed_fonts() {
		$fonts = $this->get_fonts();
		$keyed = array();
		foreach ( $fonts as $font ) {
			$provider = $font['provider'];
			unset( $font['provider'] );
			if ( ! isset( $keyed[ $provider ] ) ) {
				$keyed[ $provider ] = array( $font );
				continue;
			}
			array_push( $keyed[ $provider ], $font );
		}
		return $keyed;
	}

	/**
	 * Gets all available fonts from all active registered providers.
	 */
	public function get_available_fonts() {
		$fonts = array();
		foreach( $this->registered_providers as $id => $registered_provider ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider->is_active() ) {
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
			if ( ! $provider->is_active() ) {
				continue;
			}
			$additional_data = array_merge( $additional_data, $provider->get_additional_data() );
		}
		return $additional_data;
	}

	public function get_all_fonts() {
		$fonts = array();
		foreach( $this->registered_providers as $id => $registered_provider ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider->is_active() ) {
				continue;
			}
			$fonts = array_merge( $fonts, $provider->get_fonts_with_provider( false ) );
		}
		usort( $fonts, array( $this, 'sort_by_display_name') );
		return $fonts;
	}

	public function sort_by_display_name( $a, $b ) {
		return $a['displayName'] > $b['displayName'];
	}

	/**
	 * Hook for registering font providers
	 * @return void
	 */
	public function register_providers() {
		$provider_dir = dirname( __FILE__ ) . '/providers/';
		// first ensure the abstract class is loaded
		require( $provider_dir . 'base.php' );
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
			$this->generator = new Jetpack_Fonts_Css_Generator;
		}
		return $this->generator;
	}

	/**
	 * Save a group of fonts
	 * @param  array $fonts Array of fonts
	 * @param  bool  $force Force fonts to save through providers, even if nothing has changed.
	 *                      This will also make the function save the fonts itself.
	 * @return array $fonts the fonts to save
	 */
	public function save_fonts( $fonts, $force = false ) {
		$previous_fonts = $this->get_fonts();
		$fonts_to_save = array();

		// looping through registered providers to ensure only provider'ed fonts are saved
		foreach( array_keys( $this->registered_providers ) as $provider_id ) {
			$should_update = false;

			$fonts_with_provider = wp_list_filter( $fonts, array( 'provider' => $provider_id ) );
			$fonts_with_provider = array_filter( array_map( array( $this, 'validate_font' ), $fonts_with_provider ) );

			if ( $force === true ) {
				$should_update = true;
			} else {
				$previous_fonts_with_provider = wp_list_filter( $previous_fonts, array( 'provider' => $provider_id ) );
				$previous_fonts_with_provider = array_map( array( $this, 'validate_font' ), $this->prepare_for_js( $previous_fonts_with_provider ) );
				$should_update = $fonts_with_provider !== $previous_fonts_with_provider;
			}

			if ( $should_update ) {
				$provider = $this->get_provider( $provider_id );
				if ( ! $provider->is_active() ) {
					continue;
				}
				$fonts_with_provider = $provider->save_fonts( $fonts_with_provider );
			}

			$fonts_to_save = array_merge( $fonts_to_save, $fonts_with_provider );
		}

		do_action( 'jetpack_fonts_save', $fonts_to_save );

		if ( $force === true ) {
			$this->set( 'selected_fonts', $fonts_to_save );
		}

		return $fonts_to_save;
	}

	/**
	 * Get the currently saved fonts, if any.
	 * @return mixed
	 */
	public function get_fonts() {
		return apply_filters( 'jetpack_fonts_selected_fonts', $this->get( 'selected_fonts' ), $this );
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
			$provider = $this->get_provider( $font['provider'] );
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

			array_push( $fonts_for_js, $font );
		}
		return $fonts_for_js;
	}

	/**
	 * Saves a member to our single option.
	 * @param  array $fonts An array of font objects
	 * @return boolean True if option value has changed, false if not or if update failed
	 */
	public function set( $key, $data ) {
		$opt = get_option( self::OPTION, array() );
		$opt[ $key ] = $data;
		return update_option( self::OPTION, $opt );
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
		return update_option( self::OPTION, $opt );
	}

	/**
	 * Delete all cached fonts. Handy for forcing a rebuild of all of them.
	 * @return boolean
	 */
	public function flush_all_cached_fonts() {
		foreach( $this->registered_providers as $id => $registered_provider ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider->is_active() ) {
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
		foreach( $this->registered_providers as $id => $registered_provider ) {
			$provider = $this->get_provider( $id );
			if ( ! $provider->is_active() ) {
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
		$plugin = self::get_instance();
	}

	/**
	 * Fires when the plugin is deactivated
	 * @return void
	 */
	public static function on_deactivate() {
		$plugin = self::get_instance();
	}

	/**
	 * Silence is golden
	 */
	protected function __construct() {}
}

// Hook things up geddit hooks.
add_action( 'setup_theme', array( Jetpack_Fonts::get_instance(), 'init' ), 9 );
register_activation_hook( __FILE__, array( 'Jetpack_Fonts', 'on_activate' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack_Fonts', 'on_deactivate' ) );

// Hey wp-cli is fun
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	include dirname( __FILE__ ) . '/wp-cli-command.php';
}
