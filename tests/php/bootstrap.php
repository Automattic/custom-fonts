<?php

namespace {
	require_once __DIR__ . '/../../vendor/autoload.php';

	// Shared WordPress helpers used by the CSS generator and rendering tests.
	function wp_list_pluck( $list, $field ) {
		$results = array();
		foreach( $list as $item ) {
			if ( $item[ $field ] ) {
				array_push( $results, $item[ $field ] );
			}
		}
		return $results;
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

	WP_Mock::bootstrap();
}
