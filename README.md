custom-fonts
============

Rewrite of the Custom Fonts component in a provider-agnostic manner.

# Installation

Download or clone the repository into the `plugins/` directory of your WordPress install.

Then load the Customizer and you should see the `Fonts` Controls appear in the sidebar.

# Development

First, download or clone the repository into the `plugins/` directory of your WordPress install.

```
git clone <repo> plugins/
```

Second, enter the directory.

```
cd plugins/custom-fonts
```

Third, run `npm install` to install necessary pacakages.

```
npm install
```

Fourth, run `grunt` to build the plugin.

```
grunt
```

Then load the Customizer and you should see the `Fonts` Controls appear.

# Testing

You must have `phpunit` installed to run the PHP tests. Instructions are on
[their site](https://github.com/sebastianbergmann/phpunit/#installation). If you
are using Homebrew on Mac OS, you can do it like this:

```
brew tap homebrew/php;
brew update;
brew install phpunit;
```

To run the tests, run `grunt test`.

# Debugging

You can enable debug output in the browser by typing
`localStorage.setItem('debug', 'jetpack-fonts');` into your Javascript console
and then reloading the page.
