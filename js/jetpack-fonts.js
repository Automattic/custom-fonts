(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":2}],2:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":3}],3:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],4:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var AvailableFont = require( '../models/available-font' );

module.exports = Backbone.Collection.extend( {
	model: AvailableFont
} );

},{"../helpers/backbone":8,"../models/available-font":18}],5:[function(require,module,exports){
module.exports = window.wp.customize;

},{}],6:[function(require,module,exports){
var settings = require( '../helpers/bootstrap' );

var fonts = [];
if ( settings && settings.fonts ) {
	fonts = settings.fonts;
}

module.exports = fonts;


},{"../helpers/bootstrap":9}],7:[function(require,module,exports){
var settings = require( '../helpers/bootstrap' );

function compareTypes( a, b ) {
	if ( a.id === 'headings' ) {
		return -1;
	}
	if ( b.id === 'headings' ) {
		return 1;
	}
	return 0;
}

function removeSiteTitle( types ) {
	return types.reduce( function( previous, type ) {
		if ( type.id !== 'site-title' ) {
			previous.push( type );
		}
		return previous;
	}, [] );
}

var types = [];
if ( settings && settings.types ) {
	// Arrange the controls so that body-text is first
	types = settings.types.sort( compareTypes );
	// Remove deprecated site-title control from UI
	types = removeSiteTitle( types );
}

module.exports = types;

},{"../helpers/bootstrap":9}],8:[function(require,module,exports){
/* globals Backbone */
module.exports = Backbone;

},{}],9:[function(require,module,exports){
var settings = window._JetpackFonts;

module.exports = settings;

},{}],10:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	_ = require( '../helpers/underscore' );

module.exports = _.extend( Backbone.Events );


},{"../helpers/backbone":8,"../helpers/underscore":14}],11:[function(require,module,exports){
var styleOptions = typeof window !== 'undefined'
	? window._JetpackFonts.fvdMap
	: {
		'n1': 'Thin',
		'i1': 'Thin Italic',
		'o1': 'Thin Oblique',
		'n2': 'Extra Light',
		'i2': 'Extra Light Italic',
		'o2': 'Extra Light Oblique',
		'n3': 'Light',
		'i3': 'Light Italic',
		'o3': 'Light Oblique',
		'n4': 'Regular',
		'i4': 'Italic',
		'o4': 'Oblique',
		'n5': 'Medium',
		'i5': 'Medium Italic',
		'o5': 'Medium Oblique',
		'n6': 'Semibold',
		'i6': 'Semibold Italic',
		'o6': 'Semibold Oblique',
		'n7': 'Bold',
		'i7': 'Bold Italic',
		'o7': 'Bold Oblique',
		'n8': 'Extra Bold',
		'i8': 'Extra Bold Italic',
		'o8': 'Extra Bold Oblique',
		'n9': 'Ultra Bold',
		'i9': 'Ultra Bold Italic',
		'o9': 'Ultra Bold Oblique'
	};

module.exports = {
	getFontVariantNameFromId: function( id ) {
		var match = styleOptions[ id ];
		if ( match ) {
			return match;
		}
		return 'Regular';
	}
};

},{}],12:[function(require,module,exports){
/**
 * This helper sets up Views to render each font for specific providers. Each
 * View should be an instance of `wp.customize.JetpackFonts.ProviderView` (which
 * is a `Backbone.View`) that will render its font option to the font list.
 * Additional provider Views can be added by adding to the
 * `wp.customize.JetpackFonts.providerViews` object using the provider id as the
 * key. The only thing that needs to be added for each ProviderView is the
 * `render` method. Each ProviderView has as its `model` object the font object
 * it needs to display, including the `cssName`, `displayName`, and `id` attributes.
 *
 * Additionally, if your provider needs specific logic for hover states (think
 * background image swapping), you can implement `mouseenter` and `mouseleave` methods.
 */

var api = require( '../helpers/api' ),
	debug = require( 'debug' )( 'jetpack-fonts:provider-views' );

var DropdownItem = require( '../views/dropdown-item' );
if ( ! api.JetpackFonts ) {
	api.JetpackFonts = {};
}
if ( ! api.JetpackFonts.providerViews ) {
	api.JetpackFonts.providerViews = {};
}
api.JetpackFonts.ProviderView = DropdownItem.extend( {
	mouseenter: function() {},
	mouseleave: function() {}
} );

var providerViews = {};

function importProviderViews() {
	debug( 'importing provider views from', api.JetpackFonts.providerViews );
	if ( api.JetpackFonts.providerViews ) {
		Object.keys( api.JetpackFonts.providerViews ).forEach( function( providerKey ) {
			providerViews[ providerKey ] = api.JetpackFonts.providerViews[ providerKey ];
		} );
	}
}

function getViewForProvider( provider ) {
	importProviderViews();
	if ( providerViews[ provider ] ) {
		debug( 'found view for provider', provider );
		return providerViews[ provider ];
	}
	debug( 'no view found for provider', provider );
	return null;
}

module.exports = {
	getViewForProvider: getViewForProvider
};

},{"../helpers/api":5,"../views/dropdown-item":28,"debug":1}],13:[function(require,module,exports){
var translations = typeof window !== 'undefined'
	? window._JetpackFonts.i18n
	: {};

module.exports = function( string ) {
	if ( translations[ string ] ) {
		return translations[ string ];
	}
	return string;
};

},{}],14:[function(require,module,exports){
/* globals _ */
module.exports = _;

},{}],15:[function(require,module,exports){
/* globals WebFont */
module.exports = WebFont;

},{}],16:[function(require,module,exports){
var api = require( './helpers/api' );

var Master = require( './views/master' );

var SelectedFonts = require( './models/selected-fonts' );

// Customizer Control
api.controlConstructor.jetpackFonts = api.Control.extend( {
	ready: function() {
		// Get the existing setting from the Customizer
		this.selectedFonts = new SelectedFonts( this.setting() );

		// Update the setting when the current font changes
		this.selectedFonts.on( 'change', function() {
			this.setting( this.selectedFonts.toJSON() );
		}.bind( this ) );

		this.view = new Master( {
			selectedFonts: this.selectedFonts,
			el: this.container
		} ).render();

		// Delay loading fonts until the Section is opened
		api.section( this.section() ).container
		.one( 'expanded', function() {
			setTimeout( this.view.loadFonts, 200 );
		}.bind( this ) );

		api.section( this.section() ).container
		.on( 'collapsed', function() {
			this.view.closeAllMenus();
		}.bind( this ) );
	}
} );

},{"./helpers/api":5,"./models/selected-fonts":21,"./views/master":39}],17:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts:menu-view' ),
	Emitter = require( '../helpers/emitter' );

function maybeOpenMenu( key ) {
	if ( key.type && key.type.id && key.menu ) {
		key = key.type.id + ':' + key.menu;
	}
	if ( key !== this.menuKey ) {
		return this.closeMenu();
	}
	this.openMenu();
}

function openMenu() {
	debug( 'opening menu', this.menuKey );
	this.menuStatus.set( { isOpen: true } );
}

function closeMenu() {
	debug( 'closing menu', this.menuKey );
	this.menuStatus.set( { isOpen: false } );
}

var menuViewMixin = function( view ) {
	if ( ! view.listenTo ) {
		throw 'menuViewMixin requires a Backbone View with the `listenTo` method';
	}
	if ( ! view.menuKey ) {
		throw 'menuViewMixin requires a View with a `menuKey` string property to identify the menu';
	}
	if ( ! view.menuStatus ) {
		view.menuStatus = new Backbone.Model( { isOpen: false } );
	}

	view.maybeOpenMenu = maybeOpenMenu;
	view.openMenu = openMenu;
	view.closeMenu = closeMenu;

	view.listenTo( Emitter, 'open-menu', view.maybeOpenMenu );
	view.listenTo( Emitter, 'close-open-menus', view.closeMenu );

	debug( 'added menu capability to the View', view.menuKey );

	return view.menuStatus;
};

module.exports = menuViewMixin;

},{"../helpers/backbone":8,"../helpers/emitter":10,"debug":1}],18:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	_ = require( '../helpers/underscore' ),
	translate = require( '../helpers/translate' );

var sizeOptions = [
	{ id: -10, name: translate( 'Tiny' ) },
	{ id: -5,  name: translate( 'Small' ) },
	{ id: 0,   name: translate( 'Normal' ) },
	{ id: 5,   name: translate( 'Large' ) },
	{ id: 10,  name: translate( 'Huge' ) }
];

module.exports = Backbone.Model.extend( {
	getFontVariantOptions: function() {
		if ( this.get( 'fvds' ) ) {
			return this.get( 'fvds' );
		}
		return [];
	},

	getFontSizeOptions: function() {
		return sizeOptions;
	},

	getFontSizeNameFromId: function( id ) {
		var option = _.findWhere( sizeOptions, { id: id } );
		if ( option ) {
			return option.name;
		}
		return false;
	}
} );

},{"../helpers/backbone":8,"../helpers/translate":13,"../helpers/underscore":14}],19:[function(require,module,exports){
var SelectedFont = require( '../models/selected-font' ),
	translate = require( '../helpers/translate' );

module.exports = SelectedFont.extend( {
	initialize: function() {
		this.set( { id: '', displayName: translate( 'Default Theme Font' ), provider: '' } );
	}
} );

},{"../helpers/translate":13,"../models/selected-font":20}],20:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	translate = require( '../helpers/translate' ),
	availableTypes = require( '../helpers/available-types' ),
	_ = require( '../helpers/underscore' ),
	debug = require( 'debug' )( 'jetpack_fonts:selected-font' );

// A Model for a currently set font setting for this theme
module.exports = Backbone.Model.extend( {
	initialize: function() {
		this.maybeSetCurrentFvd();
	},
	defaults: {
		'displayName': translate( 'Default Theme Font' )
	},
	set: function() {
		Backbone.Model.prototype.set.apply( this, arguments );
		this.maybeSetCurrentFvd();
	},
	maybeSetCurrentFvd: function() {
		var type;
		if ( this.get( 'currentFvd' ) ) {
			debug( 'Font already has an fvd', this.get( 'currentFvd' ) );
			return;
		}
		if ( ! this.get( 'id' ) ) {
			return;
		}
		type = _.findWhere( availableTypes, { id: this.get( 'type' ) } );
		if ( ! type || ! type.fvdAdjust || ! this.get( 'fvds' ) ) {
			return;
		}
		this.set( 'currentFvd', this.pickFvd() );
		debug( 'Fvd now set to: ', this.get( 'currentFvd' ) );
	},
	pickFvd: function() {
		// algorithm here: https://developer.mozilla.org/en/docs/Web/CSS/font-weight#Fallback
		// we always go for 400 weight first.
		var variations = this.get( 'fvds' );
		// first try n4
		var i = 4;
		if ( this.hasVariation( 'n' + i, variations ) ) {
			return 'n' + i;
		}
		// next we try n5
		i = 5;
		if ( this.hasVariation( 'n' + i, variations ) ) {
			return 'n' + i;
		}
		// now we go lighter, to 3-1
		for ( i = 3; i >= 1; i-- ) {
			if ( this.hasVariation( 'n' + i, variations ) ) {
				return 'n' + i;
			}
		}
		// now darker, 6-9
		for ( i = 6; i <= 9; i++ ) {
			if ( this.hasVariation( 'n' + i, variations ) ) {
				return 'n' + i;
			}
		}
		// I guess just return n4 anyway
		return 'n4';
	},
	hasVariation: function( fvd, fvds ) {
		return _.contains( fvds, fvd );
	}
} );

},{"../helpers/available-types":7,"../helpers/backbone":8,"../helpers/translate":13,"../helpers/underscore":14,"debug":1}],21:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts:selected-fonts' ),
	translate = require( '../helpers/translate' );

var SelectedFont = require( '../models/selected-font' );

// A Collection of the current font settings for this theme
// We use a Model instead of an actual Collection because we can't otherwise
// hold two copies of the same font (same id).
module.exports = Backbone.Model.extend( {

	initialize: function( data ) {
		if ( ! data ) {
			data = [];
		}
		var fonts = data.map( function( font ) {
			return new SelectedFont( font );
		} );
		this.set( 'fonts', fonts );
	},

	getFontByType: function( type ) {
		var model = this.get( 'fonts' ).reduce( function( previous, mod ) {
			if ( mod.get( 'type' ) === type ) {
				return mod;
			}
			return previous;
		}, null );
		if ( ! model ) {
			model = new SelectedFont( { type: type, displayName: translate( 'Default Theme Font' ) } );
			this.get( 'fonts' ).push( model );
		}
		return model;
	},

	size: function() {
		return this.get( 'fonts' ).length;
	},

	setSelectedFont: function( font ) {
		debug( 'setting selected font to', font );
		if ( ! font.type ) {
			debug( 'Cannot set selected font because it has no type', font );
			return;
		}
		var model = this.getFontByType( font.type );
		model.clear( { silent: true } );
		if ( model ) {
			model.set( font );
		} else {
			this.get( 'fonts' ).push( new SelectedFont( font ) );
		}
		this.trigger( 'change' );
	},

	toJSON: function() {
		// skip any fonts set to the default
		return this.get( 'fonts' ).reduce( function( previous, model ) {
			if ( model.get( 'id' ) ) {
				previous.push( model.toJSON() );
			}
			return previous;
		}, [] );
	}
} );


},{"../helpers/backbone":8,"../helpers/translate":13,"../models/selected-font":20,"debug":1}],22:[function(require,module,exports){
var api = require( '../helpers/api' ),
	bootstrap = require( '../helpers/bootstrap' );

var WebFont = require( '../helpers/webfont' );

var loadedFontIds = [];

function addFontToControls( font, text ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	WebFont.load({
		google: { families: [ font.id ], text: text },
		classes: false,
		events: false
	});
}

function addFontToPreview( font ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	var familyString = font.id + ':100,200,300,400,500,600,700,800,900,100italic,200italic,300italic,400italic,500italic,600italic,700italic,800italic,900italic';
	if ( bootstrap.providerData && bootstrap.providerData.googleSubsetString ) {
		var subsetString = bootstrap.providerData.googleSubsetString;
		if ( subsetString && subsetString.length > 0 ) {
			familyString += ':' + subsetString;
		}
	}
	WebFont.load( { google: { families: [ familyString ] } } );
}

var GoogleProviderView = api.JetpackFonts.ProviderView.extend( {

	render: function() {
		this.$el.html( this.model.get( 'displayName' ) );

		this.$el.css( 'font-family', '"' + this.model.get( 'cssName' ) + '"' );
		if ( this.currentFont && this.currentFont.get( 'id' ) === this.model.get( 'id' ) ) {
			this.$el.addClass( 'active' );
		} else {
			this.$el.removeClass( 'active' );
		}
		if (!this.disableFocus ) {
			this.$el.attr('tabindex', '0');
		}
		addFontToControls( this.model.toJSON(), this.model.get( 'id' ) );
		return this;
	}
} );

GoogleProviderView.addFontToPreview = addFontToPreview;

api.JetpackFonts.providerViews.google = GoogleProviderView;

module.exports = GoogleProviderView;

},{"../helpers/api":5,"../helpers/bootstrap":9,"../helpers/webfont":15}],23:[function(require,module,exports){
var DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

module.exports = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font-size font-property-control-current',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call( this, opts );
		this.currentFontSize = opts.currentFontSize;
	},

	render: function() {
		this.$el.html( this.currentFontSize );
		this.$el.attr( 'tabindex', '0');
		return this;
	}

} );

},{"../views/dropdown-current-template":27}],24:[function(require,module,exports){
var DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

var getFontVariantNameFromId = require( '../helpers/fvd-to-readable' ).getFontVariantNameFromId;

var CurrentFontVariant = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font-variant font-property-control-current',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call( this, opts );
		this.currentFontVariant = opts.currentFontVariant;
		this.multiOptions = opts.multiOptions;
	},

	render: function() {
		this.$el.html( getFontVariantNameFromId( this.currentFontVariant ) );
		if ( this.multiOptions === false ) {
			this.$el.addClass( 'inactive' );
		} else {
			this.$el.removeClass( 'inactive' );
		}
		this.$el.attr( 'tabindex', '0');
		return this;
	}

} );

