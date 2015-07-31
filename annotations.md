# Annotations

Each theme has an annotation file which is used to determine what elements in the theme can be customized by the custom-fonts plugin.

For each element, an annotation specifies the following information:

- The 'category' or 'type' of that element (either 'body-text' or 'headings') which defines which of the two font controls (Base Font or Headings, respectively) changes the element. (Note: some older annotations also have the 'site-title' category, although this is no longer used and will map to the 'headings' category).
- The CSS selector for that element. The selector will have `.wf-active` automatically prepended to increase its specificity once fonts have loaded.
- A set of rules defining the default CSS properties of an element. These are described below.

## Rules

For each element with an annotation there is also a set of rules defining the default font CSS properties of that element. Generally this involves the `font-family`, `font-weight`, `font-size`, and `font-style` properties which map to their associated controls in the Customizer. The rules defined in the annotation usually mimic the actual CSS from the theme and act as defaults for the controls.

For example, an annotation may be for the selector `h1.site-title` in the category `headings` and have a rule that sets `font-family` to `Helvetica, sans-serif`. In this case, changing the "Headings" font in the Customizer to "Cinzel" will set this CSS:

```css
.wf-active h1.site-title {
  font-family: Cinzel, Helvetica, sans-serif;
}
```

If the annotation also includes rules like `font-weight: 100` and `font-style: italic`, then the plugin will create this CSS instead:

```css
.wf-active h1.site-title {
  font-family: Cinzel, Helvetica, sans-serif;
  font-weight: 100;
  font-style: italic;
}
```

If the Customizer is then used to set the "Headings" style to "bold", this will be the CSS set by the plugin:

```css
.wf-active h1.site-title {
  font-family: Cinzel, Helvetica, sans-serif;
  font-weight: 700;
  font-style: normal;
}
```

If a `font-size` rule is not present in the annotation for an element, that element will **not be changed** by changing the font-size in the Customizer control. (A default font size must be set in order for the Customizer control to calculate a new size.)

If a `font-family` rule is not present in the annotation, that element will **not be changed** by setting the font-family in the Customizer control. It will, however, be changed by the style and weight properties (unless `fvdAdjust` is false).

Each annotation category has a property called `fvdAdjust` ('fvd' stands for [Font Variant Description](https://github.com/typekit/fvd)) which can be set to allow changing the weight and style of the elements in that category. The `body-text` (Base Font) category has `fvdAdjust` set to `false`, and the `headings` category has `fvdAdjust` set to `true`. Elements defined for a category where `fvdAdjust` is false (that is, any element in the `body-text` category) will **not be changed** by changing the font style in the Customizer control (in fact, there will be no style controls present at all). Furthermore, any `font-weight` or `font-style` rules defined on such an element **will be ignored** and not act as defaults.

For an example of those rules being ignored, another annotation may exist for the selector `p` in the category `body-text` with rules that set `font-family: serif` and `font-weight: bold`. Because `fvdAdjust` on the `body-text` category is `false`, the following CSS will be generated:

```css
.wf-active p {
  font-family: serif;
}
```

## Registration

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
