<?php
/**
 * Manage the Custom Fonts plugin.
 */
class Jetpack_Custom_Fonts_Command extends WP_CLI_Command {

	/**
	 * Flushes all cached font lists.
	 *
	 * @subcommand flush-cache
	 */
	function flush_cache( $args, $assoc_args ) {
		if ( Jetpack_Custom_Fonts::get_instance()->flush_all_cached_fonts() ) {
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
		Jetpack_Custom_Fonts::get_instance()->save_fonts( $value );
		WP_CLI::success( "Fonts successfully saved:" );
		WP_CLI::line( json_encode( $value, 1 ) );
	}

	/**
	 * Get the current Custom Fonts value.
	 *
	 * ## OPTIONS
	 *
	 * --format=<format>
	 * : The value will be run through `print_r()` unless format is set to `json` or `serialized`
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
		$value = Jetpack_Custom_Fonts::get_instance()->get_fonts();
		if ( ! isset( $assoc_args['format'] ) ) {
			$assoc_args['format'] = 'default';
		}
		switch( $assoc_args['format'] ) {
			case 'json':
				$value = json_encode( $value, 1 );
				break;
			case 'serialized':
				$value = serialize( $value );
				break;
			default:
				$value = print_r( $value, 1 );
		}

		WP_CLI::line( $value );
	}
}

WP_CLI::add_command( 'custom-fonts', 'Jetpack_Custom_Fonts_Command' );