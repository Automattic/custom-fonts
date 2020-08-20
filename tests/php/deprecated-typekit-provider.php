<?php

include dirname( __FILE__ ) . '/../../providers/deprecated-typekit.php';

class Jetpack_Deprecated_Typekit_Font_Provider_Test extends PHPUnit_Framework_TestCase {
	public function setUp() {
		parent::setUp();
	}

	public function tearDown() {
		parent::tearDown();
	}

	public function test_current_fvd_returned_if_direct_mapping() {
		$this->assertEquals( 'n4', Jetpack_Fonts_Typekit_Font_Mapper::valid_or_closest_fvd_for_font( 'n4', [ 'n1', 'n2', 'n3', 'n4' ] ) );
		$this->assertEquals( 'i3', Jetpack_Fonts_Typekit_Font_Mapper::valid_or_closest_fvd_for_font( 'i3', [ 'n1', 'n2', 'i3', 'n4' ] ) );
	}

	public function test_closest_fvd_returned_if_no_direct_mapping() {
		$this->assertEquals( 'n5', Jetpack_Fonts_Typekit_Font_Mapper::valid_or_closest_fvd_for_font( 'n4', [ 'n2', 'n5', 'n6' ] ) );
		$this->assertEquals( 'n3', Jetpack_Fonts_Typekit_Font_Mapper::valid_or_closest_fvd_for_font( 'n4', [ 'n3', 'n6', 'n9' ] ) );
		$this->assertEquals( 'i4', Jetpack_Fonts_Typekit_Font_Mapper::valid_or_closest_fvd_for_font( 'i3', [ 'n1', 'i2', 'i4' ] ) );
		$this->assertEquals( 'i2', Jetpack_Fonts_Typekit_Font_Mapper::valid_or_closest_fvd_for_font( 'i3', [ 'n1', 'i2', 'n4', 'i5' ] ) );
	}

	public function test_no_fvd_returned_if_no_possible_mapping() {
		$this->assertEquals( null, Jetpack_Fonts_Typekit_Font_Mapper::valid_or_closest_fvd_for_font( 'n4', [ 'i2', 'i5', 'i6' ] ) );
	}
}
