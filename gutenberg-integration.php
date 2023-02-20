<?php
/**
 * Load the Custom font configuration in Gutenberg.
 *
 * @param $settings
 *
 * @return array
 */
function custom_fonts_append_font_configuration_in_gutenberg_editor( $settings ) {
	require_once __DIR__ . '/css-generator.php';

	$generator = new Jetpack_Fonts_Css_Generator( '' );
	$fonts = new Jetpack_Fonts( $generator );
	$fonts->register_providers();

	if ( ! isset( $settings['styles'][0]['css'] ) ) {
		return $settings;
	}

	$settings['styles'][0]['css'] .= $fonts->get_font_css();

	return $settings;
}

add_filter( 'block_editor_settings_all' , 'custom_fonts_append_font_configuration_in_gutenberg_editor' );

/**
 * Enqueue the font script loader.
 *
 * @return void
 */
function enqueue_font_loader_script_in_gutenberg() {
	$fonts = Jetpack_Fonts::get_instance();
	$fonts->register_providers();

	$fonts->enqueue_fonts();
}

add_action( 'enqueue_block_editor_assets', 'enqueue_font_loader_script_in_gutenberg' );
