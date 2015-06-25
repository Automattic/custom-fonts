# Annotations

**TODO: explain annotations** 

## Generator

Let's try to do without it. For the time being the old-style annotations will be compatible, so if you need a generator, you can make those. But, only the new style will be distributed with our themes. I will almost definitely make an automated tool to convert the old style to the new style.

## Registration

Let's make an action callback. The current structure uses one too, but in a weird way. I'm thinking:

```php
add_action( 'jetpack_fonts_rules', 'mytheme_fonts_annotations' );
function mytheme_fonts_annotations( $jetpack_fonts ) {
	$jetpack_fonts->add_rule( array(
		'type' => 'body-text',
		'selector' => 'body',
		'rules' => array(
			array( 'property' => 'font-family', 'value' => '"Source Sans",sans-serif' )
			array( 'property' => 'font-size', 'value' => '1em' )
		),
		// optional:
		'media_query' => 'screen and (max-width: 30em)'
	) );
}
```

This is pretty similar to what's there previously, with the advantage that it's 1) clearer what everything is for, and 2) you don't need to return a value at the end, 3) no passing the received `$category_rules` value into the annotation function. It's less verbose too, which is nice.

## Pairs

Another action callback.

```php
add_action( 'jetpack_fonts_pairs', 'mytheme_add_font_pairs' );
function mytheme_add_font_pairs( $jetpack_fonts ) {
	$jetpack_fonts->add_pair( array(
		array(
			'provider' => 'google',
			'id'       => 'Roboto+Slab',
			'type'     => 'headings',
			'fvds'     => array( 'n3' )
		),
		array(
			'provider' => 'google',
			'id'       => 'Source+Sans',
			'type'     => 'body-text',
			'fvds'     => array( 'n3', 'i3', 'n6', 'i6' )
		)
	) );
}
```
