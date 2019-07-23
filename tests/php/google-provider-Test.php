<?php

include dirname( __FILE__ ) . '/../../providers/base.php';
include dirname( __FILE__ ) . '/../../providers/google.php';

if ( ! function_exists( 'add_filter' ) ) {
	function add_filter() {}
}

function add_query_arg( $args, $url ) {
	return $url;
}

function get_transient( $key ) {
	global $google_transients;

	return $google_transients[$key] ?: false;
}

function set_transient( $key, $value, $timeout ) {
	global $google_transients;

	$google_transients[$key] = $value;
}

function get_site_transient( $key ) {
	global $google_site_transients;

	return $google_site_transients[$key] ?: false;
}

function set_site_transient( $key, $value, $timeout ) {
	global $google_site_transients;

	$google_site_transients[$key] = $value;
}
// End mocks


class Jetpack_Google_Font_Provider_Test extends PHPUnit_Framework_TestCase {

	public function make_provider() {
        $mock = $this->getMockBuilder(Jetpack_Google_Font_Provider::class)
			->disableOriginalConstructor()
			->setMethods(['retrieve_response', 'get_cached_fonts'])
			->getMock();

        $mock->method('retrieve_response')
             ->willReturn('{
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
			   "family": "Antic",
			   "category": "sans-serif",
			   "variants": [
			    "regular"
			   ],
			   "subsets": [
			    "latin"
			   ],
			   "version": "v4",
			   "lastModified": "2012-07-25",
			   "files": {
			    "regular": "http://themes.googleusercontent.com/static/fonts/antic/v4/hEa8XCNM7tXGzD0Uk0AipA.ttf"
			   }
			  }
			 ]
			}');

        return $mock;
	}

	protected function get_fonts() {
		return $this->make_provider()->get_fonts();
	}

	public function test_get_fonts_returns_array_with_one_item_per_font() {
		$this->assertCount( 2, $this->get_fonts() );
	}

	public function test_get_fonts_returns_encoded_id() {
		$this->assertEquals( 'Anonymous+Pro', $this->get_fonts()[0][ 'id' ] );
	}

	public function test_get_fonts_returns_css_name() {
		$this->assertEquals( 'Anonymous Pro', $this->get_fonts()[0][ 'cssName' ] );
	}

	public function test_get_fonts_returns_display_name() {
		$this->assertEquals( 'Anonymous Pro', $this->get_fonts()[0][ 'displayName' ] );
	}

	public function test_get_fonts_returns_true_body_text_if_whitelisted() {
		$this->assertTrue( $this->get_fonts()[0][ 'bodyText' ] ); // intentional 0
	}

	public function test_get_fonts_returns_false_body_text_if_not_whitelisted() {
		$this->assertFalse( $this->get_fonts()[1][ 'bodyText' ] ); // intentional 1
	}

	public function test_get_fonts_returns_fvds_with_correct_italic() {
		$this->assertContains( 'i4', $this->get_fonts()[0][ 'fvds' ] );
	}

	public function test_get_fonts_returns_fvds_with_correct_bold_italic() {
		$this->assertContains( 'i7', $this->get_fonts()[0][ 'fvds' ] );
	}

	public function test_get_fonts_returns_fvds_with_correct_regular() {
		$this->assertContains( 'n4', $this->get_fonts()[0][ 'fvds' ] );
	}

	public function test_get_fonts_returns_fvds_with_correct_bold() {
		$this->assertContains( 'n7', $this->get_fonts()[0][ 'fvds' ] );
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
				'genericFamily' => 'sans-serif'
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
				'genericFamily' => 'serif'
			)
		);
		\WP_Mock::setUp();
		\WP_Mock::wpFunction( '_x', array(
			'args' => array( 'no-subset', \WP_Mock\Functions::type( 'string' ), \WP_Mock\Functions::type( 'string' ) ),
			'return' => ''
		) );
		$provider = $this->make_provider();
		$url = $provider->get_fonts_api_url( $saved_fonts );
		$this->assertEquals( '//fonts.googleapis.com/css?family=Lobster+Two:r|Cinzel:bi&subset=latin%2Clatin-ext', $url );
		\WP_Mock::tearDown();
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
				'cssName' => 'Lobster Two'
			),
			array(
				'type' => 'body-text',
				'displayName' => 'Anonymous Pro',
				'id' => 'Anonymous+Pro',
				'size' => 5,
				'fvds' => array( 'n4' ),
				'currentFvd' => 'n4',
				'bodyText' => true,
				'cssName' => 'Anonymous Pro'
			)
		);
		\WP_Mock::setUp();
		\WP_Mock::wpFunction( '_x', array(
			'args' => array( 'no-subset', \WP_Mock\Functions::type( 'string' ), \WP_Mock\Functions::type( 'string' ) ),
			'return' => 'greek'
		) );
		$provider = $this->make_provider();
		$url = $provider->get_fonts_api_url( $saved_fonts );
		$this->assertEquals( '//fonts.googleapis.com/css?family=Lobster+Two:r|Anonymous+Pro:r&subset=latin%2Clatin-ext%2Cgreek%2Cgreek-ext', $url );
		\WP_Mock::tearDown();
	}

}