module.exports = CurrentFontVariant;

},{"../helpers/fvd-to-readable":11,"../views/dropdown-current-template":27}],25:[function(require,module,exports){
var debug = require( 'debug' )( 'jetpack-fonts:CurrentFontView' );

var getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

var CurrentFontView = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font',

	events: {
		'mouseenter': 'dispatchHover',
		'mouseleave': 'dispatchHover',
		'click': 'toggleDropdown',
		'keydown': 'checkKeyboardToggle',
	},

	dispatchHover: function( event ) {

		if ( ! ( event.type === 'mouseenter' || event.type === 'mouseleave' ) ) {
			return;
		}
		this.providerView && this.providerView[ event.type ]( event );
	},

	checkKeyboardToggle: function( event ) {
		if ( event.key === 'Enter' ) {
			this.toggleDropdown();
		}
	},

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call( this, opts );
		this.currentFont = opts.currentFont;
		this.active = opts.active;
		this.listenTo( this.currentFont, 'change', this.render );
		this.listenTo( this.menuStatus, 'change', this.render );
	},

	render: function() {
		if ( this.active ) {
			this.$el.addClass( 'active' );
		} else {
			this.$el.removeClass( 'active' );
		}
		if ( this.menuStatus.get( 'isOpen' ) ) {
			this.$el.addClass( 'jetpack-fonts__current-font--open' );
		} else {
			this.$el.removeClass( 'jetpack-fonts__current-font--open' );
		}
		debug( 'rendering currentFont:', this.currentFont.toJSON() );
		if ( ! this.currentFont.get( 'id' ) ) {
			this.$el.addClass( 'jetpack-fonts__current-font--default' );
		} else {
			this.$el.removeClass( 'jetpack-fonts__current-font--default' );
		}
		if ( this.providerView ) {
			this.providerView.remove();
		}
		this.$el.text( '' );
		this.$el.attr( 'tabindex', '0');
		var ProviderView = getViewForProvider( this.currentFont.get( 'provider' ) );
		if ( ! ProviderView ) {
			debug( 'rendering currentFont with no providerView for', this.currentFont.toJSON() );
			if ( ! this.currentFont.get( 'displayName' ) ) {
				debug( 'error rendering currentFont because it has no displayName!', this.currentFont.toJSON() );
				this.$el.html( 'Unknown' );
			} else {
				this.$el.html( this.currentFont.get( 'displayName' ) );
			}
			return this;
		}
		debug( 'rendering currentFont providerView for', this.currentFont.toJSON() );
		this.providerView = new ProviderView( {
			model: this.currentFont,
			type: this.type,
			disableFocus: true
		} );
		this.$el.append( this.providerView.render().el );
		return this;
	}

} );

module.exports = CurrentFontView;

},{"../helpers/provider-views":12,"../views/dropdown-current-template":27,"debug":1}],26:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

var DefaultFont = require( '../models/default-font' );

// 'x' button that resets font to default
var DefaultFontButton = Backbone.View.extend( {
	className: 'jetpack-fonts__default-button',
	tagName: 'span',

	events: {
		'click': 'resetToDefault'
	},

	initialize: function( opts ) {
		this.currentFont = opts.currentFont;
		this.type = opts.type;
		if ( ! this.type ) {
			throw 'Error: cannot create DefaultFontButton without a type';
		}
		this.menuStatus = opts.menuStatus;
		this.listenTo( this.currentFont, 'change', this.render );
		this.listenTo( this.menuStatus, 'change', this.render );
	},

	render: function() {
		this.$el.html( '' );
		if ( this.currentFont.id && ! this.menuStatus.get( 'isOpen' ) ) {
			this.$el.addClass( 'active-button' );
			this.$el.show();
		} else {
			this.$el.removeClass( 'active-button' );
			this.$el.hide();
		}
		return this;
	},

	resetToDefault: function() {
		Emitter.trigger( 'change-font', { font: new DefaultFont(), type: this.type.id } );
	}
} );

module.exports = DefaultFontButton;

},{"../helpers/backbone":8,"../helpers/emitter":10,"../models/default-font":19}],27:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts:DropdownCurrentTemplate' );

var Emitter = require( '../helpers/emitter' );

var DropdownCurrentTemplate = Backbone.View.extend( {
	events: {
		'click': 'toggleDropdown',
		'keydown': 'checkKeyboardToggle',
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
		this.menuStatus = opts.menuStatus;
		this.active = true;
	},

	toggleDropdown: function( e ) {
		if ( e ) {
			e.stopPropagation();
		}
		if ( ! this.active ) {
			debug( 'menu is inactive; ignoring click', this.menu, this.type );
			return;
		}
		if ( this.menuStatus.get( 'isOpen' ) ) {
			debug( 'menu is open; closing menus', this.menu, this.type );
			Emitter.trigger( 'close-open-menus' );
		} else {
			debug( 'menu is closed; opening menu', this.menu, this.type );
			Emitter.trigger( 'open-menu', { type: this.type, menu: this.menu } );
		}
	},

	checkKeyboardToggle: function( event ) {
		if ( event.key === 'Enter' ) {
			this.$el.click();
		}
	},
} );

module.exports = DropdownCurrentTemplate;

},{"../helpers/backbone":8,"../helpers/emitter":10,"debug":1}],28:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

// An individual font in the dropdown list, exported as
// `api.JetpackFonts.ProviderView`. Extend this object for each provider. The
// extended objects need to define a `render` method to render their provider's
// font name, as well as `addFontToControls` and `addFontToPreview` methods on the object itself.
var ProviderView = Backbone.View.extend( {
	className: 'jetpack-fonts__option',

	events: {
		'click': 'fontChanged',
		'keydown': 'checkKeyboardSelect'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.currentFont = opts.currentFont;
		this.disableFocus = Boolean(opts.disableFocus);
		if ( this.currentFont ) {
			this.listenTo(this.currentFont, 'change', this.render);
		}
	},

	checkKeyboardSelect: function( event ) {
		if ( event.key === 'Enter' ) {
			this.$el.click();
		}
	},

	// Warning: this should be overriden in the provider
	render: function() {
		this.$el.html( this.model.get( 'displayName' ) );
		return this;
	},

	fontChanged: function() {
		if ( this.currentFont && this.currentFont !== this.model ) {
			Emitter.trigger( 'change-font', { font: this.model, type: this.type.id } );
		}
	}
} );

ProviderView.addFontToControls = function() {};

module.exports = ProviderView;

},{"../helpers/backbone":8,"../helpers/emitter":10}],29:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var DropdownTemplate = Backbone.View.extend( {
	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
		this.menuStatus = opts.menuStatus;
		this.listenTo( this.menuStatus, 'change', this.updateStatus );
	},

	updateStatus: function() {
		if ( this.menuStatus.get( 'isOpen' ) ) {
			this.open();
		} else {
			this.close();
		}
	},

	open: function() {
		this.$el.addClass( 'open' );
		this.isOpen = true;
	},

	close: function() {
		this.$el.removeClass( 'open' );
		this.isOpen = false;
	}
} );

module.exports = DropdownTemplate;

},{"../helpers/backbone":8}],30:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	menuViewMixin = require( '../mixins/menu-view-mixin' );

var FontDropdown = require( '../views/font-dropdown' ),
	CurrentFontView = require( '../views/current-font' ),
	DefaultFontButton = require( '../views/default-font-button' );

// Container for the list of available fonts and 'x' button
var FontControlView = Backbone.View.extend( {
	className: 'jetpack-fonts__menu-container',

	initialize: function( opts ) {
		this.fontData = opts.fontData;
		this.type = opts.type;
		this.menu = 'fontFamily';
		this.menuKey = this.type.id + ':' + this.menu;
		this.menuStatus = menuViewMixin( this );
	},

	render: function() {
		var currentFontView = new CurrentFontView( {
			type: this.type,
			menu: this.menu,
			menuStatus: this.menuStatus,
			currentFont: this.model,
			active: ( this.fontData.length > 0 )
		} );
		this.$el.append( currentFontView.render().el );
		this.$el.append( new FontDropdown( {
			type: this.type,
			menu: this.menu,
			menuStatus: this.menuStatus,
			currentFont: this.model,
			currentFontView: currentFontView,
			fontData: this.fontData
		} ).render().el );
		this.$el.append( new DefaultFontButton( {
			type: this.type,
			menuStatus: this.menuStatus,
			currentFont: this.model
		} ).render().el );
		return this;
	}
} );

module.exports = FontControlView;

},{"../helpers/backbone":8,"../mixins/menu-view-mixin":17,"../views/current-font":25,"../views/default-font-button":26,"../views/font-dropdown":31}],31:[function(require,module,exports){
var debug = require( 'debug' )( 'jetpack-fonts:FontDropdown' ),
	Emitter = require( '../helpers/emitter' );

var getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownTemplate = require( '../views/dropdown-template' ),
	$ = require( '../helpers/backbone' ).$;

// Dropdown of available fonts
var FontDropdown = DropdownTemplate.extend( {
	className: 'jetpack-fonts__menu',
	id: 'font-select',

	events: {
		'mouseenter > .jetpack-fonts__option': 'dispatchHover',
		'mouseleave > .jetpack-fonts__option': 'dispatchHover',
	},

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call( this, opts );
		this.fontData = opts.fontData;
		this.availableFonts = [];
		this.subViews = {};
		this.currentFont = opts.currentFont;
		this.currentFontView = opts.currentFontView;
		this.listenTo( Emitter, 'load-menu-fonts', this.loadFonts );
	},

	loadFonts: function() {
		if ( this.availableFonts.length > 0 ) {
			return;
		}
		this.availableFonts = this.fontData;
		this.render();
	},

	dispatchHover: function( event ) {
		var el;
		if ( ! ( event.type === 'mouseenter' || event.type === 'mouseleave' ) ) {
			return;
		}
		el = event.currentTarget;
		if ( el.cid && this.subViews[ el.cid ] ) {
			this.subViews[ el.cid ][ event.type ]( event );
		}
	},

	render: function() {
		Object.keys( this.subViews ).forEach( function( cid ) {
			this.subViews[ cid ].remove();
		}.bind( this ) );
		debug( 'rendering', this.availableFonts.length, 'availableFonts for', this.type );
		this.availableFonts.forEach( function( font ) {
			var ProviderView = getViewForProvider( font.get( 'provider' ) );
			if ( ! ProviderView ) {
				return;
			}
			debug( 'rendering providerView in', this.type, 'font list for', font.toJSON() );
			var view = new ProviderView( {
				model: font,
				type: this.type,
				currentFont: this.currentFont
			} ).render();

			view.el.cid = view.cid;
			this.subViews[ view.cid ] = view;
			this.$el.append( view.el );
		}, this );
		return this;
	},

	open: function() {
		DropdownTemplate.prototype.open.call( this );
		this.adjustPosition();
	},

	adjustPosition: function() {
		var offset = this.currentFontView.$el.offset();
		var myHeight = this.currentFontView.$el.height();
		var availableHeight = $( '.wp-full-overlay-sidebar-content' ).height();
		var middle = availableHeight / 2;

		debug( 'adjusting position of menu; offset.top', offset.top, 'middle', middle, 'calc', offset.top - ( myHeight / 2 ) );
		if ( offset.top - ( myHeight / 2 ) >= middle ) {
			debug( 'menu: closer to bottom' );
			this.$el.removeClass( 'open-down' ).css( {
				height: offset.top - myHeight - 10
			} );
		} else {
			debug( 'menu: closer to top' );
			debug( 'offset.top', offset.top, 'availableHeight', availableHeight, 'myHeight', myHeight );
			this.$el.addClass( 'open-down' ).css( {
				height: availableHeight - offset.top - 10
			} );
		}
	}
} );

module.exports = FontDropdown;

},{"../helpers/backbone":8,"../helpers/emitter":10,"../helpers/provider-views":12,"../views/dropdown-template":29,"debug":1}],32:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	menuViewMixin = require( '../mixins/menu-view-mixin' );

var FontSizeDropdown = require( '../views/font-size-dropdown' ),
CurrentFontSize = require( '../views/current-font-size' ),
translate = require( '../helpers/translate' );

var FontSizeControl = Backbone.View.extend( {
	className: 'jetpack-fonts__font-size-control font-property-control',

	initialize: function( opts ) {
		this.menu = 'fontSize';
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
		this.menuKey = this.type.id + ':' + this.menu;
		this.menuStatus = menuViewMixin( this );
	},

	getSelectedAvailableFont: function() {
		var selectedAvailableFont = this.fontData.findWhere( { id: this.currentFont.get( 'id' ) } );
		if ( !selectedAvailableFont ) {
			return false;
		}
		return selectedAvailableFont;
	},

	getCurrentFontSize: function() {
		var selectedAvailableFont = this.getSelectedAvailableFont();
		if ( selectedAvailableFont ) {
			var size = this.currentFont.get( 'size' );
			if ( size && selectedAvailableFont.getFontSizeNameFromId( size ) ) {
				return selectedAvailableFont.getFontSizeNameFromId( size );
			}
			return translate( 'Normal Size' );
		}
	},

	isDefaultFont: function() {
		return ( ! ( this.currentFont.has( 'id' ) && this.currentFont.get( 'id' ).length > 0 ) );
	},

	render: function() {
		this.$el.html( '' );
		if ( this.isDefaultFont() ) {
			this.$el.addClass( 'jetpack-fonts__font-property-control--inactive' );
		} else {
			this.$el.removeClass( 'jetpack-fonts__font-property-control--inactive' );
		}
		this.$el.append( new CurrentFontSize( {
			type: this.type,
			menu: this.menu,
			menuStatus: this.menuStatus,
			currentFontSize: this.getCurrentFontSize()
		} ).render().el );
		this.$el.append( new FontSizeDropdown( {
			type: this.type,
			menu: this.menu,
			menuStatus: this.menuStatus,
			selectedAvailableFont: this.getSelectedAvailableFont(),
			currentFontSize: this.getCurrentFontSize()
		} ).render().el );
		return this;
	}

} );

module.exports = FontSizeControl;

},{"../helpers/backbone":8,"../helpers/translate":13,"../mixins/menu-view-mixin":17,"../views/current-font-size":23,"../views/font-size-dropdown":33}],33:[function(require,module,exports){
var FontSizeOption = require( '../views/font-size-option' ),
DropdownTemplate = require( '../views/dropdown-template' );

var FontSizeDropdown = DropdownTemplate.extend( {
	className: 'jetpack-fonts__font-size-dropdown font-property-control-dropdown',

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call( this, opts );
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.currentFontSize = opts.currentFontSize;
	},

	render: function() {
		this.$el.html( '' );
		if ( this.selectedAvailableFont ) {
			var sizeOptions = this.selectedAvailableFont.getFontSizeOptions();
			sizeOptions.forEach( function( option ) {
				this.$el.append( new FontSizeOption( {
					type: this.type,
					id: option.id,
					name: option.name,
					currentFontSize: this.currentFontSize
				} ).render().el );
			}.bind( this ) );
		}
		return this;
	}

} );

module.exports = FontSizeDropdown;

},{"../views/dropdown-template":29,"../views/font-size-option":34}],34:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-size-option jetpack-fonts__font-property-option',

	events: {
		'click': 'setSizeOption',
		'keydown': 'checkKeyboardSelect'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.name = opts.name;
		this.currentFontSize = opts.currentFontSize;
	},

	checkKeyboardSelect: function( event ) {
		if ( event.key === 'Enter' ) {
			this.$el.click();
		}
	},

	render: function() {
		this.$el.html( this.name );
		this.$el.attr( 'data-name', this.name );
		if ( this.currentFontSize === this.name ) {
			this.$el.addClass( 'current' );
		}
		this.$el.attr( 'tabindex', '0' );
		return this;
	},

	setSizeOption: function() {
		Emitter.trigger( 'set-size', { size: this.id, type: this.type.id } );
	}

} );

},{"../helpers/backbone":8,"../helpers/emitter":10}],35:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts:FontTypeView' );

