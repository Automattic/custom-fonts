<?php

include dirname( __FILE__ ) . '/../../css-generator.php';

// Begin mocks
function __( $args ) {
	return $args;
}

function apply_filters( $arg1, $arg2 ) {
	$arg1;
	return $arg2;
}

function add_action() {}

function wp_list_pluck( $list, $field ) {
	$results = array();
	foreach( $list as $item ) {
		if ( $item[ $field ] ) {
			array_push( $results, $item[ $field ] );
		}
	}
	return $results;
}

function get_stylesheet() {
	return 'twentyfourteen';
}

function do_action( $action, $param ) {
	if ( $action === 'jetpack_fonts_rules' ) {
		$param->add_rule( array(
			'type' => 'body-text',
			'selector' => 'body, button, input, select, textarea',
			'rules' => array(
				array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
				array( 'property' => 'font-size', 'value' => '16px' ),
				array( 'property' => 'font-size', 'value' => '1rem' ),
				array( 'property' => 'font-weight', 'value' => '400' ),
			)
		) );

		$param->add_rule( array(
			'type' => 'headings',
			'selector' => '.entry-title',
			'rules' => array(
				array( 'property' => 'font-family', 'value' => 'inherit' ),
				array( 'property' => 'font-size', 'value' => '33px' ),
				array( 'property' => 'font-weight', 'value' => '300' ),
			)
		) );

		$param->add_rule( array(
			'type' => 'headings',
			'selector' => '.site-title',
			'rules' => array(
				array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
				array( 'property' => 'font-size', 'value' => '18px' ),
				array( 'property' => 'font-weight', 'value' => '700' ),
			)
		) );
	}
}

function wp_list_filter( $list, $args = array(), $operator = 'AND' ) {
	if ( ! is_array( $list ) )
		return array();

	if ( empty( $args ) )
		return $list;

	$operator = strtoupper( $operator );
	$count = count( $args );
	$filtered = array();

	foreach ( $list as $key => $obj ) {
		$to_match = (array) $obj;

		$matched = 0;
		foreach ( $args as $m_key => $m_value ) {
			if ( array_key_exists( $m_key, $to_match ) && $m_value == $to_match[ $m_key ] )
				$matched++;
		}

		if ( ( 'AND' == $operator && $matched == $count )
		  || ( 'OR' == $operator && $matched > 0 )
		  || ( 'NOT' == $operator && 0 == $matched ) ) {
			$filtered[$key] = $obj;
		}
	}

	return $filtered;
}
// End mocks


class Jetpack_Fonts_Css_Generator_Test extends PHPUnit_Framework_TestCase {
	protected $fonts_for_css;

	public function setUp() {
		$this->fonts_for_css = array(
			array(
				'type' => 'headings',
				'name' => 'Lobster Two',
				'id' => 'Lobster+Two',
				'fvds' => array( 'n4' ),
				'subsets' => array(
					'latin'
				),
				'bodyText' => false,
				'css_name' => 'Lobster Two'
			),
			array(
				'type' => 'body-text',
				'name' => 'Cinzel',
				'id' => 'Cinzel',
				'size' => 5,
				'fvds' => array( 'i7' ),
				'subsets' => array(
					'latin'
				),
				'bodyText' => true,
				'css_name' => 'Cinzel'
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
		$this->assertRegExp( '/\.entry-title\{[^}]*font-family:\s?"?Lobster\ Two"?/', $generator->get_css( $this->fonts_for_css ) );
		$this->assertRegExp( '/\.site-title\{[^}]*font-family:\s?"?Lobster\ Two"?/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_body_font_family() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/body[^{]+\{[^}]*font-family:\s?"?Cinzel"?/', $generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_family_fallback() {
		$generator = new Jetpack_Fonts_Css_Generator;
		$this->assertRegExp( '/body[^{]+\{[^}]*font-family:\s?"?Cinzel"?,\s?Lato, sans-serif/', $generator->get_css( $this->fonts_for_css ) );
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
}
