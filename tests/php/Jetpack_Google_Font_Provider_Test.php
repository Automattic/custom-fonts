<?php

include dirname( __FILE__ ) . '/../../providers/base.php';
include dirname( __FILE__ ) . '/../../providers/google.php';

class Jetpack_Google_Font_Provider_Test extends PHPUnit\Framework\TestCase {
	private $styles_printed = false;

	public function setUp(): void {
		parent::setUp();
		\WP_Mock::setUp();
		\WP_Mock::passthruFunction( 'add_filter' );
		\WP_Mock::passthruFunction( 'add_query_arg' );
		\WP_Mock::passthruFunction( 'get_transient' );
		\WP_Mock::passthruFunction( 'set_transient' );
		\WP_Mock::passthruFunction( 'get_site_transient' );
		\WP_Mock::passthruFunction( 'set_site_transient' );
		\WP_Mock::userFunction( 'register_activation_hook' );
		\WP_Mock::userFunction( 'register_deactivation_hook' );
		\WP_Mock::userFunction( 'wp_parse_url', array( 'return' => function ( $url, $component = -1 ) { return parse_url( $url, $component ); } ) );
		require_once __DIR__ . '/../../custom-fonts.php';
		\WP_Mock::userFunction( 'did_action', array( 'return' => function () { return $this->styles_printed ? 1 : 0; } ) );
	}

	public function tearDown(): void {
		\WP_Mock::tearDown();
		parent::tearDown();
	}
	public function make_provider() {
		$google_response = '
			{
				"kind": "webfonts#webfontList",
				"items": [
					{
						"kind": "webfonts#webfont",
						"family": "Anonymous Pro",
						"category": "monospace",
						"variants": [
							"regular",
							"italic",
							"700",
							"700italic"
						],
						"subsets": [
							"greek",
							"greek-ext",
							"cyrillic-ext",
							"latin-ext",
							"latin",
							"cyrillic"
						],
						"version": "v3",
						"lastModified": "2012-07-25",
						"files": {
							"regular": "http://themes.googleusercontent.com/static/fonts/anonymouspro/v3/Zhfjj_gat3waL4JSju74E-V_5zh5b-_HiooIRUBwn1A.ttf",
							"italic": "http://themes.googleusercontent.com/static/fonts/anonymouspro/v3/q0u6LFHwttnT_69euiDbWKwIsuKDCXG0NQm7BvAgx-c.ttf",
							"700": "http://themes.googleusercontent.com/static/fonts/anonymouspro/v3/WDf5lZYgdmmKhO8E1AQud--Cz_5MeePnXDAcLNWyBME.ttf",
							"700italic": "http://themes.googleusercontent.com/static/fonts/anonymouspro/v3/_fVr_XGln-cetWSUc-JpfA1LL9bfs7wyIp6F8OC9RxA.ttf"
						}
					},
					{
						"kind": "webfonts#webfont",
						"family": "Cinzel",
						"category": "serif",
						"variants": [
							"regular",
							"700",
							"900"
						],
						"subsets": [
	 					    "latin-ext",
							"latin"
						],
					    "version": "v9",
					    "lastModified": "2019-07-17",
						"files": {
							"regular": "http://fonts.gstatic.com/s/cinzel/v9/8vIJ7ww63mVu7gtL8W76HEdHMg.ttf",
							"700": "http://fonts.gstatic.com/s/cinzel/v9/8vIK7ww63mVu7gtzTUHeFGxbO_zo-w.ttf",
							"900": "http://fonts.gstatic.com/s/cinzel/v9/8vIK7ww63mVu7gtzdUPeFGxbO_zo-w.ttf"
						}
					}
				]
			}
		';
		\WP_Mock::userFunction( 'wp_remote_retrieve_response_code', [ 'return' => 200 ] );
		\WP_Mock::userFunction( 'wp_remote_retrieve_body', [ 'return' => $google_response ] );

		$mock = $this->getMockBuilder( Jetpack_Google_Font_Provider::class )
			->disableOriginalConstructor()
			->onlyMethods( [ 'api_get' ] )
			->getMock();

		return $mock;
	}

