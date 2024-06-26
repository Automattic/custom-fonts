<?php

class Jetpack_Fonts_Control extends WP_Customize_Control {

	public $type = 'jetpackFonts';

	public $jetpack_fonts = '';

	public function enqueue() {
		if ( wp_script_is( 'jetpack-fonts' ) ) {
			return;
		}
		wp_enqueue_style( 'fonts-customizer', plugins_url( 'css/fonts-customizer.css', __FILE__ ), array(), '20240626' );

		/**
		 * Filters the Google Fonts API URL.
		 *
		 * @param string $url The Google Fonts API URL.
		 */
		$api_url = apply_filters( 'custom_fonts_google_fonts_api_url', 'https://fonts.googleapis.com/css' );

		wp_register_script( 'webfonts', plugins_url( 'js/webfont.js', __FILE__ ), array(), '20240626', true );
		wp_localize_script( 'webfonts', 'WebFontConfig', array( 'api_url' => $api_url ) );

		wp_enqueue_script( 'jetpack-fonts', plugins_url( 'js/jetpack-fonts.js', __FILE__ ), array( 'customize-controls', 'backbone', 'webfonts' ), '20240626', true );
		$data = array(
			'fonts' => $this->jetpack_fonts->get_available_fonts(),
			'types' => $this->jetpack_fonts->get_generator()->get_rule_types(),
			'pairs' => $this->jetpack_fonts->get_generator()->get_pairs(),
			'fvdMap' => Jetpack_Font_Provider::fvd_to_variant_name_map()
		);

		// all translations go here
		$data['i18n'] = array(
			'Default Theme Font' => __( 'Default Theme Font' ),
			'Tiny' => __( 'Tiny' ),
			'Small' => __( 'Small' ),
			'Normal' => __( 'Normal' ),
			'Normal Size' => __( 'Normal Size' ),
			'Large' => __( 'Large' ),
			'Huge' => __( 'Huge' )
		);

		wp_localize_script( 'jetpack-fonts', '_JetpackFonts', $data );

	}
	protected function render_content() {
		# silence is golden. render in JS.
	}
}
