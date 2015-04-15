<?php

include dirname( __FILE__ ) . '/../../css-generator.php';

class Jetpack_Fonts_Css_Generator_Test extends PHPUnit_Framework_TestCase {
	public function test_instance_exists() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertTrue( $generator );
	}
}
