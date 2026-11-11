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

**Note that no changes will take effect without a theme annotation for the current theme.**

# Front-end font loading

Native Google Fonts loading is opt-in. Web Font Loader remains the default.
An integration can select native loading through `jetpack_fonts_loading_decision`:

```php
add_filter( 'jetpack_fonts_loading_decision', function ( $decision ) {
	return array( 'mode' => 'native', 'rule' => 'site_configuration' );
} );
```

The filter accepts `native` or `loader` and a nonempty rule label for reporting.
Malformed decisions fall back to the loader. Admin and Customizer contexts
always retain the loader, and the block editor keeps its existing loader path.
Register the filter before fonts render on `wp_enqueue_scripts`, and keep its
result stable within a request. Return `loader`, or remove the integration, to
restore the legacy path.

Custom Fonts does not load any rollout policy itself. A platform integration
supplies one through this filter.

Both modes load saved fonts on themes without annotation rules, so fonts
referenced only from theme CSS or Additional CSS keep working. Both modes also
print the `jetpack-custom-fonts-css` style element there, with no rules inside.

In native mode, the front end enqueues a stylesheet using the
`jetpack-custom-fonts-faces` handle. Generated CSS keeps its existing
`jetpack-custom-fonts-css` style element and uses `:root` instead of `.wf-active`.
Both prefixes have the same specificity, but `:root` applies the selected family,
weight, style and size immediately, without waiting for JavaScript. One
difference follows from this: when the font stylesheet is blocked or fails, the
theme's fallback font renders at the selected size, weight and style. The
loader path leaves the theme's default typography untouched in that case. Retired
Typekit selections still map to their Google replacements. The Customizer
preview and block editor continue to use their existing Web Font Loader paths.
Other providers can retain their existing loading behavior (see [Providers](./Providers.md)).

The stylesheet uses `font-display: fallback`, the policy closest to the loader's
behavior. The loader paints the theme's font first, swaps when the fonts arrive,
and gives up after its 3 second timeout. `fallback` hides text for about 100 ms,
shows the fallback font, swaps if the font arrives within about 3 seconds, and
otherwise keeps the fallback for that page view. The cost is the short block
period: on a cold cache, text can paint up to about 100 ms later than with the
loader, which can delay FCP when text is the first content. `swap` removes the
block period but allows a swap, and a layout shift, at any time. `optional`
removes late swaps but can leave first-time visitors on the fallback font.
Override the policy with:

```php
add_filter( 'jetpack_fonts_font_display', function () {
	return 'optional';
} );
```

Supported values are `auto`, `block`, `swap`, `fallback` and `optional`; invalid
values fall back to `fallback`. The existing `custom_fonts_google_fonts_api_url` filter
receives `https://fonts.googleapis.com/css`, matching the loader and preview.
Return an API endpoint, without a `family` parameter; font families, subsets and
the display policy are appended afterward. A preconnect hint targets
`fonts.gstatic.com` for Google. Integrations can use
`jetpack_fonts_font_file_origin` (arguments: origin and stylesheet URL) to supply
a proxy's font-file origin, or an empty string to omit the hint.
Core prints the hint and stylesheet when fonts render on `wp_enqueue_scripts`,
the default. A later `maybe_render_fonts()` call inside `wp_head` prints both in
place, ahead of the generated CSS.

The stylesheet is render-blocking, and the page's first paint waits for it. The
loader never blocks rendering this way. Slow and failed loads behave as follows:

| Case | Native mode | Loader |
| --- | --- | --- |
| Stylesheet host responds slowly | First paint of the whole page waits until the response arrives or the request fails | No delay; the theme's font shows until the fonts load |
| Stylesheet request fails or is blocked | Rendering continues at once; the fallback font shows at the selected size, weight and style | The theme's default typography stays untouched |
| Font files are slow | Fallback font after about 100 ms, then a swap within about 3 seconds or none | Theme's font, then a swap within 3 seconds or none |
| Font files fail | Fallback font at the selected size, weight and style | The theme's default typography stays untouched |

The stylesheet host is `fonts.googleapis.com`, or `fonts-api.wp.com` on
WordPress.com, and an outage or slowdown there delays first paint on every
natively routed page with a cold cache. Both hosts currently let browsers cache
the stylesheet for a day, so repeat views within that day skip the request.
Selecting `loader` restores the non-blocking path.
Inline font faces would remove the dependency and are separate follow-up work.

A small compatibility script adds `wf-active` immediately for theme and user
CSS. It is no longer a font-loaded signal in native mode. The script is omitted
when another provider still uses Web Font Loader, which then sets the class
once its own fonts load. Theme scripts that
observe that class to measure text, such as Lodestar's header measurement,
need a separate update to measure after `document.fonts.ready` or observe size
changes. Generated font CSS works even when JavaScript is disabled or delayed.

Before enabling native loading broadly, check representative
classic themes, Additional CSS, localized subsets, cold and warm caches, and
disabled JavaScript. Cold-cache font swaps can still cause layout shifts. Compare FCP, LCP and CLS during rollout;
inline font faces and metric-matched fallback fonts are separate follow-up work.
Return `loader` from the integration's decision filter to restore the legacy
loading path.

## Loading reports

Each render reports its mode and rule in two places:

- The style element carries them, for example `<style id="jetpack-custom-fonts-css" data-loading="native" data-rule="percentage">`
- The `jetpack_fonts_loading_mode` action fires with the mode and rule, for stats

The reported mode is `native`, `loader` or `mixed`. `mixed` means the decision
chose native loading but at least one provider kept Web Font Loader, so the page
carries the loader as well as the `:root` CSS. The rule is the decision's rule
label.

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
