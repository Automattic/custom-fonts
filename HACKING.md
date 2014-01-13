# How to make a Custom Fonts provider

## Create a Custom Fonts module

### Create your class

You will need to make a single php file that extends the `Jetpack_Custom_Fonts_Module` class:

```php
class Jetpack_Google_Fonts extends Jetpack_Custom_Fonts_Module {
}
```

Since `Jetpack_Custom_Fonts_Module` is an abstract class, the required members and methods are easy to find, and are well documented in `modules/base.php`.

### Register your class

Your class should not self-instantiate. The Custom Fonts plugin manages everything and will use autoloading to include it when needed.

```php
add_action( 'jetpack_custom_fonts_register', 'my_fonts_moduler_register' );
function my_fonts_module_register( $jetpack_custom_fonts ) {
	/**
	 * Register your custom fonts module with three required variables
	 * @param $id    string The ID of your provider. Must match Your_Font_Module::$id
	 * @param $class string The class name of your module. Eg Your_Font_Module
	 * @param $file  string The module file to include when needed.
	 */
	$jetpack_custom_fonts->register_module( $id, $class, $file );
}
```