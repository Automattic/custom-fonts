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
}

WP_CLI::add_command( 'custom-fonts', 'Jetpack_Custom_Fonts_Command' );