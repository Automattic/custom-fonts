<?php

class Jetpack_Fonts_Rendering_Test extends PHPUnit\Framework\TestCase {
	private $fonts;
	private $provider;
	private $is_admin = false;
	private $is_preview = false;
	private $is_amp = false;

	public function setUp(): void {
		parent::setUp();
		\WP_Mock::setUp();
		\WP_Mock::userFunction( 'register_activation_hook' );
		\WP_Mock::userFunction( 'register_deactivation_hook' );
		\WP_Mock::userFunction( '__', array( 'return_arg' => 0 ) );
		\WP_Mock::userFunction( '_x', array( 'return_arg' => 0 ) );
		\WP_Mock::userFunction( 'is_admin', array( 'return' => function () { return $this->is_admin; } ) );
		\WP_Mock::userFunction( 'is_customize_preview', array( 'return' => function () { return $this->is_preview; } ) );
		\WP_Mock::userFunction( 'is_amp_endpoint', array( 'return' => function () { return $this->is_amp; } ) );
		\WP_Mock::userFunction( 'get_stylesheet_directory', array( 'return' => __DIR__ . '/no-theme' ) );
		\WP_Mock::userFunction( 'is_child_theme', array( 'return' => false ) );
		\WP_Mock::userFunction( 'plugins_url', array( 'return' => 'https://example.org/custom-fonts/js/webfont.js' ) );
		\WP_Mock::userFunction( 'wp_parse_url', array( 'return' => function ( $url, $component = -1 ) { return parse_url( $url, $component ); } ) );
		\WP_Mock::userFunction( 'did_action', array( 'return' => 0 ) );
		\WP_Mock::userFunction( 'wp_print_inline_script_tag', array(
			'return' => function ( $script ) {
				echo '<script data-printer="core">' . $script . '</script>';
			},
		) );

		require_once __DIR__ . '/../../custom-fonts.php';
		require_once __DIR__ . '/../../css-generator.php';
		require_once __DIR__ . '/../../providers/base.php';
		require_once __DIR__ . '/../../providers/google.php';
		require_once __DIR__ . '/../../providers/deprecated-typekit.php';

		$this->fonts = $this->getMockBuilder( Jetpack_Fonts::class )
			->onlyMethods( array( 'get_fonts', 'get_provider' ) )
			->getMock();
		$this->provider = $this->getMockBuilder( Jetpack_Google_Font_Provider::class )
			->setConstructorArgs( array( $this->fonts ) )
			->onlyMethods( array( 'get_font' ) )
			->getMock();
		$this->provider->method( 'get_font' )->willReturn( array( 'genericFamily' => 'sans-serif' ) );
		$this->fonts->method( 'get_provider' )->willReturn( $this->provider );
	}

	public function tearDown(): void {
		\WP_Mock::tearDown();
		parent::tearDown();
	}

	private function select_font( $provider = 'google' ) {
		$this->fonts->method( 'get_fonts' )->willReturn( array( array(
			'provider'   => $provider,
			'id'         => 'typekit' === $provider ? 'gjst' : 'Cabin',
			'cssName'    => 'Cabin',
			'type'       => 'headings',
			'currentFvd' => 'n7',
			'size'       => 1,
		) ) );
	}

	private function enable_native_loading() {
		\WP_Mock::onFilter( 'jetpack_fonts_loading_decision' )
			->with( array( 'mode' => 'loader', 'rule' => 'default' ) )
			->reply( array( 'mode' => 'native', 'rule' => 'filter' ) );
	}

	private function annotate_theme() {
		$this->fonts->get_generator()->add_rule( array(
			'type'     => 'headings',
			'selector' => 'h1, h2',
			'rules'    => array(
				array( 'property' => 'font-family', 'value' => 'serif' ),
				array( 'property' => 'font-size', 'value' => '20px' ),
			),
		) );
	}

	private function render( $force = false ) {
		ob_start();
		try {
			$this->fonts->maybe_render_fonts( $force );
			return ob_get_contents();
		} finally {
			ob_end_clean();
		}
	}

