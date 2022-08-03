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
		'keydown': 'checkOpen',
	},

	dispatchHover: function( event ) {

		if ( ! ( event.type === 'mouseenter' || event.type === 'mouseleave' ) ) {
			return;
		}
		this.providerView && this.providerView[ event.type ]( event );
	},

	checkOpen: function( event ) {
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
			this.$el.removeAttr( 'tabindex' );
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
		'keydown': 'checkOpen',
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

	checkOpen: function( event ) {
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
		'keydown': 'checkSelect'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.currentFont = opts.currentFont;
		this.disableFocus = Boolean(opts.disableFocus);
		if ( this.currentFont ) {
			this.listenTo(this.currentFont, 'change', this.render);
		}
	},

	checkSelect: function( event ) {
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
		'keydown': 'checkSelect'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.name = opts.name;
		this.currentFontSize = opts.currentFontSize;
	},

	checkSelect: function( event ) {
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
		'keydown': 'checkSelect'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.currentFontVariant = opts.currentFontVariant;
	},

	checkSelect: function( event ) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsInNyYy9qcy9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMuanMiLCJzcmMvanMvaGVscGVycy9hcGkuanMiLCJzcmMvanMvaGVscGVycy9hdmFpbGFibGUtZm9udHMuanMiLCJzcmMvanMvaGVscGVycy9hdmFpbGFibGUtdHlwZXMuanMiLCJzcmMvanMvaGVscGVycy9iYWNrYm9uZS5qcyIsInNyYy9qcy9oZWxwZXJzL2Jvb3RzdHJhcC5qcyIsInNyYy9qcy9oZWxwZXJzL2VtaXR0ZXIuanMiLCJzcmMvanMvaGVscGVycy9mdmQtdG8tcmVhZGFibGUuanMiLCJzcmMvanMvaGVscGVycy9wcm92aWRlci12aWV3cy5qcyIsInNyYy9qcy9oZWxwZXJzL3RyYW5zbGF0ZS5qcyIsInNyYy9qcy9oZWxwZXJzL3VuZGVyc2NvcmUuanMiLCJzcmMvanMvaGVscGVycy93ZWJmb250LmpzIiwic3JjL2pzL2luZGV4LmpzIiwic3JjL2pzL21peGlucy9tZW51LXZpZXctbWl4aW4uanMiLCJzcmMvanMvbW9kZWxzL2F2YWlsYWJsZS1mb250LmpzIiwic3JjL2pzL21vZGVscy9kZWZhdWx0LWZvbnQuanMiLCJzcmMvanMvbW9kZWxzL3NlbGVjdGVkLWZvbnQuanMiLCJzcmMvanMvbW9kZWxzL3NlbGVjdGVkLWZvbnRzLmpzIiwic3JjL2pzL3Byb3ZpZGVycy9nb29nbGUuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LXNpemUuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LmpzIiwic3JjL2pzL3ZpZXdzL2RlZmF1bHQtZm9udC1idXR0b24uanMiLCJzcmMvanMvdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZS5qcyIsInNyYy9qcy92aWV3cy9kcm9wZG93bi1pdGVtLmpzIiwic3JjL2pzL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtY29udHJvbC5qcyIsInNyYy9qcy92aWV3cy9mb250LWRyb3Bkb3duLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtc2l6ZS1jb250cm9sLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtc2l6ZS1kcm9wZG93bi5qcyIsInNyYy9qcy92aWV3cy9mb250LXNpemUtb3B0aW9uLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtdHlwZS5qcyIsInNyYy9qcy92aWV3cy9mb250LXZhcmlhbnQtY29udHJvbC5qcyIsInNyYy9qcy92aWV3cy9mb250LXZhcmlhbnQtZHJvcGRvd24uanMiLCJzcmMvanMvdmlld3MvZm9udC12YXJpYW50LW9wdGlvbi5qcyIsInNyYy9qcy92aWV3cy9tYXN0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxuICAnZm9yZXN0Z3JlZW4nLFxuICAnZ29sZGVucm9kJyxcbiAgJ2RvZGdlcmJsdWUnLFxuICAnZGFya29yY2hpZCcsXG4gICdjcmltc29uJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIGlzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG4gIHJldHVybiAoJ1dlYmtpdEFwcGVhcmFuY2UnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSkgfHxcbiAgICAvLyBpcyBmaXJlYnVnPyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zOTgxMjAvMzc2NzczXG4gICAgKHdpbmRvdy5jb25zb2xlICYmIChjb25zb2xlLmZpcmVidWcgfHwgKGNvbnNvbGUuZXhjZXB0aW9uICYmIGNvbnNvbGUudGFibGUpKSkgfHxcbiAgICAvLyBpcyBmaXJlZm94ID49IHYzMT9cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1Rvb2xzL1dlYl9Db25zb2xlI1N0eWxpbmdfbWVzc2FnZXNcbiAgICAobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9maXJlZm94XFwvKFxcZCspLykgJiYgcGFyc2VJbnQoUmVnRXhwLiQxLCAxMCkgPj0gMzEpO1xufVxuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMuaiA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHYpO1xufTtcblxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoKSB7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgdXNlQ29sb3JzID0gdGhpcy51c2VDb2xvcnM7XG5cbiAgYXJnc1swXSA9ICh1c2VDb2xvcnMgPyAnJWMnIDogJycpXG4gICAgKyB0aGlzLm5hbWVzcGFjZVxuICAgICsgKHVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKVxuICAgICsgYXJnc1swXVxuICAgICsgKHVzZUNvbG9ycyA/ICclYyAnIDogJyAnKVxuICAgICsgJysnICsgZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG4gIGlmICghdXNlQ29sb3JzKSByZXR1cm4gYXJncztcblxuICB2YXIgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XG4gIGFyZ3MgPSBbYXJnc1swXSwgYywgJ2NvbG9yOiBpbmhlcml0J10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MsIDEpKTtcblxuICAvLyB0aGUgZmluYWwgXCIlY1wiIGlzIHNvbWV3aGF0IHRyaWNreSwgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlclxuICAvLyBhcmd1bWVudHMgcGFzc2VkIGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhlICVjLCBzbyB3ZSBuZWVkIHRvXG4gIC8vIGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgaW5kZXggdG8gaW5zZXJ0IHRoZSBDU1MgaW50b1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgbGFzdEMgPSAwO1xuICBhcmdzWzBdLnJlcGxhY2UoLyVbYS16JV0vZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICBpZiAoJyUlJyA9PT0gbWF0Y2gpIHJldHVybjtcbiAgICBpbmRleCsrO1xuICAgIGlmICgnJWMnID09PSBtYXRjaCkge1xuICAgICAgLy8gd2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiB0aGUgKmxhc3QqICVjXG4gICAgICAvLyAodGhlIHVzZXIgbWF5IGhhdmUgcHJvdmlkZWQgdGhlaXIgb3duKVxuICAgICAgbGFzdEMgPSBpbmRleDtcbiAgICB9XG4gIH0pO1xuXG4gIGFyZ3Muc3BsaWNlKGxhc3RDLCAwLCBjKTtcbiAgcmV0dXJuIGFyZ3M7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gbG9nKCkge1xuICAvLyBUaGlzIGhhY2tlcnkgaXMgcmVxdWlyZWQgZm9yIElFOCxcbiAgLy8gd2hlcmUgdGhlIGBjb25zb2xlLmxvZ2AgZnVuY3Rpb24gZG9lc24ndCBoYXZlICdhcHBseSdcbiAgcmV0dXJuICdvYmplY3QnID09IHR5cGVvZiBjb25zb2xlXG4gICAgJiYgJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgY29uc29sZS5sb2dcbiAgICAmJiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbn1cblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG4gIHRyeSB7XG4gICAgaWYgKG51bGwgPT0gbmFtZXNwYWNlcykge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5kZWJ1ZyA9IG5hbWVzcGFjZXM7XG4gICAgfVxuICB9IGNhdGNoKGUpIHt9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9hZCgpIHtcbiAgdmFyIHI7XG4gIHRyeSB7XG4gICAgciA9IGxvY2FsU3RvcmFnZS5kZWJ1ZztcbiAgfSBjYXRjaChlKSB7fVxuICByZXR1cm4gcjtcbn1cblxuLyoqXG4gKiBFbmFibGUgbmFtZXNwYWNlcyBsaXN0ZWQgaW4gYGxvY2FsU3RvcmFnZS5kZWJ1Z2AgaW5pdGlhbGx5LlxuICovXG5cbmV4cG9ydHMuZW5hYmxlKGxvYWQoKSk7XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZGVidWc7XG5leHBvcnRzLmNvZXJjZSA9IGNvZXJjZTtcbmV4cG9ydHMuZGlzYWJsZSA9IGRpc2FibGU7XG5leHBvcnRzLmVuYWJsZSA9IGVuYWJsZTtcbmV4cG9ydHMuZW5hYmxlZCA9IGVuYWJsZWQ7XG5leHBvcnRzLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblxuLyoqXG4gKiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLCBhbmQgbmFtZXMgdG8gc2tpcC5cbiAqL1xuXG5leHBvcnRzLm5hbWVzID0gW107XG5leHBvcnRzLnNraXBzID0gW107XG5cbi8qKlxuICogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuICpcbiAqIFZhbGlkIGtleSBuYW1lcyBhcmUgYSBzaW5nbGUsIGxvd2VyY2FzZWQgbGV0dGVyLCBpLmUuIFwiblwiLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycyA9IHt9O1xuXG4vKipcbiAqIFByZXZpb3VzbHkgYXNzaWduZWQgY29sb3IuXG4gKi9cblxudmFyIHByZXZDb2xvciA9IDA7XG5cbi8qKlxuICogUHJldmlvdXMgbG9nIHRpbWVzdGFtcC5cbiAqL1xuXG52YXIgcHJldlRpbWU7XG5cbi8qKlxuICogU2VsZWN0IGEgY29sb3IuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VsZWN0Q29sb3IoKSB7XG4gIHJldHVybiBleHBvcnRzLmNvbG9yc1twcmV2Q29sb3IrKyAlIGV4cG9ydHMuY29sb3JzLmxlbmd0aF07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlYnVnKG5hbWVzcGFjZSkge1xuXG4gIC8vIGRlZmluZSB0aGUgYGRpc2FibGVkYCB2ZXJzaW9uXG4gIGZ1bmN0aW9uIGRpc2FibGVkKCkge1xuICB9XG4gIGRpc2FibGVkLmVuYWJsZWQgPSBmYWxzZTtcblxuICAvLyBkZWZpbmUgdGhlIGBlbmFibGVkYCB2ZXJzaW9uXG4gIGZ1bmN0aW9uIGVuYWJsZWQoKSB7XG5cbiAgICB2YXIgc2VsZiA9IGVuYWJsZWQ7XG5cbiAgICAvLyBzZXQgYGRpZmZgIHRpbWVzdGFtcFxuICAgIHZhciBjdXJyID0gK25ldyBEYXRlKCk7XG4gICAgdmFyIG1zID0gY3VyciAtIChwcmV2VGltZSB8fCBjdXJyKTtcbiAgICBzZWxmLmRpZmYgPSBtcztcbiAgICBzZWxmLnByZXYgPSBwcmV2VGltZTtcbiAgICBzZWxmLmN1cnIgPSBjdXJyO1xuICAgIHByZXZUaW1lID0gY3VycjtcblxuICAgIC8vIGFkZCB0aGUgYGNvbG9yYCBpZiBub3Qgc2V0XG4gICAgaWYgKG51bGwgPT0gc2VsZi51c2VDb2xvcnMpIHNlbGYudXNlQ29sb3JzID0gZXhwb3J0cy51c2VDb2xvcnMoKTtcbiAgICBpZiAobnVsbCA9PSBzZWxmLmNvbG9yICYmIHNlbGYudXNlQ29sb3JzKSBzZWxmLmNvbG9yID0gc2VsZWN0Q29sb3IoKTtcblxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblxuICAgIGFyZ3NbMF0gPSBleHBvcnRzLmNvZXJjZShhcmdzWzBdKTtcblxuICAgIGlmICgnc3RyaW5nJyAhPT0gdHlwZW9mIGFyZ3NbMF0pIHtcbiAgICAgIC8vIGFueXRoaW5nIGVsc2UgbGV0J3MgaW5zcGVjdCB3aXRoICVvXG4gICAgICBhcmdzID0gWyclbyddLmNvbmNhdChhcmdzKTtcbiAgICB9XG5cbiAgICAvLyBhcHBseSBhbnkgYGZvcm1hdHRlcnNgIHRyYW5zZm9ybWF0aW9uc1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgYXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16JV0pL2csIGZ1bmN0aW9uKG1hdGNoLCBmb3JtYXQpIHtcbiAgICAgIC8vIGlmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcbiAgICAgIGlmIChtYXRjaCA9PT0gJyUlJykgcmV0dXJuIG1hdGNoO1xuICAgICAgaW5kZXgrKztcbiAgICAgIHZhciBmb3JtYXR0ZXIgPSBleHBvcnRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcbiAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm9ybWF0dGVyKSB7XG4gICAgICAgIHZhciB2YWwgPSBhcmdzW2luZGV4XTtcbiAgICAgICAgbWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xuXG4gICAgICAgIC8vIG5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcbiAgICAgICAgYXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpbmRleC0tO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuXG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBleHBvcnRzLmZvcm1hdEFyZ3MpIHtcbiAgICAgIGFyZ3MgPSBleHBvcnRzLmZvcm1hdEFyZ3MuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgfVxuICAgIHZhciBsb2dGbiA9IGVuYWJsZWQubG9nIHx8IGV4cG9ydHMubG9nIHx8IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gICAgbG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gIH1cbiAgZW5hYmxlZC5lbmFibGVkID0gdHJ1ZTtcblxuICB2YXIgZm4gPSBleHBvcnRzLmVuYWJsZWQobmFtZXNwYWNlKSA/IGVuYWJsZWQgOiBkaXNhYmxlZDtcblxuICBmbi5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG5cbiAgcmV0dXJuIGZuO1xufVxuXG4vKipcbiAqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcbiAgZXhwb3J0cy5zYXZlKG5hbWVzcGFjZXMpO1xuXG4gIHZhciBzcGxpdCA9IChuYW1lc3BhY2VzIHx8ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoIXNwbGl0W2ldKSBjb250aW51ZTsgLy8gaWdub3JlIGVtcHR5IHN0cmluZ3NcbiAgICBuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcbiAgICBpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG4gICAgICBleHBvcnRzLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkaXNhYmxlKCkge1xuICBleHBvcnRzLmVuYWJsZSgnJyk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cbiIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkodmFsKVxuICApO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKFxuICAgIHN0clxuICApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgfVxuICBpZiAobXMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIH1cbiAgaWYgKG1zID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JykgfHxcbiAgICBwbHVyYWwobXMsIGgsICdob3VyJykgfHxcbiAgICBwbHVyYWwobXMsIG0sICdtaW51dGUnKSB8fFxuICAgIHBsdXJhbChtcywgcywgJ3NlY29uZCcpIHx8XG4gICAgbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAobXMgPCBuICogMS41KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJztcbn1cbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgQXZhaWxhYmxlRm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvYXZhaWxhYmxlLWZvbnQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoIHtcblx0bW9kZWw6IEF2YWlsYWJsZUZvbnRcbn0gKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gd2luZG93LndwLmN1c3RvbWl6ZTtcbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Jvb3RzdHJhcCcgKTtcblxudmFyIGZvbnRzID0gW107XG5pZiAoIHNldHRpbmdzICYmIHNldHRpbmdzLmZvbnRzICkge1xuXHRmb250cyA9IHNldHRpbmdzLmZvbnRzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZvbnRzO1xuXG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAnLi4vaGVscGVycy9ib290c3RyYXAnICk7XG5cbmZ1bmN0aW9uIGNvbXBhcmVUeXBlcyggYSwgYiApIHtcblx0aWYgKCBhLmlkID09PSAnaGVhZGluZ3MnICkge1xuXHRcdHJldHVybiAtMTtcblx0fVxuXHRpZiAoIGIuaWQgPT09ICdoZWFkaW5ncycgKSB7XG5cdFx0cmV0dXJuIDE7XG5cdH1cblx0cmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVNpdGVUaXRsZSggdHlwZXMgKSB7XG5cdHJldHVybiB0eXBlcy5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2aW91cywgdHlwZSApIHtcblx0XHRpZiAoIHR5cGUuaWQgIT09ICdzaXRlLXRpdGxlJyApIHtcblx0XHRcdHByZXZpb3VzLnB1c2goIHR5cGUgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHByZXZpb3VzO1xuXHR9LCBbXSApO1xufVxuXG52YXIgdHlwZXMgPSBbXTtcbmlmICggc2V0dGluZ3MgJiYgc2V0dGluZ3MudHlwZXMgKSB7XG5cdC8vIEFycmFuZ2UgdGhlIGNvbnRyb2xzIHNvIHRoYXQgYm9keS10ZXh0IGlzIGZpcnN0XG5cdHR5cGVzID0gc2V0dGluZ3MudHlwZXMuc29ydCggY29tcGFyZVR5cGVzICk7XG5cdC8vIFJlbW92ZSBkZXByZWNhdGVkIHNpdGUtdGl0bGUgY29udHJvbCBmcm9tIFVJXG5cdHR5cGVzID0gcmVtb3ZlU2l0ZVRpdGxlKCB0eXBlcyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR5cGVzO1xuIiwiLyogZ2xvYmFscyBCYWNrYm9uZSAqL1xubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZTtcbiIsInZhciBzZXR0aW5ncyA9IHdpbmRvdy5fSmV0cGFja0ZvbnRzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHRpbmdzO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdF8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF8uZXh0ZW5kKCBCYWNrYm9uZS5FdmVudHMgKTtcblxuIiwidmFyIHN0eWxlT3B0aW9ucyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG5cdD8gd2luZG93Ll9KZXRwYWNrRm9udHMuZnZkTWFwXG5cdDoge1xuXHRcdCduMSc6ICdUaGluJyxcblx0XHQnaTEnOiAnVGhpbiBJdGFsaWMnLFxuXHRcdCdvMSc6ICdUaGluIE9ibGlxdWUnLFxuXHRcdCduMic6ICdFeHRyYSBMaWdodCcsXG5cdFx0J2kyJzogJ0V4dHJhIExpZ2h0IEl0YWxpYycsXG5cdFx0J28yJzogJ0V4dHJhIExpZ2h0IE9ibGlxdWUnLFxuXHRcdCduMyc6ICdMaWdodCcsXG5cdFx0J2kzJzogJ0xpZ2h0IEl0YWxpYycsXG5cdFx0J28zJzogJ0xpZ2h0IE9ibGlxdWUnLFxuXHRcdCduNCc6ICdSZWd1bGFyJyxcblx0XHQnaTQnOiAnSXRhbGljJyxcblx0XHQnbzQnOiAnT2JsaXF1ZScsXG5cdFx0J241JzogJ01lZGl1bScsXG5cdFx0J2k1JzogJ01lZGl1bSBJdGFsaWMnLFxuXHRcdCdvNSc6ICdNZWRpdW0gT2JsaXF1ZScsXG5cdFx0J242JzogJ1NlbWlib2xkJyxcblx0XHQnaTYnOiAnU2VtaWJvbGQgSXRhbGljJyxcblx0XHQnbzYnOiAnU2VtaWJvbGQgT2JsaXF1ZScsXG5cdFx0J243JzogJ0JvbGQnLFxuXHRcdCdpNyc6ICdCb2xkIEl0YWxpYycsXG5cdFx0J283JzogJ0JvbGQgT2JsaXF1ZScsXG5cdFx0J244JzogJ0V4dHJhIEJvbGQnLFxuXHRcdCdpOCc6ICdFeHRyYSBCb2xkIEl0YWxpYycsXG5cdFx0J284JzogJ0V4dHJhIEJvbGQgT2JsaXF1ZScsXG5cdFx0J245JzogJ1VsdHJhIEJvbGQnLFxuXHRcdCdpOSc6ICdVbHRyYSBCb2xkIEl0YWxpYycsXG5cdFx0J285JzogJ1VsdHJhIEJvbGQgT2JsaXF1ZSdcblx0fTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdldEZvbnRWYXJpYW50TmFtZUZyb21JZDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHZhciBtYXRjaCA9IHN0eWxlT3B0aW9uc1sgaWQgXTtcblx0XHRpZiAoIG1hdGNoICkge1xuXHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdH1cblx0XHRyZXR1cm4gJ1JlZ3VsYXInO1xuXHR9XG59O1xuIiwiLyoqXG4gKiBUaGlzIGhlbHBlciBzZXRzIHVwIFZpZXdzIHRvIHJlbmRlciBlYWNoIGZvbnQgZm9yIHNwZWNpZmljIHByb3ZpZGVycy4gRWFjaFxuICogVmlldyBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YgYHdwLmN1c3RvbWl6ZS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3YCAod2hpY2hcbiAqIGlzIGEgYEJhY2tib25lLlZpZXdgKSB0aGF0IHdpbGwgcmVuZGVyIGl0cyBmb250IG9wdGlvbiB0byB0aGUgZm9udCBsaXN0LlxuICogQWRkaXRpb25hbCBwcm92aWRlciBWaWV3cyBjYW4gYmUgYWRkZWQgYnkgYWRkaW5nIHRvIHRoZVxuICogYHdwLmN1c3RvbWl6ZS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3c2Agb2JqZWN0IHVzaW5nIHRoZSBwcm92aWRlciBpZCBhcyB0aGVcbiAqIGtleS4gVGhlIG9ubHkgdGhpbmcgdGhhdCBuZWVkcyB0byBiZSBhZGRlZCBmb3IgZWFjaCBQcm92aWRlclZpZXcgaXMgdGhlXG4gKiBgcmVuZGVyYCBtZXRob2QuIEVhY2ggUHJvdmlkZXJWaWV3IGhhcyBhcyBpdHMgYG1vZGVsYCBvYmplY3QgdGhlIGZvbnQgb2JqZWN0XG4gKiBpdCBuZWVkcyB0byBkaXNwbGF5LCBpbmNsdWRpbmcgdGhlIGBjc3NOYW1lYCwgYGRpc3BsYXlOYW1lYCwgYW5kIGBpZGAgYXR0cmlidXRlcy5cbiAqXG4gKiBBZGRpdGlvbmFsbHksIGlmIHlvdXIgcHJvdmlkZXIgbmVlZHMgc3BlY2lmaWMgbG9naWMgZm9yIGhvdmVyIHN0YXRlcyAodGhpbmtcbiAqIGJhY2tncm91bmQgaW1hZ2Ugc3dhcHBpbmcpLCB5b3UgY2FuIGltcGxlbWVudCBgbW91c2VlbnRlcmAgYW5kIGBtb3VzZWxlYXZlYCBtZXRob2RzLlxuICovXG5cbnZhciBhcGkgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hcGknICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpwcm92aWRlci12aWV3cycgKTtcblxudmFyIERyb3Bkb3duSXRlbSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1pdGVtJyApO1xuaWYgKCAhIGFwaS5KZXRwYWNrRm9udHMgKSB7XG5cdGFwaS5KZXRwYWNrRm9udHMgPSB7fTtcbn1cbmlmICggISBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKSB7XG5cdGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyA9IHt9O1xufVxuYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXcgPSBEcm9wZG93bkl0ZW0uZXh0ZW5kKCB7XG5cdG1vdXNlZW50ZXI6IGZ1bmN0aW9uKCkge30sXG5cdG1vdXNlbGVhdmU6IGZ1bmN0aW9uKCkge31cbn0gKTtcblxudmFyIHByb3ZpZGVyVmlld3MgPSB7fTtcblxuZnVuY3Rpb24gaW1wb3J0UHJvdmlkZXJWaWV3cygpIHtcblx0ZGVidWcoICdpbXBvcnRpbmcgcHJvdmlkZXIgdmlld3MgZnJvbScsIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApO1xuXHRpZiAoIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApIHtcblx0XHRPYmplY3Qua2V5cyggYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkuZm9yRWFjaCggZnVuY3Rpb24oIHByb3ZpZGVyS2V5ICkge1xuXHRcdFx0cHJvdmlkZXJWaWV3c1sgcHJvdmlkZXJLZXkgXSA9IGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3c1sgcHJvdmlkZXJLZXkgXTtcblx0XHR9ICk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0Vmlld0ZvclByb3ZpZGVyKCBwcm92aWRlciApIHtcblx0aW1wb3J0UHJvdmlkZXJWaWV3cygpO1xuXHRpZiAoIHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyIF0gKSB7XG5cdFx0ZGVidWcoICdmb3VuZCB2aWV3IGZvciBwcm92aWRlcicsIHByb3ZpZGVyICk7XG5cdFx0cmV0dXJuIHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyIF07XG5cdH1cblx0ZGVidWcoICdubyB2aWV3IGZvdW5kIGZvciBwcm92aWRlcicsIHByb3ZpZGVyICk7XG5cdHJldHVybiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0Vmlld0ZvclByb3ZpZGVyOiBnZXRWaWV3Rm9yUHJvdmlkZXJcbn07XG4iLCJ2YXIgdHJhbnNsYXRpb25zID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcblx0PyB3aW5kb3cuX0pldHBhY2tGb250cy5pMThuXG5cdDoge307XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIHN0cmluZyApIHtcblx0aWYgKCB0cmFuc2xhdGlvbnNbIHN0cmluZyBdICkge1xuXHRcdHJldHVybiB0cmFuc2xhdGlvbnNbIHN0cmluZyBdO1xuXHR9XG5cdHJldHVybiBzdHJpbmc7XG59O1xuIiwiLyogZ2xvYmFscyBfICovXG5tb2R1bGUuZXhwb3J0cyA9IF87XG4iLCIvKiBnbG9iYWxzIFdlYkZvbnQgKi9cbm1vZHVsZS5leHBvcnRzID0gV2ViRm9udDtcbiIsInZhciBhcGkgPSByZXF1aXJlKCAnLi9oZWxwZXJzL2FwaScgKTtcblxudmFyIE1hc3RlciA9IHJlcXVpcmUoICcuL3ZpZXdzL21hc3RlcicgKTtcblxudmFyIFNlbGVjdGVkRm9udHMgPSByZXF1aXJlKCAnLi9tb2RlbHMvc2VsZWN0ZWQtZm9udHMnICk7XG5cbi8vIEN1c3RvbWl6ZXIgQ29udHJvbFxuYXBpLmNvbnRyb2xDb25zdHJ1Y3Rvci5qZXRwYWNrRm9udHMgPSBhcGkuQ29udHJvbC5leHRlbmQoIHtcblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEdldCB0aGUgZXhpc3Rpbmcgc2V0dGluZyBmcm9tIHRoZSBDdXN0b21pemVyXG5cdFx0dGhpcy5zZWxlY3RlZEZvbnRzID0gbmV3IFNlbGVjdGVkRm9udHMoIHRoaXMuc2V0dGluZygpICk7XG5cblx0XHQvLyBVcGRhdGUgdGhlIHNldHRpbmcgd2hlbiB0aGUgY3VycmVudCBmb250IGNoYW5nZXNcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMub24oICdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuc2V0dGluZyggdGhpcy5zZWxlY3RlZEZvbnRzLnRvSlNPTigpICk7XG5cdFx0fS5iaW5kKCB0aGlzICkgKTtcblxuXHRcdHRoaXMudmlldyA9IG5ldyBNYXN0ZXIoIHtcblx0XHRcdHNlbGVjdGVkRm9udHM6IHRoaXMuc2VsZWN0ZWRGb250cyxcblx0XHRcdGVsOiB0aGlzLmNvbnRhaW5lclxuXHRcdH0gKS5yZW5kZXIoKTtcblxuXHRcdC8vIERlbGF5IGxvYWRpbmcgZm9udHMgdW50aWwgdGhlIFNlY3Rpb24gaXMgb3BlbmVkXG5cdFx0YXBpLnNlY3Rpb24oIHRoaXMuc2VjdGlvbigpICkuY29udGFpbmVyXG5cdFx0Lm9uZSggJ2V4cGFuZGVkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzZXRUaW1lb3V0KCB0aGlzLnZpZXcubG9hZEZvbnRzLCAyMDAgKTtcblx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXG5cdFx0YXBpLnNlY3Rpb24oIHRoaXMuc2VjdGlvbigpICkuY29udGFpbmVyXG5cdFx0Lm9uKCAnY29sbGFwc2VkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnZpZXcuY2xvc2VBbGxNZW51cygpO1xuXHRcdH0uYmluZCggdGhpcyApICk7XG5cdH1cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6bWVudS12aWV3JyApLFxuXHRFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxuZnVuY3Rpb24gbWF5YmVPcGVuTWVudSgga2V5ICkge1xuXHRpZiAoIGtleS50eXBlICYmIGtleS50eXBlLmlkICYmIGtleS5tZW51ICkge1xuXHRcdGtleSA9IGtleS50eXBlLmlkICsgJzonICsga2V5Lm1lbnU7XG5cdH1cblx0aWYgKCBrZXkgIT09IHRoaXMubWVudUtleSApIHtcblx0XHRyZXR1cm4gdGhpcy5jbG9zZU1lbnUoKTtcblx0fVxuXHR0aGlzLm9wZW5NZW51KCk7XG59XG5cbmZ1bmN0aW9uIG9wZW5NZW51KCkge1xuXHRkZWJ1ZyggJ29wZW5pbmcgbWVudScsIHRoaXMubWVudUtleSApO1xuXHR0aGlzLm1lbnVTdGF0dXMuc2V0KCB7IGlzT3BlbjogdHJ1ZSB9ICk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlTWVudSgpIHtcblx0ZGVidWcoICdjbG9zaW5nIG1lbnUnLCB0aGlzLm1lbnVLZXkgKTtcblx0dGhpcy5tZW51U3RhdHVzLnNldCggeyBpc09wZW46IGZhbHNlIH0gKTtcbn1cblxudmFyIG1lbnVWaWV3TWl4aW4gPSBmdW5jdGlvbiggdmlldyApIHtcblx0aWYgKCAhIHZpZXcubGlzdGVuVG8gKSB7XG5cdFx0dGhyb3cgJ21lbnVWaWV3TWl4aW4gcmVxdWlyZXMgYSBCYWNrYm9uZSBWaWV3IHdpdGggdGhlIGBsaXN0ZW5Ub2AgbWV0aG9kJztcblx0fVxuXHRpZiAoICEgdmlldy5tZW51S2V5ICkge1xuXHRcdHRocm93ICdtZW51Vmlld01peGluIHJlcXVpcmVzIGEgVmlldyB3aXRoIGEgYG1lbnVLZXlgIHN0cmluZyBwcm9wZXJ0eSB0byBpZGVudGlmeSB0aGUgbWVudSc7XG5cdH1cblx0aWYgKCAhIHZpZXcubWVudVN0YXR1cyApIHtcblx0XHR2aWV3Lm1lbnVTdGF0dXMgPSBuZXcgQmFja2JvbmUuTW9kZWwoIHsgaXNPcGVuOiBmYWxzZSB9ICk7XG5cdH1cblxuXHR2aWV3Lm1heWJlT3Blbk1lbnUgPSBtYXliZU9wZW5NZW51O1xuXHR2aWV3Lm9wZW5NZW51ID0gb3Blbk1lbnU7XG5cdHZpZXcuY2xvc2VNZW51ID0gY2xvc2VNZW51O1xuXG5cdHZpZXcubGlzdGVuVG8oIEVtaXR0ZXIsICdvcGVuLW1lbnUnLCB2aWV3Lm1heWJlT3Blbk1lbnUgKTtcblx0dmlldy5saXN0ZW5UbyggRW1pdHRlciwgJ2Nsb3NlLW9wZW4tbWVudXMnLCB2aWV3LmNsb3NlTWVudSApO1xuXG5cdGRlYnVnKCAnYWRkZWQgbWVudSBjYXBhYmlsaXR5IHRvIHRoZSBWaWV3Jywgdmlldy5tZW51S2V5ICk7XG5cblx0cmV0dXJuIHZpZXcubWVudVN0YXR1cztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbWVudVZpZXdNaXhpbjtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRfID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdW5kZXJzY29yZScgKSxcblx0dHJhbnNsYXRlID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdHJhbnNsYXRlJyApO1xuXG52YXIgc2l6ZU9wdGlvbnMgPSBbXG5cdHsgaWQ6IC0xMCwgbmFtZTogdHJhbnNsYXRlKCAnVGlueScgKSB9LFxuXHR7IGlkOiAtNSwgIG5hbWU6IHRyYW5zbGF0ZSggJ1NtYWxsJyApIH0sXG5cdHsgaWQ6IDAsICAgbmFtZTogdHJhbnNsYXRlKCAnTm9ybWFsJyApIH0sXG5cdHsgaWQ6IDUsICAgbmFtZTogdHJhbnNsYXRlKCAnTGFyZ2UnICkgfSxcblx0eyBpZDogMTAsICBuYW1lOiB0cmFuc2xhdGUoICdIdWdlJyApIH1cbl07XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKCB7XG5cdGdldEZvbnRWYXJpYW50T3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmdldCggJ2Z2ZHMnICkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXQoICdmdmRzJyApO1xuXHRcdH1cblx0XHRyZXR1cm4gW107XG5cdH0sXG5cblx0Z2V0Rm9udFNpemVPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2l6ZU9wdGlvbnM7XG5cdH0sXG5cblx0Z2V0Rm9udFNpemVOYW1lRnJvbUlkOiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0dmFyIG9wdGlvbiA9IF8uZmluZFdoZXJlKCBzaXplT3B0aW9ucywgeyBpZDogaWQgfSApO1xuXHRcdGlmICggb3B0aW9uICkge1xuXHRcdFx0cmV0dXJuIG9wdGlvbi5uYW1lO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn0gKTtcbiIsInZhciBTZWxlY3RlZEZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL3NlbGVjdGVkLWZvbnQnICksXG5cdHRyYW5zbGF0ZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3RyYW5zbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RlZEZvbnQuZXh0ZW5kKCB7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc2V0KCB7IGlkOiAnJywgZGlzcGxheU5hbWU6IHRyYW5zbGF0ZSggJ0RlZmF1bHQgVGhlbWUgRm9udCcgKSwgcHJvdmlkZXI6ICcnIH0gKTtcblx0fVxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdHRyYW5zbGF0ZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3RyYW5zbGF0ZScgKSxcblx0YXZhaWxhYmxlVHlwZXMgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hdmFpbGFibGUtdHlwZXMnICksXG5cdF8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2tfZm9udHM6c2VsZWN0ZWQtZm9udCcgKTtcblxuLy8gQSBNb2RlbCBmb3IgYSBjdXJyZW50bHkgc2V0IGZvbnQgc2V0dGluZyBmb3IgdGhpcyB0aGVtZVxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoIHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5tYXliZVNldEN1cnJlbnRGdmQoKTtcblx0fSxcblx0ZGVmYXVsdHM6IHtcblx0XHQnZGlzcGxheU5hbWUnOiB0cmFuc2xhdGUoICdEZWZhdWx0IFRoZW1lIEZvbnQnIClcblx0fSxcblx0c2V0OiBmdW5jdGlvbigpIHtcblx0XHRCYWNrYm9uZS5Nb2RlbC5wcm90b3R5cGUuc2V0LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR0aGlzLm1heWJlU2V0Q3VycmVudEZ2ZCgpO1xuXHR9LFxuXHRtYXliZVNldEN1cnJlbnRGdmQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0eXBlO1xuXHRcdGlmICggdGhpcy5nZXQoICdjdXJyZW50RnZkJyApICkge1xuXHRcdFx0ZGVidWcoICdGb250IGFscmVhZHkgaGFzIGFuIGZ2ZCcsIHRoaXMuZ2V0KCAnY3VycmVudEZ2ZCcgKSApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAoICEgdGhpcy5nZXQoICdpZCcgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dHlwZSA9IF8uZmluZFdoZXJlKCBhdmFpbGFibGVUeXBlcywgeyBpZDogdGhpcy5nZXQoICd0eXBlJyApIH0gKTtcblx0XHRpZiAoICEgdHlwZSB8fCAhIHR5cGUuZnZkQWRqdXN0IHx8ICEgdGhpcy5nZXQoICdmdmRzJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnNldCggJ2N1cnJlbnRGdmQnLCB0aGlzLnBpY2tGdmQoKSApO1xuXHRcdGRlYnVnKCAnRnZkIG5vdyBzZXQgdG86ICcsIHRoaXMuZ2V0KCAnY3VycmVudEZ2ZCcgKSApO1xuXHR9LFxuXHRwaWNrRnZkOiBmdW5jdGlvbigpIHtcblx0XHQvLyBhbGdvcml0aG0gaGVyZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvQ1NTL2ZvbnQtd2VpZ2h0I0ZhbGxiYWNrXG5cdFx0Ly8gd2UgYWx3YXlzIGdvIGZvciA0MDAgd2VpZ2h0IGZpcnN0LlxuXHRcdHZhciB2YXJpYXRpb25zID0gdGhpcy5nZXQoICdmdmRzJyApO1xuXHRcdC8vIGZpcnN0IHRyeSBuNFxuXHRcdHZhciBpID0gNDtcblx0XHRpZiAoIHRoaXMuaGFzVmFyaWF0aW9uKCAnbicgKyBpLCB2YXJpYXRpb25zICkgKSB7XG5cdFx0XHRyZXR1cm4gJ24nICsgaTtcblx0XHR9XG5cdFx0Ly8gbmV4dCB3ZSB0cnkgbjVcblx0XHRpID0gNTtcblx0XHRpZiAoIHRoaXMuaGFzVmFyaWF0aW9uKCAnbicgKyBpLCB2YXJpYXRpb25zICkgKSB7XG5cdFx0XHRyZXR1cm4gJ24nICsgaTtcblx0XHR9XG5cdFx0Ly8gbm93IHdlIGdvIGxpZ2h0ZXIsIHRvIDMtMVxuXHRcdGZvciAoIGkgPSAzOyBpID49IDE7IGktLSApIHtcblx0XHRcdGlmICggdGhpcy5oYXNWYXJpYXRpb24oICduJyArIGksIHZhcmlhdGlvbnMgKSApIHtcblx0XHRcdFx0cmV0dXJuICduJyArIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIG5vdyBkYXJrZXIsIDYtOVxuXHRcdGZvciAoIGkgPSA2OyBpIDw9IDk7IGkrKyApIHtcblx0XHRcdGlmICggdGhpcy5oYXNWYXJpYXRpb24oICduJyArIGksIHZhcmlhdGlvbnMgKSApIHtcblx0XHRcdFx0cmV0dXJuICduJyArIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIEkgZ3Vlc3MganVzdCByZXR1cm4gbjQgYW55d2F5XG5cdFx0cmV0dXJuICduNCc7XG5cdH0sXG5cdGhhc1ZhcmlhdGlvbjogZnVuY3Rpb24oIGZ2ZCwgZnZkcyApIHtcblx0XHRyZXR1cm4gXy5jb250YWlucyggZnZkcywgZnZkICk7XG5cdH1cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6c2VsZWN0ZWQtZm9udHMnICksXG5cdHRyYW5zbGF0ZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3RyYW5zbGF0ZScgKTtcblxudmFyIFNlbGVjdGVkRm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvc2VsZWN0ZWQtZm9udCcgKTtcblxuLy8gQSBDb2xsZWN0aW9uIG9mIHRoZSBjdXJyZW50IGZvbnQgc2V0dGluZ3MgZm9yIHRoaXMgdGhlbWVcbi8vIFdlIHVzZSBhIE1vZGVsIGluc3RlYWQgb2YgYW4gYWN0dWFsIENvbGxlY3Rpb24gYmVjYXVzZSB3ZSBjYW4ndCBvdGhlcndpc2Vcbi8vIGhvbGQgdHdvIGNvcGllcyBvZiB0aGUgc2FtZSBmb250IChzYW1lIGlkKS5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKCB7XG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0aWYgKCAhIGRhdGEgKSB7XG5cdFx0XHRkYXRhID0gW107XG5cdFx0fVxuXHRcdHZhciBmb250cyA9IGRhdGEubWFwKCBmdW5jdGlvbiggZm9udCApIHtcblx0XHRcdHJldHVybiBuZXcgU2VsZWN0ZWRGb250KCBmb250ICk7XG5cdFx0fSApO1xuXHRcdHRoaXMuc2V0KCAnZm9udHMnLCBmb250cyApO1xuXHR9LFxuXG5cdGdldEZvbnRCeVR5cGU6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdHZhciBtb2RlbCA9IHRoaXMuZ2V0KCAnZm9udHMnICkucmVkdWNlKCBmdW5jdGlvbiggcHJldmlvdXMsIG1vZCApIHtcblx0XHRcdGlmICggbW9kLmdldCggJ3R5cGUnICkgPT09IHR5cGUgKSB7XG5cdFx0XHRcdHJldHVybiBtb2Q7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcHJldmlvdXM7XG5cdFx0fSwgbnVsbCApO1xuXHRcdGlmICggISBtb2RlbCApIHtcblx0XHRcdG1vZGVsID0gbmV3IFNlbGVjdGVkRm9udCggeyB0eXBlOiB0eXBlLCBkaXNwbGF5TmFtZTogdHJhbnNsYXRlKCAnRGVmYXVsdCBUaGVtZSBGb250JyApIH0gKTtcblx0XHRcdHRoaXMuZ2V0KCAnZm9udHMnICkucHVzaCggbW9kZWwgKTtcblx0XHR9XG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9LFxuXG5cdHNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmdldCggJ2ZvbnRzJyApLmxlbmd0aDtcblx0fSxcblxuXHRzZXRTZWxlY3RlZEZvbnQ6IGZ1bmN0aW9uKCBmb250ICkge1xuXHRcdGRlYnVnKCAnc2V0dGluZyBzZWxlY3RlZCBmb250IHRvJywgZm9udCApO1xuXHRcdGlmICggISBmb250LnR5cGUgKSB7XG5cdFx0XHRkZWJ1ZyggJ0Nhbm5vdCBzZXQgc2VsZWN0ZWQgZm9udCBiZWNhdXNlIGl0IGhhcyBubyB0eXBlJywgZm9udCApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR2YXIgbW9kZWwgPSB0aGlzLmdldEZvbnRCeVR5cGUoIGZvbnQudHlwZSApO1xuXHRcdG1vZGVsLmNsZWFyKCB7IHNpbGVudDogdHJ1ZSB9ICk7XG5cdFx0aWYgKCBtb2RlbCApIHtcblx0XHRcdG1vZGVsLnNldCggZm9udCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmdldCggJ2ZvbnRzJyApLnB1c2goIG5ldyBTZWxlY3RlZEZvbnQoIGZvbnQgKSApO1xuXHRcdH1cblx0XHR0aGlzLnRyaWdnZXIoICdjaGFuZ2UnICk7XG5cdH0sXG5cblx0dG9KU09OOiBmdW5jdGlvbigpIHtcblx0XHQvLyBza2lwIGFueSBmb250cyBzZXQgdG8gdGhlIGRlZmF1bHRcblx0XHRyZXR1cm4gdGhpcy5nZXQoICdmb250cycgKS5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2aW91cywgbW9kZWwgKSB7XG5cdFx0XHRpZiAoIG1vZGVsLmdldCggJ2lkJyApICkge1xuXHRcdFx0XHRwcmV2aW91cy5wdXNoKCBtb2RlbC50b0pTT04oKSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHByZXZpb3VzO1xuXHRcdH0sIFtdICk7XG5cdH1cbn0gKTtcblxuIiwidmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKSxcblx0Ym9vdHN0cmFwID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYm9vdHN0cmFwJyApO1xuXG52YXIgV2ViRm9udCA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3dlYmZvbnQnICk7XG5cbnZhciBsb2FkZWRGb250SWRzID0gW107XG5cbmZ1bmN0aW9uIGFkZEZvbnRUb0NvbnRyb2xzKCBmb250LCB0ZXh0ICkge1xuXHRpZiAoIH4gbG9hZGVkRm9udElkcy5pbmRleE9mKCBmb250LmlkICkgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxvYWRlZEZvbnRJZHMucHVzaCggZm9udC5pZCApO1xuXHRXZWJGb250LmxvYWQoe1xuXHRcdGdvb2dsZTogeyBmYW1pbGllczogWyBmb250LmlkIF0sIHRleHQ6IHRleHQgfSxcblx0XHRjbGFzc2VzOiBmYWxzZSxcblx0XHRldmVudHM6IGZhbHNlXG5cdH0pO1xufVxuXG5mdW5jdGlvbiBhZGRGb250VG9QcmV2aWV3KCBmb250ICkge1xuXHRpZiAoIH4gbG9hZGVkRm9udElkcy5pbmRleE9mKCBmb250LmlkICkgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxvYWRlZEZvbnRJZHMucHVzaCggZm9udC5pZCApO1xuXHR2YXIgZmFtaWx5U3RyaW5nID0gZm9udC5pZCArICc6MTAwLDIwMCwzMDAsNDAwLDUwMCw2MDAsNzAwLDgwMCw5MDAsMTAwaXRhbGljLDIwMGl0YWxpYywzMDBpdGFsaWMsNDAwaXRhbGljLDUwMGl0YWxpYyw2MDBpdGFsaWMsNzAwaXRhbGljLDgwMGl0YWxpYyw5MDBpdGFsaWMnO1xuXHRpZiAoIGJvb3RzdHJhcC5wcm92aWRlckRhdGEgJiYgYm9vdHN0cmFwLnByb3ZpZGVyRGF0YS5nb29nbGVTdWJzZXRTdHJpbmcgKSB7XG5cdFx0dmFyIHN1YnNldFN0cmluZyA9IGJvb3RzdHJhcC5wcm92aWRlckRhdGEuZ29vZ2xlU3Vic2V0U3RyaW5nO1xuXHRcdGlmICggc3Vic2V0U3RyaW5nICYmIHN1YnNldFN0cmluZy5sZW5ndGggPiAwICkge1xuXHRcdFx0ZmFtaWx5U3RyaW5nICs9ICc6JyArIHN1YnNldFN0cmluZztcblx0XHR9XG5cdH1cblx0V2ViRm9udC5sb2FkKCB7IGdvb2dsZTogeyBmYW1pbGllczogWyBmYW1pbHlTdHJpbmcgXSB9IH0gKTtcbn1cblxudmFyIEdvb2dsZVByb3ZpZGVyVmlldyA9IGFwaS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3LmV4dGVuZCgge1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5tb2RlbC5nZXQoICdkaXNwbGF5TmFtZScgKSApO1xuXG5cdFx0dGhpcy4kZWwuY3NzKCAnZm9udC1mYW1pbHknLCAnXCInICsgdGhpcy5tb2RlbC5nZXQoICdjc3NOYW1lJyApICsgJ1wiJyApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udCAmJiB0aGlzLmN1cnJlbnRGb250LmdldCggJ2lkJyApID09PSB0aGlzLm1vZGVsLmdldCggJ2lkJyApICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH1cblx0XHRpZiAoIXRoaXMuZGlzYWJsZUZvY3VzICkge1xuXHRcdFx0dGhpcy4kZWwuYXR0cigndGFiaW5kZXgnLCAnMCcpO1xuXHRcdH1cblx0XHRhZGRGb250VG9Db250cm9scyggdGhpcy5tb2RlbC50b0pTT04oKSwgdGhpcy5tb2RlbC5nZXQoICdpZCcgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59ICk7XG5cbkdvb2dsZVByb3ZpZGVyVmlldy5hZGRGb250VG9QcmV2aWV3ID0gYWRkRm9udFRvUHJldmlldztcblxuYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzLmdvb2dsZSA9IEdvb2dsZVByb3ZpZGVyVmlldztcblxubW9kdWxlLmV4cG9ydHMgPSBHb29nbGVQcm92aWRlclZpZXc7XG4iLCJ2YXIgRHJvcGRvd25DdXJyZW50VGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LXNpemUgZm9udC1wcm9wZXJ0eS1jb250cm9sLWN1cnJlbnQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLmN1cnJlbnRGb250U2l6ZSA9IG9wdHMuY3VycmVudEZvbnRTaXplO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5jdXJyZW50Rm9udFNpemUgKTtcblx0XHR0aGlzLiRlbC5hdHRyKCAndGFiaW5kZXgnLCAnMCcpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG52YXIgZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZnZkLXRvLXJlYWRhYmxlJyApLmdldEZvbnRWYXJpYW50TmFtZUZyb21JZDtcblxudmFyIEN1cnJlbnRGb250VmFyaWFudCA9IERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtdmFyaWFudCBmb250LXByb3BlcnR5LWNvbnRyb2wtY3VycmVudCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdFx0dGhpcy5tdWx0aU9wdGlvbnMgPSBvcHRzLm11bHRpT3B0aW9ucztcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIGdldEZvbnRWYXJpYW50TmFtZUZyb21JZCggdGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgKSApO1xuXHRcdGlmICggdGhpcy5tdWx0aU9wdGlvbnMgPT09IGZhbHNlICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdpbmFjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdpbmFjdGl2ZScgKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ3VycmVudEZvbnRWYXJpYW50O1xuIiwidmFyIGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpDdXJyZW50Rm9udFZpZXcnICk7XG5cbnZhciBnZXRWaWV3Rm9yUHJvdmlkZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9wcm92aWRlci12aWV3cycgKS5nZXRWaWV3Rm9yUHJvdmlkZXIsXG5cdERyb3Bkb3duQ3VycmVudFRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLWN1cnJlbnQtdGVtcGxhdGUnICk7XG5cbnZhciBDdXJyZW50Rm9udFZpZXcgPSBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fY3VycmVudC1mb250JyxcblxuXHRldmVudHM6IHtcblx0XHQnbW91c2VlbnRlcic6ICdkaXNwYXRjaEhvdmVyJyxcblx0XHQnbW91c2VsZWF2ZSc6ICdkaXNwYXRjaEhvdmVyJyxcblx0XHQnY2xpY2snOiAndG9nZ2xlRHJvcGRvd24nLFxuXHRcdCdrZXlkb3duJzogJ2NoZWNrT3BlbicsXG5cdH0sXG5cblx0ZGlzcGF0Y2hIb3ZlcjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXG5cdFx0aWYgKCAhICggZXZlbnQudHlwZSA9PT0gJ21vdXNlZW50ZXInIHx8IGV2ZW50LnR5cGUgPT09ICdtb3VzZWxlYXZlJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnByb3ZpZGVyVmlldyAmJiB0aGlzLnByb3ZpZGVyVmlld1sgZXZlbnQudHlwZSBdKCBldmVudCApO1xuXHR9LFxuXG5cdGNoZWNrT3BlbjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0dGhpcy50b2dnbGVEcm9wZG93bigpO1xuXHRcdH1cblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5hY3RpdmUgPSBvcHRzLmFjdGl2ZTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1lbnVTdGF0dXMsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmFjdGl2ZSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLm1lbnVTdGF0dXMuZ2V0KCAnaXNPcGVuJyApICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtLW9wZW4nICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LS1vcGVuJyApO1xuXHRcdH1cblx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBjdXJyZW50Rm9udDonLCB0aGlzLmN1cnJlbnRGb250LnRvSlNPTigpICk7XG5cdFx0aWYgKCAhIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udC0tZGVmYXVsdCcgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtLWRlZmF1bHQnICk7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVBdHRyKCAndGFiaW5kZXgnICk7XG5cdFx0fVxuXHRcdGlmICggdGhpcy5wcm92aWRlclZpZXcgKSB7XG5cdFx0XHR0aGlzLnByb3ZpZGVyVmlldy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwudGV4dCggJycgKTtcblx0XHR0aGlzLiRlbC5hdHRyKCAndGFiaW5kZXgnLCAnMCcpO1xuXHRcdHZhciBQcm92aWRlclZpZXcgPSBnZXRWaWV3Rm9yUHJvdmlkZXIoIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAncHJvdmlkZXInICkgKTtcblx0XHRpZiAoICEgUHJvdmlkZXJWaWV3ICkge1xuXHRcdFx0ZGVidWcoICdyZW5kZXJpbmcgY3VycmVudEZvbnQgd2l0aCBubyBwcm92aWRlclZpZXcgZm9yJywgdGhpcy5jdXJyZW50Rm9udC50b0pTT04oKSApO1xuXHRcdFx0aWYgKCAhIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnZGlzcGxheU5hbWUnICkgKSB7XG5cdFx0XHRcdGRlYnVnKCAnZXJyb3IgcmVuZGVyaW5nIGN1cnJlbnRGb250IGJlY2F1c2UgaXQgaGFzIG5vIGRpc3BsYXlOYW1lIScsIHRoaXMuY3VycmVudEZvbnQudG9KU09OKCkgKTtcblx0XHRcdFx0dGhpcy4kZWwuaHRtbCggJ1Vua25vd24nICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLmN1cnJlbnRGb250LmdldCggJ2Rpc3BsYXlOYW1lJyApICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZGVidWcoICdyZW5kZXJpbmcgY3VycmVudEZvbnQgcHJvdmlkZXJWaWV3IGZvcicsIHRoaXMuY3VycmVudEZvbnQudG9KU09OKCkgKTtcblx0XHR0aGlzLnByb3ZpZGVyVmlldyA9IG5ldyBQcm92aWRlclZpZXcoIHtcblx0XHRcdG1vZGVsOiB0aGlzLmN1cnJlbnRGb250LFxuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0ZGlzYWJsZUZvY3VzOiB0cnVlXG5cdFx0fSApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggdGhpcy5wcm92aWRlclZpZXcucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ3VycmVudEZvbnRWaWV3O1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxudmFyIERlZmF1bHRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9kZWZhdWx0LWZvbnQnICk7XG5cbi8vICd4JyBidXR0b24gdGhhdCByZXNldHMgZm9udCB0byBkZWZhdWx0XG52YXIgRGVmYXVsdEZvbnRCdXR0b24gPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19kZWZhdWx0LWJ1dHRvbicsXG5cdHRhZ05hbWU6ICdzcGFuJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAncmVzZXRUb0RlZmF1bHQnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdGlmICggISB0aGlzLnR5cGUgKSB7XG5cdFx0XHR0aHJvdyAnRXJyb3I6IGNhbm5vdCBjcmVhdGUgRGVmYXVsdEZvbnRCdXR0b24gd2l0aG91dCBhIHR5cGUnO1xuXHRcdH1cblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBvcHRzLm1lbnVTdGF0dXM7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tZW51U3RhdHVzLCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250LmlkICYmICEgdGhpcy5tZW51U3RhdHVzLmdldCggJ2lzT3BlbicgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlLWJ1dHRvbicgKTtcblx0XHRcdHRoaXMuJGVsLnNob3coKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUtYnV0dG9uJyApO1xuXHRcdFx0dGhpcy4kZWwuaGlkZSgpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRyZXNldFRvRGVmYXVsdDogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2hhbmdlLWZvbnQnLCB7IGZvbnQ6IG5ldyBEZWZhdWx0Rm9udCgpLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVmYXVsdEZvbnRCdXR0b247XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOkRyb3Bkb3duQ3VycmVudFRlbXBsYXRlJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICd0b2dnbGVEcm9wZG93bicsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tPcGVuJyxcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5tZW51ID0gb3B0cy5tZW51O1xuXHRcdHRoaXMubWVudVN0YXR1cyA9IG9wdHMubWVudVN0YXR1cztcblx0XHR0aGlzLmFjdGl2ZSA9IHRydWU7XG5cdH0sXG5cblx0dG9nZ2xlRHJvcGRvd246IGZ1bmN0aW9uKCBlICkge1xuXHRcdGlmICggZSApIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXHRcdGlmICggISB0aGlzLmFjdGl2ZSApIHtcblx0XHRcdGRlYnVnKCAnbWVudSBpcyBpbmFjdGl2ZTsgaWdub3JpbmcgY2xpY2snLCB0aGlzLm1lbnUsIHRoaXMudHlwZSApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAoIHRoaXMubWVudVN0YXR1cy5nZXQoICdpc09wZW4nICkgKSB7XG5cdFx0XHRkZWJ1ZyggJ21lbnUgaXMgb3BlbjsgY2xvc2luZyBtZW51cycsIHRoaXMubWVudSwgdGhpcy50eXBlICk7XG5cdFx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWJ1ZyggJ21lbnUgaXMgY2xvc2VkOyBvcGVuaW5nIG1lbnUnLCB0aGlzLm1lbnUsIHRoaXMudHlwZSApO1xuXHRcdFx0RW1pdHRlci50cmlnZ2VyKCAnb3Blbi1tZW51JywgeyB0eXBlOiB0aGlzLnR5cGUsIG1lbnU6IHRoaXMubWVudSB9ICk7XG5cdFx0fVxuXHR9LFxuXG5cdGNoZWNrT3BlbjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0dGhpcy4kZWwuY2xpY2soKTtcblx0XHR9XG5cdH0sXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGU7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG4vLyBBbiBpbmRpdmlkdWFsIGZvbnQgaW4gdGhlIGRyb3Bkb3duIGxpc3QsIGV4cG9ydGVkIGFzXG4vLyBgYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXdgLiBFeHRlbmQgdGhpcyBvYmplY3QgZm9yIGVhY2ggcHJvdmlkZXIuIFRoZVxuLy8gZXh0ZW5kZWQgb2JqZWN0cyBuZWVkIHRvIGRlZmluZSBhIGByZW5kZXJgIG1ldGhvZCB0byByZW5kZXIgdGhlaXIgcHJvdmlkZXInc1xuLy8gZm9udCBuYW1lLCBhcyB3ZWxsIGFzIGBhZGRGb250VG9Db250cm9sc2AgYW5kIGBhZGRGb250VG9QcmV2aWV3YCBtZXRob2RzIG9uIHRoZSBvYmplY3QgaXRzZWxmLlxudmFyIFByb3ZpZGVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX29wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ2ZvbnRDaGFuZ2VkJyxcblx0XHQna2V5ZG93bic6ICdjaGVja1NlbGVjdCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5kaXNhYmxlRm9jdXMgPSBCb29sZWFuKG9wdHMuZGlzYWJsZUZvY3VzKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgKSB7XG5cdFx0XHR0aGlzLmxpc3RlblRvKHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlcik7XG5cdFx0fVxuXHR9LFxuXG5cdGNoZWNrU2VsZWN0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC5rZXkgPT09ICdFbnRlcicgKSB7XG5cdFx0XHR0aGlzLiRlbC5jbGljaygpO1xuXHRcdH1cblx0fSxcblxuXHQvLyBXYXJuaW5nOiB0aGlzIHNob3VsZCBiZSBvdmVycmlkZW4gaW4gdGhlIHByb3ZpZGVyXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5tb2RlbC5nZXQoICdkaXNwbGF5TmFtZScgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGZvbnRDaGFuZ2VkOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgJiYgdGhpcy5jdXJyZW50Rm9udCAhPT0gdGhpcy5tb2RlbCApIHtcblx0XHRcdEVtaXR0ZXIudHJpZ2dlciggJ2NoYW5nZS1mb250JywgeyBmb250OiB0aGlzLm1vZGVsLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHRcdH1cblx0fVxufSApO1xuXG5Qcm92aWRlclZpZXcuYWRkRm9udFRvQ29udHJvbHMgPSBmdW5jdGlvbigpIHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyVmlldztcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRHJvcGRvd25UZW1wbGF0ZSA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLm1lbnUgPSBvcHRzLm1lbnU7XG5cdFx0dGhpcy5tZW51U3RhdHVzID0gb3B0cy5tZW51U3RhdHVzO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubWVudVN0YXR1cywgJ2NoYW5nZScsIHRoaXMudXBkYXRlU3RhdHVzICk7XG5cdH0sXG5cblx0dXBkYXRlU3RhdHVzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMubWVudVN0YXR1cy5nZXQoICdpc09wZW4nICkgKSB7XG5cdFx0XHR0aGlzLm9wZW4oKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdH1cblx0fSxcblxuXHRvcGVuOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ29wZW4nICk7XG5cdFx0dGhpcy5pc09wZW4gPSB0cnVlO1xuXHR9LFxuXG5cdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ29wZW4nICk7XG5cdFx0dGhpcy5pc09wZW4gPSBmYWxzZTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duVGVtcGxhdGU7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0bWVudVZpZXdNaXhpbiA9IHJlcXVpcmUoICcuLi9taXhpbnMvbWVudS12aWV3LW1peGluJyApO1xuXG52YXIgRm9udERyb3Bkb3duID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtZHJvcGRvd24nICksXG5cdEN1cnJlbnRGb250VmlldyA9IHJlcXVpcmUoICcuLi92aWV3cy9jdXJyZW50LWZvbnQnICksXG5cdERlZmF1bHRGb250QnV0dG9uID0gcmVxdWlyZSggJy4uL3ZpZXdzL2RlZmF1bHQtZm9udC1idXR0b24nICk7XG5cbi8vIENvbnRhaW5lciBmb3IgdGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGZvbnRzIGFuZCAneCcgYnV0dG9uXG52YXIgRm9udENvbnRyb2xWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fbWVudS1jb250YWluZXInLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLm1lbnUgPSAnZm9udEZhbWlseSc7XG5cdFx0dGhpcy5tZW51S2V5ID0gdGhpcy50eXBlLmlkICsgJzonICsgdGhpcy5tZW51O1xuXHRcdHRoaXMubWVudVN0YXR1cyA9IG1lbnVWaWV3TWl4aW4oIHRoaXMgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjdXJyZW50Rm9udFZpZXcgPSBuZXcgQ3VycmVudEZvbnRWaWV3KCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRtZW51U3RhdHVzOiB0aGlzLm1lbnVTdGF0dXMsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbCxcblx0XHRcdGFjdGl2ZTogKCB0aGlzLmZvbnREYXRhLmxlbmd0aCA+IDAgKVxuXHRcdH0gKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIGN1cnJlbnRGb250Vmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnREcm9wZG93bigge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWwsXG5cdFx0XHRjdXJyZW50Rm9udFZpZXc6IGN1cnJlbnRGb250Vmlldyxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRGVmYXVsdEZvbnRCdXR0b24oIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250Q29udHJvbFZpZXc7XG4iLCJ2YXIgZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOkZvbnREcm9wZG93bicgKSxcblx0RW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBnZXRWaWV3Rm9yUHJvdmlkZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9wcm92aWRlci12aWV3cycgKS5nZXRWaWV3Rm9yUHJvdmlkZXIsXG5cdERyb3Bkb3duVGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tdGVtcGxhdGUnICksXG5cdCQgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKS4kO1xuXG4vLyBEcm9wZG93biBvZiBhdmFpbGFibGUgZm9udHNcbnZhciBGb250RHJvcGRvd24gPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19tZW51Jyxcblx0aWQ6ICdmb250LXNlbGVjdCcsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J21vdXNlZW50ZXIgPiAuamV0cGFjay1mb250c19fb3B0aW9uJzogJ2Rpc3BhdGNoSG92ZXInLFxuXHRcdCdtb3VzZWxlYXZlID4gLmpldHBhY2stZm9udHNfX29wdGlvbic6ICdkaXNwYXRjaEhvdmVyJyxcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmF2YWlsYWJsZUZvbnRzID0gW107XG5cdFx0dGhpcy5zdWJWaWV3cyA9IHt9O1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMuY3VycmVudEZvbnRWaWV3ID0gb3B0cy5jdXJyZW50Rm9udFZpZXc7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ2xvYWQtbWVudS1mb250cycsIHRoaXMubG9hZEZvbnRzICk7XG5cdH0sXG5cblx0bG9hZEZvbnRzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuYXZhaWxhYmxlRm9udHMubGVuZ3RoID4gMCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5hdmFpbGFibGVGb250cyA9IHRoaXMuZm9udERhdGE7XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0fSxcblxuXHRkaXNwYXRjaEhvdmVyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0dmFyIGVsO1xuXHRcdGlmICggISAoIGV2ZW50LnR5cGUgPT09ICdtb3VzZWVudGVyJyB8fCBldmVudC50eXBlID09PSAnbW91c2VsZWF2ZScgKSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZWwgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuXHRcdGlmICggZWwuY2lkICYmIHRoaXMuc3ViVmlld3NbIGVsLmNpZCBdICkge1xuXHRcdFx0dGhpcy5zdWJWaWV3c1sgZWwuY2lkIF1bIGV2ZW50LnR5cGUgXSggZXZlbnQgKTtcblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRPYmplY3Qua2V5cyggdGhpcy5zdWJWaWV3cyApLmZvckVhY2goIGZ1bmN0aW9uKCBjaWQgKSB7XG5cdFx0XHR0aGlzLnN1YlZpZXdzWyBjaWQgXS5yZW1vdmUoKTtcblx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXHRcdGRlYnVnKCAncmVuZGVyaW5nJywgdGhpcy5hdmFpbGFibGVGb250cy5sZW5ndGgsICdhdmFpbGFibGVGb250cyBmb3InLCB0aGlzLnR5cGUgKTtcblx0XHR0aGlzLmF2YWlsYWJsZUZvbnRzLmZvckVhY2goIGZ1bmN0aW9uKCBmb250ICkge1xuXHRcdFx0dmFyIFByb3ZpZGVyVmlldyA9IGdldFZpZXdGb3JQcm92aWRlciggZm9udC5nZXQoICdwcm92aWRlcicgKSApO1xuXHRcdFx0aWYgKCAhIFByb3ZpZGVyVmlldyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0ZGVidWcoICdyZW5kZXJpbmcgcHJvdmlkZXJWaWV3IGluJywgdGhpcy50eXBlLCAnZm9udCBsaXN0IGZvcicsIGZvbnQudG9KU09OKCkgKTtcblx0XHRcdHZhciB2aWV3ID0gbmV3IFByb3ZpZGVyVmlldygge1xuXHRcdFx0XHRtb2RlbDogZm9udCxcblx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRjdXJyZW50Rm9udDogdGhpcy5jdXJyZW50Rm9udFxuXHRcdFx0fSApLnJlbmRlcigpO1xuXG5cdFx0XHR2aWV3LmVsLmNpZCA9IHZpZXcuY2lkO1xuXHRcdFx0dGhpcy5zdWJWaWV3c1sgdmlldy5jaWQgXSA9IHZpZXc7XG5cdFx0XHR0aGlzLiRlbC5hcHBlbmQoIHZpZXcuZWwgKTtcblx0XHR9LCB0aGlzICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0b3BlbjogZnVuY3Rpb24oKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUub3Blbi5jYWxsKCB0aGlzICk7XG5cdFx0dGhpcy5hZGp1c3RQb3NpdGlvbigpO1xuXHR9LFxuXG5cdGFkanVzdFBvc2l0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgb2Zmc2V0ID0gdGhpcy5jdXJyZW50Rm9udFZpZXcuJGVsLm9mZnNldCgpO1xuXHRcdHZhciBteUhlaWdodCA9IHRoaXMuY3VycmVudEZvbnRWaWV3LiRlbC5oZWlnaHQoKTtcblx0XHR2YXIgYXZhaWxhYmxlSGVpZ2h0ID0gJCggJy53cC1mdWxsLW92ZXJsYXktc2lkZWJhci1jb250ZW50JyApLmhlaWdodCgpO1xuXHRcdHZhciBtaWRkbGUgPSBhdmFpbGFibGVIZWlnaHQgLyAyO1xuXG5cdFx0ZGVidWcoICdhZGp1c3RpbmcgcG9zaXRpb24gb2YgbWVudTsgb2Zmc2V0LnRvcCcsIG9mZnNldC50b3AsICdtaWRkbGUnLCBtaWRkbGUsICdjYWxjJywgb2Zmc2V0LnRvcCAtICggbXlIZWlnaHQgLyAyICkgKTtcblx0XHRpZiAoIG9mZnNldC50b3AgLSAoIG15SGVpZ2h0IC8gMiApID49IG1pZGRsZSApIHtcblx0XHRcdGRlYnVnKCAnbWVudTogY2xvc2VyIHRvIGJvdHRvbScgKTtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnb3Blbi1kb3duJyApLmNzcygge1xuXHRcdFx0XHRoZWlnaHQ6IG9mZnNldC50b3AgLSBteUhlaWdodCAtIDEwXG5cdFx0XHR9ICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlYnVnKCAnbWVudTogY2xvc2VyIHRvIHRvcCcgKTtcblx0XHRcdGRlYnVnKCAnb2Zmc2V0LnRvcCcsIG9mZnNldC50b3AsICdhdmFpbGFibGVIZWlnaHQnLCBhdmFpbGFibGVIZWlnaHQsICdteUhlaWdodCcsIG15SGVpZ2h0ICk7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ29wZW4tZG93bicgKS5jc3MoIHtcblx0XHRcdFx0aGVpZ2h0OiBhdmFpbGFibGVIZWlnaHQgLSBvZmZzZXQudG9wIC0gMTBcblx0XHRcdH0gKTtcblx0XHR9XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250RHJvcGRvd247XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0bWVudVZpZXdNaXhpbiA9IHJlcXVpcmUoICcuLi9taXhpbnMvbWVudS12aWV3LW1peGluJyApO1xuXG52YXIgRm9udFNpemVEcm9wZG93biA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtZHJvcGRvd24nICksXG5DdXJyZW50Rm9udFNpemUgPSByZXF1aXJlKCAnLi4vdmlld3MvY3VycmVudC1mb250LXNpemUnICksXG50cmFuc2xhdGUgPSByZXF1aXJlKCAnLi4vaGVscGVycy90cmFuc2xhdGUnICk7XG5cbnZhciBGb250U2l6ZUNvbnRyb2wgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtY29udHJvbCBmb250LXByb3BlcnR5LWNvbnRyb2wnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMubWVudSA9ICdmb250U2l6ZSc7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdHRoaXMubWVudUtleSA9IHRoaXMudHlwZS5pZCArICc6JyArIHRoaXMubWVudTtcblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBtZW51Vmlld01peGluKCB0aGlzICk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRBdmFpbGFibGVGb250OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5mb250RGF0YS5maW5kV2hlcmUoIHsgaWQ6IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgfSApO1xuXHRcdGlmICggIXNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0fSxcblxuXHRnZXRDdXJyZW50Rm9udFNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpO1xuXHRcdGlmICggc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0dmFyIHNpemUgPSB0aGlzLmN1cnJlbnRGb250LmdldCggJ3NpemUnICk7XG5cdFx0XHRpZiAoIHNpemUgJiYgc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRTaXplTmFtZUZyb21JZCggc2l6ZSApICkge1xuXHRcdFx0XHRyZXR1cm4gc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRTaXplTmFtZUZyb21JZCggc2l6ZSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRyYW5zbGF0ZSggJ05vcm1hbCBTaXplJyApO1xuXHRcdH1cblx0fSxcblxuXHRpc0RlZmF1bHRGb250OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKCAhICggdGhpcy5jdXJyZW50Rm9udC5oYXMoICdpZCcgKSAmJiB0aGlzLmN1cnJlbnRGb250LmdldCggJ2lkJyApLmxlbmd0aCA+IDAgKSApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJycgKTtcblx0XHRpZiAoIHRoaXMuaXNEZWZhdWx0Rm9udCgpICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19mb250LXByb3BlcnR5LWNvbnRyb2wtLWluYWN0aXZlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2pldHBhY2stZm9udHNfX2ZvbnQtcHJvcGVydHktY29udHJvbC0taW5hY3RpdmUnICk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEN1cnJlbnRGb250U2l6ZSgge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmdldEN1cnJlbnRGb250U2l6ZSgpXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFNpemVEcm9wZG93bigge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0c2VsZWN0ZWRBdmFpbGFibGVGb250OiB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpLFxuXHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmdldEN1cnJlbnRGb250U2l6ZSgpXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbnRTaXplQ29udHJvbDtcbiIsInZhciBGb250U2l6ZU9wdGlvbiA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtb3B0aW9uJyApLFxuRHJvcGRvd25UZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZScgKTtcblxudmFyIEZvbnRTaXplRHJvcGRvd24gPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtZHJvcGRvd24gZm9udC1wcm9wZXJ0eS1jb250cm9sLWRyb3Bkb3duJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IG9wdHMuc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gb3B0cy5jdXJyZW50Rm9udFNpemU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdGlmICggdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHR2YXIgc2l6ZU9wdGlvbnMgPSB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250U2l6ZU9wdGlvbnMoKTtcblx0XHRcdHNpemVPcHRpb25zLmZvckVhY2goIGZ1bmN0aW9uKCBvcHRpb24gKSB7XG5cdFx0XHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRTaXplT3B0aW9uKCB7XG5cdFx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRcdGlkOiBvcHRpb24uaWQsXG5cdFx0XHRcdFx0bmFtZTogb3B0aW9uLm5hbWUsXG5cdFx0XHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmN1cnJlbnRGb250U2l6ZVxuXHRcdFx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHRcdH0uYmluZCggdGhpcyApICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250U2l6ZURyb3Bkb3duO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtb3B0aW9uIGpldHBhY2stZm9udHNfX2ZvbnQtcHJvcGVydHktb3B0aW9uJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnc2V0U2l6ZU9wdGlvbicsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tTZWxlY3QnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuaWQgPSBvcHRzLmlkO1xuXHRcdHRoaXMubmFtZSA9IG9wdHMubmFtZTtcblx0XHR0aGlzLmN1cnJlbnRGb250U2l6ZSA9IG9wdHMuY3VycmVudEZvbnRTaXplO1xuXHR9LFxuXG5cdGNoZWNrU2VsZWN0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC5rZXkgPT09ICdFbnRlcicgKSB7XG5cdFx0XHR0aGlzLiRlbC5jbGljaygpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubmFtZSApO1xuXHRcdHRoaXMuJGVsLmF0dHIoICdkYXRhLW5hbWUnLCB0aGlzLm5hbWUgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRTaXplID09PSB0aGlzLm5hbWUgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2N1cnJlbnQnICk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLmF0dHIoICd0YWJpbmRleCcsICcwJyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHNldFNpemVPcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ3NldC1zaXplJywgeyBzaXplOiB0aGlzLmlkLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6Rm9udFR5cGVWaWV3JyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBGb250Q29udHJvbFZpZXcgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1jb250cm9sJyApLFxuXHRGb250VmFyaWFudENvbnRyb2wgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC12YXJpYW50LWNvbnRyb2wnICksXG5cdEZvbnRTaXplQ29udHJvbCA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtY29udHJvbCcgKTtcblxuLy8gQSBmb250IGNvbnRyb2wgVmlldyBmb3IgYSBwYXJ0aWN1bGFyIHNldHRpbmcgdHlwZVxudmFyIEZvbnRUeXBlVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX3R5cGUnLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdjbG9zZU1lbnVzJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggJzxkaXYgY2xhc3M9XCJqZXRwYWNrLWZvbnRzX190eXBlXCIgZGF0YS1mb250LXR5cGU9XCInICsgdGhpcy50eXBlLmlkICsgJ1wiPjxoMyBjbGFzcz1cImpldHBhY2stZm9udHNfX3R5cGUtaGVhZGVyXCI+JyArIHRoaXMudHlwZS5uYW1lICsgJzwvaDM+PC9kaXY+JyApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRDb250cm9sVmlldygge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bW9kZWw6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHZhciBzdWJNZW51c0NvbnRhaW5lciA9IEJhY2tib25lLiQoICc8ZGl2IGNsYXNzPVwiamV0cGFjay1mb250c19fdHlwZS1vcHRpb25zXCI+PC9kaXY+JyApO1xuXHRcdHN1Yk1lbnVzQ29udGFpbmVyLmFwcGVuZCggbmV3IEZvbnRWYXJpYW50Q29udHJvbCgge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHN1Yk1lbnVzQ29udGFpbmVyLmFwcGVuZCggbmV3IEZvbnRTaXplQ29udHJvbCgge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggc3ViTWVudXNDb250YWluZXIgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRjbG9zZU1lbnVzOiBmdW5jdGlvbigpIHtcblx0XHRkZWJ1ZyggJ3R5cGUgY2xpY2tlZDsgY2xvc2luZyBtZW51cycsIHRoaXMudHlwZSApO1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250VHlwZVZpZXc7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0bWVudVZpZXdNaXhpbiA9IHJlcXVpcmUoICcuLi9taXhpbnMvbWVudS12aWV3LW1peGluJyApO1xuXG52YXIgRm9udFZhcmlhbnREcm9wZG93biA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXZhcmlhbnQtZHJvcGRvd24nICksXG5DdXJyZW50Rm9udFZhcmlhbnQgPSByZXF1aXJlKCAnLi4vdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQnICk7XG5cbnZhciBGb250VmFyaWFudENvbnRyb2wgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXZhcmlhbnQtY29udHJvbCBmb250LXByb3BlcnR5LWNvbnRyb2wnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMubWVudSA9ICdmb250VmFyaWFudCc7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdHRoaXMubWVudUtleSA9IHRoaXMudHlwZS5pZCArICc6JyArIHRoaXMubWVudTtcblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBtZW51Vmlld01peGluKCB0aGlzICk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRBdmFpbGFibGVGb250OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5mb250RGF0YS5maW5kV2hlcmUoIHsgaWQ6IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgfSApO1xuXHRcdGlmICggIXNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0fSxcblxuXHRnZXRDdXJyZW50Rm9udFZhcmlhbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpO1xuXHRcdGlmICggc2VsZWN0ZWRBdmFpbGFibGVGb250ICYmIHRoaXMudHlwZS5mdmRBZGp1c3QgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5jdXJyZW50Rm9udC5nZXQoICdjdXJyZW50RnZkJyApO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpO1xuXHRcdHZhciBtdWx0aU9wdGlvbnM7XG5cdFx0aWYgKCBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgJiYgc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRWYXJpYW50T3B0aW9ucygpLmxlbmd0aCA+IDEgKSB7XG5cdFx0XHRtdWx0aU9wdGlvbnMgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtdWx0aU9wdGlvbnMgPSBmYWxzZTtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250VmlldyApIHtcblx0XHRcdHRoaXMuY3VycmVudEZvbnRWaWV3LnJlbW92ZSgpO1xuXHRcdH1cblx0XHRpZiAoIHRoaXMuZHJvcERvd25WaWV3ICkge1xuXHRcdFx0dGhpcy5kcm9wRG93blZpZXcucmVtb3ZlKCk7XG5cdFx0fVxuXHRcdGlmICggbXVsdGlPcHRpb25zICYmIHRoaXMudHlwZS5mdmRBZGp1c3QgKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRGb250VmlldyA9IG5ldyBDdXJyZW50Rm9udFZhcmlhbnQoIHtcblx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdFx0Y3VycmVudEZvbnRWYXJpYW50OiB0aGlzLmdldEN1cnJlbnRGb250VmFyaWFudCgpLFxuXHRcdFx0XHRtdWx0aU9wdGlvbnM6IG11bHRpT3B0aW9uc1xuXHRcdFx0fSApO1xuXHRcdFx0dGhpcy4kZWwuYXBwZW5kKCB0aGlzLmN1cnJlbnRGb250Vmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdFx0dGhpcy5kcm9wRG93blZpZXcgPSBuZXcgRm9udFZhcmlhbnREcm9wZG93bigge1xuXHRcdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0XHRzZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCksXG5cdFx0XHRcdGN1cnJlbnRGb250VmFyaWFudDogdGhpcy5nZXRDdXJyZW50Rm9udFZhcmlhbnQoKVxuXHRcdFx0fSApO1xuXHRcdFx0dGhpcy4kZWwuYXBwZW5kKCB0aGlzLmRyb3BEb3duVmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9udFZhcmlhbnRDb250cm9sO1xuIiwidmFyIEZvbnRWYXJpYW50T3B0aW9uID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdmFyaWFudC1vcHRpb24nICksXG5Ecm9wZG93blRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duVGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtdmFyaWFudC1kcm9wZG93biBmb250LXByb3BlcnR5LWNvbnRyb2wtZHJvcGRvd24nLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duVGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gb3B0cy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQ7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgPSBvcHRzLmN1cnJlbnRGb250VmFyaWFudDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0aWYgKCB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCAmJiB0aGlzLnR5cGUuZnZkQWRqdXN0ICkge1xuXHRcdFx0dmFyIHZhcmlhbnRPcHRpb25zID0gdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFZhcmlhbnRPcHRpb25zKCk7XG5cdFx0XHR2YXJpYW50T3B0aW9ucy5mb3JFYWNoKCBmdW5jdGlvbiggZnZkICkge1xuXHRcdFx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250VmFyaWFudE9wdGlvbigge1xuXHRcdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0XHRpZDogZnZkLFxuXHRcdFx0XHRcdGN1cnJlbnRGb250VmFyaWFudDogdGhpcy5jdXJyZW50Rm9udFZhcmlhbnRcblx0XHRcdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG52YXIgZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZnZkLXRvLXJlYWRhYmxlJyApLmdldEZvbnRWYXJpYW50TmFtZUZyb21JZDtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXZhcmlhbnQtb3B0aW9uIGpldHBhY2stZm9udHNfX2ZvbnQtcHJvcGVydHktb3B0aW9uJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnc2V0VmFyaWFudE9wdGlvbicsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tTZWxlY3QnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuaWQgPSBvcHRzLmlkO1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdH0sXG5cblx0Y2hlY2tTZWxlY3Q6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoIGV2ZW50LmtleSA9PT0gJ0VudGVyJyApIHtcblx0XHRcdHRoaXMuJGVsLmNsaWNrKCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkKCB0aGlzLmlkICkgKTtcblx0XHR0aGlzLiRlbC5kYXRhKCAnaWQnLCB0aGlzLmlkICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250VmFyaWFudCA9PT0gdGhpcy5pZCApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnY3VycmVudCcgKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0c2V0VmFyaWFudE9wdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnc2V0LXZhcmlhbnQnLCB7IHZhcmlhbnQ6IHRoaXMuaWQsIHR5cGU6IHRoaXMudHlwZS5pZCB9ICk7XG5cdH1cblxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOk1hc3RlclZpZXcnICksXG5cdGF2YWlsYWJsZUZvbnRzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXZhaWxhYmxlLWZvbnRzJyApLFxuXHRhdmFpbGFibGVUeXBlcyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2F2YWlsYWJsZS10eXBlcycgKTtcblxudmFyIEZvbnRUeXBlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdHlwZScgKSxcblx0QXZhaWxhYmxlRm9udHMgPSByZXF1aXJlKCAnLi4vY29sbGVjdGlvbnMvYXZhaWxhYmxlLWZvbnRzJyApO1xuXG52YXIgRGVmYXVsdEZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL2RlZmF1bHQtZm9udCcgKTtcblxuLy8gSW5pdGlhbGl6ZSB0aGUgZGVmYXVsdCBQcm92aWRlciBWaWV3c1xucmVxdWlyZSggJy4uL3Byb3ZpZGVycy9nb29nbGUnICk7XG5cbi8vIFRoZSBtYWluIGZvbnQgY29udHJvbCBWaWV3LCBjb250YWluaW5nIHNlY3Rpb25zIGZvciBlYWNoIHNldHRpbmcgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMgPSBvcHRzLnNlbGVjdGVkRm9udHM7XG5cdFx0ZGVidWcoICdpbml0IHdpdGggY3VycmVudGx5IHNlbGVjdGVkIGZvbnRzOicsIHRoaXMuc2VsZWN0ZWRGb250cy50b0pTT04oKSApO1xuXHRcdHRoaXMudHlwZVZpZXdzID0gW107XG5cdFx0dGhpcy5oZWFkaW5nRm9udHMgPSBuZXcgQXZhaWxhYmxlRm9udHMoIGF2YWlsYWJsZUZvbnRzICk7XG5cdFx0dGhpcy5ib2R5Rm9udHMgPSBuZXcgQXZhaWxhYmxlRm9udHMoIHRoaXMuaGVhZGluZ0ZvbnRzLndoZXJlKCB7IGJvZHlUZXh0OiB0cnVlIH0gKSApO1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdjaGFuZ2UtZm9udCcsIHRoaXMudXBkYXRlQ3VycmVudEZvbnQgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnc2V0LXZhcmlhbnQnLCB0aGlzLnNldEZvbnRWYXJpYW50ICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ3NldC1zaXplJywgdGhpcy5zZXRGb250U2l6ZSApO1xuXHR9LFxuXG5cdGNsb3NlQWxsTWVudXM6IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0c2V0Rm9udFZhcmlhbnQ6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGRlYnVnKCAnZm9udCB2YXJpYW50IGNoYW5nZWQnLCBkYXRhICk7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5zZWxlY3RlZEZvbnRzLmdldEZvbnRCeVR5cGUoIGRhdGEudHlwZSApO1xuXHRcdG1vZGVsLnNldCggJ2N1cnJlbnRGdmQnLCBkYXRhLnZhcmlhbnQgKTtcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMuc2V0U2VsZWN0ZWRGb250KCBtb2RlbC50b0pTT04oKSApO1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0c2V0Rm9udFNpemU6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGRlYnVnKCAnZm9udCBzaXplIGNoYW5nZWQnLCBkYXRhICk7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5zZWxlY3RlZEZvbnRzLmdldEZvbnRCeVR5cGUoIGRhdGEudHlwZSApO1xuXHRcdG1vZGVsLnNldCggJ3NpemUnLCBkYXRhLnNpemUgKTtcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMuc2V0U2VsZWN0ZWRGb250KCBtb2RlbC50b0pTT04oKSApO1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0dXBkYXRlQ3VycmVudEZvbnQ6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGRhdGEuZm9udC5zZXQoIHsgdHlwZTogZGF0YS50eXBlIH0gKTtcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMuc2V0U2VsZWN0ZWRGb250KCBkYXRhLmZvbnQudG9KU09OKCkgKTtcblx0XHRkZWJ1ZyggJ3VwZGF0ZUN1cnJlbnRGb250IHdpdGgnLCBkYXRhLmZvbnQudG9KU09OKCksICd0bycsIHRoaXMuc2VsZWN0ZWRGb250cy5nZXRGb250QnlUeXBlKCBkYXRhLnR5cGUgKS50b0pTT04oKSApO1xuXHRcdC8vIFNldHRpbmcgaGVhZGluZ3MgdHlwZSBvdmVyd3JpdGVzIHRoZSBkZXByZWNhdGVkIHNpdGUtdGl0bGUgdHlwZVxuXHRcdGlmICggZGF0YS50eXBlID09PSAnaGVhZGluZ3MnICkge1xuXHRcdFx0dGhpcy51cGRhdGVDdXJyZW50Rm9udCggeyBmb250OiBuZXcgRGVmYXVsdEZvbnQoKSwgdHlwZTogJ3NpdGUtdGl0bGUnIH0gKTtcblx0XHR9XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudHlwZVZpZXdzLmZvckVhY2goIGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdFx0dmlldy5yZW1vdmUoKTtcblx0XHR9ICk7XG5cdFx0dGhpcy4kZWwudGV4dCggJycgKTsgLy8gVE9ETzogYmV0dGVyIHRvIHVwZGF0ZSBlYWNoIFZpZXcgdGhhbiBvdmVyd3JpdGVcblx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBjb250cm9scyBmb3IgZm9udCB0eXBlcycsIGF2YWlsYWJsZVR5cGVzICk7XG5cdFx0dGhpcy50eXBlVmlld3MgPSBhdmFpbGFibGVUeXBlcy5tYXAoIHRoaXMucmVuZGVyVHlwZUNvbnRyb2wuYmluZCggdGhpcyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVuZGVyVHlwZUNvbnRyb2w6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdHZhciBmb250cztcblx0XHRpZiAoIHR5cGUuYm9keVRleHQgPT09IHRydWUgKSB7XG5cdFx0XHRmb250cyA9IHRoaXMuYm9keUZvbnRzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb250cyA9IHRoaXMuaGVhZGluZ0ZvbnRzO1xuXHRcdH1cblx0XHR2YXIgdmlldyA9IG5ldyBGb250VHlwZSgge1xuXHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLnNlbGVjdGVkRm9udHMuZ2V0Rm9udEJ5VHlwZSggdHlwZS5pZCApLFxuXHRcdFx0Zm9udERhdGE6IGZvbnRzXG5cdFx0fSApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggdmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB2aWV3O1xuXHR9LFxuXG5cdGxvYWRGb250czogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnbG9hZC1tZW51LWZvbnRzJyApO1xuXHR9XG5cbn0gKTtcbiJdfQ==
