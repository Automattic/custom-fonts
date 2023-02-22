<?php

define( 'CUSTOM_FONTS_PLUGIN_PATH', dirname( __FILE__ ) . '/../..' );
function wp_list_pluck( $list, $field ) {
	$results = array();
	foreach( $list as $item ) {
		if ( $item[ $field ] ) {
			array_push( $results, $item[ $field ] );
		}
	}
	return $results;
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

function jetpack_fonts_rules( $rules ) {
	$rules->add_rule( array(
		'type' => 'body-text',
		'selector' => 'body, button, input, select, textarea',
		'rules' => array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-size', 'value' => '1rem' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
			array( 'property' => 'font-style', 'value' => 'italic' ),
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
		'selector' => '.no-font-element',
		'rules' => array(
			array( 'property' => 'font-style', 'value' => 'italic' ),
		)
	) );

	$rules->add_rule( array(
		'type' => 'site-title',
		'selector' => '.site-title',
		'rules' => array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
			array( 'property' => 'font-size', 'value' => '18px' ),
			array( 'property' => 'font-weight', 'value' => '700' ),
			array( 'property' => 'font-style', 'value' => 'italic' ),
		)
	) );
}

class Jetpack_Fonts_Css_Generator_Test extends PHPUnit_Framework_TestCase {
	protected $fonts_for_css;

	public static function setUpBeforeClass(): void {
		require_once CUSTOM_FONTS_PLUGIN_PATH . '/css-generator.php';
	}