	protected function retrieve_fonts() {
		return $this->make_provider()->retrieve_fonts();
	}

	protected function get_first_font() {
		$fonts = $this->retrieve_fonts();
		return $fonts[0];
	}

	protected function get_second_font() {
		$fonts = $this->retrieve_fonts();
		return $fonts[1];
	}

	public function test_retreive_fonts_returns_array_with_one_item_per_font() {
		$this->assertCount( 2, $this->retrieve_fonts() );
	}

	public function test_retreive_fonts_returns_encoded_id() {
		$font = $this->get_first_font();
		$this->assertEquals( 'Anonymous+Pro', $font['id'] );
	}

	public function test_retreive_fonts_returns_css_name() {
		$font = $this->get_first_font();
		$this->assertEquals( 'Anonymous Pro', $font['cssName'] );
	}

	public function test_retreive_fonts_returns_display_name() {
		$font = $this->get_first_font();
		$this->assertEquals( 'Anonymous Pro', $font['displayName'] );
	}

	public function test_retreive_fonts_returns_true_body_text_if_whitelisted() {
		$font = $this->get_first_font();
		$this->assertTrue( $font['bodyText'] );
	}

	public function test_retreive_fonts_returns_false_body_text_if_not_whitelisted() {
		$font = $this->get_second_font();
		$this->assertFalse( $font['bodyText'] );
	}

	public function test_retreive_fonts_returns_fvds_with_correct_italic() {
		$font = $this->get_first_font();
		$this->assertContains( 'i4', $font['fvds'] );
	}

	public function test_retreive_fonts_returns_fvds_with_correct_bold_italic() {
		$font = $this->get_first_font();
		$this->assertContains( 'i7', $font['fvds'] );
	}

	public function test_retreive_fonts_returns_fvds_with_correct_regular() {
		$font = $this->get_first_font();
		$this->assertContains( 'n4', $font['fvds'] );
	}

	public function test_retreive_fonts_returns_fvds_with_correct_bold() {
		$font = $this->get_first_font();
		$this->assertContains( 'n7', $font['fvds'] );
	}

	public function test_render_fonts_adds_correct_families() {
		$saved_fonts = array(
			array(
				'type' => 'headings',
				'displayName' => 'Lobster Two',
				'id' => 'Lobster+Two',
				'fvds' => array( 'n4' ),
				'currentFvd' => 'n4',
				'bodyText' => false,
				'cssName' => 'Lobster Two',
				'genericFamily' => 'sans-serif',
			),
			array(
				'type' => 'body-text',
				'displayName' => 'Cinzel',
				'id' => 'Cinzel',
				'size' => 5,
				'fvds' => array( 'i7' ),
				'currentFvd' => 'i7',
				'bodyText' => true,
				'cssName' => 'Cinzel',
				'genericFamily' => 'serif',
			),
		);
		\WP_Mock::userFunction(
			'_x',
			[
				'args' => [ 'no-subset', \WP_Mock\Functions::type( 'string' ), \WP_Mock\Functions::type( 'string' ) ],
				'return' => 'no-subset',
			]
		);
		$provider = $this->make_provider();
		$url = $provider->get_fonts_api_url( $saved_fonts );
		$this->assertEquals( 'https://fonts.googleapis.com/css?family=Lobster+Two:r%7CCinzel:bi&subset=latin%2Clatin-ext', $url );
	}

	public function test_render_fonts_adds_correct_subsets() {
		$saved_fonts = array(
			array(
				'type' => 'headings',
				'displayName' => 'Lobster Two',
				'id' => 'Lobster+Two',
				'fvds' => array( 'n4' ),
				'currentFvd' => 'n4',
				'bodyText' => false,
				'cssName' => 'Lobster Two',
			),
			array(
				'type' => 'body-text',
				'displayName' => 'Anonymous Pro',
				'id' => 'Anonymous+Pro',
				'size' => 5,
				'fvds' => array( 'n4' ),
				'currentFvd' => 'n4',
				'bodyText' => true,
				'cssName' => 'Anonymous Pro',
			),
		);
		\WP_Mock::userFunction(
			'_x',
			[
				'args' => [ 'no-subset', \WP_Mock\Functions::type( 'string' ), \WP_Mock\Functions::type( 'string' ) ],
				'return' => 'greek',
			]
		);
		$provider = $this->make_provider();
		$url = $provider->get_fonts_api_url( $saved_fonts );
		$this->assertEquals( 'https://fonts.googleapis.com/css?family=Lobster+Two:r%7CAnonymous+Pro:r&subset=latin%2Clatin-ext%2Cgreek%2Cgreek-ext', $url );
	}