	public function test_invalid_integration_decisions_keep_the_loader() {
		$default = array( 'mode' => 'loader', 'rule' => 'default' );
		foreach ( array( null, true, 'native', array(), array( 'mode' => 'mixed', 'rule' => 'test' ), array( 'mode' => 'native', 'rule' => '' ), array( 'mode' => 'native', 'rule' => array() ) ) as $invalid ) {
			\WP_Mock::onFilter( 'jetpack_fonts_loading_decision' )->with( $default )->reply( $invalid );
			$this->assertSame( $default, $this->fonts->get_loading_decision() );
		}
	}

	public function test_loading_decision_defaults_to_loader_and_accepts_native_opt_in() {
		$this->assertSame( array( 'mode' => 'loader', 'rule' => 'default' ), $this->fonts->get_loading_decision() );
		$this->enable_native_loading();
		$this->assertTrue( $this->fonts->use_native_loading() );
	}

	public function test_loader_remains_the_default() {
		$this->select_font();
		$this->annotate_theme();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 0 ) );
		$output = $this->render();
		$this->assertStringContainsString( 'WebFontConfig = {"google":{"families":["Cabin:b:latin,latin-ext"]}', $output );
		$this->assertStringContainsString( '/js/webfont.js', $output );
		$this->assertStringContainsString( '.wf-active h1, .wf-active h2{', $output );
		$this->assertStringNotContainsString( "classList.add('wf-active')", $output );
		$this->assertStringContainsString( '<style id="jetpack-custom-fonts-css" data-loading="loader" data-rule="default">', $output );
	}

	public function test_render_reports_the_routed_mode_and_rule() {
		$this->select_font();
		$this->annotate_theme();
		\WP_Mock::onFilter( 'jetpack_fonts_loading_decision' )
			->with( array( 'mode' => 'loader', 'rule' => 'default' ) )
			->reply( array( 'mode' => 'native', 'rule' => 'integration' ) );
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 1 ) );
		\WP_Mock::expectAction( 'jetpack_fonts_loading_mode', 'native', 'integration' );
		$output = $this->render();
		$this->assertStringContainsString( '<style id="jetpack-custom-fonts-css" data-loading="native" data-rule="integration">', $output );
		$this->assertStringContainsString( ':root h1, :root h2{', $output );
	}

	public function test_font_css_rendered_on_its_own_has_no_marker() {
		$this->select_font();
		$this->annotate_theme();
		ob_start();
		$this->fonts->render_font_css();
		$this->assertStringStartsWith( '<style id="jetpack-custom-fonts-css">', ob_get_clean() );
	}

	public function test_native_loading_applies_all_font_properties_without_a_loader() {
		$this->enable_native_loading();
		$this->select_font();
		$this->annotate_theme();
		\WP_Mock::userFunction( 'wp_enqueue_style', array(
			'times' => 1,
			'args'  => array( 'jetpack-custom-fonts-faces', 'https://fonts.googleapis.com/css?family=Cabin:b&subset=latin%2Clatin-ext&display=fallback', array(), null ),
		) );
		$output = $this->render();
		$this->assertStringContainsString( ':root h1, :root h2{', $output );
		$this->assertStringContainsString( 'font-family:"Cabin",sans-serif', $output );
		$this->assertStringContainsString( 'font-weight:700', $output );
		$this->assertStringContainsString( 'font-style:normal', $output );
		$this->assertStringContainsString( 'font-size:21.2px', $output );
		$this->assertStringContainsString( "classList.add('wf-active')", $output );
		$this->assertStringContainsString( '<style id="jetpack-custom-fonts-css" data-loading="native" data-rule="filter">', $output );
		$this->assertStringNotContainsString( 'WebFontConfig', $output );
		$this->assertStringNotContainsString( 'webfont.js', $output );
		$this->assertStringNotContainsString( '.wf-active ', $output );
	}

	public function test_compatibility_script_uses_the_core_inline_script_printer() {
		$this->enable_native_loading();
		$this->select_font();
		$this->annotate_theme();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 1 ) );
		$output = $this->render();
		$this->assertStringContainsString( "<script data-printer=\"core\">document.documentElement.classList.add('wf-active');</script>", $output );
		$this->assertStringNotContainsString( '<script>document.documentElement', $output );
	}

	public function test_no_annotations_still_load_and_report_native_fonts() {
		$this->enable_native_loading();
		$this->select_font();
		\WP_Mock::userFunction( 'wp_enqueue_style', array(
			'times' => 1,
			'args'  => array( 'jetpack-custom-fonts-faces', 'https://fonts.googleapis.com/css?family=Cabin:b&subset=latin%2Clatin-ext&display=fallback', array(), null ),
		) );
		\WP_Mock::expectAction( 'jetpack_fonts_loading_mode', 'native', 'filter' );
		$output = $this->render();
		$this->assertStringContainsString( '<style id="jetpack-custom-fonts-css" data-loading="native" data-rule="filter"></style>', $output );
		$this->assertStringContainsString( "classList.add('wf-active')", $output );
		$this->assertStringNotContainsString( 'WebFontConfig', $output );
	}

	public function test_no_annotations_keep_legacy_loading() {
		$this->select_font();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 0 ) );
		$output = $this->render();
		$this->assertStringContainsString( 'WebFontConfig = {"google":{"families":["Cabin:b:latin,latin-ext"]}', $output );
		$this->assertStringContainsString( '/js/webfont.js', $output );
		$this->assertStringContainsString( '<style id="jetpack-custom-fonts-css" data-loading="loader" data-rule="default"></style>', $output );
	}

	public function test_no_saved_fonts_produce_no_output() {
		$this->enable_native_loading();
		$this->fonts->method( 'get_fonts' )->willReturn( array() );
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 0 ) );
		$this->assertSame( '', $this->render() );
	}

	public function test_amp_produces_no_output() {
		$this->enable_native_loading();
		$this->select_font();
		$this->is_amp = true;
		$this->annotate_theme();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 0 ) );
		$this->assertSame( '', $this->render() );
	}

	public function test_preview_is_skipped_and_forced_preview_retains_loader() {
		$this->enable_native_loading();
		$this->select_font();
		$this->is_preview = true;
		$this->annotate_theme();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 0 ) );
		$this->assertSame( '', $this->render() );
		$output = $this->render( true );
		$this->assertStringContainsString( 'WebFontConfig', $output );
		$this->assertStringContainsString( '.wf-active h1', $output );
		$this->assertStringNotContainsString( ':root', $output );
	}

	public function test_editor_keeps_google_loader_config_even_when_native_is_enabled() {
		$this->enable_native_loading();
		$this->select_font();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 0 ) );
		\WP_Mock::userFunction( 'wp_register_script', array( 'times' => 1 ) );
		\WP_Mock::userFunction( 'wp_enqueue_script', array( 'times' => 1, 'args' => array( 'webfonts' ) ) );
		\WP_Mock::userFunction( 'wp_localize_script', array(
			'times' => 1,
			'args'  => array( 'webfonts', 'WebFontConfig', array(
				'google'  => array( 'families' => array( 'Cabin:b:latin,latin-ext' ) ),
				'api_url' => 'https://fonts.googleapis.com/css',
			) ),
		) );
		$this->fonts->enqueue_fonts();
		$this->assertSame( array( 'google' => array( 'families' => array( 'Cabin:b:latin,latin-ext' ) ) ), $this->fonts->get_webfont_options() );
	}

	public function test_admin_does_not_enable_native_loading() {
		$this->enable_native_loading();
		$this->is_admin = true;
		$this->assertFalse( $this->fonts->use_native_loading() );
	}

	public function test_native_loading_keeps_deprecated_typekit_mapping() {
		$this->enable_native_loading();
		$this->select_font( 'typekit' );
		$this->annotate_theme();
		\WP_Mock::userFunction( 'wp_enqueue_style', array(
			'times' => 1,
			'args'  => array( 'jetpack-custom-fonts-faces', 'https://fonts.googleapis.com/css?family=Merriweather:b&subset=latin%2Clatin-ext&display=fallback', array(), null ),
		) );
		$output = $this->render();
		$this->assertStringContainsString( 'font-family:"Merriweather",serif', $output );
		$this->assertStringNotContainsString( 'WebFontConfig', $output );
	}

	public function test_native_prefix_applies_when_the_generator_predates_the_filter() {
		$this->select_font();
		$this->annotate_theme();
		$this->enable_native_loading();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 1 ) );
		$output = $this->render();
		$this->assertStringContainsString( ':root h1, :root h2{', $output );
		$this->assertStringNotContainsString( '.wf-active ', $output );
	}

	public function test_native_prefix_replaces_the_loader_prefix_on_an_injected_generator() {
		$output = $this->render_with_injected_generator( new Jetpack_Fonts_Css_Generator() );
		$this->assertStringContainsString( ':root h1, :root h2{', $output );
		$this->assertStringNotContainsString( '.wf-active ', $output );
	}

	public function test_native_loading_keeps_other_injected_prefixes() {
		$output = $this->render_with_injected_generator( new Jetpack_Fonts_Css_Generator( '.editor-styles-wrapper' ) );
		$this->assertStringContainsString( '.editor-styles-wrapper h1, .editor-styles-wrapper h2{', $output );
		$this->assertStringNotContainsString( ':root', $output );
	}

	private function render_with_injected_generator( $generator ) {
		$this->fonts = $this->getMockBuilder( Jetpack_Fonts::class )
			->setConstructorArgs( array( $generator ) )
			->onlyMethods( array( 'get_fonts', 'get_provider' ) )
			->getMock();
		$this->fonts->method( 'get_provider' )->willReturn( $this->provider );
		$this->enable_native_loading();
		$this->select_font();
		$this->annotate_theme();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 1 ) );
		return $this->render();
	}

	public function test_provider_on_the_loader_reports_mixed_and_owns_wf_active() {
		$this->provider = $this->getMockBuilder( Jetpack_Google_Font_Provider::class )
			->setConstructorArgs( array( $this->fonts ) )
			->onlyMethods( array( 'get_font', 'render_native_fonts' ) )
			->getMock();
		$this->provider->method( 'get_font' )->willReturn( array( 'genericFamily' => 'sans-serif' ) );
		$this->provider->method( 'render_native_fonts' )->willReturn( false );
		$this->fonts = $this->getMockBuilder( Jetpack_Fonts::class )
			->onlyMethods( array( 'get_fonts', 'get_provider' ) )
			->getMock();
		$this->fonts->method( 'get_provider' )->willReturn( $this->provider );
		$this->enable_native_loading();
		$this->select_font();
		$this->annotate_theme();
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 0 ) );
		\WP_Mock::expectAction( 'jetpack_fonts_loading_mode', 'mixed', 'filter' );
		$output = $this->render();
		$this->assertStringContainsString( 'WebFontConfig', $output );
		$this->assertStringContainsString( '<style id="jetpack-custom-fonts-css" data-loading="mixed" data-rule="filter">', $output );
		$this->assertStringContainsString( ':root h1, :root h2{', $output );
		$this->assertStringNotContainsString( "classList.add('wf-active')", $output );
	}

	public function test_other_providers_can_keep_their_loader_configuration() {
		$fonts = $this->getMockBuilder( Jetpack_Fonts::class )->onlyMethods( array( 'get_fonts', 'get_provider' ) )->getMock();
		$provider = $this->createMock( Jetpack_Google_Font_Provider::class );
		$provider->method( 'is_active' )->willReturn( true );
		$provider->method( 'render_native_fonts' )->willReturn( false );
		$provider->expects( $this->once() )->method( 'render_fonts' );
		$provider->method( 'get_webfont_config_option' )->willReturn( array( 'custom' => array( 'families' => array( 'Example' ) ) ) );
		$fonts->method( 'get_provider' )->willReturn( $provider );
		$fonts->method( 'get_fonts' )->willReturn( array( array( 'provider' => 'custom', 'id' => 'Example' ) ) );
		$this->assertSame( array( 'custom' => array( 'families' => array( 'Example' ) ) ), $fonts->get_webfont_options( true ) );
	}
}
