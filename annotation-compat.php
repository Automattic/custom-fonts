<?php

// add late, see if we need to shim in rules
add_action( 'jetpack_fonts_rules', 'wpcom_font_rules_compat', 20 );
function wpcom_font_rules_compat( $rules ) {
	if ( $rules->has_rules() ) {
		return;
	}

	// first, if we already have filters, we are in business
	if ( has_filter( 'typekit_add_font_category_rules' ) ) {
		return wpcom_load_legacy_font_category_rules( $rules );
	}

	// ok, load 'em up
	$annotations_base = apply_filters( 'wpcom_font_rules_location_base', WPMU_PLUGIN_DIR . '/custom-fonts/theme-annotations' );
	$annotations_file = trailingslashit( $annotations_base ) . get_stylesheet() . '.php';
	if ( ! file_exists( $annotations_file ) && is_child_theme() ) {
		$annotations_file = trailingslashit( $annotations_base ) . get_template() . '.php';
	}
	if ( file_exists( $annotations_file ) ) {
		include_once $annotations_file;
		wpcom_load_legacy_font_category_rules( $rules );
	}
}

function wpcom_load_legacy_font_category_rules( $rules ) {
	require_once __DIR__ . '/typekit-theme-mock.php';
	TypekitTheme::$rules_dependency = $rules;
	TypekitTheme::$allowed_categories = $rules->get_allowed_types();
	apply_filters( 'typekit_add_font_category_rules', array() );
}
