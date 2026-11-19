custom-fonts
============

A provider-agnostic WordPress plugin for changing theme fonts.

# Installation

Download or clone the repository into the `plugins/` directory of your WordPress install.

Then load the Customizer and you should see the `Fonts` Controls appear in the sidebar.

# Usage

This plugin adds a "Fonts" section to the Customizer. By default, the fonts
available are a selection of Google fonts, but other providers can be added by
other plugins (see the [Providers](./Providers.md) documentation ).

There are two options: Base Font and Headings. Depending on your theme, they
will apply to different elements, but generally the Base Font will apply to
every text element on the site and Headings will apply to page and post titles
as well as the site title. See the [Annotations](./annotations.md) documentation
to learn how the font settings differ by theme.

**Theme annotations are required for the plugin to generate CSS that applies your font settings.**
Saved fonts still load without annotations for use in theme CSS or Additional CSS.

# Front-end font loading

Native Google Fonts loading is opt-in. Web Font Loader remains the default.
An integration can select native loading through `jetpack_fonts_loading_decision`:

```php
add_filter( 'jetpack_fonts_loading_decision', function ( $decision ) {
	return array( 'mode' => 'native', 'rule' => 'site_configuration' );
} );
```

Return an array with a `mode` of `native` or `loader` and a nonempty `rule` label
for reporting. Malformed decisions fall back to the loader. Register the filter
before fonts render on `wp_enqueue_scripts`: it runs the first time the decision
is needed, and the result is reused for the request. Return `loader`, or remove
the integration, to restore the default loading path. Admin and Customizer
contexts retain the loader, and the block editor keeps its existing loader path.

## Compatibility and performance

Native Google Fonts loading enqueues the `jetpack-custom-fonts-faces` stylesheet.
Generated CSS stays in the `jetpack-custom-fonts-css` style element. Rules for
fonts loaded natively use `:root` instead of `.wf-active`, preserving specificity
and applying font properties without waiting for JavaScript. Other providers
can keep their existing loading behavior and `.wf-active` rules (see
[Providers](./Providers.md)). Retired Typekit selections still map to Google fonts.

When at least one provider loads natively and none keeps its existing loading
path, a compatibility script adds `wf-active` immediately for theme and user CSS.
It is not a font-loaded signal in this case. Scripts that measure text should
wait for `document.fonts.ready` or observe size changes. Otherwise, the manager
leaves the class to Web Font Loader or the provider's `render_fonts()` method.

The native stylesheet blocks rendering until it arrives or the request fails;
Web Font Loader allows the page to render while it loads fonts. Native loading
uses `font-display: fallback`, with a short text block period and a limited swap
period. Font swaps can still cause layout shifts. If loading fails, native CSS
keeps the selected size, weight and style with a fallback font, while the loader
path leaves the theme's default typography in place.

## Configuration

Override the native stylesheet's display policy with:

```php
add_filter( 'jetpack_fonts_font_display', function () {
	return 'optional';
} );
```

Supported values are `auto`, `block`, `swap`, `fallback` and `optional`; invalid
values fall back to `fallback`.

The `custom_fonts_google_fonts_api_url` filter receives
`https://fonts.googleapis.com/css` for both native loading and Web Font Loader.
Return an endpoint without a `family` parameter, or one ending in `?family=` or
`&family=`. Existing query parameters are preserved. Root-relative endpoints
such as `/fonts-proxy/css` resolve against the site's origin, including for
subdirectory installs. Font families and subsets are appended to the endpoint;
native loading also appends the display policy.

Native loading adds a preconnect hint for `fonts.gstatic.com` when using Google's
endpoint. Use `jetpack_fonts_font_file_origin` (arguments: origin and stylesheet
URL) to supply a proxy's font-file origin, or an empty string to omit the hint.
Core prints the hint and stylesheet when fonts render on `wp_enqueue_scripts`.
A later `maybe_render_fonts()` call inside `wp_head` prints the stylesheet in
place if core's style output has passed, but omits the hint if resource hints
have already been printed.

## Loading reports

Each render adds `data-loading` and `data-rule` attributes to the
`jetpack-custom-fonts-css` style element, even when there are no annotation
rules. The `jetpack_fonts_loading_mode` action receives the mode and rule once
per request, on the first front-end render. Customizer preview renders carry
`loader` and `context` markers but do not fire the action.

The reported mode describes the providers used by the render:

- `native`: at least one provider loaded natively and none kept its existing loading path.
- `mixed`: at least one provider loaded natively and another used Web Font Loader or its own `render_fonts()` method. Web Font Loader is not necessarily present.
- `loader`: no provider loaded natively, including when saved selections have only missing or inactive providers.

Missing or inactive providers are skipped and do not change the mode selected
by the remaining providers. The rule is the decision's rule label in every case.

# Development

Run `npm install && npm run build` inside the plugin directory to build the Javascript and CSS.

_NOTE: the `fvd` package may report a `BADENGINE` error - the code still seems to work, but the package requires `node@0.10.x` and there hasn't been a release of the package that removes this restriction. Such a release has been requested in https://github.com/percolate/fvd/issues/4, but doesn't exist yet._

Edit the files under the `src` directory to make changes to the Javascript and CSS. Changes to the PHP can be made to the files directly.

You can start a watch process that will rebuild the plugin on any change by running `npm run watch`.

When you're ready to deploy, update [the version number in composer.json](composer.json#L3) and run `npm run dist` inside the plugin directory to build the production Javascript and CSS, as these files are included in the repository. This makes deploying easier on the server since there is no build step required there.

_NOTE: You should also bump the date values in any `wp_enqueue_script()` or `wp_enqueue_style()` calls if the JS or CSS files are updated._

Once you have merged your PR with the updated files, you should also create a GitHub release tagged with the version number from [composer.json](composer.json#L3). This makes the updated package available via Composer.

# Testing

For running the PHP tests, you will need to have [phpunit](https://phpunit.de/) installed, as well as
[composer](https://getcomposer.org/).

If you are on the Mac OS, you can install both with [Homebrew](http://brew.sh/)
with the following commands:

```
brew tap homebrew/php
brew update
brew install phpunit
brew install composer
```

To run the tests, run `npm test`.

# Debugging

You can enable debug output in the browser by typing
`localStorage.setItem( 'debug', 'jetpack-fonts:*' );` into your Javascript console
and then reloading the page.

## License

custom-fonts is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
