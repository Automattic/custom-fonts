<?php
class Jetpack_Google_Font_Provider extends Jetpack_Font_Provider {

	protected $api_base = 'https://www.googleapis.com/webfonts/v1/webfonts';

	public $id = 'google';

	public static $fonts = null; // null if unset, [] if set but empty, [[fonts]] if set

	// These fonts not available as body/base fonts. The front end js will filter them
	// them out, leaving them only in the header field.
	//
	// Any font not on this list is available as both a header font and a body font.
	function header_only_fonts() {
		return array(
			'Abril+Fatface',
			'Cherry+Swash',
			'Cinzel',
			'Fondamento',
			'Lobster+Two',
			'Montserrat',
			'Muli',
			'Oswald',
			'Playfair+Display',
			'Roboto+Slab',
			'Tangerine',
		);
	}

	public $whitelists_by_subset = [
		// These subsets have too many fonts to simply display and need to be
		// curated
		'latin' => [
			// latin / latin-ext
			'Alegreya',
			'Alegreya+Sans',
			'Anonymous+Pro',
			'Arimo',
			'Exo+2',
			'Gentium+Book+Basic',
			'Karla',
			'Lato',
			'Lora',
			'Libre+Baskerville',
			'Merriweather',
			'Merriweather+Sans',
			'Noticia+Text',
			'Noto+Sans',
			'Noto+Serif',
			'Open+Sans',
			'PT+Sans',
			'PT+Serif',
			'Quattrocento+Sans',
			'Source+Code+Pro',
			'Source+Sans+Pro',
			'Ubuntu',
			'Vollkorn',

			// todo: clean up / dedupe - these are the heading fonts from v1.0.1, above are the body fonts
			// latin / latin-ext
			'Abril+Fatface',
			'Cherry+Swash',
			'Cinzel',
			'Fondamento',
			'Lobster+Two',
			'Montserrat',
			'Muli',
			'Oswald',
			'Playfair+Display',
			'Roboto+Slab',
			'Tangerine',
		],

		'latin-ext' => [],

		// Not curated yet
		'arabic' => [],

		// Not curated yet
		'bengali' => [
			'Atma',
			'Baloo+Da',
			'Galada',
			'Hind+Siliguri',
			'Mina'
		],
		// Not curated yet
		'chinese-hongkong' => [
			'Noto+Sans+HK'
		],
		// Not curated yet
		'chinese-simplified' => [
			'Noto+Sans+SC',
			'Noto+Serif+SC',
			'ZCOOL+KuaiLe',
			'ZCOOL+QingKe+HuangYou',
			'ZCOOL+XiaoWei'
		],
		// Not curated yet
		'chinese-traditional' => [
			'Noto+Sans+TC',
			'Noto+Serif+TC'
		],

		'cyrillic' => [],
		'cyrillic-ext' => [],

		// Not curated yet
		'greek' => [
			'Advent+Pro',
			'Alegreya',
			'Alegreya+SC',
			'Alegreya+Sans',
			'Alegreya+Sans+SC',
			'Anonymous+Pro',
			'Arimo',
			'Cardo',
			'Caudex',
			'Comfortaa',
			'Cousine',
			'Didact+Gothic',
			'EB+Garamond',
			'Fira+Mono',
			'Fira+Sans',
			'Fira+Sans+Condensed',
			'Fira+Sans+Extra+Condensed',
			'GFS+Didot',
			'GFS+Neohellenic',
			'IBM+Plex+Sans',
			'Jura',
			'Literata',
			'M+PLUS+1p',
			'M+PLUS+Rounded+1c',
			'Noto+Sans',
			'Noto+Serif',
			'Nova+Mono',
			'Open+Sans',
			'Open+Sans+Condensed',
			'Play',
			'Press+Start+2P',
			'Roboto',
			'Roboto+Condensed',
			'Roboto+Mono',
			'Roboto+Slab',
			'Source+Sans+Pro',
			'Tinos',
			'Ubuntu',
			'Ubuntu+Condensed',
			'Ubuntu+Mono',
			'Vollkorn'
		],
		// Not curated yet
		'gujarati' => [
			'Baloo+Bhai',
			'Farsan',
			'Hind+Vadodara',
			'Kumar+One',
			'Kumar+One+Outline',
			'Mogra',
			'Mukta+Vaani',
			'Rasa',
			'Shrikhand'
		],
		// Not curated yet
		'gurmukhi' => [
			'Baloo+Paaji',
			'Mukta+Mahee'
		],
		// Not curated yet
		'hebrew' => [
			'Alef',
			'Amatic+SC',
			'Arimo',
			'Assistant',
			'Bellefair',
			'Cousine',
			'David+Libre',
			'Frank+Ruhl+Libre',
			'Heebo',
			'M+PLUS+1p',
			'M+PLUS+Rounded+1c',
			'Miriam+Libre',
			'Rubik',
			'Secular+One',
			'Suez+One',
			'Tinos',
			'Varela+Round'
		],
		// Not curated yet
		'japanese' => [
			'Kosugi',
			'Kosugi+Maru',
			'M+PLUS+1p',
			'M+PLUS+Rounded+1c',
			'Noto+Sans+JP',
			'Noto+Serif+JP',
			'Sawarabi+Gothic',
			'Sawarabi+Mincho'
		],
		// Not curated yet
		'kannada' => [
			'Baloo+Tamma'
		],
		// Not curated yet
		'khmer' => [
			'Angkor',
			'Battambang',
			'Bayon',
			'Bokor',
			'Chenla',
			'Content',
			'Dangrek',
			'Fasthand',
			'Freehand',
			'Hanuman',
			'Kantumruy',
			'Kdam+Thmor',
			'Khmer',
			'Koulen',
			'Metal',
			'Moul',
			'Moulpali',
			'Nokora',
			'Odor+Mean+Chey',
			'Preahvihear',
			'Siemreap',
			'Suwannaphum',
			'Taprom'
		],
		// Not curated yet
		'korean' => [
			'Black+And+White+Picture',
			'Black+Han+Sans',
			'Cute+Font',
			'Do+Hyeon',
			'Dokdo',
			'East+Sea+Dokdo',
			'Gaegu',
			'Gamja+Flower',
			'Gothic+A1',
			'Gugi',
			'Hi+Melody',
			'Jua',
			'Kirang+Haerang',
			'Nanum+Brush+Script',
			'Nanum+Gothic',
			'Nanum+Gothic+Coding',
			'Nanum+Myeongjo',
			'Nanum+Pen+Script',
			'Noto+Sans+KR',
			'Noto+Serif+KR',
			'Poor+Story',
			'Song+Myung',
			'Stylish',
			'Sunflower',
			'Yeon+Sung'
		],
		// Not curated yet
		'malayalam' => [
			'Baloo+Chettan'
		],
		// Not curated yet
		'myanmar' => [
			'Padauk'
		],
		// Not curated yet
		'oriya' => [
			'Baloo+Bhaina'
		],
		// Not curated yet
		'sinhala' => [
			'Abhaya+Libre'
		],
		// Not curated yet
		'tamil' => [
			'Arima+Madurai',
			'Baloo+Thambi',
			'Catamaran',
			'Coiny',
			'Hind+Madurai',
			'Kavivanar',
			'Meera+Inimai',
			'Mukta+Malar',
			'Pavanam'
		],
		// Not curated yet
		'telugu' => [
			'Baloo+Tammudu',
			'Chathura',
			'Dhurjati',
			'Gidugu',
			'Gurajada',
			'Hind+Guntur',
			'Lakki+Reddy',
			'Mallanna',
			'Mandali',
			'NTR',
			'Peddana',
			'Ramabhadra',
			'Ramaraja',
			'Ravi+Prakash',
			'Sree+Krushnadevaraya',
			'Suranna',
			'Suravaram',
			'Tenali+Ramakrishna',
			'Timmana'
		],
		// Not curated yet
		'thai' => [
			'Athiti',
			'Bai+Jamjuree',
			'Chakra+Petch',
			'Charm',
			'Charmonman',
			'Chonburi',
			'Fahkwang',
			'Itim',
			'K2D',
			'Kanit',
			'KoHo',
			'Kodchasan',
			'Krub',
			'Maitree',
			'Mali',
			'Mitr',
			'Niramit',
			'Pattaya',
			'Pridi',
			'Prompt',
			'Sarabun',
			'Sriracha',
			'Srisakdi',
			'Taviraj',
			'Thasadith',
			'Trirong'
		],

		// Not curated yet
		'vietnamese' => [],
	];