	public function test_stylesheet_preserves_body_variants_and_deduplicates_families() {
		\WP_Mock::userFunction( '_x', array( 'return' => 'no-subset' ) );
		$font = array( 'id' => 'Fira+Sans' );
		$this->assertSame(
			'https://fonts.googleapis.com/css?family=Fira+Sans:r,i,b,bi&subset=latin%2Clatin-ext',
			$this->make_provider()->get_fonts_api_url( array( $font, $font ) )
		);
	}

	public function test_stylesheet_supports_a_fixed_proxy_endpoint() {
		\WP_Mock::userFunction( '_x', array( 'return' => 'khmer' ) );
		\WP_Mock::onFilter( 'custom_fonts_google_fonts_api_url' )
			->with( 'https://fonts.googleapis.com/css' )
			->reply( 'https://fonts-api.wp.com/css' );
		$this->assertSame(
			'https://fonts-api.wp.com/css?family=Hanuman:600i&subset=khmer',
			$this->make_provider()->get_fonts_api_url( array( array( 'id' => 'Hanuman', 'currentFvd' => 'i6' ) ) )
		);
	}

	public function test_stylesheet_preserves_existing_endpoint_query_parameters() {
		\WP_Mock::userFunction( '_x', array( 'return' => 'no-subset' ) );
		\WP_Mock::onFilter( 'custom_fonts_google_fonts_api_url' )
			->with( 'https://fonts.googleapis.com/css' )
			->reply( 'https://example.org/fonts?source=custom-fonts' );
		$this->assertSame(
			'https://example.org/fonts?source=custom-fonts&family=Cabin:r&subset=latin%2Clatin-ext',
			$this->make_provider()->get_fonts_api_url( array( array( 'id' => 'Cabin', 'currentFvd' => 'n4' ) ) )
		);
	}

	public function test_native_stylesheet_and_preconnect_for_each_display_policy() {
		foreach ( array( 'fallback', 'swap', 'optional', 'block', 'auto', 'invalid' ) as $display ) {
			\WP_Mock::onFilter( 'jetpack_fonts_font_display' )->with( 'fallback' )->reply( $display );
			$this->assert_native_stylesheet( 'https://fonts.googleapis.com/css', 'https://fonts.gstatic.com', 'invalid' === $display ? 'fallback' : $display );
		}
	}

	public function test_native_stylesheet_preconnects_to_a_filtered_font_origin() {
		\WP_Mock::onFilter( 'jetpack_fonts_font_file_origin' )
			->with( '', 'https://example.org/css?family=Cabin:r&subset=latin%2Clatin-ext&display=fallback' )
			->reply( 'https://cdn.example.org' );
		$this->assert_native_stylesheet( 'https://example.org/css', 'https://cdn.example.org', 'fallback' );
	}

	private function assert_native_stylesheet( $endpoint, $font_host, $display ) {
		\WP_Mock::userFunction( '_x', array( 'return' => 'no-subset' ) );
		\WP_Mock::onFilter( 'custom_fonts_google_fonts_api_url' )->with( 'https://fonts.googleapis.com/css' )->reply( $endpoint );
		\WP_Mock::userFunction( 'wp_enqueue_style', array(
			'times' => 1,
			'args'  => array( 'jetpack-custom-fonts-faces', $endpoint . '?family=Cabin:r&subset=latin%2Clatin-ext&display=' . $display, array(), null ),
		) );
		$provider = $this->make_provider();
		\WP_Mock::expectFilterAdded( 'wp_resource_hints', array( $provider, 'resource_hints' ), 10, 2 );

		$this->assertTrue( $provider->render_native_fonts( array( array( 'id' => 'Cabin', 'currentFvd' => 'n4' ) ) ) );
		$existing = array( 'https://example.org' );
		$this->assertSame( array_merge( $existing, array( array( 'href' => $font_host, 'crossorigin' => 'anonymous' ) ) ), $provider->resource_hints( $existing, 'preconnect' ) );
		$this->assertSame( $existing, $provider->resource_hints( $existing, 'dns-prefetch' ) );
	}

