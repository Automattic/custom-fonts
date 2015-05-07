<?php
/**
 * Manage the Custom Fonts plugin.
 */
class Jetpack_Fonts_Command extends WP_CLI_Command {

	/**
	 * Repopulates the cached font lists.
	 */
	function repopulate() {
		$timer = microtime( true );
		if ( Jetpack_Fonts::get_instance()->repopulate_all_cached_fonts() ) {
			$elapsed = round ( ( microtime( true ) - $timer ), 3 );
			WP_CLI::success( sprintf( "Fonts cache successfully repopulated in %g seconds", $elapsed ) );
		} else {
			WP_CLI::error( "Something went wrong when repopulating fonts" );
		}

	}

	/**
	 * Flushes all cached font lists.
	 *
	 * @subcommand flush-cache
	 */
	function flush_cache( $args, $assoc_args ) {
		if ( Jetpack_Fonts::get_instance()->flush_all_cached_fonts() ) {
			WP_CLI::success( "Fonts cache successfully flushed" );
		} else {
			WP_CLI::error( "Something went wrong when flushing fonts" );
		}
	}

	/**
	 * Set the Custom Fonts value.
	 *
	 * ## OPTIONS
	 *
	 * <value>
	 * : The new value to set. You may want to try `wp custom-fonts get` first to see the format.
	 * You must supply an array, so --format=json is required.
	 *
	 * ## EXAMPLES
	 *
	 * 	wp custom-fonts set --format=json < your-settings.json
	 * 	wp custom-fonts set '[{"type":"body","provider":"google","id":"Open+Sans","fvds":["n3","i3"]}]' --format=json
	 * 	command-producing-json | wp custom-fonts set --format=json
	 *
	 * @synopsis [<value>] [--format=<format>]
	 */
	function set( $args, $assoc_args ) {
		if ( empty( $args ) ) {
			$args[0] = file_get_contents( 'php://stdin' );
		}
		$value = WP_CLI::read_value( $args[0], $assoc_args );
		$result = Jetpack_Fonts::get_instance()->save_fonts( $value, true );
		if ( is_null( $result ) ) {
			return WP_CLI::warning( 'Fonts are unchanged, you probably passed the same value.' );
		}
		if ( ! $result ) {
			return WP_CLI::error( 'Something went wrong with saving fonts.' );
		}
		WP_CLI::success( 'Fonts successfully saved:' );
		$this->get( array(), $assoc_args );
	}

	/**
	 * Get the current Custom Fonts value.
	 *
	 * ## OPTIONS
	 *
	 * --format=<format>
	 * : Pass --format=json, otherwise run through var_export()
	 *
	 * ## EXAMPLES
	 *
	 * wp custom-fonts get
	 * wp custom-fonts get --format=json
	 * wp custom
	 *
	 * @synopsis [--format=<format>]
	 */
	function get( $args, $assoc_args ) {
		$value = Jetpack_Fonts::get_instance()->get_fonts();
		WP_CLI::print_value( $value, $assoc_args );
	}
}

WP_CLI::add_command( 'custom-fonts', 'Jetpack_Fonts_Command' );