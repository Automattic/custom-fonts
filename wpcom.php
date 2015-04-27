<?php

# TEMP to support twentyfourteen still
function temp__jetpack_font_rules( $rules ) {
	if ( 'twentyfourteen' === get_stylesheet() ) {
		include_once __DIR__ . '/annotations.php';
	}
}
add_action( 'jetpack_fonts_rules', 'temp__jetpack_font_rules', 9 );

// add late, see if we need to shim in rules
add_action( 'jetpack_fonts_rules', 'wpcom_font_rules_compat', 20 );
function wpcom_font_rules_compat( $rules ) {
	if ( $rules->has_rules() ) {
		return;
	}

	// first, load 'em up
	$annotations_base = apply_filters( 'wpcom_font_rules_location_base', WPMU_PLUGIN_DIR . '/custom-fonts/theme-annotations' );
	$annotations_file = trailingslashit( $annotations_base ) . get_stylesheet() . '.php';
	if ( file_exists( $annotations_file ) ) {
		require_once __DIR__ . '/typekit-theme-mock.php';
		include_once $annotations_file;
		TypekitTheme::$rules_dependency = $rules;
		apply_filters( 'typekit_add_font_category_rules', array() );
	}
}