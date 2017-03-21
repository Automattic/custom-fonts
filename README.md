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

Edit the files under the `src` directory to make changes to the Javascript and CSS. Changes to the PHP can be made to the files directly.

You can start a watch process that will rebuild the plugin on any change by running `npm run watch`.

When you're ready to deploy, you will need to run `npm run dist` inside the plugin directory to build the production Javascript and CSS, as these files are included in the repository. This makes deploying easier on the server since there is no build step required there.

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
