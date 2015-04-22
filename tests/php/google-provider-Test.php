<?php

include dirname( __FILE__ ) . '/../../providers/base.php';
include dirname( __FILE__ ) . '/../../providers/google.php';

// Begin mocks
$google_response = '{
 "kind": "webfonts#webfontList",
 "items": [
  {
   "kind": "webfonts#webfont",
   "family": "Anonymous Pro",
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
}';

class Jetpack_Fonts {}

function add_filter() {}

function get_transient( $key ) {
	$key;
	return;
}

function set_transient( $key, $value ) {
	array( $key, $value );
}

function add_query_arg( $args, $url ) {
	$args;
	return $url;
}

function wp_remote_request( $url, $args ) {
	$url;
	$args;
	return 'foobar';
}

function wp_remote_retrieve_response_code( $response ) {
	$response;
	return 200;
}

function wp_remote_retrieve_body( $response ) {
	$response;
	global $google_response;
	return $google_response;
}
// End mocks


class Jetpack_Google_Font_Provider_Test extends PHPUnit_Framework_TestCase {
	protected function get_fonts() {
		$jetpack_fonts = new Jetpack_Fonts();
		$provider = new Jetpack_Google_Font_Provider( $jetpack_fonts );
		return $provider->get_fonts();
	}

	protected function get_first_font() {
		$fonts = $this->get_fonts();
		return $fonts[0];
	}

	protected function get_second_font() {
		$fonts = $this->get_fonts();
		return $fonts[1];
	}

	public function test_instance_exists() {
		$jetpack_fonts = new Jetpack_Fonts();
		$provider = new Jetpack_Google_Font_Provider( $jetpack_fonts );
		$this->assertTrue( (boolean)$provider );
	}

	public function test_get_fonts_returns_array_with_one_item_per_font() {
		$this->assertCount( 2, $this->get_fonts() );
	}

	public function test_get_fonts_returns_encoded_id() {
		$font = $this->get_first_font();
		$this->assertEquals( 'Anonymous+Pro', $font[ 'id' ] );
	}

	public function test_get_fonts_returns_css_name() {
		$font = $this->get_first_font();
		$this->assertEquals( 'Anonymous Pro', $font[ 'cssName' ] );
	}

	public function test_get_fonts_returns_display_name() {
		$font = $this->get_first_font();
		$this->assertEquals( 'Anonymous Pro', $font[ 'displayName' ] );
	}

	public function test_get_fonts_returns_true_body_text_if_whitelisted() {
		$font = $this->get_first_font();
		$this->assertTrue( $font[ 'bodyText' ] );
	}

	public function test_get_fonts_returns_false_body_text_if_not_whitelisted() {
		$font = $this->get_second_font();
		$this->assertFalse( $font[ 'bodyText' ] );
	}

	public function test_get_fonts_returns_fvds_with_correct_italic() {
		$font = $this->get_first_font();
		$this->assertContains( 'i4', $font[ 'fvds' ] );
	}

	public function test_get_fonts_returns_fvds_with_correct_bold_italic() {
		$font = $this->get_first_font();
		$this->assertContains( 'i7', $font[ 'fvds' ] );
	}

	public function test_get_fonts_returns_fvds_with_correct_regular() {
		$font = $this->get_first_font();
		$this->assertContains( 'n4', $font[ 'fvds' ] );
	}

	public function test_get_fonts_returns_fvds_with_correct_bold() {
		$font = $this->get_first_font();
		$this->assertContains( 'n7', $font[ 'fvds' ] );
	}

}

