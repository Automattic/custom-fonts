# How to make a Custom Fonts provider

To add a provider for a different font foundry, there are two necessary pieces: the PHP provider file, and the JavaScript provider file.

The PHP provider file contains most of the code to implement the fonts for the provider. The JavaScript provider file is used to render the fonts in the Customizer control panel as well as in the Customizer preview pane.

## Create a PHP Custom Fonts provider

### Create your class

You will need to make a single php file that extends the `Jetpack_Font_Provider` class:

```php
class Jetpack_Google_Fonts extends Jetpack_Font_Provider {
}
```

Since `Jetpack_Font_Provider` is an abstract class, the required members and methods are easy to find, and are well documented in `providers/base.php`.

Some of the more interesting things to set are:

1. The `$id` variable. Set this to something unique for your provider.
2. The `is_active` method is optional, but if your provider can be disabled, use this method to determine if it is active or not.
3. The `get_fonts` method must return a list of all available fonts from your provider.
4. `get_additional_data` returs a string-keyed array of data that the provider may need to bootstrap into the JavaScript for the preview.
5. The `render_fonts` method is used to actually add the selected fonts to the page on the web front-end.
6. The optional function `get_webfont_config_option` can be overridden if your fonts can be rendered using [WebFontLoader](https://github.com/typekit/webfontloader) instead of using `render_fonts`.
7. The function `save_fonts` will be called to save selected fonts to the API of your provider. eg: Typekit requires "publishing" a set of fonts to use them. This can be empty if the provider does not require saving.

### Register your class

Your class should not self-instantiate in its file. The Custom Fonts plugin manages everything and will use autoloading to include it when needed. Register your class no later than the `setup_theme` action.

```php
add_action( 'jetpack_fonts_register', 'my_fonts_provider_register' );
function my_fonts_provider_register( $jetpack_fonts ) {
	/**
	 * Register your custom fonts provider with three required variables
	 * @param $id    string The ID of your provider. Must match Your_Font_Provider::$id
	 * @param $class string The class name of your provider. Eg Your_Font_Provider
	 * @param $file  string The provider file to include when needed.
	 */
	$jetpack_fonts->register_provider( $id, $class, $file );
}
```


## Font object structure

Each provider returns an array of fonts. This is what each of those fonts should look like:

```php
$font = array(
	// REQUIRED
	'id' => 'source+sans+pro',
	'name' => 'Source Sans Pro',
	'fvds' => array( 'n4', 'i4', 'n6', 'i6', 'n7', 'i7' ),
	// OPTIONAL
	'languages' => array(),
	'subsets' => array()
);
```

Each field is explained below. The first 3 are required, and the rest are optional.

### id

The provider-specific ID for a font.

### cssName

The font's font-family value, to be used in the CSS

### displayName

The font's user-readable name, to display in the dropdown list

### fvds

Lists all of a font's variants following the [Font Variant Description](https://github.com/typekit/fvd).

### languages

Country codes the language supports

### subsets

Available subsets for the font, like `latin`, `latin-ext`, `cyrillic`, etc.

## Create a JavaScript Custom Fonts provider

**TODO**
