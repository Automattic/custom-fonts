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
	 * @return null
	 */
	public function init() {
		spl_autoload_register( array( $this, 'autoloader' ) );
		add_action( 'init', array( $this, 'register_modules' ), 11 );
	}

	public function autoloader( $class ) {
		foreach( $this->registered_providers as $id => $provider ) {
			if ( $provider['class'] === $class ) {
				include $provider['file'];
			}
		}
	}

	/**
	 * Hook for registering font providers
	 * @return null
	 */
	public function register_modules() {
		$module_dir = dirname( __FILE__ ) . '/modules/';
		// first ensure the abstract class is loaded
		require_once( dirname( __FILE__ ) . '/modules/base.php' );
		$this->register_module( 'google', 'Jetpack_Google_Font_Provider', $module_dir . 'google.php' );
		do_action( 'jetpack_custom_fonts_register', $this );
	}

	/**
	 * Public function for registering a font provider module
	 * @param  string $id    The ID of the font module. Must match $class::$id
	 * @param  string $class The name of the class that extends Jetpack_Font_Provider
	 * @param  string $file  File holding the module's class
	 * @return null
	 */
	public function register_module( $id, $class, $file ) {
		if ( ! file_exists( $file ) ) {
			throw new Exception( "Custom Fonts module $class does not exist at $file", 1 );
		}
		$this->registered_providers[ $id ] = compact( 'class', 'file' );
	}

	/**
	 * Fires when the plugin is activated
	 * @return null
	 */
	public static function on_activate() {
		$plugin = self::get_instance();
	}

	/**
	 * Fires when the plugin is deactivated
	 * @return null
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
