<?php

include dirname( __FILE__ ) . '/../../css-generator.php';

function __( $args ) {
	return $args;
}

function apply_filters( $arg1, $arg2 ) {
	$arg1;
	return $arg2;
}

function add_action() {}

function wp_list_pluck( $list, $field ) {
	$results = array();
	foreach( $list as $item ) {
		if ( $item[ $field ] ) {
			array_push( $results, $item[ $field ] );
		}
	}
	return $results;
}

function get_stylesheet() {
	return 'twentyfourteen';
}

function do_action() {}

class Jetpack_Fonts_Css_Generator_Test extends PHPUnit_Framework_TestCase {
	public function test_instance_exists() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertTrue( (boolean)$generator );
	}

	public function test_get_css_returns_text() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$expected = '.site-title{ font-size: 32px; }';
		$fonts_for_css = array();
		$this->assertContains( $expected, $generator->get_css( $fonts_for_css ) );
	}
}