	/**
	 * Constructor
	 * @param Jetpack_Fonts $custom_fonts Manager instance
	 */
	public function __construct( Jetpack_Fonts $custom_fonts ) {
		parent::__construct( $custom_fonts );
		add_filter( 'jetpack_fonts_whitelist_' . $this->id, array( $this, 'locale_specific_whitelist' ), 9 );
	}

	public function get_additional_data() {
		// We need this wpcom function in order to get the right locale after
		// determine_locale() fudges the locale for wp-admin pages.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_lang_code = get_blog_lang_code();
		} else {
			$blog_lang_code = get_locale();
		}

		$subset = $this->subset_for_locale( $blog_lang_code );

		return array(
			'googleSubsetString' => $this->get_font_subset_string(),
			'googleSubset' => $subset,
		);
	}

	public static function subset_for_locale( $locale ) {
		$switched = false;

		if( $locale !== get_locale() ) {
			$switched = switch_to_locale( $locale );
		}

		// https://translate.wordpress.com/projects/wpcom/-all-translations/158779/
		$subset = _x( 'no-subset', 'Add new subset (greek, cyrillic, devanagari, vietnamese)', 'custom-fonts' );

		if( $switched ) {
			restore_previous_locale();
		}

		return $subset;
	}

	public function locale_specific_whitelist( $whitelist ) {
		// We need this wpcom function in order to get the right locale after
		// determine_locale() fudges the locale for wp-admin pages.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_lang_code = get_blog_lang_code();
		} else {
			$blog_lang_code = get_locale();
		}

		$subset = $this->subset_for_locale( $blog_lang_code );

		return array_unique( array_merge(
			$this->whitelists_by_subset['latin'],
			$this->whitelists_by_subset['latin-ext'],
			$this->whitelists_by_subset[ $subset ] ?? []
		) );
	}

	/**
	 * Retrieve fonts from the API
	 * @return array List of fonts
	 */
	public function retrieve_fonts() {
		$response = $this->api_get();
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}
		$fonts = wp_remote_retrieve_body( $response );
		$fonts = json_decode( $fonts, true );
		$fonts = array_map( array( $this, 'format_font' ), $fonts['items'] );
		return $fonts;
	}

	// TEMP
	public function get_api_key() {
		return 'AIzaSyBUK3PeqSEzwPNIyg94dBQpziFOPvm7-aA';
	}

	/**
	 * Converts a font from API format to internal format.
	 * @param  array $font API font
	 * @return array       Formatted font
	 */
	public function format_font( $font ) {
		switch( $font['category'] ) {
			case 'display':
				// a guess: doesn't map nicely. thankfully we don't have many here
				$generic = 'sans-serif';
				break;
			case 'handwriting':
				$generic = 'cursive';
				break;
			default:
				$generic = $font['category'];
		}
		$id = urlencode( $font['family'] );
		$formatted = array(
			'id'   => $id,
			'cssName' => $font['family'],
			'displayName' => $font['family'],
			'fvds' => $this->variants_to_fvds( $font['variants'] ),
			'genericFamily' => $generic,
			'subsets' => $font['subsets'],
			'bodyText' => ! in_array( $id, $this->header_only_fonts() ),
		);
		return $formatted;
	}

	/**
	 * Converts API variants to Font Variant Descriptions
	 * @param  array $variants
	 * @return array           FVDs
	 */
	private function variants_to_fvds( $variants ) {
		$fvds = array();
		foreach( $variants as $variant ) {
			array_push( $fvds, $this->variant_to_fvd( $variant ) );
		}
		return $fvds;
	}

	/**
	 * Convert an API variant to a Font Variant Description
	 * @param  string $variant API variant
	 * @return string          FVD
	 */
	private function variant_to_fvd( $variant ) {
		$variant = strtolower( $variant );

		if ( false !== strpos( $variant, 'italic' ) ) {
			$style = 'i';
			$weight = str_replace( 'italic', '', $variant );
		} elseif ( false !== strpos( $variant, 'oblique' ) ) {
			$style = 'o';
			$weight = str_replace( 'oblique', '', $variant );
		} else {
			$style = 'n';
			$weight = $variant;
		}

		if ( 'regular' === $weight || 'normal' === $weight || '' === $weight ) {
			$weight = '400';
		}
		$weight = substr( $weight, 0, 1 );
		return $style . $weight;
	}

	/**
	 * Adds an appropriate Google Fonts stylesheet to the page. Will not be called
	 * with an empty array.
	 * @param  array $fonts List of fonts.
	 * @return void
	 */
	public function render_fonts( $fonts ) {
	}

	public function get_webfont_config_option( $fonts ) {
		return array( 'google' => array( 'families' => $this->convert_fonts_to_families( $fonts ) ) );
	}

	/**
	 * Return an array of string versions of the font choices as used by the
	 * Google API's JavaScript function.
	 *
	 * Example output: `[ 'Lato:400,100italic:latin,latin-ext', 'Open+Sans:400italic,400,600:latin,latin-ext' ]`
	 *
	 * @param array $fonts The list of fonts to convert.
	 * @return array The `families` strings expected by Google.
	 */
	public function convert_fonts_to_families( $fonts ) {
		$api_fonts = array();
		foreach( $fonts as $font ) {
			if ( isset( $font['currentFvd'] ) ) {
				$current_variant = [ $font['currentFvd'] ];
			} else {
				$current_variant = [ 'n4', 'i4', 'n7', 'i7' ];
			}
			$family = $font['id'] . ':' . $this->fvds_to_api_string( $current_variant );
			$subsets = $this->get_font_subset_string();
			if ( strlen( $subsets ) > 0 ) {
				$family .= ':' . $subsets;
			}
			array_push( $api_fonts, $family );
		}
		return $api_fonts;
	}

	/**
	 * Return the Google API URL used by render_fonts
	 * @param array $fonts List of fonts.
	 * @return string   The URL
	 */
	public function get_fonts_api_url( $fonts ) {
		$base = '//fonts.googleapis.com/css?family=';
		$api_fonts = array();
		foreach( $fonts as $font ) {
			if ( isset( $font['currentFvd'] ) ) {
				$current_variant = [ $font['currentFvd'] ];
			} else {
				$current_variant = [ 'n4', 'i4', 'n7', 'i7' ];
			}
			$api_fonts[] = $font['id'] . ':' . $this->fvds_to_api_string( $current_variant );
		}
		$api_url = $base . implode( '|', $api_fonts );
		$subsets = $this->get_font_subset_string();
		if ( strlen( $subsets ) > 0 ) {
			$api_url .= '&subset=' . urlencode( $subsets );
		}
		return $api_url;
	}

	/**
	 * Return the subset string for the current subset specified in the
	 * translation file for the string `no-subset`.
	 * @return string  The subset string for use by get_fonts_api_url
	 */
	public function get_font_subset_string() {
		$subset_string = 'latin,latin-ext';
		$subset = _x( 'no-subset', 'Add new subset (greek, cyrillic, devanagari, vietnamese)', 'custom-fonts' );
		if ( 'cyrillic' === $subset ) {
			$subset_string .= ',cyrillic,cyrillic-ext';
		} elseif ( 'greek' === $subset ) {
			$subset_string .= ',greek,greek-ext';
		} elseif ( 'devanagari' === $subset ) {
			$subset_string .= ',devanagari';
		} elseif ( 'vietnamese' === $subset ) {
			$subset_string .= ',vietnamese';
		}
		return $subset_string;
	}

	/**
	 * Convert FVDs to an API string for variants.
	 * @param  array $fvds FVDs
	 * @return string      API variants
	 */
	private function fvds_to_api_string( $fvds ) {
		$to_return = array();
		foreach( $fvds as $fvd ) {
			switch ( $fvd ) {
				case 'n4':
					$to_return[] = 'r'; break;
				case 'i4':
					$to_return[] = 'i'; break;
				case 'n7':
					$to_return[] = 'b'; break;
				case 'i7':
					$to_return[] = 'bi'; break;
				default:
					$style = substr( $fvd, 1, 1 ) . '00';
					if ( 'i' === substr( $fvd, 0, 1 ) ) {
						$style .= 'i';
					}
					$to_return[] = $style;
			}
		}
		return implode( ',', $to_return );
	}

	/**
	 * The URL for your frontend customizer script. Underscore and jQuery
	 * will be called as dependencies.
	 * @return string
	 */
	public function customizer_frontend_script_url() {

	}

	/**
	 * The URL for your admin customizer script to enable your control.
	 * Backbone, Underscore, and jQuery will be called as dependencies.
	 * @return string
	 */
	public function customizer_admin_script_url() {

	}

	/**
	 * Overrides base.php allowing `wp custom-fonts static-cache set` to work as expected
	 */
	public function write_cached_json( ) {
		$fonts = $this->retrieve_fonts();

		if ( ! is_array( $fonts ) || empty( $fonts ) ) {
			return false;
		}

		$path = __DIR__ . '/google.json';

		return file_put_contents( $path, json_encode( $fonts ) );
	}

	/**
	 * Get all available fonts from Google.
	 * @return array A list of fonts.
	 */
	public function get_fonts() {
		if ( null !== static::$fonts ) {
			return static::$fonts;
		}

		$path = __DIR__ . '/google.json';

		if ( is_readable( $path ) ) {
			static::$fonts = json_decode( file_get_contents( $path ), true );

			return static::$fonts;
		}

		return [];
	}

	/**
	 * We need this for our abstract class extension but with Google we have no need for saving to
	 * an API since it's completely free.
	 * @param  array $fonts  A list of fonts.
	 * @return array         A potentially modified list of fonts.
	 */
	public function save_fonts( $fonts ) {
		return $fonts;
	}
}