var Emitter = require( '../helpers/emitter' );

var FontControlView = require( '../views/font-control' ),
	FontVariantControl = require( '../views/font-variant-control' ),
	FontSizeControl = require( '../views/font-size-control' );

// A font control View for a particular setting type
var FontTypeView = Backbone.View.extend( {
	className: 'jetpack-fonts__type',

	events: {
		'click': 'closeMenus'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
	},

	render: function() {
		this.$el.append( '<div class="jetpack-fonts__type" data-font-type="' + this.type.id + '"><h3 class="jetpack-fonts__type-header">' + this.type.name + '</h3></div>' );
		this.$el.append( new FontControlView( {
			type: this.type,
			model: this.currentFont,
			fontData: this.fontData
		} ).render().el );
		var subMenusContainer = Backbone.$( '<div class="jetpack-fonts__type-options"></div>' );
		subMenusContainer.append( new FontVariantControl( {
			type: this.type,
			currentFont: this.currentFont,
			fontData: this.fontData
		} ).render().el );
		subMenusContainer.append( new FontSizeControl( {
			type: this.type,
			currentFont: this.currentFont,
			fontData: this.fontData
		} ).render().el );
		this.$el.append( subMenusContainer );
		return this;
	},

	closeMenus: function() {
		debug( 'type clicked; closing menus', this.type );
		Emitter.trigger( 'close-open-menus' );
	}
} );

module.exports = FontTypeView;

},{"../helpers/backbone":8,"../helpers/emitter":10,"../views/font-control":30,"../views/font-size-control":32,"../views/font-variant-control":36,"debug":1}],36:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	menuViewMixin = require( '../mixins/menu-view-mixin' );

var FontVariantDropdown = require( '../views/font-variant-dropdown' ),
CurrentFontVariant = require( '../views/current-font-variant' );

var FontVariantControl = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-control font-property-control',

	initialize: function( opts ) {
		this.menu = 'fontVariant';
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
		this.menuKey = this.type.id + ':' + this.menu;
		this.menuStatus = menuViewMixin( this );
	},

	getSelectedAvailableFont: function() {
		var selectedAvailableFont = this.fontData.findWhere( { id: this.currentFont.get( 'id' ) } );
		if ( !selectedAvailableFont ) {
			return false;
		}
		return selectedAvailableFont;
	},

	getCurrentFontVariant: function() {
		var selectedAvailableFont = this.getSelectedAvailableFont();
		if ( selectedAvailableFont && this.type.fvdAdjust ) {
			return this.currentFont.get( 'currentFvd' );
		}
	},

	render: function() {
		var selectedAvailableFont = this.getSelectedAvailableFont();
		var multiOptions;
		if ( selectedAvailableFont && selectedAvailableFont.getFontVariantOptions().length > 1 ) {
			multiOptions = true;
		} else {
			multiOptions = false;
		}
		if ( this.currentFontView ) {
			this.currentFontView.remove();
		}
		if ( this.dropDownView ) {
			this.dropDownView.remove();
		}
		if ( multiOptions && this.type.fvdAdjust ) {
			this.currentFontView = new CurrentFontVariant( {
				type: this.type,
				menu: this.menu,
				menuStatus: this.menuStatus,
				currentFontVariant: this.getCurrentFontVariant(),
				multiOptions: multiOptions
			} );
			this.$el.append( this.currentFontView.render().el );
			this.dropDownView = new FontVariantDropdown( {
				type: this.type,
				menu: this.menu,
				menuStatus: this.menuStatus,
				selectedAvailableFont: this.getSelectedAvailableFont(),
				currentFontVariant: this.getCurrentFontVariant()
			} );
			this.$el.append( this.dropDownView.render().el );
		}
		return this;
	}

} );

module.exports = FontVariantControl;

},{"../helpers/backbone":8,"../mixins/menu-view-mixin":17,"../views/current-font-variant":24,"../views/font-variant-dropdown":37}],37:[function(require,module,exports){
var FontVariantOption = require( '../views/font-variant-option' ),
DropdownTemplate = require( '../views/dropdown-template' );

module.exports = DropdownTemplate.extend( {
	className: 'jetpack-fonts__font-variant-dropdown font-property-control-dropdown',

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call( this, opts );
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.currentFontVariant = opts.currentFontVariant;
	},

	render: function() {
		this.$el.html( '' );
		if ( this.selectedAvailableFont && this.type.fvdAdjust ) {
			var variantOptions = this.selectedAvailableFont.getFontVariantOptions();
			variantOptions.forEach( function( fvd ) {
				this.$el.append( new FontVariantOption( {
					type: this.type,
					id: fvd,
					currentFontVariant: this.currentFontVariant
				} ).render().el );
			}.bind( this ) );
		}
		return this;
	}

} );

},{"../views/dropdown-template":29,"../views/font-variant-option":38}],38:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

var getFontVariantNameFromId = require( '../helpers/fvd-to-readable' ).getFontVariantNameFromId;

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-option jetpack-fonts__font-property-option',

	events: {
		'click': 'setVariantOption',
		'keydown': 'checkKeyboardSelect'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.currentFontVariant = opts.currentFontVariant;
	},

	checkKeyboardSelect: function( event ) {
		if ( event.key === 'Enter' ) {
			this.$el.click();
		}
	},

	render: function() {
		this.$el.html( getFontVariantNameFromId( this.id ) );
		this.$el.data( 'id', this.id );
		if ( this.currentFontVariant === this.id ) {
			this.$el.addClass( 'current' );
		}
		this.$el.attr( 'tabindex', '0' );
		return this;
	},

	setVariantOption: function() {
		Emitter.trigger( 'set-variant', { variant: this.id, type: this.type.id } );
	}

} );

},{"../helpers/backbone":8,"../helpers/emitter":10,"../helpers/fvd-to-readable":11}],39:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' ),
	debug = require( 'debug' )( 'jetpack-fonts:MasterView' ),
	availableFonts = require( '../helpers/available-fonts' ),
	availableTypes = require( '../helpers/available-types' );

var FontType = require( '../views/font-type' ),
	AvailableFonts = require( '../collections/available-fonts' );

var DefaultFont = require( '../models/default-font' );

// Initialize the default Provider Views
require( '../providers/google' );

