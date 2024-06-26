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
