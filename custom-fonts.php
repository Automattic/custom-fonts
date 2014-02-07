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

class Jetpack_Custom_Fonts {

	const OPTION = 'jetpack_custom_fonts';

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
	 * Holds the Jetpack_Custom_Fonts_Css_Generator instance
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
	 * @return object Jetpack_Custom_Fonts instance
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
		add_action( 'init', array( $this, 'register_providers' ), 11 );
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_render_fonts' ) );
		add_action( 'customize_register', array( $this, 'register_controls' ) );
	}

	/**
	 * Automatically load the provider classes when needed. spl_autoload_register callback.
	 * @param  string $class class name
	 * @return void
	 */
	public function autoloader( $class ) {
		if ( 'Jetpack_Custom_Fonts_Css_Generator' === $class ) {
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
		$wp_customize->add_section( 'jetpack_custom_fonts', array(
			'title' => __( 'Fonts' )
		) );
		$wp_customize->add_setting( self::OPTION . '[selected_fonts]', array(
			'type'      => 'option',
			'transport' => 'postMessage'
		) );
		$wp_customize->add_control( new Jetpack_Fonts_Control( $wp_customize, 'jetpack_custom_fonts', array(
			'settings'      => self::OPTION . '[selected_fonts]',
			'section'       => 'jetpack_custom_fonts',
			'label'         => __( 'Fonts' ),
			'jetpack_fonts' => $this
		) ) );
	}

	/** Renders fonts and font CSS if we have any fonts. */
	public function maybe_render_fonts() {
		if ( ! $this->get_fonts() ) {
			return;
		}

		add_action( 'wp_head', array( $this, 'render_font_css' ), 11 );

		foreach ( $this->provider_keyed_fonts() as $provider_id => $fonts_for_provider ) {
			$provider = $this->get_provider( $provider_id );
			$provider->render_fonts( $fonts_for_provider );
		}
	}

	public function render_font_css() {
		$fonts_for_css = array();
		foreach ( $this->provider_keyed_fonts() as $provider_id => $fonts_for_provider ) {
			$provider = $this->get_provider( $provider_id );
			$fonts_for_css = array_merge( $fonts_for_css, $provider->font_list_with_css_names( $fonts_for_provider ) );
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
			// let's be kind to our providers: if the same instance of a font exists,
			// but perhaps with different fvds, merge them.
			$added = false;
			foreach( $keyed[ $provider ] as $i => $added_font ) {
				if ( $added_font['id'] === $font['id'] ) {
					$keyed[ $provider ][ $i ]['fvds'] = array_merge( $added_font['fvds'], $font['fvds'] );
					$added = true;
					break;
				}
			}
			if ( ! $added ) {
				array_push( $keyed[ $provider ], $font );
			}
		}
		return $keyed;
	}

	public function get_availble_fonts() {
		$fonts = array();
		foreach( $this->registered_providers as $id => $registered_provider ) {
			$provider = $this->get_provider( $id );
			$fonts = array_merge( $fonts, $provider->get_fonts_with_provider() );
		}
		return $fonts;
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
		do_action( 'jetpack_custom_fonts_register', $this );
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


	public function font_provider_fields( $font ) {
		// @TODO decide if this is the right place to handle empty fvds
		return array(
			'id' => $font['id'],
			'fvds' => $font['fvds']
		);
	}

	/**
	 * Get the CSS generator, instantiating if needed
	 * @return object Jetpack_Custom_Fonts_Css_Generator instance
	 */
	public function get_generator() {
		if ( ! $this->generator ) {
			$this->generator = new Jetpack_Custom_Fonts_Css_Generator;
		}
		return $this->generator;
	}

	/**
	 * Save a group of fonts
	 * @param  array $fonts Array of fonts
	 * @return null|boolean True: successfully changed, False: change failure, null: no change
	 */
	public function save_fonts( $fonts ) {
		$previous_fonts = $this->get_fonts();
		$fonts_to_save = array();

		// looping through registered providers to ensure only provider'ed fonts are saved
		foreach( $this->registered_providers as $id => $registered_provider ) {
			$provider = $this->get_provider( $id );
			$new = wp_list_filter( $fonts, array( 'provider' => $id ) );
			$fonts_to_save = array_merge( $fonts_to_save, $new );
			$previous = wp_list_filter( $previous_fonts, array( 'provider' => $id ) );;
			if ( $new !== $previous ) {
				$new = array_map( array( $this, 'font_provider_fields' ), $new );
				$provider->save_fonts( $new );
			}
		}

		if ( $previous_fonts === $fonts_to_save ) {
			return null;
		}

		return $this->save( 'selected_fonts', $fonts_to_save );
	}

	/**
	 * Get the currently saved fonts, if any.
	 * @return mixed
	 */
	public function get_fonts() {
		return $this->get( 'selected_fonts' );
	}

	/**
	 * Saves a member to our single option.
	 * @param  array $fonts An array of font objects
	 * @return boolean True if option value has changed, false if not or if update failed
	 */
	public function save( $key, $data ) {
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
	public function get( $key, $default = array() ) {
		$opt = get_option( self::OPTION, $default );
		if ( is_array( $opt ) && isset( $opt[ $key ] ) ) {
			return $opt[ $key ];
		}
		return $opt;
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
		$this->save( $opt );
	}

	/**
	 * Delete all cached fonts. Handy for forcing a rebuild of all of them.
	 * @return boolean
	 */
	public function flush_all_cached_fonts() {
		foreach( $this->registered_providers as $id => $registered_provider ) {
			$provider = $this->get_provider( $id );
			$provider->flush_cached_fonts();
		}
		return true;
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
add_action( 'init', array( Jetpack_Custom_Fonts::get_instance(), 'init' ) );
register_activation_hook( __FILE__, array( 'Jetpack_Custom_Fonts', 'on_activate' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack_Custom_Fonts', 'on_deactivate' ) );

// Hey wp-cli is fun
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	include dirname( __FILE__ ) . '/wp-cli-command.php';
}
