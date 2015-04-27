<?php

define( 'CUSTOM_FONTS_PLUGIN_PATH', dirname( __FILE__ ) . '/../..' );
define( 'WP_PATH', CUSTOM_FONTS_PLUGIN_PATH . '/../../..' );
define( 'WPMU_PLUGIN_DIR', '' );

require_once WP_PATH . '/wp-includes/plugin.php';

// Begin mocks
function __( $args ) {
	return $args;
}

function wp_list_pluck( $list, $field ) {
	$results = array();
	foreach( $list as $item ) {
		if ( $item[ $field ] ) {
			array_push( $results, $item[ $field ] );
		}
	}
	return $results;
}

function get_stylesheet_directory() {
	return dirname( __FILE__ ) . '/../../../../themes/twentyfourteen';
}

function is_child_theme() {
	return false;
}

function get_stylesheet() {
	return  'twentyfourteen' ;
}

function wp_list_filter( $list, $args = array(), $operator = 'AND' ) {
	if ( ! is_array( $list ) )
		return array();

	if ( empty( $args ) )
		return $list;

	$operator = strtoupper( $operator );
	$count = count( $args );
	$filtered = array();

	foreach ( $list as $key => $obj ) {
		$to_match = (array) $obj;

		$matched = 0;
		foreach ( $args as $m_key => $m_value ) {
			if ( array_key_exists( $m_key, $to_match ) && $m_value == $to_match[ $m_key ] )
				$matched++;
		}

		if ( ( 'AND' == $operator && $matched == $count )
		  || ( 'OR' == $operator && $matched > 0 )
		  || ( 'NOT' == $operator && 0 == $matched ) ) {
			$filtered[$key] = $obj;
		}
	}

	return $filtered;
}
function trailingslashit( $string ) {
	return untrailingslashit( $string ) . '/';
}
function untrailingslashit( $string ) {
	return rtrim( $string, '/\\' );
}
// End mocks