<?php

class Jetpack_Fonts_Control extends WP_Customize_Control {

	public $type = 'jetpackFonts';

	public $jetpack_fonts = '';

	public function enqueue() {
		if ( wp_script_is( 'jetpack-fonts' ) ) {
			return;
		}
		wp_enqueue_style( 'fonts-customizer', plugins_url( 'css/fonts-customizer.css', __FILE__ ), array(), '20150331' );
		wp_enqueue_script( 'jetpack-fonts', plugins_url( 'js/jetpack-fonts.js', __FILE__ ), array( 'customize-controls', 'backbone' ), '20140204', true );
		$data = array(
			'fonts' => $this->jetpack_fonts->get_available_fonts(),
			'types' => $this->jetpack_fonts->get_generator()->get_rule_types(),
			'pairs' => $this->jetpack_fonts->get_generator()->get_pairs()
		);
		wp_localize_script( 'jetpack-fonts', '_JetpackFonts', $data );

	}
	protected function render_content() {
		# silence is golden. render in JS.
	}
}
