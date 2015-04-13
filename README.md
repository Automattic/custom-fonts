custom-fonts
============

Rewrite of the Custom Fonts component in a provider-agnostic manner.

# Installation

Right now the plugin is not packaged for distribution. That will change in the future. This means at the moment you must install build the plugin yourself.

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
