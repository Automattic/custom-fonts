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

add_action( 'jetpack_fonts_save', 'wpcom_jetpack_fonts_save' );
function wpcom_jetpack_fonts_save() {
	// invalidate any saved Typekit fonts at this point
	$typekit_data = (array) get_option( 'typekit_data', array( 'families' => null ) );
	if ( isset( $typekit_data['families'] ) && $typekit_data['families'] ) {
		$typekit_data['families'] = null;
		update_option( 'typekit_data', $typekit_data );
	}
}

add_filter( 'jetpack_fonts_selected_fonts', 'wpcom_legacy_fonts' );
function wpcom_legacy_fonts( $fonts ) {
	$typekit_data = (array) get_option( 'typekit_data', array( 'families' => null ) );

	if ( ! isset( $typekit_data['families'] ) || ! $typekit_data[ 'families'] ) {
		return $fonts;
	}

	// If we're filtering in, we can assume there's nothing in the real option
	// Saving will delete the old option and only use our new one
	$families = array();

	foreach ( $typekit_data[ 'families'] as $type => $legacy_font ) {
		if ( 'site-title' === $type ) {
			continue;
		}
		$font_data = wpcom_get_font_data( $legacy_font['id'] );
		$font_data['type'] = $type;

		if ( $legacy_font['size'] !== 0 ) {
			$font_data['size'] = $legacy_font['size'];
		}

		// body-text won't have an fvd and can keep the above default.
		if ( $legacy_font['fvd'] ) {
			$font_data['currentFvd'] = $legacy_font['fvd'];
		}
		$families[] = $font_data;
	}

	return $families;
}

function wpcom_get_font_data( $font_id ) {
	$font_data = Jetpack_Fonts::get_instance()->get_available_fonts();
	$filtered = wp_list_filter( $font_data, array(
		'id' => $font_id,
		'provider' => 'typekit'
	) );
	if ( ! empty( $filtered ) ) {
		return array_shift( $filtered );
	}
	return false;
}

// make sure the customizer gets the filtered version too
add_filter( 'customize_sanitize_js_' . Jetpack_Fonts::OPTION . '[selected_fonts]', array( Jetpack_Fonts::get_instance(), 'get_fonts' ) );


// uncomment to test with mocked legacy option data
# include __DIR__ . '/tests/php/legacy-data-mock.php';