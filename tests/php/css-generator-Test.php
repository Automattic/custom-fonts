<?php

if ( ! defined( 'CUSTOM_FONTS_PLUGIN_PATH' ) ) {
	require_once __DIR__ . '/mocks.php';
}

function jetpack_fonts_rules( $rules ) {
	$rules->add_rule( array(
		'type' => 'body-text',
		'selector' => 'body, button, input, select, textarea',
		'rules' => array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-size', 'value' => '1rem' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	) );

	$rules->add_rule( array(
		'type' => 'headings',
		'selector' => '.entry-title',
		'rules' => array(
			array( 'property' => 'font-family', 'value' => 'inherit' ),
			array( 'property' => 'font-size', 'value' => '33px' ),
			array( 'property' => 'font-weight', 'value' => '300' ),
		)
	) );

	$rules->add_rule( array(
		'type' => 'headings',
		'selector' => '.site-title',
		'rules' => array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
			array( 'property' => 'font-size', 'value' => '18px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
		)
	) );
}

add_action( 'jetpack_fonts_rules', 'jetpack_fonts_rules' );

class Jetpack_Fonts_Css_Generator_Test extends PHPUnit_Framework_TestCase {
	protected $fonts_for_css;

	public static function setUpBeforeClass() {
		require_once CUSTOM_FONTS_PLUGIN_PATH . '/css-generator.php';
	}

	public function setUp() {
		$this->fonts_for_css = array(
			array(
				'type' => 'headings',
				'displayName' => 'Lobster Two',
				'id' => 'Lobster+Two',
				'fvds' => array( 'n4' ),
				'currentFvd' => 'n4',
				'subsets' => array(
					'latin'
				),
				'bodyText' => false,
				'cssName' => 'Lobster Two'
			),
			array(
				'type' => 'body-text',
				'displayName' => 'Cinzel',
				'id' => 'Cinzel',
				'size' => 5,
				'fvds' => array( 'i7' ),
				'currentFvd' => 'i7',
				'subsets' => array(
					'latin'
				),
				'bodyText' => true,
				'cssName' => 'Cinzel'
			)
		);
	}

	public function test_instance_exists() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertTrue( (boolean)$generator );
	}

	public function test_get_css_returns_text() {
		$generator = new Jetpack_Fonts_Css_Generator;
		// mock $generator->get_rules, which we do above with do_action
		$this->assertRegExp( '/\.entry-title\{/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_heading_font_family() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/\.entry-title\{[^}]*font-family:\s?"Lobster\ Two"/', $generator->get_css( $this->fonts_for_css ) );
		$this->assertRegExp( '/\.site-title\{[^}]*font-family:\s?"Lobster\ Two"/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_body_font_family() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/body[^{]+\{[^}]*font-family:\s?"Cinzel"/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_family_fallback() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/body[^{]+\{[^}]*font-family:\s?"Cinzel",\s?Lato, sans-serif/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_size() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/body[^{]+\{[^}]*font-size:\s?20.8px/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_weight_for_bold() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/body[^{]+\{[^}]*font-weight:\s?700/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_weight_for_normal() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/\.entry-title[^{]*\{[^}]*font-weight:\s?400/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_style() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/body[^{]+\{[^}]*font-style:\s?italic/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_does_not_return_inherit_in_a_font_stack() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertNotRegExp( '/, ?inherit/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_normal_font_weight_for_invalid_data() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$fonts_for_css = array(
			array(
				'type' => 'body-text',
				'displayName' => 'Cinzel',
				'cssName' => 'Cinzel',
				'id' => 'Cinzel',
				'size' => 5,
				'fvds' => array( 'x7' ),
				'subsets' => array(
					'latin'
				),
				'bodyText' => true
			)
		);
		$this->assertRegExp( '/body[^{]+\{[^}]*font-weight:\s?400/', $generator->get_css( $fonts_for_css ) );
	}
}
