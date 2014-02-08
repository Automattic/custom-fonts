<?php

$pairs = array(
	array(
		array(
			'provider' => 'google',
			'id'       => 'Roboto+Slab',
			'type'     => 'headings',
			'fvds'     => 'n3'
		),
		array(
			'provider' => 'google',
			'id'       => 'Source+Sans',
			'type'     => 'body-text',
			'fvds'     => array( 'n3', 'i3', 'n6', 'i6' )
		)
	),
	array(
		array(
			'provider' => 'google',
			'id'       => 'Merriweather',
			'type'     => 'headings'
		),
		array(
			'provider' => 'google',
			'id'       => 'Merriweather+Sans',
			'type'     => 'body-text'
		)
	),
	array(
		array(
			'provider' => 'google',
			'id'       => 'Playfair+Display',
			'type'     => 'headings'
		),
		array(
			'provider' => 'google',
			'id'       => 'Quattrocento+Sans',
			'type'     => 'body-text'
		)
	),
);


foreach( $pairs as $pair ) {
	$this->add_pair( $pair );
}