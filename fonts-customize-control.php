<?php

class Jetpack_Fonts_Control extends WP_Customize_Control {
	public function enqueue() {
		if ( wp_script_is( 'jetpack-fonts' ) ) {
			return;
		}
		wp_enqueue_script( 'jetpack-fonts', plugins_url( 'js/jetpack-fonts-base.js', __FILE__ ), array( 'customize-controls' ), '20140204', true );
	}
	protected function render_content() {
		echo 'Fonts Control';
	}
}