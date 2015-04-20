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

class Jetpack_Fonts_Css_Generator_Test extends PHPUnit_Framework_TestCase {
	public function test_instance_exists() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertTrue( (boolean)$generator );
	}
}
