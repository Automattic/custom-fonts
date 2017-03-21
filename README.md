custom-fonts
============

Rewrite of the Custom Fonts component in a provider-agnostic manner.

# Installation

Download or clone the repository into the `plugins/` directory of your WordPress install.

Next, run `npm install && npm run dist` inside the plugin directory to build the Javascript and CSS.

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

# Development

You can start a watch process that will rebuild the plugin on any change by running `npm run watch`.

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