	public function test_native_stylesheet_prints_in_place_after_core_has_printed_styles() {
		$this->styles_printed = true;
		\WP_Mock::userFunction( '_x', array( 'return' => 'no-subset' ) );
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 1 ) );
		\WP_Mock::userFunction( 'wp_print_styles', array( 'times' => 1, 'args' => array( 'jetpack-custom-fonts-faces' ) ) );
		$provider = $this->make_provider();
		\WP_Mock::expectFilterNotAdded( 'wp_resource_hints', array( $provider, 'resource_hints' ) );

		$this->expectOutputString( "<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin='anonymous' />\n" );
		$this->assertTrue( $provider->render_native_fonts( array( array( 'id' => 'Cabin', 'currentFvd' => 'n4' ) ) ) );
	}

	public function test_native_stylesheet_is_left_to_core_before_styles_print() {
		\WP_Mock::userFunction( '_x', array( 'return' => 'no-subset' ) );
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 1 ) );
		\WP_Mock::userFunction( 'wp_print_styles', array( 'times' => 0 ) );

		$this->expectOutputString( '' );
		$this->assertTrue( $this->make_provider()->render_native_fonts( array( array( 'id' => 'Cabin', 'currentFvd' => 'n4' ) ) ) );
	}

	public function test_protocol_relative_endpoint_preconnects_to_its_font_host() {
		$this->assert_native_stylesheet( '//fonts.googleapis.com/css', 'https://fonts.gstatic.com', 'fallback' );
	}

	public function test_relative_endpoint_without_a_host_does_not_preconnect() {
		\WP_Mock::userFunction( '_x', array( 'return' => 'no-subset' ) );
		\WP_Mock::userFunction( 'wp_enqueue_style', array(
			'times' => 1,
			'args'  => array( 'jetpack-custom-fonts-faces', '/fonts-proxy/css?family=Cabin:r&subset=latin%2Clatin-ext&display=fallback', array(), null ),
		) );
		\WP_Mock::onFilter( 'custom_fonts_google_fonts_api_url' )->with( 'https://fonts.googleapis.com/css' )->reply( '/fonts-proxy/css' );
		$provider = $this->make_provider();
		\WP_Mock::expectFilterNotAdded( 'wp_resource_hints', array( $provider, 'resource_hints' ) );
		$this->assertTrue( $provider->render_native_fonts( array( array( 'id' => 'Cabin', 'currentFvd' => 'n4' ) ) ) );
		$this->assertSame( array(), $provider->resource_hints( array(), 'preconnect' ) );
	}

	public function test_empty_native_font_list_does_not_enqueue_a_stylesheet() {
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 0 ) );
		$this->assertTrue( $this->make_provider()->render_native_fonts( array() ) );
	}

	public function test_unknown_proxy_does_not_preconnect_to_google() {
		\WP_Mock::userFunction( '_x', array( 'return' => 'no-subset' ) );
		\WP_Mock::userFunction( 'wp_enqueue_style', array( 'times' => 1 ) );
		\WP_Mock::onFilter( 'custom_fonts_google_fonts_api_url' )->with( 'https://fonts.googleapis.com/css' )->reply( 'https://example.org/fonts' );
		$provider = $this->make_provider();
		\WP_Mock::expectFilterNotAdded( 'wp_resource_hints', array( $provider, 'resource_hints' ) );
		$this->assertTrue( $provider->render_native_fonts( array( array( 'id' => 'Cabin' ) ) ) );
		$this->assertSame( array(), $provider->resource_hints( array(), 'preconnect' ) );
	}
}
