<?php

include dirname( __FILE__ ) . '/../../providers/google.php';

// Begin mocks
class Jetpack_Fonts {}

class Jetpack_Font_Provider {
	public function __construct( $jetpack_fonts ) {
		$jetpack_fonts;
	}
}

function add_filter() {}
// End mocks


class Jetpack_Google_Font_Provider_Test extends PHPUnit_Framework_TestCase {
	public function setUp() {
	}

	public function test_instance_exists() {
		$jetpack_fonts = new Jetpack_Fonts();
		$provider = new Jetpack_Google_Font_Provider( $jetpack_fonts );
		$this->assertTrue( (boolean)$provider );
	}

}

