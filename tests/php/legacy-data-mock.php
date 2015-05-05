<?php

add_filter( 'pre_option_typekit_data', function( $opt ) {
	return array( 'families' => wpcom_mocked_typekit_data() );
} );

function wpcom_mocked_typekit_data() {
	return array(
		'site-title' => array(
				'id' => 'yvxn',
				'fvd' => 'i9',
				'size' => 0,
				'css_names' => array( 'brandon-grotesque-1','brandon-grotesque-2' )
		),
		'headings' => array(
				'id' => 'yvxn',
				'fvd' => 'i9',
				'size' => 5,
				'css_names' => array( 'brandon-grotesque-1','brandon-grotesque-2' )
		),
		'body-text' => array(
				'id' => 'cwfk',
				'fvd' => null,
				'size' => 0,
				'css_names' => array( 'jubilat-1','jubilat-2' )
		)
	);
}