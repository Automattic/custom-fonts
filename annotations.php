<?php

add_action( 'jetpack_custom_fonts_rules', 'mytheme_fonts_annotations' );
function mytheme_fonts_annotations( $rules ) {
	$rules->add_rule( array(
		'type' => 'body-text',
		'selector' => 'body, button, input, select, textarea',
		'rules' => array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
			array( 'property' => 'font-size', 'value' => '16px' ),
			array( 'property' => 'font-weight', 'value' => '400' ),
		)
	) );

	$rules->add_rule( array(
		'type' => 'headings',
		'selector' => '.entry-title',
		'rules' => array(
			array( 'property' => 'font-family', 'value' => 'Lato, sans-serif' ),
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