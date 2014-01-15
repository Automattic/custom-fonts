# How to make a Custom Fonts provider

## Create a Custom Fonts provider

### Create your class

You will need to make a single php file that extends the `Jetpack_Font_Provider` class:

```php
class Jetpack_Google_Fonts extends Jetpack_Font_Provider {
}
```

Since `Jetpack_Font_Provider` is an abstract class, the required members and methods are easy to find, and are well documented in `providers/base.php`.

### Register your class

Your class should not self-instantiate in its file. The Custom Fonts plugin manages everything and will use autoloading to include it when needed.

```php
add_action( 'jetpack_custom_fonts_register', 'my_fonts_providerr_register' );
function my_fonts_provider_register( $jetpack_custom_fonts ) {
	/**
	 * Register your custom fonts provider with three required variables
	 * @param $id    string The ID of your provider. Must match Your_Font_Provider::$id
	 * @param $class string The class name of your provider. Eg Your_Font_Provider
	 * @param $file  string The provider file to include when needed.
	 */
	$jetpack_custom_fonts->register_provider( $id, $class, $file );
}
```


## Font object structure

Each provider returns an array of fonts. This is what each of those fonts should look like:

```php
$font = array(
	// REQUIRED
	'id' => 'source+sans+pro',
	'name' => 'Source Sans Pro',
	'fvds' => array(
		'n4' => 'Regular',
		'i4' => 'Italic',
		'n6' => 'Semi Bold',
		'i6' => 'Semi Bold Italic',
		'n7' => 'Bold',
		'i7' => 'Bold Italic'
	),
	// OPTIONAL
	'smallText' => false,
	'tags' => array( 'humanist', 'sans-serif', 'open-source' ),
	'classification' => 'sans-serif',
	'description' => 'Very important words.',
	'languages' => array(),
	'subsets' => array()
);
```

Each field is explained below. The first 3 are required, and the rest are optional.

### id

The provider-specific ID for a font.

### name

The font's name. Will be used in UIs.

### fvds

Lists all of a font's variants with the key following the [Font Variant Description](https://github.com/typekit/fvd) and the value containing a name for use in UIs.

### smallText

Is the font suitable for small text? The UI may choose to only list fonts with this set to `true` in a body text context.

### tags

These may be used for a filtering UI.

### classification

May be used for a filtering UI.

### description

May be used in a font detail UI.

### languages

Country codes the language supports

### subsets

Available subsets for the font, like `latin`, `latin-ext`, `cyrillic`, etc.
