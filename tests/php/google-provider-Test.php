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
	public function setUp() {
	}

	public function test_instance_exists() {
		$jetpack_fonts = new Jetpack_Fonts();
		$provider = new Jetpack_Google_Font_Provider( $jetpack_fonts );
		$this->assertTrue( (boolean)$provider );
	}

	public function test_get_fonts_returns_array() {
		$jetpack_fonts = new Jetpack_Fonts();
		$provider = new Jetpack_Google_Font_Provider( $jetpack_fonts );
		$this->assertCount( 2, $provider->get_fonts() );
	}

}