// The main font control View, containing sections for each setting type
module.exports = Backbone.View.extend( {
	initialize: function( opts ) {
		this.selectedFonts = opts.selectedFonts;
		debug( 'init with currently selected fonts:', this.selectedFonts.toJSON() );
		this.typeViews = [];
		this.headingFonts = new AvailableFonts( availableFonts );
		this.bodyFonts = new AvailableFonts( this.headingFonts.where( { bodyText: true } ) );
		this.listenTo( Emitter, 'change-font', this.updateCurrentFont );
		this.listenTo( Emitter, 'set-variant', this.setFontVariant );
		this.listenTo( Emitter, 'set-size', this.setFontSize );
	},

	closeAllMenus: function() {
		Emitter.trigger( 'close-open-menus' );
	},

	setFontVariant: function( data ) {
		debug( 'font variant changed', data );
		var model = this.selectedFonts.getFontByType( data.type );
		model.set( 'currentFvd', data.variant );
		this.selectedFonts.setSelectedFont( model.toJSON() );
		Emitter.trigger( 'close-open-menus' );
	},

	setFontSize: function( data ) {
		debug( 'font size changed', data );
		var model = this.selectedFonts.getFontByType( data.type );
		model.set( 'size', data.size );
		this.selectedFonts.setSelectedFont( model.toJSON() );
		Emitter.trigger( 'close-open-menus' );
	},

	updateCurrentFont: function( data ) {
		data.font.set( { type: data.type } );
		this.selectedFonts.setSelectedFont( data.font.toJSON() );
		debug( 'updateCurrentFont with', data.font.toJSON(), 'to', this.selectedFonts.getFontByType( data.type ).toJSON() );
		// Setting headings type overwrites the deprecated site-title type
		if ( data.type === 'headings' ) {
			this.updateCurrentFont( { font: new DefaultFont(), type: 'site-title' } );
		}
		Emitter.trigger( 'close-open-menus' );
	},

	render: function() {
		this.typeViews.forEach( function( view ) {
			view.remove();
		} );
		this.$el.text( '' ); // TODO: better to update each View than overwrite
		debug( 'rendering controls for font types', availableTypes );
		this.typeViews = availableTypes.map( this.renderTypeControl.bind( this ) );
		return this;
	},

	renderTypeControl: function( type ) {
		var fonts;
		if ( type.bodyText === true ) {
			fonts = this.bodyFonts;
		} else {
			fonts = this.headingFonts;
		}
		var view = new FontType( {
			type: type,
			currentFont: this.selectedFonts.getFontByType( type.id ),
			fontData: fonts
		} );
		this.$el.append( view.render().el );
		return view;
	},

	loadFonts: function() {
		Emitter.trigger( 'load-menu-fonts' );
	}

} );

},{"../collections/available-fonts":4,"../helpers/available-fonts":6,"../helpers/available-types":7,"../helpers/backbone":8,"../helpers/emitter":10,"../models/default-font":19,"../providers/google":22,"../views/font-type":35,"debug":1}]},{},[16])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsInNyYy9qcy9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMuanMiLCJzcmMvanMvaGVscGVycy9hcGkuanMiLCJzcmMvanMvaGVscGVycy9hdmFpbGFibGUtZm9udHMuanMiLCJzcmMvanMvaGVscGVycy9hdmFpbGFibGUtdHlwZXMuanMiLCJzcmMvanMvaGVscGVycy9iYWNrYm9uZS5qcyIsInNyYy9qcy9oZWxwZXJzL2Jvb3RzdHJhcC5qcyIsInNyYy9qcy9oZWxwZXJzL2VtaXR0ZXIuanMiLCJzcmMvanMvaGVscGVycy9mdmQtdG8tcmVhZGFibGUuanMiLCJzcmMvanMvaGVscGVycy9wcm92aWRlci12aWV3cy5qcyIsInNyYy9qcy9oZWxwZXJzL3RyYW5zbGF0ZS5qcyIsInNyYy9qcy9oZWxwZXJzL3VuZGVyc2NvcmUuanMiLCJzcmMvanMvaGVscGVycy93ZWJmb250LmpzIiwic3JjL2pzL2luZGV4LmpzIiwic3JjL2pzL21peGlucy9tZW51LXZpZXctbWl4aW4uanMiLCJzcmMvanMvbW9kZWxzL2F2YWlsYWJsZS1mb250LmpzIiwic3JjL2pzL21vZGVscy9kZWZhdWx0LWZvbnQuanMiLCJzcmMvanMvbW9kZWxzL3NlbGVjdGVkLWZvbnQuanMiLCJzcmMvanMvbW9kZWxzL3NlbGVjdGVkLWZvbnRzLmpzIiwic3JjL2pzL3Byb3ZpZGVycy9nb29nbGUuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LXNpemUuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LmpzIiwic3JjL2pzL3ZpZXdzL2RlZmF1bHQtZm9udC1idXR0b24uanMiLCJzcmMvanMvdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZS5qcyIsInNyYy9qcy92aWV3cy9kcm9wZG93bi1pdGVtLmpzIiwic3JjL2pzL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtY29udHJvbC5qcyIsInNyYy9qcy92aWV3cy9mb250LWRyb3Bkb3duLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtc2l6ZS1jb250cm9sLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtc2l6ZS1kcm9wZG93bi5qcyIsInNyYy9qcy92aWV3cy9mb250LXNpemUtb3B0aW9uLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtdHlwZS5qcyIsInNyYy9qcy92aWV3cy9mb250LXZhcmlhbnQtY29udHJvbC5qcyIsInNyYy9qcy92aWV3cy9mb250LXZhcmlhbnQtZHJvcGRvd24uanMiLCJzcmMvanMvdmlld3MvZm9udC12YXJpYW50LW9wdGlvbi5qcyIsInNyYy9qcy92aWV3cy9tYXN0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICdsaWdodHNlYWdyZWVuJyxcbiAgJ2ZvcmVzdGdyZWVuJyxcbiAgJ2dvbGRlbnJvZCcsXG4gICdkb2RnZXJibHVlJyxcbiAgJ2RhcmtvcmNoaWQnLFxuICAnY3JpbXNvbidcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICByZXR1cm4gKCdXZWJraXRBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh3aW5kb3cuY29uc29sZSAmJiAoY29uc29sZS5maXJlYnVnIHx8IChjb25zb2xlLmV4Y2VwdGlvbiAmJiBjb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuIGFyZ3M7XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzID0gW2FyZ3NbMF0sIGMsICdjb2xvcjogaW5oZXJpdCddLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSk7XG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EteiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgsXG4gIC8vIHdoZXJlIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PSB0eXBlb2YgY29uc29sZVxuICAgICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBsb2NhbFN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbcHJldkNvbG9yKysgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICAvLyBkZWZpbmUgdGhlIGBkaXNhYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcbiAgfVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZW5hYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBlbmFibGVkKCkge1xuXG4gICAgdmFyIHNlbGYgPSBlbmFibGVkO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyBhZGQgdGhlIGBjb2xvcmAgaWYgbm90IHNldFxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gICAgaWYgKG51bGwgPT0gc2VsZi5jb2xvciAmJiBzZWxmLnVzZUNvbG9ycykgc2VsZi5jb2xvciA9IHNlbGVjdENvbG9yKCk7XG5cbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlb1xuICAgICAgYXJncyA9IFsnJW8nXS5jb25jYXQoYXJncyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EteiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5mb3JtYXRBcmdzKSB7XG4gICAgICBhcmdzID0gZXhwb3J0cy5mb3JtYXRBcmdzLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIH1cbiAgICB2YXIgbG9nRm4gPSBlbmFibGVkLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG4gIGVuYWJsZWQuZW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XG5cbiAgZm4ubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHkgPSBkICogMzY1LjI1O1xuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHRocm93cyB7RXJyb3J9IHRocm93IGFuIGVycm9yIGlmIHZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgbnVtYmVyXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuICBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgdmFsLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gcGFyc2UodmFsKTtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiBpc05hTih2YWwpID09PSBmYWxzZSkge1xuICAgIHJldHVybiBvcHRpb25zLmxvbmcgPyBmbXRMb25nKHZhbCkgOiBmbXRTaG9ydCh2YWwpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICAndmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD0nICtcbiAgICAgIEpTT04uc3RyaW5naWZ5KHZhbClcbiAgKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICBzdHIgPSBTdHJpbmcoc3RyKTtcbiAgaWYgKHN0ci5sZW5ndGggPiAxMDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG1hdGNoID0gL14oKD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaHJzJzpcbiAgICBjYXNlICdocic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtaW5zJzpcbiAgICBjYXNlICdtaW4nOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtO1xuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAnc2Vjcyc6XG4gICAgY2FzZSAnc2VjJzpcbiAgICBjYXNlICdzJzpcbiAgICAgIHJldHVybiBuICogcztcbiAgICBjYXNlICdtaWxsaXNlY29uZHMnOlxuICAgIGNhc2UgJ21pbGxpc2Vjb25kJzpcbiAgICBjYXNlICdtc2Vjcyc6XG4gICAgY2FzZSAnbXNlYyc6XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG47XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRTaG9ydChtcykge1xuICBpZiAobXMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtcyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpIHx8XG4gICAgcGx1cmFsKG1zLCBoLCAnaG91cicpIHx8XG4gICAgcGx1cmFsKG1zLCBtLCAnbWludXRlJykgfHxcbiAgICBwbHVyYWwobXMsIHMsICdzZWNvbmQnKSB8fFxuICAgIG1zICsgJyBtcyc7XG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XG4gIGlmIChtcyA8IG4pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKG1zIDwgbiAqIDEuNSkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICB9XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncyc7XG59XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEF2YWlsYWJsZUZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL2F2YWlsYWJsZS1mb250JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKCB7XG5cdG1vZGVsOiBBdmFpbGFibGVGb250XG59ICk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy53cC5jdXN0b21pemU7XG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAnLi4vaGVscGVycy9ib290c3RyYXAnICk7XG5cbnZhciBmb250cyA9IFtdO1xuaWYgKCBzZXR0aW5ncyAmJiBzZXR0aW5ncy5mb250cyApIHtcblx0Zm9udHMgPSBzZXR0aW5ncy5mb250cztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmb250cztcblxuIiwidmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYm9vdHN0cmFwJyApO1xuXG5mdW5jdGlvbiBjb21wYXJlVHlwZXMoIGEsIGIgKSB7XG5cdGlmICggYS5pZCA9PT0gJ2hlYWRpbmdzJyApIHtcblx0XHRyZXR1cm4gLTE7XG5cdH1cblx0aWYgKCBiLmlkID09PSAnaGVhZGluZ3MnICkge1xuXHRcdHJldHVybiAxO1xuXHR9XG5cdHJldHVybiAwO1xufVxuXG5mdW5jdGlvbiByZW1vdmVTaXRlVGl0bGUoIHR5cGVzICkge1xuXHRyZXR1cm4gdHlwZXMucmVkdWNlKCBmdW5jdGlvbiggcHJldmlvdXMsIHR5cGUgKSB7XG5cdFx0aWYgKCB0eXBlLmlkICE9PSAnc2l0ZS10aXRsZScgKSB7XG5cdFx0XHRwcmV2aW91cy5wdXNoKCB0eXBlICk7XG5cdFx0fVxuXHRcdHJldHVybiBwcmV2aW91cztcblx0fSwgW10gKTtcbn1cblxudmFyIHR5cGVzID0gW107XG5pZiAoIHNldHRpbmdzICYmIHNldHRpbmdzLnR5cGVzICkge1xuXHQvLyBBcnJhbmdlIHRoZSBjb250cm9scyBzbyB0aGF0IGJvZHktdGV4dCBpcyBmaXJzdFxuXHR0eXBlcyA9IHNldHRpbmdzLnR5cGVzLnNvcnQoIGNvbXBhcmVUeXBlcyApO1xuXHQvLyBSZW1vdmUgZGVwcmVjYXRlZCBzaXRlLXRpdGxlIGNvbnRyb2wgZnJvbSBVSVxuXHR0eXBlcyA9IHJlbW92ZVNpdGVUaXRsZSggdHlwZXMgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0eXBlcztcbiIsIi8qIGdsb2JhbHMgQmFja2JvbmUgKi9cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmU7XG4iLCJ2YXIgc2V0dGluZ3MgPSB3aW5kb3cuX0pldHBhY2tGb250cztcblxubW9kdWxlLmV4cG9ydHMgPSBzZXR0aW5ncztcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRfID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdW5kZXJzY29yZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBfLmV4dGVuZCggQmFja2JvbmUuRXZlbnRzICk7XG5cbiIsInZhciBzdHlsZU9wdGlvbnMgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuXHQ/IHdpbmRvdy5fSmV0cGFja0ZvbnRzLmZ2ZE1hcFxuXHQ6IHtcblx0XHQnbjEnOiAnVGhpbicsXG5cdFx0J2kxJzogJ1RoaW4gSXRhbGljJyxcblx0XHQnbzEnOiAnVGhpbiBPYmxpcXVlJyxcblx0XHQnbjInOiAnRXh0cmEgTGlnaHQnLFxuXHRcdCdpMic6ICdFeHRyYSBMaWdodCBJdGFsaWMnLFxuXHRcdCdvMic6ICdFeHRyYSBMaWdodCBPYmxpcXVlJyxcblx0XHQnbjMnOiAnTGlnaHQnLFxuXHRcdCdpMyc6ICdMaWdodCBJdGFsaWMnLFxuXHRcdCdvMyc6ICdMaWdodCBPYmxpcXVlJyxcblx0XHQnbjQnOiAnUmVndWxhcicsXG5cdFx0J2k0JzogJ0l0YWxpYycsXG5cdFx0J280JzogJ09ibGlxdWUnLFxuXHRcdCduNSc6ICdNZWRpdW0nLFxuXHRcdCdpNSc6ICdNZWRpdW0gSXRhbGljJyxcblx0XHQnbzUnOiAnTWVkaXVtIE9ibGlxdWUnLFxuXHRcdCduNic6ICdTZW1pYm9sZCcsXG5cdFx0J2k2JzogJ1NlbWlib2xkIEl0YWxpYycsXG5cdFx0J282JzogJ1NlbWlib2xkIE9ibGlxdWUnLFxuXHRcdCduNyc6ICdCb2xkJyxcblx0XHQnaTcnOiAnQm9sZCBJdGFsaWMnLFxuXHRcdCdvNyc6ICdCb2xkIE9ibGlxdWUnLFxuXHRcdCduOCc6ICdFeHRyYSBCb2xkJyxcblx0XHQnaTgnOiAnRXh0cmEgQm9sZCBJdGFsaWMnLFxuXHRcdCdvOCc6ICdFeHRyYSBCb2xkIE9ibGlxdWUnLFxuXHRcdCduOSc6ICdVbHRyYSBCb2xkJyxcblx0XHQnaTknOiAnVWx0cmEgQm9sZCBJdGFsaWMnLFxuXHRcdCdvOSc6ICdVbHRyYSBCb2xkIE9ibGlxdWUnXG5cdH07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRGb250VmFyaWFudE5hbWVGcm9tSWQ6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgbWF0Y2ggPSBzdHlsZU9wdGlvbnNbIGlkIF07XG5cdFx0aWYgKCBtYXRjaCApIHtcblx0XHRcdHJldHVybiBtYXRjaDtcblx0XHR9XG5cdFx0cmV0dXJuICdSZWd1bGFyJztcblx0fVxufTtcbiIsIi8qKlxuICogVGhpcyBoZWxwZXIgc2V0cyB1cCBWaWV3cyB0byByZW5kZXIgZWFjaCBmb250IGZvciBzcGVjaWZpYyBwcm92aWRlcnMuIEVhY2hcbiAqIFZpZXcgc2hvdWxkIGJlIGFuIGluc3RhbmNlIG9mIGB3cC5jdXN0b21pemUuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlld2AgKHdoaWNoXG4gKiBpcyBhIGBCYWNrYm9uZS5WaWV3YCkgdGhhdCB3aWxsIHJlbmRlciBpdHMgZm9udCBvcHRpb24gdG8gdGhlIGZvbnQgbGlzdC5cbiAqIEFkZGl0aW9uYWwgcHJvdmlkZXIgVmlld3MgY2FuIGJlIGFkZGVkIGJ5IGFkZGluZyB0byB0aGVcbiAqIGB3cC5jdXN0b21pemUuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3NgIG9iamVjdCB1c2luZyB0aGUgcHJvdmlkZXIgaWQgYXMgdGhlXG4gKiBrZXkuIFRoZSBvbmx5IHRoaW5nIHRoYXQgbmVlZHMgdG8gYmUgYWRkZWQgZm9yIGVhY2ggUHJvdmlkZXJWaWV3IGlzIHRoZVxuICogYHJlbmRlcmAgbWV0aG9kLiBFYWNoIFByb3ZpZGVyVmlldyBoYXMgYXMgaXRzIGBtb2RlbGAgb2JqZWN0IHRoZSBmb250IG9iamVjdFxuICogaXQgbmVlZHMgdG8gZGlzcGxheSwgaW5jbHVkaW5nIHRoZSBgY3NzTmFtZWAsIGBkaXNwbGF5TmFtZWAsIGFuZCBgaWRgIGF0dHJpYnV0ZXMuXG4gKlxuICogQWRkaXRpb25hbGx5LCBpZiB5b3VyIHByb3ZpZGVyIG5lZWRzIHNwZWNpZmljIGxvZ2ljIGZvciBob3ZlciBzdGF0ZXMgKHRoaW5rXG4gKiBiYWNrZ3JvdW5kIGltYWdlIHN3YXBwaW5nKSwgeW91IGNhbiBpbXBsZW1lbnQgYG1vdXNlZW50ZXJgIGFuZCBgbW91c2VsZWF2ZWAgbWV0aG9kcy5cbiAqL1xuXG52YXIgYXBpID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXBpJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6cHJvdmlkZXItdmlld3MnICk7XG5cbnZhciBEcm9wZG93bkl0ZW0gPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24taXRlbScgKTtcbmlmICggISBhcGkuSmV0cGFja0ZvbnRzICkge1xuXHRhcGkuSmV0cGFja0ZvbnRzID0ge307XG59XG5pZiAoICEgYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkge1xuXHRhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgPSB7fTtcbn1cbmFwaS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3ID0gRHJvcGRvd25JdGVtLmV4dGVuZCgge1xuXHRtb3VzZWVudGVyOiBmdW5jdGlvbigpIHt9LFxuXHRtb3VzZWxlYXZlOiBmdW5jdGlvbigpIHt9XG59ICk7XG5cbnZhciBwcm92aWRlclZpZXdzID0ge307XG5cbmZ1bmN0aW9uIGltcG9ydFByb3ZpZGVyVmlld3MoKSB7XG5cdGRlYnVnKCAnaW1wb3J0aW5nIHByb3ZpZGVyIHZpZXdzIGZyb20nLCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKTtcblx0aWYgKCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKSB7XG5cdFx0T2JqZWN0LmtleXMoIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApLmZvckVhY2goIGZ1bmN0aW9uKCBwcm92aWRlcktleSApIHtcblx0XHRcdHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyS2V5IF0gPSBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3NbIHByb3ZpZGVyS2V5IF07XG5cdFx0fSApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFZpZXdGb3JQcm92aWRlciggcHJvdmlkZXIgKSB7XG5cdGltcG9ydFByb3ZpZGVyVmlld3MoKTtcblx0aWYgKCBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdICkge1xuXHRcdGRlYnVnKCAnZm91bmQgdmlldyBmb3IgcHJvdmlkZXInLCBwcm92aWRlciApO1xuXHRcdHJldHVybiBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdO1xuXHR9XG5cdGRlYnVnKCAnbm8gdmlldyBmb3VuZCBmb3IgcHJvdmlkZXInLCBwcm92aWRlciApO1xuXHRyZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdldFZpZXdGb3JQcm92aWRlcjogZ2V0Vmlld0ZvclByb3ZpZGVyXG59O1xuIiwidmFyIHRyYW5zbGF0aW9ucyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG5cdD8gd2luZG93Ll9KZXRwYWNrRm9udHMuaTE4blxuXHQ6IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBzdHJpbmcgKSB7XG5cdGlmICggdHJhbnNsYXRpb25zWyBzdHJpbmcgXSApIHtcblx0XHRyZXR1cm4gdHJhbnNsYXRpb25zWyBzdHJpbmcgXTtcblx0fVxuXHRyZXR1cm4gc3RyaW5nO1xufTtcbiIsIi8qIGdsb2JhbHMgXyAqL1xubW9kdWxlLmV4cG9ydHMgPSBfO1xuIiwiLyogZ2xvYmFscyBXZWJGb250ICovXG5tb2R1bGUuZXhwb3J0cyA9IFdlYkZvbnQ7XG4iLCJ2YXIgYXBpID0gcmVxdWlyZSggJy4vaGVscGVycy9hcGknICk7XG5cbnZhciBNYXN0ZXIgPSByZXF1aXJlKCAnLi92aWV3cy9tYXN0ZXInICk7XG5cbnZhciBTZWxlY3RlZEZvbnRzID0gcmVxdWlyZSggJy4vbW9kZWxzL3NlbGVjdGVkLWZvbnRzJyApO1xuXG4vLyBDdXN0b21pemVyIENvbnRyb2xcbmFwaS5jb250cm9sQ29uc3RydWN0b3IuamV0cGFja0ZvbnRzID0gYXBpLkNvbnRyb2wuZXh0ZW5kKCB7XG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHQvLyBHZXQgdGhlIGV4aXN0aW5nIHNldHRpbmcgZnJvbSB0aGUgQ3VzdG9taXplclxuXHRcdHRoaXMuc2VsZWN0ZWRGb250cyA9IG5ldyBTZWxlY3RlZEZvbnRzKCB0aGlzLnNldHRpbmcoKSApO1xuXG5cdFx0Ly8gVXBkYXRlIHRoZSBzZXR0aW5nIHdoZW4gdGhlIGN1cnJlbnQgZm9udCBjaGFuZ2VzXG5cdFx0dGhpcy5zZWxlY3RlZEZvbnRzLm9uKCAnY2hhbmdlJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnNldHRpbmcoIHRoaXMuc2VsZWN0ZWRGb250cy50b0pTT04oKSApO1xuXHRcdH0uYmluZCggdGhpcyApICk7XG5cblx0XHR0aGlzLnZpZXcgPSBuZXcgTWFzdGVyKCB7XG5cdFx0XHRzZWxlY3RlZEZvbnRzOiB0aGlzLnNlbGVjdGVkRm9udHMsXG5cdFx0XHRlbDogdGhpcy5jb250YWluZXJcblx0XHR9ICkucmVuZGVyKCk7XG5cblx0XHQvLyBEZWxheSBsb2FkaW5nIGZvbnRzIHVudGlsIHRoZSBTZWN0aW9uIGlzIG9wZW5lZFxuXHRcdGFwaS5zZWN0aW9uKCB0aGlzLnNlY3Rpb24oKSApLmNvbnRhaW5lclxuXHRcdC5vbmUoICdleHBhbmRlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2V0VGltZW91dCggdGhpcy52aWV3LmxvYWRGb250cywgMjAwICk7XG5cdFx0fS5iaW5kKCB0aGlzICkgKTtcblxuXHRcdGFwaS5zZWN0aW9uKCB0aGlzLnNlY3Rpb24oKSApLmNvbnRhaW5lclxuXHRcdC5vbiggJ2NvbGxhcHNlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy52aWV3LmNsb3NlQWxsTWVudXMoKTtcblx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXHR9XG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOm1lbnUtdmlldycgKSxcblx0RW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbmZ1bmN0aW9uIG1heWJlT3Blbk1lbnUoIGtleSApIHtcblx0aWYgKCBrZXkudHlwZSAmJiBrZXkudHlwZS5pZCAmJiBrZXkubWVudSApIHtcblx0XHRrZXkgPSBrZXkudHlwZS5pZCArICc6JyArIGtleS5tZW51O1xuXHR9XG5cdGlmICgga2V5ICE9PSB0aGlzLm1lbnVLZXkgKSB7XG5cdFx0cmV0dXJuIHRoaXMuY2xvc2VNZW51KCk7XG5cdH1cblx0dGhpcy5vcGVuTWVudSgpO1xufVxuXG5mdW5jdGlvbiBvcGVuTWVudSgpIHtcblx0ZGVidWcoICdvcGVuaW5nIG1lbnUnLCB0aGlzLm1lbnVLZXkgKTtcblx0dGhpcy5tZW51U3RhdHVzLnNldCggeyBpc09wZW46IHRydWUgfSApO1xufVxuXG5mdW5jdGlvbiBjbG9zZU1lbnUoKSB7XG5cdGRlYnVnKCAnY2xvc2luZyBtZW51JywgdGhpcy5tZW51S2V5ICk7XG5cdHRoaXMubWVudVN0YXR1cy5zZXQoIHsgaXNPcGVuOiBmYWxzZSB9ICk7XG59XG5cbnZhciBtZW51Vmlld01peGluID0gZnVuY3Rpb24oIHZpZXcgKSB7XG5cdGlmICggISB2aWV3Lmxpc3RlblRvICkge1xuXHRcdHRocm93ICdtZW51Vmlld01peGluIHJlcXVpcmVzIGEgQmFja2JvbmUgVmlldyB3aXRoIHRoZSBgbGlzdGVuVG9gIG1ldGhvZCc7XG5cdH1cblx0aWYgKCAhIHZpZXcubWVudUtleSApIHtcblx0XHR0aHJvdyAnbWVudVZpZXdNaXhpbiByZXF1aXJlcyBhIFZpZXcgd2l0aCBhIGBtZW51S2V5YCBzdHJpbmcgcHJvcGVydHkgdG8gaWRlbnRpZnkgdGhlIG1lbnUnO1xuXHR9XG5cdGlmICggISB2aWV3Lm1lbnVTdGF0dXMgKSB7XG5cdFx0dmlldy5tZW51U3RhdHVzID0gbmV3IEJhY2tib25lLk1vZGVsKCB7IGlzT3BlbjogZmFsc2UgfSApO1xuXHR9XG5cblx0dmlldy5tYXliZU9wZW5NZW51ID0gbWF5YmVPcGVuTWVudTtcblx0dmlldy5vcGVuTWVudSA9IG9wZW5NZW51O1xuXHR2aWV3LmNsb3NlTWVudSA9IGNsb3NlTWVudTtcblxuXHR2aWV3Lmxpc3RlblRvKCBFbWl0dGVyLCAnb3Blbi1tZW51Jywgdmlldy5tYXliZU9wZW5NZW51ICk7XG5cdHZpZXcubGlzdGVuVG8oIEVtaXR0ZXIsICdjbG9zZS1vcGVuLW1lbnVzJywgdmlldy5jbG9zZU1lbnUgKTtcblxuXHRkZWJ1ZyggJ2FkZGVkIG1lbnUgY2FwYWJpbGl0eSB0byB0aGUgVmlldycsIHZpZXcubWVudUtleSApO1xuXG5cdHJldHVybiB2aWV3Lm1lbnVTdGF0dXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lbnVWaWV3TWl4aW47XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0XyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICksXG5cdHRyYW5zbGF0ZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3RyYW5zbGF0ZScgKTtcblxudmFyIHNpemVPcHRpb25zID0gW1xuXHR7IGlkOiAtMTAsIG5hbWU6IHRyYW5zbGF0ZSggJ1RpbnknICkgfSxcblx0eyBpZDogLTUsICBuYW1lOiB0cmFuc2xhdGUoICdTbWFsbCcgKSB9LFxuXHR7IGlkOiAwLCAgIG5hbWU6IHRyYW5zbGF0ZSggJ05vcm1hbCcgKSB9LFxuXHR7IGlkOiA1LCAgIG5hbWU6IHRyYW5zbGF0ZSggJ0xhcmdlJyApIH0sXG5cdHsgaWQ6IDEwLCAgbmFtZTogdHJhbnNsYXRlKCAnSHVnZScgKSB9XG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCgge1xuXHRnZXRGb250VmFyaWFudE9wdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5nZXQoICdmdmRzJyApICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0KCAnZnZkcycgKTtcblx0XHR9XG5cdFx0cmV0dXJuIFtdO1xuXHR9LFxuXG5cdGdldEZvbnRTaXplT3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNpemVPcHRpb25zO1xuXHR9LFxuXG5cdGdldEZvbnRTaXplTmFtZUZyb21JZDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHZhciBvcHRpb24gPSBfLmZpbmRXaGVyZSggc2l6ZU9wdGlvbnMsIHsgaWQ6IGlkIH0gKTtcblx0XHRpZiAoIG9wdGlvbiApIHtcblx0XHRcdHJldHVybiBvcHRpb24ubmFtZTtcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59ICk7XG4iLCJ2YXIgU2VsZWN0ZWRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9zZWxlY3RlZC1mb250JyApLFxuXHR0cmFuc2xhdGUgPSByZXF1aXJlKCAnLi4vaGVscGVycy90cmFuc2xhdGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0ZWRGb250LmV4dGVuZCgge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNldCggeyBpZDogJycsIGRpc3BsYXlOYW1lOiB0cmFuc2xhdGUoICdEZWZhdWx0IFRoZW1lIEZvbnQnICksIHByb3ZpZGVyOiAnJyB9ICk7XG5cdH1cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHR0cmFuc2xhdGUgPSByZXF1aXJlKCAnLi4vaGVscGVycy90cmFuc2xhdGUnICksXG5cdGF2YWlsYWJsZVR5cGVzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXZhaWxhYmxlLXR5cGVzJyApLFxuXHRfID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdW5kZXJzY29yZScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrX2ZvbnRzOnNlbGVjdGVkLWZvbnQnICk7XG5cbi8vIEEgTW9kZWwgZm9yIGEgY3VycmVudGx5IHNldCBmb250IHNldHRpbmcgZm9yIHRoaXMgdGhlbWVcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKCB7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMubWF5YmVTZXRDdXJyZW50RnZkKCk7XG5cdH0sXG5cdGRlZmF1bHRzOiB7XG5cdFx0J2Rpc3BsYXlOYW1lJzogdHJhbnNsYXRlKCAnRGVmYXVsdCBUaGVtZSBGb250JyApXG5cdH0sXG5cdHNldDogZnVuY3Rpb24oKSB7XG5cdFx0QmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnNldC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdFx0dGhpcy5tYXliZVNldEN1cnJlbnRGdmQoKTtcblx0fSxcblx0bWF5YmVTZXRDdXJyZW50RnZkOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdHlwZTtcblx0XHRpZiAoIHRoaXMuZ2V0KCAnY3VycmVudEZ2ZCcgKSApIHtcblx0XHRcdGRlYnVnKCAnRm9udCBhbHJlYWR5IGhhcyBhbiBmdmQnLCB0aGlzLmdldCggJ2N1cnJlbnRGdmQnICkgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKCAhIHRoaXMuZ2V0KCAnaWQnICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHR5cGUgPSBfLmZpbmRXaGVyZSggYXZhaWxhYmxlVHlwZXMsIHsgaWQ6IHRoaXMuZ2V0KCAndHlwZScgKSB9ICk7XG5cdFx0aWYgKCAhIHR5cGUgfHwgISB0eXBlLmZ2ZEFkanVzdCB8fCAhIHRoaXMuZ2V0KCAnZnZkcycgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5zZXQoICdjdXJyZW50RnZkJywgdGhpcy5waWNrRnZkKCkgKTtcblx0XHRkZWJ1ZyggJ0Z2ZCBub3cgc2V0IHRvOiAnLCB0aGlzLmdldCggJ2N1cnJlbnRGdmQnICkgKTtcblx0fSxcblx0cGlja0Z2ZDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gYWxnb3JpdGhtIGhlcmU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0NTUy9mb250LXdlaWdodCNGYWxsYmFja1xuXHRcdC8vIHdlIGFsd2F5cyBnbyBmb3IgNDAwIHdlaWdodCBmaXJzdC5cblx0XHR2YXIgdmFyaWF0aW9ucyA9IHRoaXMuZ2V0KCAnZnZkcycgKTtcblx0XHQvLyBmaXJzdCB0cnkgbjRcblx0XHR2YXIgaSA9IDQ7XG5cdFx0aWYgKCB0aGlzLmhhc1ZhcmlhdGlvbiggJ24nICsgaSwgdmFyaWF0aW9ucyApICkge1xuXHRcdFx0cmV0dXJuICduJyArIGk7XG5cdFx0fVxuXHRcdC8vIG5leHQgd2UgdHJ5IG41XG5cdFx0aSA9IDU7XG5cdFx0aWYgKCB0aGlzLmhhc1ZhcmlhdGlvbiggJ24nICsgaSwgdmFyaWF0aW9ucyApICkge1xuXHRcdFx0cmV0dXJuICduJyArIGk7XG5cdFx0fVxuXHRcdC8vIG5vdyB3ZSBnbyBsaWdodGVyLCB0byAzLTFcblx0XHRmb3IgKCBpID0gMzsgaSA+PSAxOyBpLS0gKSB7XG5cdFx0XHRpZiAoIHRoaXMuaGFzVmFyaWF0aW9uKCAnbicgKyBpLCB2YXJpYXRpb25zICkgKSB7XG5cdFx0XHRcdHJldHVybiAnbicgKyBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBub3cgZGFya2VyLCA2LTlcblx0XHRmb3IgKCBpID0gNjsgaSA8PSA5OyBpKysgKSB7XG5cdFx0XHRpZiAoIHRoaXMuaGFzVmFyaWF0aW9uKCAnbicgKyBpLCB2YXJpYXRpb25zICkgKSB7XG5cdFx0XHRcdHJldHVybiAnbicgKyBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBJIGd1ZXNzIGp1c3QgcmV0dXJuIG40IGFueXdheVxuXHRcdHJldHVybiAnbjQnO1xuXHR9LFxuXHRoYXNWYXJpYXRpb246IGZ1bmN0aW9uKCBmdmQsIGZ2ZHMgKSB7XG5cdFx0cmV0dXJuIF8uY29udGFpbnMoIGZ2ZHMsIGZ2ZCApO1xuXHR9XG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOnNlbGVjdGVkLWZvbnRzJyApLFxuXHR0cmFuc2xhdGUgPSByZXF1aXJlKCAnLi4vaGVscGVycy90cmFuc2xhdGUnICk7XG5cbnZhciBTZWxlY3RlZEZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL3NlbGVjdGVkLWZvbnQnICk7XG5cbi8vIEEgQ29sbGVjdGlvbiBvZiB0aGUgY3VycmVudCBmb250IHNldHRpbmdzIGZvciB0aGlzIHRoZW1lXG4vLyBXZSB1c2UgYSBNb2RlbCBpbnN0ZWFkIG9mIGFuIGFjdHVhbCBDb2xsZWN0aW9uIGJlY2F1c2Ugd2UgY2FuJ3Qgb3RoZXJ3aXNlXG4vLyBob2xkIHR3byBjb3BpZXMgb2YgdGhlIHNhbWUgZm9udCAoc2FtZSBpZCkuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCgge1xuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGlmICggISBkYXRhICkge1xuXHRcdFx0ZGF0YSA9IFtdO1xuXHRcdH1cblx0XHR2YXIgZm9udHMgPSBkYXRhLm1hcCggZnVuY3Rpb24oIGZvbnQgKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFNlbGVjdGVkRm9udCggZm9udCApO1xuXHRcdH0gKTtcblx0XHR0aGlzLnNldCggJ2ZvbnRzJywgZm9udHMgKTtcblx0fSxcblxuXHRnZXRGb250QnlUeXBlOiBmdW5jdGlvbiggdHlwZSApIHtcblx0XHR2YXIgbW9kZWwgPSB0aGlzLmdldCggJ2ZvbnRzJyApLnJlZHVjZSggZnVuY3Rpb24oIHByZXZpb3VzLCBtb2QgKSB7XG5cdFx0XHRpZiAoIG1vZC5nZXQoICd0eXBlJyApID09PSB0eXBlICkge1xuXHRcdFx0XHRyZXR1cm4gbW9kO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHByZXZpb3VzO1xuXHRcdH0sIG51bGwgKTtcblx0XHRpZiAoICEgbW9kZWwgKSB7XG5cdFx0XHRtb2RlbCA9IG5ldyBTZWxlY3RlZEZvbnQoIHsgdHlwZTogdHlwZSwgZGlzcGxheU5hbWU6IHRyYW5zbGF0ZSggJ0RlZmF1bHQgVGhlbWUgRm9udCcgKSB9ICk7XG5cdFx0XHR0aGlzLmdldCggJ2ZvbnRzJyApLnB1c2goIG1vZGVsICk7XG5cdFx0fVxuXHRcdHJldHVybiBtb2RlbDtcblx0fSxcblxuXHRzaXplOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXQoICdmb250cycgKS5sZW5ndGg7XG5cdH0sXG5cblx0c2V0U2VsZWN0ZWRGb250OiBmdW5jdGlvbiggZm9udCApIHtcblx0XHRkZWJ1ZyggJ3NldHRpbmcgc2VsZWN0ZWQgZm9udCB0bycsIGZvbnQgKTtcblx0XHRpZiAoICEgZm9udC50eXBlICkge1xuXHRcdFx0ZGVidWcoICdDYW5ub3Qgc2V0IHNlbGVjdGVkIGZvbnQgYmVjYXVzZSBpdCBoYXMgbm8gdHlwZScsIGZvbnQgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5nZXRGb250QnlUeXBlKCBmb250LnR5cGUgKTtcblx0XHRtb2RlbC5jbGVhciggeyBzaWxlbnQ6IHRydWUgfSApO1xuXHRcdGlmICggbW9kZWwgKSB7XG5cdFx0XHRtb2RlbC5zZXQoIGZvbnQgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5nZXQoICdmb250cycgKS5wdXNoKCBuZXcgU2VsZWN0ZWRGb250KCBmb250ICkgKTtcblx0XHR9XG5cdFx0dGhpcy50cmlnZ2VyKCAnY2hhbmdlJyApO1xuXHR9LFxuXG5cdHRvSlNPTjogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gc2tpcCBhbnkgZm9udHMgc2V0IHRvIHRoZSBkZWZhdWx0XG5cdFx0cmV0dXJuIHRoaXMuZ2V0KCAnZm9udHMnICkucmVkdWNlKCBmdW5jdGlvbiggcHJldmlvdXMsIG1vZGVsICkge1xuXHRcdFx0aWYgKCBtb2RlbC5nZXQoICdpZCcgKSApIHtcblx0XHRcdFx0cHJldmlvdXMucHVzaCggbW9kZWwudG9KU09OKCkgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwcmV2aW91cztcblx0XHR9LCBbXSApO1xuXHR9XG59ICk7XG5cbiIsInZhciBhcGkgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hcGknICksXG5cdGJvb3RzdHJhcCA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Jvb3RzdHJhcCcgKTtcblxudmFyIFdlYkZvbnQgPSByZXF1aXJlKCAnLi4vaGVscGVycy93ZWJmb250JyApO1xuXG52YXIgbG9hZGVkRm9udElkcyA9IFtdO1xuXG5mdW5jdGlvbiBhZGRGb250VG9Db250cm9scyggZm9udCwgdGV4dCApIHtcblx0aWYgKCB+IGxvYWRlZEZvbnRJZHMuaW5kZXhPZiggZm9udC5pZCApICkge1xuXHRcdHJldHVybjtcblx0fVxuXHRsb2FkZWRGb250SWRzLnB1c2goIGZvbnQuaWQgKTtcblx0V2ViRm9udC5sb2FkKHtcblx0XHRnb29nbGU6IHsgZmFtaWxpZXM6IFsgZm9udC5pZCBdLCB0ZXh0OiB0ZXh0IH0sXG5cdFx0Y2xhc3NlczogZmFsc2UsXG5cdFx0ZXZlbnRzOiBmYWxzZVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gYWRkRm9udFRvUHJldmlldyggZm9udCApIHtcblx0aWYgKCB+IGxvYWRlZEZvbnRJZHMuaW5kZXhPZiggZm9udC5pZCApICkge1xuXHRcdHJldHVybjtcblx0fVxuXHRsb2FkZWRGb250SWRzLnB1c2goIGZvbnQuaWQgKTtcblx0dmFyIGZhbWlseVN0cmluZyA9IGZvbnQuaWQgKyAnOjEwMCwyMDAsMzAwLDQwMCw1MDAsNjAwLDcwMCw4MDAsOTAwLDEwMGl0YWxpYywyMDBpdGFsaWMsMzAwaXRhbGljLDQwMGl0YWxpYyw1MDBpdGFsaWMsNjAwaXRhbGljLDcwMGl0YWxpYyw4MDBpdGFsaWMsOTAwaXRhbGljJztcblx0aWYgKCBib290c3RyYXAucHJvdmlkZXJEYXRhICYmIGJvb3RzdHJhcC5wcm92aWRlckRhdGEuZ29vZ2xlU3Vic2V0U3RyaW5nICkge1xuXHRcdHZhciBzdWJzZXRTdHJpbmcgPSBib290c3RyYXAucHJvdmlkZXJEYXRhLmdvb2dsZVN1YnNldFN0cmluZztcblx0XHRpZiAoIHN1YnNldFN0cmluZyAmJiBzdWJzZXRTdHJpbmcubGVuZ3RoID4gMCApIHtcblx0XHRcdGZhbWlseVN0cmluZyArPSAnOicgKyBzdWJzZXRTdHJpbmc7XG5cdFx0fVxuXHR9XG5cdFdlYkZvbnQubG9hZCggeyBnb29nbGU6IHsgZmFtaWxpZXM6IFsgZmFtaWx5U3RyaW5nIF0gfSB9ICk7XG59XG5cbnZhciBHb29nbGVQcm92aWRlclZpZXcgPSBhcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlldy5leHRlbmQoIHtcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubW9kZWwuZ2V0KCAnZGlzcGxheU5hbWUnICkgKTtcblxuXHRcdHRoaXMuJGVsLmNzcyggJ2ZvbnQtZmFtaWx5JywgJ1wiJyArIHRoaXMubW9kZWwuZ2V0KCAnY3NzTmFtZScgKSArICdcIicgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgJiYgdGhpcy5jdXJyZW50Rm9udC5nZXQoICdpZCcgKSA9PT0gdGhpcy5tb2RlbC5nZXQoICdpZCcgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9XG5cdFx0aWYgKCF0aGlzLmRpc2FibGVGb2N1cyApIHtcblx0XHRcdHRoaXMuJGVsLmF0dHIoJ3RhYmluZGV4JywgJzAnKTtcblx0XHR9XG5cdFx0YWRkRm9udFRvQ29udHJvbHMoIHRoaXMubW9kZWwudG9KU09OKCksIHRoaXMubW9kZWwuZ2V0KCAnaWQnICkgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSApO1xuXG5Hb29nbGVQcm92aWRlclZpZXcuYWRkRm9udFRvUHJldmlldyA9IGFkZEZvbnRUb1ByZXZpZXc7XG5cbmFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cy5nb29nbGUgPSBHb29nbGVQcm92aWRlclZpZXc7XG5cbm1vZHVsZS5leHBvcnRzID0gR29vZ2xlUHJvdmlkZXJWaWV3O1xuIiwidmFyIERyb3Bkb3duQ3VycmVudFRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLWN1cnJlbnQtdGVtcGxhdGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udC1zaXplIGZvbnQtcHJvcGVydHktY29udHJvbC1jdXJyZW50JyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFNpemUgPSBvcHRzLmN1cnJlbnRGb250U2l6ZTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMuY3VycmVudEZvbnRTaXplICk7XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgRHJvcGRvd25DdXJyZW50VGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZScgKTtcblxudmFyIGdldEZvbnRWYXJpYW50TmFtZUZyb21JZCA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Z2ZC10by1yZWFkYWJsZScgKS5nZXRGb250VmFyaWFudE5hbWVGcm9tSWQ7XG5cbnZhciBDdXJyZW50Rm9udFZhcmlhbnQgPSBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LXZhcmlhbnQgZm9udC1wcm9wZXJ0eS1jb250cm9sLWN1cnJlbnQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLmN1cnJlbnRGb250VmFyaWFudCA9IG9wdHMuY3VycmVudEZvbnRWYXJpYW50O1xuXHRcdHRoaXMubXVsdGlPcHRpb25zID0gb3B0cy5tdWx0aU9wdGlvbnM7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCBnZXRGb250VmFyaWFudE5hbWVGcm9tSWQoIHRoaXMuY3VycmVudEZvbnRWYXJpYW50ICkgKTtcblx0XHRpZiAoIHRoaXMubXVsdGlPcHRpb25zID09PSBmYWxzZSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnaW5hY3RpdmUnICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnaW5hY3RpdmUnICk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLmF0dHIoICd0YWJpbmRleCcsICcwJyk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEN1cnJlbnRGb250VmFyaWFudDtcbiIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6Q3VycmVudEZvbnRWaWV3JyApO1xuXG52YXIgZ2V0Vmlld0ZvclByb3ZpZGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJvdmlkZXItdmlld3MnICkuZ2V0Vmlld0ZvclByb3ZpZGVyLFxuXHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG52YXIgQ3VycmVudEZvbnRWaWV3ID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udCcsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J21vdXNlZW50ZXInOiAnZGlzcGF0Y2hIb3ZlcicsXG5cdFx0J21vdXNlbGVhdmUnOiAnZGlzcGF0Y2hIb3ZlcicsXG5cdFx0J2NsaWNrJzogJ3RvZ2dsZURyb3Bkb3duJyxcblx0XHQna2V5ZG93bic6ICdjaGVja0tleWJvYXJkVG9nZ2xlJyxcblx0fSxcblxuXHRkaXNwYXRjaEhvdmVyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cblx0XHRpZiAoICEgKCBldmVudC50eXBlID09PSAnbW91c2VlbnRlcicgfHwgZXZlbnQudHlwZSA9PT0gJ21vdXNlbGVhdmUnICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMucHJvdmlkZXJWaWV3ICYmIHRoaXMucHJvdmlkZXJWaWV3WyBldmVudC50eXBlIF0oIGV2ZW50ICk7XG5cdH0sXG5cblx0Y2hlY2tLZXlib2FyZFRvZ2dsZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0dGhpcy50b2dnbGVEcm9wZG93bigpO1xuXHRcdH1cblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5hY3RpdmUgPSBvcHRzLmFjdGl2ZTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1lbnVTdGF0dXMsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmFjdGl2ZSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLm1lbnVTdGF0dXMuZ2V0KCAnaXNPcGVuJyApICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtLW9wZW4nICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LS1vcGVuJyApO1xuXHRcdH1cblx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBjdXJyZW50Rm9udDonLCB0aGlzLmN1cnJlbnRGb250LnRvSlNPTigpICk7XG5cdFx0aWYgKCAhIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udC0tZGVmYXVsdCcgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtLWRlZmF1bHQnICk7XG5cdFx0fVxuXHRcdGlmICggdGhpcy5wcm92aWRlclZpZXcgKSB7XG5cdFx0XHR0aGlzLnByb3ZpZGVyVmlldy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwudGV4dCggJycgKTtcblx0XHR0aGlzLiRlbC5hdHRyKCAndGFiaW5kZXgnLCAnMCcpO1xuXHRcdHZhciBQcm92aWRlclZpZXcgPSBnZXRWaWV3Rm9yUHJvdmlkZXIoIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAncHJvdmlkZXInICkgKTtcblx0XHRpZiAoICEgUHJvdmlkZXJWaWV3ICkge1xuXHRcdFx0ZGVidWcoICdyZW5kZXJpbmcgY3VycmVudEZvbnQgd2l0aCBubyBwcm92aWRlclZpZXcgZm9yJywgdGhpcy5jdXJyZW50Rm9udC50b0pTT04oKSApO1xuXHRcdFx0aWYgKCAhIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnZGlzcGxheU5hbWUnICkgKSB7XG5cdFx0XHRcdGRlYnVnKCAnZXJyb3IgcmVuZGVyaW5nIGN1cnJlbnRGb250IGJlY2F1c2UgaXQgaGFzIG5vIGRpc3BsYXlOYW1lIScsIHRoaXMuY3VycmVudEZvbnQudG9KU09OKCkgKTtcblx0XHRcdFx0dGhpcy4kZWwuaHRtbCggJ1Vua25vd24nICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLmN1cnJlbnRGb250LmdldCggJ2Rpc3BsYXlOYW1lJyApICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZGVidWcoICdyZW5kZXJpbmcgY3VycmVudEZvbnQgcHJvdmlkZXJWaWV3IGZvcicsIHRoaXMuY3VycmVudEZvbnQudG9KU09OKCkgKTtcblx0XHR0aGlzLnByb3ZpZGVyVmlldyA9IG5ldyBQcm92aWRlclZpZXcoIHtcblx0XHRcdG1vZGVsOiB0aGlzLmN1cnJlbnRGb250LFxuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0ZGlzYWJsZUZvY3VzOiB0cnVlXG5cdFx0fSApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggdGhpcy5wcm92aWRlclZpZXcucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ3VycmVudEZvbnRWaWV3O1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxudmFyIERlZmF1bHRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9kZWZhdWx0LWZvbnQnICk7XG5cbi8vICd4JyBidXR0b24gdGhhdCByZXNldHMgZm9udCB0byBkZWZhdWx0XG52YXIgRGVmYXVsdEZvbnRCdXR0b24gPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19kZWZhdWx0LWJ1dHRvbicsXG5cdHRhZ05hbWU6ICdzcGFuJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAncmVzZXRUb0RlZmF1bHQnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdGlmICggISB0aGlzLnR5cGUgKSB7XG5cdFx0XHR0aHJvdyAnRXJyb3I6IGNhbm5vdCBjcmVhdGUgRGVmYXVsdEZvbnRCdXR0b24gd2l0aG91dCBhIHR5cGUnO1xuXHRcdH1cblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBvcHRzLm1lbnVTdGF0dXM7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tZW51U3RhdHVzLCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250LmlkICYmICEgdGhpcy5tZW51U3RhdHVzLmdldCggJ2lzT3BlbicgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlLWJ1dHRvbicgKTtcblx0XHRcdHRoaXMuJGVsLnNob3coKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUtYnV0dG9uJyApO1xuXHRcdFx0dGhpcy4kZWwuaGlkZSgpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRyZXNldFRvRGVmYXVsdDogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2hhbmdlLWZvbnQnLCB7IGZvbnQ6IG5ldyBEZWZhdWx0Rm9udCgpLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVmYXVsdEZvbnRCdXR0b247XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOkRyb3Bkb3duQ3VycmVudFRlbXBsYXRlJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICd0b2dnbGVEcm9wZG93bicsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tLZXlib2FyZFRvZ2dsZScsXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMubWVudSA9IG9wdHMubWVudTtcblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBvcHRzLm1lbnVTdGF0dXM7XG5cdFx0dGhpcy5hY3RpdmUgPSB0cnVlO1xuXHR9LFxuXG5cdHRvZ2dsZURyb3Bkb3duOiBmdW5jdGlvbiggZSApIHtcblx0XHRpZiAoIGUgKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH1cblx0XHRpZiAoICEgdGhpcy5hY3RpdmUgKSB7XG5cdFx0XHRkZWJ1ZyggJ21lbnUgaXMgaW5hY3RpdmU7IGlnbm9yaW5nIGNsaWNrJywgdGhpcy5tZW51LCB0aGlzLnR5cGUgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLm1lbnVTdGF0dXMuZ2V0KCAnaXNPcGVuJyApICkge1xuXHRcdFx0ZGVidWcoICdtZW51IGlzIG9wZW47IGNsb3NpbmcgbWVudXMnLCB0aGlzLm1lbnUsIHRoaXMudHlwZSApO1xuXHRcdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVidWcoICdtZW51IGlzIGNsb3NlZDsgb3BlbmluZyBtZW51JywgdGhpcy5tZW51LCB0aGlzLnR5cGUgKTtcblx0XHRcdEVtaXR0ZXIudHJpZ2dlciggJ29wZW4tbWVudScsIHsgdHlwZTogdGhpcy50eXBlLCBtZW51OiB0aGlzLm1lbnUgfSApO1xuXHRcdH1cblx0fSxcblxuXHRjaGVja0tleWJvYXJkVG9nZ2xlOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC5rZXkgPT09ICdFbnRlcicgKSB7XG5cdFx0XHR0aGlzLiRlbC5jbGljaygpO1xuXHRcdH1cblx0fSxcbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbi8vIEFuIGluZGl2aWR1YWwgZm9udCBpbiB0aGUgZHJvcGRvd24gbGlzdCwgZXhwb3J0ZWQgYXNcbi8vIGBhcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlld2AuIEV4dGVuZCB0aGlzIG9iamVjdCBmb3IgZWFjaCBwcm92aWRlci4gVGhlXG4vLyBleHRlbmRlZCBvYmplY3RzIG5lZWQgdG8gZGVmaW5lIGEgYHJlbmRlcmAgbWV0aG9kIHRvIHJlbmRlciB0aGVpciBwcm92aWRlcidzXG4vLyBmb250IG5hbWUsIGFzIHdlbGwgYXMgYGFkZEZvbnRUb0NvbnRyb2xzYCBhbmQgYGFkZEZvbnRUb1ByZXZpZXdgIG1ldGhvZHMgb24gdGhlIG9iamVjdCBpdHNlbGYuXG52YXIgUHJvdmlkZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fb3B0aW9uJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnZm9udENoYW5nZWQnLFxuXHRcdCdrZXlkb3duJzogJ2NoZWNrS2V5Ym9hcmRTZWxlY3QnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMuZGlzYWJsZUZvY3VzID0gQm9vbGVhbihvcHRzLmRpc2FibGVGb2N1cyk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250ICkge1xuXHRcdFx0dGhpcy5saXN0ZW5Ubyh0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIpO1xuXHRcdH1cblx0fSxcblxuXHRjaGVja0tleWJvYXJkU2VsZWN0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC5rZXkgPT09ICdFbnRlcicgKSB7XG5cdFx0XHR0aGlzLiRlbC5jbGljaygpO1xuXHRcdH1cblx0fSxcblxuXHQvLyBXYXJuaW5nOiB0aGlzIHNob3VsZCBiZSBvdmVycmlkZW4gaW4gdGhlIHByb3ZpZGVyXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5tb2RlbC5nZXQoICdkaXNwbGF5TmFtZScgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGZvbnRDaGFuZ2VkOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgJiYgdGhpcy5jdXJyZW50Rm9udCAhPT0gdGhpcy5tb2RlbCApIHtcblx0XHRcdEVtaXR0ZXIudHJpZ2dlciggJ2NoYW5nZS1mb250JywgeyBmb250OiB0aGlzLm1vZGVsLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHRcdH1cblx0fVxufSApO1xuXG5Qcm92aWRlclZpZXcuYWRkRm9udFRvQ29udHJvbHMgPSBmdW5jdGlvbigpIHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyVmlldztcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRHJvcGRvd25UZW1wbGF0ZSA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLm1lbnUgPSBvcHRzLm1lbnU7XG5cdFx0dGhpcy5tZW51U3RhdHVzID0gb3B0cy5tZW51U3RhdHVzO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubWVudVN0YXR1cywgJ2NoYW5nZScsIHRoaXMudXBkYXRlU3RhdHVzICk7XG5cdH0sXG5cblx0dXBkYXRlU3RhdHVzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMubWVudVN0YXR1cy5nZXQoICdpc09wZW4nICkgKSB7XG5cdFx0XHR0aGlzLm9wZW4oKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdH1cblx0fSxcblxuXHRvcGVuOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ29wZW4nICk7XG5cdFx0dGhpcy5pc09wZW4gPSB0cnVlO1xuXHR9LFxuXG5cdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ29wZW4nICk7XG5cdFx0dGhpcy5pc09wZW4gPSBmYWxzZTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duVGVtcGxhdGU7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0bWVudVZpZXdNaXhpbiA9IHJlcXVpcmUoICcuLi9taXhpbnMvbWVudS12aWV3LW1peGluJyApO1xuXG52YXIgRm9udERyb3Bkb3duID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtZHJvcGRvd24nICksXG5cdEN1cnJlbnRGb250VmlldyA9IHJlcXVpcmUoICcuLi92aWV3cy9jdXJyZW50LWZvbnQnICksXG5cdERlZmF1bHRGb250QnV0dG9uID0gcmVxdWlyZSggJy4uL3ZpZXdzL2RlZmF1bHQtZm9udC1idXR0b24nICk7XG5cbi8vIENvbnRhaW5lciBmb3IgdGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGZvbnRzIGFuZCAneCcgYnV0dG9uXG52YXIgRm9udENvbnRyb2xWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fbWVudS1jb250YWluZXInLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLm1lbnUgPSAnZm9udEZhbWlseSc7XG5cdFx0dGhpcy5tZW51S2V5ID0gdGhpcy50eXBlLmlkICsgJzonICsgdGhpcy5tZW51O1xuXHRcdHRoaXMubWVudVN0YXR1cyA9IG1lbnVWaWV3TWl4aW4oIHRoaXMgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjdXJyZW50Rm9udFZpZXcgPSBuZXcgQ3VycmVudEZvbnRWaWV3KCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRtZW51U3RhdHVzOiB0aGlzLm1lbnVTdGF0dXMsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbCxcblx0XHRcdGFjdGl2ZTogKCB0aGlzLmZvbnREYXRhLmxlbmd0aCA+IDAgKVxuXHRcdH0gKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIGN1cnJlbnRGb250Vmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnREcm9wZG93bigge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWwsXG5cdFx0XHRjdXJyZW50Rm9udFZpZXc6IGN1cnJlbnRGb250Vmlldyxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRGVmYXVsdEZvbnRCdXR0b24oIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250Q29udHJvbFZpZXc7XG4iLCJ2YXIgZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOkZvbnREcm9wZG93bicgKSxcblx0RW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBnZXRWaWV3Rm9yUHJvdmlkZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9wcm92aWRlci12aWV3cycgKS5nZXRWaWV3Rm9yUHJvdmlkZXIsXG5cdERyb3Bkb3duVGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tdGVtcGxhdGUnICksXG5cdCQgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKS4kO1xuXG4vLyBEcm9wZG93biBvZiBhdmFpbGFibGUgZm9udHNcbnZhciBGb250RHJvcGRvd24gPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19tZW51Jyxcblx0aWQ6ICdmb250LXNlbGVjdCcsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J21vdXNlZW50ZXIgPiAuamV0cGFjay1mb250c19fb3B0aW9uJzogJ2Rpc3BhdGNoSG92ZXInLFxuXHRcdCdtb3VzZWxlYXZlID4gLmpldHBhY2stZm9udHNfX29wdGlvbic6ICdkaXNwYXRjaEhvdmVyJyxcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmF2YWlsYWJsZUZvbnRzID0gW107XG5cdFx0dGhpcy5zdWJWaWV3cyA9IHt9O1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMuY3VycmVudEZvbnRWaWV3ID0gb3B0cy5jdXJyZW50Rm9udFZpZXc7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ2xvYWQtbWVudS1mb250cycsIHRoaXMubG9hZEZvbnRzICk7XG5cdH0sXG5cblx0bG9hZEZvbnRzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuYXZhaWxhYmxlRm9udHMubGVuZ3RoID4gMCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5hdmFpbGFibGVGb250cyA9IHRoaXMuZm9udERhdGE7XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0fSxcblxuXHRkaXNwYXRjaEhvdmVyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGVsO1xuXHRcdGlmICggISAoIGV2ZW50LnR5cGUgPT09ICdtb3VzZWVudGVyJyB8fCBldmVudC50eXBlID09PSAnbW91c2VsZWF2ZScgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZWwgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuXHRcdGlmICggZWwuY2lkICYmIHRoaXMuc3ViVmlld3NbIGVsLmNpZCBdICkge1xuXHRcdFx0dGhpcy5zdWJWaWV3c1sgZWwuY2lkIF1bIGV2ZW50LnR5cGUgXSggZXZlbnQgKTtcblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRPYmplY3Qua2V5cyggdGhpcy5zdWJWaWV3cyApLmZvckVhY2goIGZ1bmN0aW9uKCBjaWQgKSB7XG5cdFx0XHR0aGlzLnN1YlZpZXdzWyBjaWQgXS5yZW1vdmUoKTtcblx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXHRcdGRlYnVnKCAncmVuZGVyaW5nJywgdGhpcy5hdmFpbGFibGVGb250cy5sZW5ndGgsICdhdmFpbGFibGVGb250cyBmb3InLCB0aGlzLnR5cGUgKTtcblx0XHR0aGlzLmF2YWlsYWJsZUZvbnRzLmZvckVhY2goIGZ1bmN0aW9uKCBmb250ICkge1xuXHRcdFx0dmFyIFByb3ZpZGVyVmlldyA9IGdldFZpZXdGb3JQcm92aWRlciggZm9udC5nZXQoICdwcm92aWRlcicgKSApO1xuXHRcdFx0aWYgKCAhIFByb3ZpZGVyVmlldyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0ZGVidWcoICdyZW5kZXJpbmcgcHJvdmlkZXJWaWV3IGluJywgdGhpcy50eXBlLCAnZm9udCBsaXN0IGZvcicsIGZvbnQudG9KU09OKCkgKTtcblx0XHRcdHZhciB2aWV3ID0gbmV3IFByb3ZpZGVyVmlldygge1xuXHRcdFx0XHRtb2RlbDogZm9udCxcblx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRjdXJyZW50Rm9udDogdGhpcy5jdXJyZW50Rm9udFxuXHRcdFx0fSApLnJlbmRlcigpO1xuXG5cdFx0XHR2aWV3LmVsLmNpZCA9IHZpZXcuY2lkO1xuXHRcdFx0dGhpcy5zdWJWaWV3c1sgdmlldy5jaWQgXSA9IHZpZXc7XG5cdFx0XHR0aGlzLiRlbC5hcHBlbmQoIHZpZXcuZWwgKTtcblx0XHR9LCB0aGlzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0b3BlbjogZnVuY3Rpb24oKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUub3Blbi5jYWxsKCB0aGlzICk7XG5cdFx0dGhpcy5hZGp1c3RQb3NpdGlvbigpO1xuXHR9LFxuXG5cdGFkanVzdFBvc2l0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb2Zmc2V0ID0gdGhpcy5jdXJyZW50Rm9udFZpZXcuJGVsLm9mZnNldCgpO1xuXHRcdHZhciBteUhlaWdodCA9IHRoaXMuY3VycmVudEZvbnRWaWV3LiRlbC5oZWlnaHQoKTtcblx0XHR2YXIgYXZhaWxhYmxlSGVpZ2h0ID0gJCggJy53cC1mdWxsLW92ZXJsYXktc2lkZWJhci1jb250ZW50JyApLmhlaWdodCgpO1xuXHRcdHZhciBtaWRkbGUgPSBhdmFpbGFibGVIZWlnaHQgLyAyO1xuXG5cdFx0ZGVidWcoICdhZGp1c3RpbmcgcG9zaXRpb24gb2YgbWVudTsgb2Zmc2V0LnRvcCcsIG9mZnNldC50b3AsICdtaWRkbGUnLCBtaWRkbGUsICdjYWxjJywgb2Zmc2V0LnRvcCAtICggbXlIZWlnaHQgLyAyICkgKTtcblx0XHRpZiAoIG9mZnNldC50b3AgLSAoIG15SGVpZ2h0IC8gMiApID49IG1pZGRsZSApIHtcblx0XHRcdGRlYnVnKCAnbWVudTogY2xvc2VyIHRvIGJvdHRvbScgKTtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnb3Blbi1kb3duJyApLmNzcygge1xuXHRcdFx0XHRoZWlnaHQ6IG9mZnNldC50b3AgLSBteUhlaWdodCAtIDEwXG5cdFx0XHR9ICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlYnVnKCAnbWVudTogY2xvc2VyIHRvIHRvcCcgKTtcblx0XHRcdGRlYnVnKCAnb2Zmc2V0LnRvcCcsIG9mZnNldC50b3AsICdhdmFpbGFibGVIZWlnaHQnLCBhdmFpbGFibGVIZWlnaHQsICdteUhlaWdodCcsIG15SGVpZ2h0ICk7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ29wZW4tZG93bicgKS5jc3MoIHtcblx0XHRcdFx0aGVpZ2h0OiBhdmFpbGFibGVIZWlnaHQgLSBvZmZzZXQudG9wIC0gMTBcblx0XHRcdH0gKTtcblx0XHR9XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250RHJvcGRvd247XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0bWVudVZpZXdNaXhpbiA9IHJlcXVpcmUoICcuLi9taXhpbnMvbWVudS12aWV3LW1peGluJyApO1xuXG52YXIgRm9udFNpemVEcm9wZG93biA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtZHJvcGRvd24nICksXG5DdXJyZW50Rm9udFNpemUgPSByZXF1aXJlKCAnLi4vdmlld3MvY3VycmVudC1mb250LXNpemUnICksXG50cmFuc2xhdGUgPSByZXF1aXJlKCAnLi4vaGVscGVycy90cmFuc2xhdGUnICk7XG5cbnZhciBGb250U2l6ZUNvbnRyb2wgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtY29udHJvbCBmb250LXByb3BlcnR5LWNvbnRyb2wnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMubWVudSA9ICdmb250U2l6ZSc7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdHRoaXMubWVudUtleSA9IHRoaXMudHlwZS5pZCArICc6JyArIHRoaXMubWVudTtcblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBtZW51Vmlld01peGluKCB0aGlzICk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRBdmFpbGFibGVGb250OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5mb250RGF0YS5maW5kV2hlcmUoIHsgaWQ6IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgfSApO1xuXHRcdGlmICggIXNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0fSxcblxuXHRnZXRDdXJyZW50Rm9udFNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpO1xuXHRcdGlmICggc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0dmFyIHNpemUgPSB0aGlzLmN1cnJlbnRGb250LmdldCggJ3NpemUnICk7XG5cdFx0XHRpZiAoIHNpemUgJiYgc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRTaXplTmFtZUZyb21JZCggc2l6ZSApICkge1xuXHRcdFx0XHRyZXR1cm4gc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRTaXplTmFtZUZyb21JZCggc2l6ZSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRyYW5zbGF0ZSggJ05vcm1hbCBTaXplJyApO1xuXHRcdH1cblx0fSxcblxuXHRpc0RlZmF1bHRGb250OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKCAhICggdGhpcy5jdXJyZW50Rm9udC5oYXMoICdpZCcgKSAmJiB0aGlzLmN1cnJlbnRGb250LmdldCggJ2lkJyApLmxlbmd0aCA+IDAgKSApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJycgKTtcblx0XHRpZiAoIHRoaXMuaXNEZWZhdWx0Rm9udCgpICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19mb250LXByb3BlcnR5LWNvbnRyb2wtLWluYWN0aXZlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2pldHBhY2stZm9udHNfX2ZvbnQtcHJvcGVydHktY29udHJvbC0taW5hY3RpdmUnICk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEN1cnJlbnRGb250U2l6ZSgge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmdldEN1cnJlbnRGb250U2l6ZSgpXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFNpemVEcm9wZG93bigge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0c2VsZWN0ZWRBdmFpbGFibGVGb250OiB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpLFxuXHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmdldEN1cnJlbnRGb250U2l6ZSgpXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbnRTaXplQ29udHJvbDtcbiIsInZhciBGb250U2l6ZU9wdGlvbiA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtb3B0aW9uJyApLFxuRHJvcGRvd25UZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZScgKTtcblxudmFyIEZvbnRTaXplRHJvcGRvd24gPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtZHJvcGRvd24gZm9udC1wcm9wZXJ0eS1jb250cm9sLWRyb3Bkb3duJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IG9wdHMuc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gb3B0cy5jdXJyZW50Rm9udFNpemU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdGlmICggdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHR2YXIgc2l6ZU9wdGlvbnMgPSB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250U2l6ZU9wdGlvbnMoKTtcblx0XHRcdHNpemVPcHRpb25zLmZvckVhY2goIGZ1bmN0aW9uKCBvcHRpb24gKSB7XG5cdFx0XHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRTaXplT3B0aW9uKCB7XG5cdFx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRcdGlkOiBvcHRpb24uaWQsXG5cdFx0XHRcdFx0bmFtZTogb3B0aW9uLm5hbWUsXG5cdFx0XHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmN1cnJlbnRGb250U2l6ZVxuXHRcdFx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHRcdH0uYmluZCggdGhpcyApICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250U2l6ZURyb3Bkb3duO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtb3B0aW9uIGpldHBhY2stZm9udHNfX2ZvbnQtcHJvcGVydHktb3B0aW9uJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnc2V0U2l6ZU9wdGlvbicsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tLZXlib2FyZFNlbGVjdCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5pZCA9IG9wdHMuaWQ7XG5cdFx0dGhpcy5uYW1lID0gb3B0cy5uYW1lO1xuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gb3B0cy5jdXJyZW50Rm9udFNpemU7XG5cdH0sXG5cblx0Y2hlY2tLZXlib2FyZFNlbGVjdDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0dGhpcy4kZWwuY2xpY2soKTtcblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm5hbWUgKTtcblx0XHR0aGlzLiRlbC5hdHRyKCAnZGF0YS1uYW1lJywgdGhpcy5uYW1lICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250U2l6ZSA9PT0gdGhpcy5uYW1lICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdjdXJyZW50JyApO1xuXHRcdH1cblx0XHR0aGlzLiRlbC5hdHRyKCAndGFiaW5kZXgnLCAnMCcgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRzZXRTaXplT3B0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdzZXQtc2l6ZScsIHsgc2l6ZTogdGhpcy5pZCwgdHlwZTogdGhpcy50eXBlLmlkIH0gKTtcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOkZvbnRUeXBlVmlldycgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG52YXIgRm9udENvbnRyb2xWaWV3ID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtY29udHJvbCcgKSxcblx0Rm9udFZhcmlhbnRDb250cm9sID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdmFyaWFudC1jb250cm9sJyApLFxuXHRGb250U2l6ZUNvbnRyb2wgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1zaXplLWNvbnRyb2wnICk7XG5cbi8vIEEgZm9udCBjb250cm9sIFZpZXcgZm9yIGEgcGFydGljdWxhciBzZXR0aW5nIHR5cGVcbnZhciBGb250VHlwZVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX190eXBlJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnY2xvc2VNZW51cydcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hcHBlbmQoICc8ZGl2IGNsYXNzPVwiamV0cGFjay1mb250c19fdHlwZVwiIGRhdGEtZm9udC10eXBlPVwiJyArIHRoaXMudHlwZS5pZCArICdcIj48aDMgY2xhc3M9XCJqZXRwYWNrLWZvbnRzX190eXBlLWhlYWRlclwiPicgKyB0aGlzLnR5cGUubmFtZSArICc8L2gzPjwvZGl2PicgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250Q29udHJvbFZpZXcoIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1vZGVsOiB0aGlzLmN1cnJlbnRGb250LFxuXHRcdFx0Zm9udERhdGE6IHRoaXMuZm9udERhdGFcblx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHR2YXIgc3ViTWVudXNDb250YWluZXIgPSBCYWNrYm9uZS4kKCAnPGRpdiBjbGFzcz1cImpldHBhY2stZm9udHNfX3R5cGUtb3B0aW9uc1wiPjwvZGl2PicgKTtcblx0XHRzdWJNZW51c0NvbnRhaW5lci5hcHBlbmQoIG5ldyBGb250VmFyaWFudENvbnRyb2woIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLmN1cnJlbnRGb250LFxuXHRcdFx0Zm9udERhdGE6IHRoaXMuZm9udERhdGFcblx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHRzdWJNZW51c0NvbnRhaW5lci5hcHBlbmQoIG5ldyBGb250U2l6ZUNvbnRyb2woIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLmN1cnJlbnRGb250LFxuXHRcdFx0Zm9udERhdGE6IHRoaXMuZm9udERhdGFcblx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIHN1Yk1lbnVzQ29udGFpbmVyICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Y2xvc2VNZW51czogZnVuY3Rpb24oKSB7XG5cdFx0ZGVidWcoICd0eXBlIGNsaWNrZWQ7IGNsb3NpbmcgbWVudXMnLCB0aGlzLnR5cGUgKTtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9udFR5cGVWaWV3O1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdG1lbnVWaWV3TWl4aW4gPSByZXF1aXJlKCAnLi4vbWl4aW5zL21lbnUtdmlldy1taXhpbicgKTtcblxudmFyIEZvbnRWYXJpYW50RHJvcGRvd24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC12YXJpYW50LWRyb3Bkb3duJyApLFxuQ3VycmVudEZvbnRWYXJpYW50ID0gcmVxdWlyZSggJy4uL3ZpZXdzL2N1cnJlbnQtZm9udC12YXJpYW50JyApO1xuXG52YXIgRm9udFZhcmlhbnRDb250cm9sID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC12YXJpYW50LWNvbnRyb2wgZm9udC1wcm9wZXJ0eS1jb250cm9sJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLm1lbnUgPSAnZm9udFZhcmlhbnQnO1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0XHR0aGlzLm1lbnVLZXkgPSB0aGlzLnR5cGUuaWQgKyAnOicgKyB0aGlzLm1lbnU7XG5cdFx0dGhpcy5tZW51U3RhdHVzID0gbWVudVZpZXdNaXhpbiggdGhpcyApO1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkQXZhaWxhYmxlRm9udDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZm9udERhdGEuZmluZFdoZXJlKCB7IGlkOiB0aGlzLmN1cnJlbnRGb250LmdldCggJ2lkJyApIH0gKTtcblx0XHRpZiAoICFzZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQ7XG5cdH0sXG5cblx0Z2V0Q3VycmVudEZvbnRWYXJpYW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5nZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQoKTtcblx0XHRpZiAoIHNlbGVjdGVkQXZhaWxhYmxlRm9udCAmJiB0aGlzLnR5cGUuZnZkQWRqdXN0ICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnY3VycmVudEZ2ZCcgKTtcblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5nZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQoKTtcblx0XHR2YXIgbXVsdGlPcHRpb25zO1xuXHRcdGlmICggc2VsZWN0ZWRBdmFpbGFibGVGb250ICYmIHNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250VmFyaWFudE9wdGlvbnMoKS5sZW5ndGggPiAxICkge1xuXHRcdFx0bXVsdGlPcHRpb25zID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bXVsdGlPcHRpb25zID0gZmFsc2U7XG5cdFx0fVxuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udFZpZXcgKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRGb250Vmlldy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLmRyb3BEb3duVmlldyApIHtcblx0XHRcdHRoaXMuZHJvcERvd25WaWV3LnJlbW92ZSgpO1xuXHRcdH1cblx0XHRpZiAoIG11bHRpT3B0aW9ucyAmJiB0aGlzLnR5cGUuZnZkQWRqdXN0ICkge1xuXHRcdFx0dGhpcy5jdXJyZW50Rm9udFZpZXcgPSBuZXcgQ3VycmVudEZvbnRWYXJpYW50KCB7XG5cdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0XHRtZW51U3RhdHVzOiB0aGlzLm1lbnVTdGF0dXMsXG5cdFx0XHRcdGN1cnJlbnRGb250VmFyaWFudDogdGhpcy5nZXRDdXJyZW50Rm9udFZhcmlhbnQoKSxcblx0XHRcdFx0bXVsdGlPcHRpb25zOiBtdWx0aU9wdGlvbnNcblx0XHRcdH0gKTtcblx0XHRcdHRoaXMuJGVsLmFwcGVuZCggdGhpcy5jdXJyZW50Rm9udFZpZXcucmVuZGVyKCkuZWwgKTtcblx0XHRcdHRoaXMuZHJvcERvd25WaWV3ID0gbmV3IEZvbnRWYXJpYW50RHJvcGRvd24oIHtcblx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdFx0c2VsZWN0ZWRBdmFpbGFibGVGb250OiB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpLFxuXHRcdFx0XHRjdXJyZW50Rm9udFZhcmlhbnQ6IHRoaXMuZ2V0Q3VycmVudEZvbnRWYXJpYW50KClcblx0XHRcdH0gKTtcblx0XHRcdHRoaXMuJGVsLmFwcGVuZCggdGhpcy5kcm9wRG93blZpZXcucmVuZGVyKCkuZWwgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbnRWYXJpYW50Q29udHJvbDtcbiIsInZhciBGb250VmFyaWFudE9wdGlvbiA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXZhcmlhbnQtb3B0aW9uJyApLFxuRHJvcGRvd25UZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXZhcmlhbnQtZHJvcGRvd24gZm9udC1wcm9wZXJ0eS1jb250cm9sLWRyb3Bkb3duJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IG9wdHMuc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdGlmICggdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgJiYgdGhpcy50eXBlLmZ2ZEFkanVzdCApIHtcblx0XHRcdHZhciB2YXJpYW50T3B0aW9ucyA9IHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRWYXJpYW50T3B0aW9ucygpO1xuXHRcdFx0dmFyaWFudE9wdGlvbnMuZm9yRWFjaCggZnVuY3Rpb24oIGZ2ZCApIHtcblx0XHRcdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFZhcmlhbnRPcHRpb24oIHtcblx0XHRcdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRcdFx0aWQ6IGZ2ZCxcblx0XHRcdFx0XHRjdXJyZW50Rm9udFZhcmlhbnQ6IHRoaXMuY3VycmVudEZvbnRWYXJpYW50XG5cdFx0XHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdFx0fS5iaW5kKCB0aGlzICkgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxudmFyIGdldEZvbnRWYXJpYW50TmFtZUZyb21JZCA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Z2ZC10by1yZWFkYWJsZScgKS5nZXRGb250VmFyaWFudE5hbWVGcm9tSWQ7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC12YXJpYW50LW9wdGlvbiBqZXRwYWNrLWZvbnRzX19mb250LXByb3BlcnR5LW9wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ3NldFZhcmlhbnRPcHRpb24nLFxuXHRcdCdrZXlkb3duJzogJ2NoZWNrS2V5Ym9hcmRTZWxlY3QnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuaWQgPSBvcHRzLmlkO1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdH0sXG5cblx0Y2hlY2tLZXlib2FyZFNlbGVjdDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0dGhpcy4kZWwuY2xpY2soKTtcblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCBnZXRGb250VmFyaWFudE5hbWVGcm9tSWQoIHRoaXMuaWQgKSApO1xuXHRcdHRoaXMuJGVsLmRhdGEoICdpZCcsIHRoaXMuaWQgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID09PSB0aGlzLmlkICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdjdXJyZW50JyApO1xuXHRcdH1cblx0XHR0aGlzLiRlbC5hdHRyKCAndGFiaW5kZXgnLCAnMCcgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRzZXRWYXJpYW50T3B0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdzZXQtdmFyaWFudCcsIHsgdmFyaWFudDogdGhpcy5pZCwgdHlwZTogdGhpcy50eXBlLmlkIH0gKTtcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6TWFzdGVyVmlldycgKSxcblx0YXZhaWxhYmxlRm9udHMgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hdmFpbGFibGUtZm9udHMnICksXG5cdGF2YWlsYWJsZVR5cGVzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXZhaWxhYmxlLXR5cGVzJyApO1xuXG52YXIgRm9udFR5cGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC10eXBlJyApLFxuXHRBdmFpbGFibGVGb250cyA9IHJlcXVpcmUoICcuLi9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMnICk7XG5cbnZhciBEZWZhdWx0Rm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvZGVmYXVsdC1mb250JyApO1xuXG4vLyBJbml0aWFsaXplIHRoZSBkZWZhdWx0IFByb3ZpZGVyIFZpZXdzXG5yZXF1aXJlKCAnLi4vcHJvdmlkZXJzL2dvb2dsZScgKTtcblxuLy8gVGhlIG1haW4gZm9udCBjb250cm9sIFZpZXcsIGNvbnRhaW5pbmcgc2VjdGlvbnMgZm9yIGVhY2ggc2V0dGluZyB0eXBlXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMuc2VsZWN0ZWRGb250cyA9IG9wdHMuc2VsZWN0ZWRGb250cztcblx0XHRkZWJ1ZyggJ2luaXQgd2l0aCBjdXJyZW50bHkgc2VsZWN0ZWQgZm9udHM6JywgdGhpcy5zZWxlY3RlZEZvbnRzLnRvSlNPTigpICk7XG5cdFx0dGhpcy50eXBlVmlld3MgPSBbXTtcblx0XHR0aGlzLmhlYWRpbmdGb250cyA9IG5ldyBBdmFpbGFibGVGb250cyggYXZhaWxhYmxlRm9udHMgKTtcblx0XHR0aGlzLmJvZHlGb250cyA9IG5ldyBBdmFpbGFibGVGb250cyggdGhpcy5oZWFkaW5nRm9udHMud2hlcmUoIHsgYm9keVRleHQ6IHRydWUgfSApICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ2NoYW5nZS1mb250JywgdGhpcy51cGRhdGVDdXJyZW50Rm9udCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdzZXQtdmFyaWFudCcsIHRoaXMuc2V0Rm9udFZhcmlhbnQgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnc2V0LXNpemUnLCB0aGlzLnNldEZvbnRTaXplICk7XG5cdH0sXG5cblx0Y2xvc2VBbGxNZW51czogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHRzZXRGb250VmFyaWFudDogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0ZGVidWcoICdmb250IHZhcmlhbnQgY2hhbmdlZCcsIGRhdGEgKTtcblx0XHR2YXIgbW9kZWwgPSB0aGlzLnNlbGVjdGVkRm9udHMuZ2V0Rm9udEJ5VHlwZSggZGF0YS50eXBlICk7XG5cdFx0bW9kZWwuc2V0KCAnY3VycmVudEZ2ZCcsIGRhdGEudmFyaWFudCApO1xuXHRcdHRoaXMuc2VsZWN0ZWRGb250cy5zZXRTZWxlY3RlZEZvbnQoIG1vZGVsLnRvSlNPTigpICk7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHRzZXRGb250U2l6ZTogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0ZGVidWcoICdmb250IHNpemUgY2hhbmdlZCcsIGRhdGEgKTtcblx0XHR2YXIgbW9kZWwgPSB0aGlzLnNlbGVjdGVkRm9udHMuZ2V0Rm9udEJ5VHlwZSggZGF0YS50eXBlICk7XG5cdFx0bW9kZWwuc2V0KCAnc2l6ZScsIGRhdGEuc2l6ZSApO1xuXHRcdHRoaXMuc2VsZWN0ZWRGb250cy5zZXRTZWxlY3RlZEZvbnQoIG1vZGVsLnRvSlNPTigpICk7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHR1cGRhdGVDdXJyZW50Rm9udDogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0ZGF0YS5mb250LnNldCggeyB0eXBlOiBkYXRhLnR5cGUgfSApO1xuXHRcdHRoaXMuc2VsZWN0ZWRGb250cy5zZXRTZWxlY3RlZEZvbnQoIGRhdGEuZm9udC50b0pTT04oKSApO1xuXHRcdGRlYnVnKCAndXBkYXRlQ3VycmVudEZvbnQgd2l0aCcsIGRhdGEuZm9udC50b0pTT04oKSwgJ3RvJywgdGhpcy5zZWxlY3RlZEZvbnRzLmdldEZvbnRCeVR5cGUoIGRhdGEudHlwZSApLnRvSlNPTigpICk7XG5cdFx0Ly8gU2V0dGluZyBoZWFkaW5ncyB0eXBlIG92ZXJ3cml0ZXMgdGhlIGRlcHJlY2F0ZWQgc2l0ZS10aXRsZSB0eXBlXG5cdFx0aWYgKCBkYXRhLnR5cGUgPT09ICdoZWFkaW5ncycgKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZUN1cnJlbnRGb250KCB7IGZvbnQ6IG5ldyBEZWZhdWx0Rm9udCgpLCB0eXBlOiAnc2l0ZS10aXRsZScgfSApO1xuXHRcdH1cblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50eXBlVmlld3MuZm9yRWFjaCggZnVuY3Rpb24oIHZpZXcgKSB7XG5cdFx0XHR2aWV3LnJlbW92ZSgpO1xuXHRcdH0gKTtcblx0XHR0aGlzLiRlbC50ZXh0KCAnJyApOyAvLyBUT0RPOiBiZXR0ZXIgdG8gdXBkYXRlIGVhY2ggVmlldyB0aGFuIG92ZXJ3cml0ZVxuXHRcdGRlYnVnKCAncmVuZGVyaW5nIGNvbnRyb2xzIGZvciBmb250IHR5cGVzJywgYXZhaWxhYmxlVHlwZXMgKTtcblx0XHR0aGlzLnR5cGVWaWV3cyA9IGF2YWlsYWJsZVR5cGVzLm1hcCggdGhpcy5yZW5kZXJUeXBlQ29udHJvbC5iaW5kKCB0aGlzICkgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRyZW5kZXJUeXBlQ29udHJvbDogZnVuY3Rpb24oIHR5cGUgKSB7XG5cdFx0dmFyIGZvbnRzO1xuXHRcdGlmICggdHlwZS5ib2R5VGV4dCA9PT0gdHJ1ZSApIHtcblx0XHRcdGZvbnRzID0gdGhpcy5ib2R5Rm9udHM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvbnRzID0gdGhpcy5oZWFkaW5nRm9udHM7XG5cdFx0fVxuXHRcdHZhciB2aWV3ID0gbmV3IEZvbnRUeXBlKCB7XG5cdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuc2VsZWN0ZWRGb250cy5nZXRGb250QnlUeXBlKCB0eXBlLmlkICksXG5cdFx0XHRmb250RGF0YTogZm9udHNcblx0XHR9ICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCB2aWV3LnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHZpZXc7XG5cdH0sXG5cblx0bG9hZEZvbnRzOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdsb2FkLW1lbnUtZm9udHMnICk7XG5cdH1cblxufSApO1xuIl19
