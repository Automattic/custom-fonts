<?php

if ( ! defined( 'CUSTOM_FONTS_PLUGIN_PATH' ) ) {
	require_once __DIR__ . '/mocks.php';
}

class Annotations_Fallback_Test extends PHPUnit_Framework_TestCase {
	public static function setUpBeforeClass() {
		require_once CUSTOM_FONTS_PLUGIN_PATH . '/css-generator.php';
		require_once CUSTOM_FONTS_PLUGIN_PATH . '/wpcom.php';
		remove_action( 'jetpack_fonts_rules', 'temp__jetpack_font_rules', 9 );
		add_action( 'wpcom_font_rules_location_base', array( __CLASS__, 'wpcom_font_rules_location_base' ) );
	}

	public static function wpcom_font_rules_location_base( $base ) {
		return CUSTOM_FONTS_PLUGIN_PATH . '/tests/php/annotations';
	}

	public function test_has_annotations() {
		$generator = new Jetpack_Fonts_Css_Generator;
		var_dump( $generator->get_rules() );
		$this->assertTrue( $generator->has_rules() );
	}

}