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
			'type' => 'headings',
			'selector' => '.entry-title',
			'rules' => array(
				array( 'property' => 'font-family', 'value' => 'inherit' ),
				array( 'property' => 'font-size', 'value' => '33px' ),
				array( 'property' => 'font-weight', 'value' => '300' ),
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
				'fvds' => array(
					'n4' => 'Regular',
					'i4' => 'Italic'
				),
				'subsets' => array(
					'latin'
				),
				'bodyText' => false,
				'css_name' => 'Lobster Two'
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

	public function test_get_css_returns_correct_font_family() {
		$generator = new Jetpack_Fonts_Css_Generator;
		// mock $generator->get_rules, which we do above with do_action
		$this->assertRegExp( '/\.entry-title\{.*?font-family:\s?"?Lobster\ Two"?/', $generator->get_css( $this->fonts_for_css ) );
	}
}