	public function setUp(): void {
		$this->fonts_for_css = array(
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
		\WP_Mock::userFunction(
			'__',
			array(
				'return_arg' => '0',
			)
		);
		$this->generator = new Jetpack_Fonts_Css_Generator;
		\WP_Mock::userFunction(
			'get_stylesheet_directory',
			array(
				'return' => dirname( __FILE__ ) . '/../../../../themes/twentyfourteen',
			)
		);
		\WP_Mock::userFunction(
			'is_child_theme',
			array(
				'return' => false,
			)
		);
		\WP_Mock::onAction( 'jetpack_fonts_rules' )
			->with( $this->generator )
			->perform( array( $this, 'jetpack_fonts_rules' ) );
	}

	public function jetpack_fonts_rules() {
		return jetpack_fonts_rules( $this->generator );
	}

	public function tearDown(): void {
		\WP_Mock::tearDown();
	}

	public function test_instance_exists() {
		$this->assertTrue( (boolean)$this->generator );
	}

	public function test_get_css_returns_text() {
		// mock $this->generator->get_rules, which we do above with do_action
		$this->assertRegExp( '/\.entry-title\{/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_each_selector_with_wp_active_prepended() {
		$this->assertRegExp( '/\.wf-active body/', $this->generator->get_css( $this->fonts_for_css ) );
		$this->assertRegExp( '/\.wf-active button/', $this->generator->get_css( $this->fonts_for_css ) );
		$this->assertRegExp( '/\.wf-active textarea/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_heading_font_family() {
		$this->assertRegExp( '/\.entry-title\{[^}]*font-family:\s?"Lobster\ Two"/', $this->generator->get_css( $this->fonts_for_css ) );
		$this->assertRegExp( '/\.site-title\{[^}]*font-family:\s?"Lobster\ Two"/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_no_font_family_when_annotation_has_no_font_family() {
		$this->assertRegExp( '/\.no-font-element\s?\{/', $this->generator->get_css( $this->fonts_for_css ) );
		$this->assertNotRegExp( '/\.no-font-element\s?\{[^}]*font-family/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_body_font_family() {
		$this->assertRegExp( '/body[^{]+\{[^}]*font-family:\s?"Cinzel"/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_family_fallback() {
		$this->assertRegExp( '/body[^{]+\{[^}]*font-family:\s?"Cinzel",(\s?"[^"]+",)?\s?serif/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_size() {
		$this->assertRegExp( '/body[^{]+\{[^}]*font-size:\s?20.8px/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_no_font_size_when_annotation_has_no_font_size() {
		$this->assertRegExp( '/\.no-font-element\s?\{/', $this->generator->get_css( $this->fonts_for_css ) );
		$this->assertNotRegExp( '/\.no-font-element\s?\{[^}]*font-size/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_no_font_weight_when_fvdAdjust_is_false() {
		$this->assertNotRegExp( '/body[^{]+\{[^}]*font-weight/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_no_font_style_when_fvdAdjust_is_false() {
		$this->assertNotRegExp( '/body[^{]+\{[^}]*font-style/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_weight_for_normal() {
		$this->assertRegExp( '/\.entry-title[^{]*\{[^}]*font-weight:\s?400/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_correct_font_style() {
		$this->assertRegExp( '/\.no-font-element[^{]*\{[^}]*font-style:\s?normal/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_does_not_return_inherit_in_a_font_stack() {
		$this->assertNotRegExp( '/, ?inherit/', $this->generator->get_css( $this->fonts_for_css ) );
	}

	public function test_get_css_returns_normal_font_weight_for_invalid_data() {
		$fonts_for_css = array(
			array(
				'type' => 'headings',
				'displayName' => 'Cinzel',
				'cssName' => 'Cinzel',
				'id' => 'Cinzel',
				'size' => 5,
				'fvds' => array( 'x7' ),
				'subsets' => array(
					'latin'
				),
				'bodyText' => true,
				'genericFamily' => 'serif'
			)
		);
		$this->assertRegExp( '/\.no-font-element[^{]*\{[^}]*font-weight:\s?normal/', $this->generator->get_css( $fonts_for_css ) );
	}

	public function test_get_css_returns_normal_font_weight_for_missing_fvds_with_no_annotation() {
		$fonts_for_css = array(
			array(
				'type' => 'headings',
				'displayName' => 'Cinzel',
				'cssName' => 'Cinzel',
				'id' => 'Cinzel',
				'size' => 5,
				'fvds' => null,
				'subsets' => array(
					'latin'
				),
				'bodyText' => true,
				'genericFamily' => 'serif'
			)
		);
		$this->assertRegExp( '/\.no-font-element[^{]*\{[^}]*font-weight:\s?normal/', $this->generator->get_css( $fonts_for_css ) );
	}

	public function test_get_css_returns_different_site_title_than_heading_if_set_separately() {
		$fonts_for_css = array(
			array(
				'type' => 'site-title',
				'displayName' => 'Cinzel',
				'id' => 'Cinzel',
				'fvds' => array( 'n4' ),
				'currentFvd' => 'n4',
				'subsets' => array(
					'latin'
				),
				'bodyText' => false,
				'cssName' => 'Cinzel',
				'genericFamily' => 'serif'
			),
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
				'subsets' => array(
					'latin'
				),
				'bodyText' => true,
				'cssName' => 'Cinzel',
				'genericFamily' => 'serif'
			)
		);
		$css = $this->generator->get_css( $fonts_for_css );
		$this->assertRegExp( '/\.site-title[^{]*\{[^}]*font-family:\s?"Cinzel"/', $css );
	}

	public function test_get_css_returns_no_size_for_missing_size() {
		$fonts_for_css = array(
			array(
				'type' => 'site-title',
				'displayName' => 'Cinzel',
				'cssName' => 'Cinzel',
				'id' => 'Cinzel',
				'currentFvd' => 'i7',
				'fvds' => array( 'n4' ),
				'subsets' => array(
					'latin'
				),
				'bodyText' => true,
				'genericFamily' => 'serif'
			)
		);
		$this->assertNotRegExp( '/\.site-title[^{]*\{[^}]*font-size:/', $this->generator->get_css( $fonts_for_css ) );
	}

	public function test_get_css_returns_annotation_font_weight_for_missing_current_fvd() {
		$fonts_for_css = array(
			array(
				'type' => 'site-title',
				'displayName' => 'Cinzel',
				'cssName' => 'Cinzel',
				'id' => 'Cinzel',
				'size' => 5,
				'fvds' => array( 'n4' ),
				'subsets' => array(
					'latin'
				),
				'bodyText' => true,
				'genericFamily' => 'serif'
			)
		);
		$this->assertRegExp( '/\.site-title[^{]*\{[^}]*font-weight:\s?700/', $this->generator->get_css( $fonts_for_css ) );
	}

	public function test_get_css_returns_annotation_font_style_for_missing_current_fvd() {
		$fonts_for_css = array(
			array(
				'type' => 'site-title',
				'displayName' => 'Cinzel',
				'cssName' => 'Cinzel',
				'id' => 'Cinzel',
				'size' => 5,
				'fvds' => array( 'n4' ),
				'subsets' => array(
					'latin'
				),
				'bodyText' => true,
				'genericFamily' => 'serif'
			)
		);
		$this->assertRegExp( '/\.site-title[^{]*\{[^}]*font-style:\s?italic/', $this->generator->get_css( $fonts_for_css ) );
	}

}
