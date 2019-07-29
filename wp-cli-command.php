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
	 * Lists all available fonts, optionally from a specific provider
	 *
	 * @subcommand list
	 * @synopsis [--provider=<false>] [--available=<false>] [--subset=<false>] [--format=<id|name>]
	 */
	function list_fonts( $args = array(), $assoc_args = array() ) {
		if ( isset( $assoc_args['available'] ) && 'true' === $assoc_args['available'] ) {
			$value = Jetpack_Fonts::get_instance()->get_available_fonts();
			$middle = ' available fonts found ';
		} else {
			$value = Jetpack_Fonts::get_instance()->get_all_fonts();
			$middle = ' total fonts found ';
		}

		if ( isset( $assoc_args['subset'] ) ) {
			$subset = $assoc_args['subset'];
			$value = array_filter( $value, function( $item ) use( $subset ) {
				return in_array( $subset, $item['subsets']
				//                          ?? []
				);
			} );
			$middle .= "with the {$assoc_args['subset']} subset ";
		}

		if ( isset( $assoc_args['provider'] ) && $assoc_args['provider'] ) {
			$value = wp_list_filter( $value, array( 'provider' => $assoc_args['provider'] ) );
			$end = "from the {$assoc_args['provider']} provider.";
		} else {
			$end = 'from all providers.';
		}

		if ( isset( $assoc_args['format'] ) ) {
			if ( 'id' === $assoc_args['format'] ) {
				$value = array_column( $value, 'id' );
			} else if ( 'name' === $assoc_args['format'] ) {
				$value = array_column( $value, 'displayName' );
			}
		}

		if ( empty( $value ) ) {
			return WP_CLI::error( 'No fonts found.' );
		}
		WP_CLI::print_value( $value );
		WP_CLI::success( count( $value ) . $middle . $end );
	}

	/**
	 * Manipulates the static caches of our providers.
	 *
	 * @subcommand static-cache
	 * @synopsis <set|delete>
	 */
	function static_cache( $args = array(), $assoc_args = array() ) {
		$val = false;
		if ( 'set' === $args[0] ) {
			$val = Jetpack_Fonts::get_instance()->set_static_caches();
		} elseif ( 'delete' === $args[0] ) {
			$val = Jetpack_Fonts::get_instance()->delete_static_caches();
		}

		if ( ! $val ) {
			return WP_CLI::error( 'Please use one of "set" or "delete" when using this command.' );
		}

		if ( ! empty( $val['ok'] ) ) {
			$message = sprintf( 'Static JSON cache files successfully %s for: %s', $args[0], implode( ', ', $val['ok'] ) );
			WP_CLI::success( $message );
		}
		if ( ! empty( $val['fail'] ) ) {
			$message = sprintf( 'Static JSON cache files failed to %s for: %s', $args[0], implode( ', ', $val['fail'] ) );
			WP_CLI::error( $message );
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
		$result = Jetpack_Fonts::get_instance()->save_fonts( $value );
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