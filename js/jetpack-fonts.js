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
		if ( !this.disableFocus ) {
			this.$el.attr( 'tabindex', '0' );
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
		this.$el.attr( 'tabindex', '0' );
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
		this.$el.attr( 'tabindex', '0' );
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
		this.$el.attr( 'tabindex', '0' );
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
		'click': 'resetToDefault',
		'keydown': 'checkKeyboardReset'
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
		this.$el.attr( 'tabindex', '0' );
		return this;
	},

	resetToDefault: function() {
		Emitter.trigger( 'change-font', { font: new DefaultFont(), type: this.type.id } );
	},

	checkKeyboardReset: function(event) {
		if (event.key === 'Enter') {
			this.resetToDefault();
		}
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
		this.disableFocus = Boolean( opts.disableFocus );
		if ( this.currentFont ) {
			this.listenTo( this.currentFont, 'change', this.render );
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsInNyYy9qcy9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMuanMiLCJzcmMvanMvaGVscGVycy9hcGkuanMiLCJzcmMvanMvaGVscGVycy9hdmFpbGFibGUtZm9udHMuanMiLCJzcmMvanMvaGVscGVycy9hdmFpbGFibGUtdHlwZXMuanMiLCJzcmMvanMvaGVscGVycy9iYWNrYm9uZS5qcyIsInNyYy9qcy9oZWxwZXJzL2Jvb3RzdHJhcC5qcyIsInNyYy9qcy9oZWxwZXJzL2VtaXR0ZXIuanMiLCJzcmMvanMvaGVscGVycy9mdmQtdG8tcmVhZGFibGUuanMiLCJzcmMvanMvaGVscGVycy9wcm92aWRlci12aWV3cy5qcyIsInNyYy9qcy9oZWxwZXJzL3RyYW5zbGF0ZS5qcyIsInNyYy9qcy9oZWxwZXJzL3VuZGVyc2NvcmUuanMiLCJzcmMvanMvaGVscGVycy93ZWJmb250LmpzIiwic3JjL2pzL2luZGV4LmpzIiwic3JjL2pzL21peGlucy9tZW51LXZpZXctbWl4aW4uanMiLCJzcmMvanMvbW9kZWxzL2F2YWlsYWJsZS1mb250LmpzIiwic3JjL2pzL21vZGVscy9kZWZhdWx0LWZvbnQuanMiLCJzcmMvanMvbW9kZWxzL3NlbGVjdGVkLWZvbnQuanMiLCJzcmMvanMvbW9kZWxzL3NlbGVjdGVkLWZvbnRzLmpzIiwic3JjL2pzL3Byb3ZpZGVycy9nb29nbGUuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LXNpemUuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQuanMiLCJzcmMvanMvdmlld3MvY3VycmVudC1mb250LmpzIiwic3JjL2pzL3ZpZXdzL2RlZmF1bHQtZm9udC1idXR0b24uanMiLCJzcmMvanMvdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZS5qcyIsInNyYy9qcy92aWV3cy9kcm9wZG93bi1pdGVtLmpzIiwic3JjL2pzL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtY29udHJvbC5qcyIsInNyYy9qcy92aWV3cy9mb250LWRyb3Bkb3duLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtc2l6ZS1jb250cm9sLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtc2l6ZS1kcm9wZG93bi5qcyIsInNyYy9qcy92aWV3cy9mb250LXNpemUtb3B0aW9uLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtdHlwZS5qcyIsInNyYy9qcy92aWV3cy9mb250LXZhcmlhbnQtY29udHJvbC5qcyIsInNyYy9qcy92aWV3cy9mb250LXZhcmlhbnQtZHJvcGRvd24uanMiLCJzcmMvanMvdmlld3MvZm9udC12YXJpYW50LW9wdGlvbi5qcyIsInNyYy9qcy92aWV3cy9tYXN0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgcmV0dXJuICgnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LFxuICAvLyB3aGVyZSB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gbG9jYWxTdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXJjYXNlZCBsZXR0ZXIsIGkuZS4gXCJuXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcigpIHtcbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW3ByZXZDb2xvcisrICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZXNwYWNlKSB7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZGlzYWJsZWQoKSB7XG4gIH1cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIC8vIGRlZmluZSB0aGUgYGVuYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcblxuICAgIHZhciBzZWxmID0gZW5hYmxlZDtcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcbiAgICBpZiAobnVsbCA9PSBzZWxmLnVzZUNvbG9ycykgc2VsZi51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICAgIGlmIChudWxsID09IHNlbGYuY29sb3IgJiYgc2VsZi51c2VDb2xvcnMpIHNlbGYuY29sb3IgPSBzZWxlY3RDb2xvcigpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuZm9ybWF0QXJncykge1xuICAgICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICB9XG4gICAgdmFyIGxvZ0ZuID0gZW5hYmxlZC5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBlbmFibGVkLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHZhciBmbiA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpID8gZW5hYmxlZCA6IGRpc2FibGVkO1xuXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICByZXR1cm4gZm47XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWVzcGFjZXMgfHwgJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEB0aHJvd3Mge0Vycm9yfSB0aHJvdyBhbiBlcnJvciBpZiB2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIG51bWJlclxuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcbiAgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIHZhbC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgaXNOYU4odmFsKSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1pbGxpc2Vjb25kcz98bXNlY3M/fG1zfHNlY29uZHM/fHNlY3M/fHN8bWludXRlcz98bWlucz98bXxob3Vycz98aHJzP3xofGRheXM/fGR8eWVhcnM/fHlycz98eSk/JC9pLmV4ZWMoXG4gICAgc3RyXG4gICk7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgdmFyIHR5cGUgPSAobWF0Y2hbMl0gfHwgJ21zJykudG9Mb3dlckNhc2UoKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAneWVhcnMnOlxuICAgIGNhc2UgJ3llYXInOlxuICAgIGNhc2UgJ3lycyc6XG4gICAgY2FzZSAneXInOlxuICAgIGNhc2UgJ3knOlxuICAgICAgcmV0dXJuIG4gKiB5O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnO1xuICB9XG4gIGlmIChtcyA+PSBoKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJztcbiAgfVxuICBpZiAobXMgPj0gbSkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyAnbSc7XG4gIH1cbiAgaWYgKG1zID49IHMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnO1xuICB9XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRMb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKSB8fFxuICAgIHBsdXJhbChtcywgaCwgJ2hvdXInKSB8fFxuICAgIHBsdXJhbChtcywgbSwgJ21pbnV0ZScpIHx8XG4gICAgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJykgfHxcbiAgICBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChtcyA8IG4gKiAxLjUpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihtcyAvIG4pICsgJyAnICsgbmFtZTtcbiAgfVxuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBBdmFpbGFibGVGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9hdmFpbGFibGUtZm9udCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCgge1xuXHRtb2RlbDogQXZhaWxhYmxlRm9udFxufSApO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB3aW5kb3cud3AuY3VzdG9taXplO1xuIiwidmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYm9vdHN0cmFwJyApO1xuXG52YXIgZm9udHMgPSBbXTtcbmlmICggc2V0dGluZ3MgJiYgc2V0dGluZ3MuZm9udHMgKSB7XG5cdGZvbnRzID0gc2V0dGluZ3MuZm9udHM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZm9udHM7XG5cbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Jvb3RzdHJhcCcgKTtcblxuZnVuY3Rpb24gY29tcGFyZVR5cGVzKCBhLCBiICkge1xuXHRpZiAoIGEuaWQgPT09ICdoZWFkaW5ncycgKSB7XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdGlmICggYi5pZCA9PT0gJ2hlYWRpbmdzJyApIHtcblx0XHRyZXR1cm4gMTtcblx0fVxuXHRyZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlU2l0ZVRpdGxlKCB0eXBlcyApIHtcblx0cmV0dXJuIHR5cGVzLnJlZHVjZSggZnVuY3Rpb24oIHByZXZpb3VzLCB0eXBlICkge1xuXHRcdGlmICggdHlwZS5pZCAhPT0gJ3NpdGUtdGl0bGUnICkge1xuXHRcdFx0cHJldmlvdXMucHVzaCggdHlwZSApO1xuXHRcdH1cblx0XHRyZXR1cm4gcHJldmlvdXM7XG5cdH0sIFtdICk7XG59XG5cbnZhciB0eXBlcyA9IFtdO1xuaWYgKCBzZXR0aW5ncyAmJiBzZXR0aW5ncy50eXBlcyApIHtcblx0Ly8gQXJyYW5nZSB0aGUgY29udHJvbHMgc28gdGhhdCBib2R5LXRleHQgaXMgZmlyc3Rcblx0dHlwZXMgPSBzZXR0aW5ncy50eXBlcy5zb3J0KCBjb21wYXJlVHlwZXMgKTtcblx0Ly8gUmVtb3ZlIGRlcHJlY2F0ZWQgc2l0ZS10aXRsZSBjb250cm9sIGZyb20gVUlcblx0dHlwZXMgPSByZW1vdmVTaXRlVGl0bGUoIHR5cGVzICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdHlwZXM7XG4iLCIvKiBnbG9iYWxzIEJhY2tib25lICovXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lO1xuIiwidmFyIHNldHRpbmdzID0gd2luZG93Ll9KZXRwYWNrRm9udHM7XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3M7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0XyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gXy5leHRlbmQoIEJhY2tib25lLkV2ZW50cyApO1xuXG4iLCJ2YXIgc3R5bGVPcHRpb25zID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcblx0PyB3aW5kb3cuX0pldHBhY2tGb250cy5mdmRNYXBcblx0OiB7XG5cdFx0J24xJzogJ1RoaW4nLFxuXHRcdCdpMSc6ICdUaGluIEl0YWxpYycsXG5cdFx0J28xJzogJ1RoaW4gT2JsaXF1ZScsXG5cdFx0J24yJzogJ0V4dHJhIExpZ2h0Jyxcblx0XHQnaTInOiAnRXh0cmEgTGlnaHQgSXRhbGljJyxcblx0XHQnbzInOiAnRXh0cmEgTGlnaHQgT2JsaXF1ZScsXG5cdFx0J24zJzogJ0xpZ2h0Jyxcblx0XHQnaTMnOiAnTGlnaHQgSXRhbGljJyxcblx0XHQnbzMnOiAnTGlnaHQgT2JsaXF1ZScsXG5cdFx0J240JzogJ1JlZ3VsYXInLFxuXHRcdCdpNCc6ICdJdGFsaWMnLFxuXHRcdCdvNCc6ICdPYmxpcXVlJyxcblx0XHQnbjUnOiAnTWVkaXVtJyxcblx0XHQnaTUnOiAnTWVkaXVtIEl0YWxpYycsXG5cdFx0J281JzogJ01lZGl1bSBPYmxpcXVlJyxcblx0XHQnbjYnOiAnU2VtaWJvbGQnLFxuXHRcdCdpNic6ICdTZW1pYm9sZCBJdGFsaWMnLFxuXHRcdCdvNic6ICdTZW1pYm9sZCBPYmxpcXVlJyxcblx0XHQnbjcnOiAnQm9sZCcsXG5cdFx0J2k3JzogJ0JvbGQgSXRhbGljJyxcblx0XHQnbzcnOiAnQm9sZCBPYmxpcXVlJyxcblx0XHQnbjgnOiAnRXh0cmEgQm9sZCcsXG5cdFx0J2k4JzogJ0V4dHJhIEJvbGQgSXRhbGljJyxcblx0XHQnbzgnOiAnRXh0cmEgQm9sZCBPYmxpcXVlJyxcblx0XHQnbjknOiAnVWx0cmEgQm9sZCcsXG5cdFx0J2k5JzogJ1VsdHJhIEJvbGQgSXRhbGljJyxcblx0XHQnbzknOiAnVWx0cmEgQm9sZCBPYmxpcXVlJ1xuXHR9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkOiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0dmFyIG1hdGNoID0gc3R5bGVPcHRpb25zWyBpZCBdO1xuXHRcdGlmICggbWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0fVxuXHRcdHJldHVybiAnUmVndWxhcic7XG5cdH1cbn07XG4iLCIvKipcbiAqIFRoaXMgaGVscGVyIHNldHMgdXAgVmlld3MgdG8gcmVuZGVyIGVhY2ggZm9udCBmb3Igc3BlY2lmaWMgcHJvdmlkZXJzLiBFYWNoXG4gKiBWaWV3IHNob3VsZCBiZSBhbiBpbnN0YW5jZSBvZiBgd3AuY3VzdG9taXplLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXdgICh3aGljaFxuICogaXMgYSBgQmFja2JvbmUuVmlld2ApIHRoYXQgd2lsbCByZW5kZXIgaXRzIGZvbnQgb3B0aW9uIHRvIHRoZSBmb250IGxpc3QuXG4gKiBBZGRpdGlvbmFsIHByb3ZpZGVyIFZpZXdzIGNhbiBiZSBhZGRlZCBieSBhZGRpbmcgdG8gdGhlXG4gKiBgd3AuY3VzdG9taXplLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzYCBvYmplY3QgdXNpbmcgdGhlIHByb3ZpZGVyIGlkIGFzIHRoZVxuICoga2V5LiBUaGUgb25seSB0aGluZyB0aGF0IG5lZWRzIHRvIGJlIGFkZGVkIGZvciBlYWNoIFByb3ZpZGVyVmlldyBpcyB0aGVcbiAqIGByZW5kZXJgIG1ldGhvZC4gRWFjaCBQcm92aWRlclZpZXcgaGFzIGFzIGl0cyBgbW9kZWxgIG9iamVjdCB0aGUgZm9udCBvYmplY3RcbiAqIGl0IG5lZWRzIHRvIGRpc3BsYXksIGluY2x1ZGluZyB0aGUgYGNzc05hbWVgLCBgZGlzcGxheU5hbWVgLCBhbmQgYGlkYCBhdHRyaWJ1dGVzLlxuICpcbiAqIEFkZGl0aW9uYWxseSwgaWYgeW91ciBwcm92aWRlciBuZWVkcyBzcGVjaWZpYyBsb2dpYyBmb3IgaG92ZXIgc3RhdGVzICh0aGlua1xuICogYmFja2dyb3VuZCBpbWFnZSBzd2FwcGluZyksIHlvdSBjYW4gaW1wbGVtZW50IGBtb3VzZWVudGVyYCBhbmQgYG1vdXNlbGVhdmVgIG1ldGhvZHMuXG4gKi9cblxudmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOnByb3ZpZGVyLXZpZXdzJyApO1xuXG52YXIgRHJvcGRvd25JdGVtID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLWl0ZW0nICk7XG5pZiAoICEgYXBpLkpldHBhY2tGb250cyApIHtcblx0YXBpLkpldHBhY2tGb250cyA9IHt9O1xufVxuaWYgKCAhIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApIHtcblx0YXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzID0ge307XG59XG5hcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlldyA9IERyb3Bkb3duSXRlbS5leHRlbmQoIHtcblx0bW91c2VlbnRlcjogZnVuY3Rpb24oKSB7fSxcblx0bW91c2VsZWF2ZTogZnVuY3Rpb24oKSB7fVxufSApO1xuXG52YXIgcHJvdmlkZXJWaWV3cyA9IHt9O1xuXG5mdW5jdGlvbiBpbXBvcnRQcm92aWRlclZpZXdzKCkge1xuXHRkZWJ1ZyggJ2ltcG9ydGluZyBwcm92aWRlciB2aWV3cyBmcm9tJywgYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICk7XG5cdGlmICggYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkge1xuXHRcdE9iamVjdC5rZXlzKCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKS5mb3JFYWNoKCBmdW5jdGlvbiggcHJvdmlkZXJLZXkgKSB7XG5cdFx0XHRwcm92aWRlclZpZXdzWyBwcm92aWRlcktleSBdID0gYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzWyBwcm92aWRlcktleSBdO1xuXHRcdH0gKTtcblx0fVxufVxuXG5mdW5jdGlvbiBnZXRWaWV3Rm9yUHJvdmlkZXIoIHByb3ZpZGVyICkge1xuXHRpbXBvcnRQcm92aWRlclZpZXdzKCk7XG5cdGlmICggcHJvdmlkZXJWaWV3c1sgcHJvdmlkZXIgXSApIHtcblx0XHRkZWJ1ZyggJ2ZvdW5kIHZpZXcgZm9yIHByb3ZpZGVyJywgcHJvdmlkZXIgKTtcblx0XHRyZXR1cm4gcHJvdmlkZXJWaWV3c1sgcHJvdmlkZXIgXTtcblx0fVxuXHRkZWJ1ZyggJ25vIHZpZXcgZm91bmQgZm9yIHByb3ZpZGVyJywgcHJvdmlkZXIgKTtcblx0cmV0dXJuIG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRWaWV3Rm9yUHJvdmlkZXI6IGdldFZpZXdGb3JQcm92aWRlclxufTtcbiIsInZhciB0cmFuc2xhdGlvbnMgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuXHQ/IHdpbmRvdy5fSmV0cGFja0ZvbnRzLmkxOG5cblx0OiB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggc3RyaW5nICkge1xuXHRpZiAoIHRyYW5zbGF0aW9uc1sgc3RyaW5nIF0gKSB7XG5cdFx0cmV0dXJuIHRyYW5zbGF0aW9uc1sgc3RyaW5nIF07XG5cdH1cblx0cmV0dXJuIHN0cmluZztcbn07XG4iLCIvKiBnbG9iYWxzIF8gKi9cbm1vZHVsZS5leHBvcnRzID0gXztcbiIsIi8qIGdsb2JhbHMgV2ViRm9udCAqL1xubW9kdWxlLmV4cG9ydHMgPSBXZWJGb250O1xuIiwidmFyIGFwaSA9IHJlcXVpcmUoICcuL2hlbHBlcnMvYXBpJyApO1xuXG52YXIgTWFzdGVyID0gcmVxdWlyZSggJy4vdmlld3MvbWFzdGVyJyApO1xuXG52YXIgU2VsZWN0ZWRGb250cyA9IHJlcXVpcmUoICcuL21vZGVscy9zZWxlY3RlZC1mb250cycgKTtcblxuLy8gQ3VzdG9taXplciBDb250cm9sXG5hcGkuY29udHJvbENvbnN0cnVjdG9yLmpldHBhY2tGb250cyA9IGFwaS5Db250cm9sLmV4dGVuZCgge1xuXHRyZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gR2V0IHRoZSBleGlzdGluZyBzZXR0aW5nIGZyb20gdGhlIEN1c3RvbWl6ZXJcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMgPSBuZXcgU2VsZWN0ZWRGb250cyggdGhpcy5zZXR0aW5nKCkgKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgc2V0dGluZyB3aGVuIHRoZSBjdXJyZW50IGZvbnQgY2hhbmdlc1xuXHRcdHRoaXMuc2VsZWN0ZWRGb250cy5vbiggJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5zZXR0aW5nKCB0aGlzLnNlbGVjdGVkRm9udHMudG9KU09OKCkgKTtcblx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXG5cdFx0dGhpcy52aWV3ID0gbmV3IE1hc3Rlcigge1xuXHRcdFx0c2VsZWN0ZWRGb250czogdGhpcy5zZWxlY3RlZEZvbnRzLFxuXHRcdFx0ZWw6IHRoaXMuY29udGFpbmVyXG5cdFx0fSApLnJlbmRlcigpO1xuXG5cdFx0Ly8gRGVsYXkgbG9hZGluZyBmb250cyB1bnRpbCB0aGUgU2VjdGlvbiBpcyBvcGVuZWRcblx0XHRhcGkuc2VjdGlvbiggdGhpcy5zZWN0aW9uKCkgKS5jb250YWluZXJcblx0XHQub25lKCAnZXhwYW5kZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdHNldFRpbWVvdXQoIHRoaXMudmlldy5sb2FkRm9udHMsIDIwMCApO1xuXHRcdH0uYmluZCggdGhpcyApICk7XG5cblx0XHRhcGkuc2VjdGlvbiggdGhpcy5zZWN0aW9uKCkgKS5jb250YWluZXJcblx0XHQub24oICdjb2xsYXBzZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMudmlldy5jbG9zZUFsbE1lbnVzKCk7XG5cdFx0fS5iaW5kKCB0aGlzICkgKTtcblx0fVxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czptZW51LXZpZXcnICksXG5cdEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG5mdW5jdGlvbiBtYXliZU9wZW5NZW51KCBrZXkgKSB7XG5cdGlmICgga2V5LnR5cGUgJiYga2V5LnR5cGUuaWQgJiYga2V5Lm1lbnUgKSB7XG5cdFx0a2V5ID0ga2V5LnR5cGUuaWQgKyAnOicgKyBrZXkubWVudTtcblx0fVxuXHRpZiAoIGtleSAhPT0gdGhpcy5tZW51S2V5ICkge1xuXHRcdHJldHVybiB0aGlzLmNsb3NlTWVudSgpO1xuXHR9XG5cdHRoaXMub3Blbk1lbnUoKTtcbn1cblxuZnVuY3Rpb24gb3Blbk1lbnUoKSB7XG5cdGRlYnVnKCAnb3BlbmluZyBtZW51JywgdGhpcy5tZW51S2V5ICk7XG5cdHRoaXMubWVudVN0YXR1cy5zZXQoIHsgaXNPcGVuOiB0cnVlIH0gKTtcbn1cblxuZnVuY3Rpb24gY2xvc2VNZW51KCkge1xuXHRkZWJ1ZyggJ2Nsb3NpbmcgbWVudScsIHRoaXMubWVudUtleSApO1xuXHR0aGlzLm1lbnVTdGF0dXMuc2V0KCB7IGlzT3BlbjogZmFsc2UgfSApO1xufVxuXG52YXIgbWVudVZpZXdNaXhpbiA9IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRpZiAoICEgdmlldy5saXN0ZW5UbyApIHtcblx0XHR0aHJvdyAnbWVudVZpZXdNaXhpbiByZXF1aXJlcyBhIEJhY2tib25lIFZpZXcgd2l0aCB0aGUgYGxpc3RlblRvYCBtZXRob2QnO1xuXHR9XG5cdGlmICggISB2aWV3Lm1lbnVLZXkgKSB7XG5cdFx0dGhyb3cgJ21lbnVWaWV3TWl4aW4gcmVxdWlyZXMgYSBWaWV3IHdpdGggYSBgbWVudUtleWAgc3RyaW5nIHByb3BlcnR5IHRvIGlkZW50aWZ5IHRoZSBtZW51Jztcblx0fVxuXHRpZiAoICEgdmlldy5tZW51U3RhdHVzICkge1xuXHRcdHZpZXcubWVudVN0YXR1cyA9IG5ldyBCYWNrYm9uZS5Nb2RlbCggeyBpc09wZW46IGZhbHNlIH0gKTtcblx0fVxuXG5cdHZpZXcubWF5YmVPcGVuTWVudSA9IG1heWJlT3Blbk1lbnU7XG5cdHZpZXcub3Blbk1lbnUgPSBvcGVuTWVudTtcblx0dmlldy5jbG9zZU1lbnUgPSBjbG9zZU1lbnU7XG5cblx0dmlldy5saXN0ZW5UbyggRW1pdHRlciwgJ29wZW4tbWVudScsIHZpZXcubWF5YmVPcGVuTWVudSApO1xuXHR2aWV3Lmxpc3RlblRvKCBFbWl0dGVyLCAnY2xvc2Utb3Blbi1tZW51cycsIHZpZXcuY2xvc2VNZW51ICk7XG5cblx0ZGVidWcoICdhZGRlZCBtZW51IGNhcGFiaWxpdHkgdG8gdGhlIFZpZXcnLCB2aWV3Lm1lbnVLZXkgKTtcblxuXHRyZXR1cm4gdmlldy5tZW51U3RhdHVzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZW51Vmlld01peGluO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdF8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApLFxuXHR0cmFuc2xhdGUgPSByZXF1aXJlKCAnLi4vaGVscGVycy90cmFuc2xhdGUnICk7XG5cbnZhciBzaXplT3B0aW9ucyA9IFtcblx0eyBpZDogLTEwLCBuYW1lOiB0cmFuc2xhdGUoICdUaW55JyApIH0sXG5cdHsgaWQ6IC01LCAgbmFtZTogdHJhbnNsYXRlKCAnU21hbGwnICkgfSxcblx0eyBpZDogMCwgICBuYW1lOiB0cmFuc2xhdGUoICdOb3JtYWwnICkgfSxcblx0eyBpZDogNSwgICBuYW1lOiB0cmFuc2xhdGUoICdMYXJnZScgKSB9LFxuXHR7IGlkOiAxMCwgIG5hbWU6IHRyYW5zbGF0ZSggJ0h1Z2UnICkgfVxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoIHtcblx0Z2V0Rm9udFZhcmlhbnRPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuZ2V0KCAnZnZkcycgKSApIHtcblx0XHRcdHJldHVybiB0aGlzLmdldCggJ2Z2ZHMnICk7XG5cdFx0fVxuXHRcdHJldHVybiBbXTtcblx0fSxcblxuXHRnZXRGb250U2l6ZU9wdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzaXplT3B0aW9ucztcblx0fSxcblxuXHRnZXRGb250U2l6ZU5hbWVGcm9tSWQ6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgb3B0aW9uID0gXy5maW5kV2hlcmUoIHNpemVPcHRpb25zLCB7IGlkOiBpZCB9ICk7XG5cdFx0aWYgKCBvcHRpb24gKSB7XG5cdFx0XHRyZXR1cm4gb3B0aW9uLm5hbWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufSApO1xuIiwidmFyIFNlbGVjdGVkRm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvc2VsZWN0ZWQtZm9udCcgKSxcblx0dHJhbnNsYXRlID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdHJhbnNsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGVkRm9udC5leHRlbmQoIHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXQoIHsgaWQ6ICcnLCBkaXNwbGF5TmFtZTogdHJhbnNsYXRlKCAnRGVmYXVsdCBUaGVtZSBGb250JyApLCBwcm92aWRlcjogJycgfSApO1xuXHR9XG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0dHJhbnNsYXRlID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdHJhbnNsYXRlJyApLFxuXHRhdmFpbGFibGVUeXBlcyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2F2YWlsYWJsZS10eXBlcycgKSxcblx0XyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFja19mb250czpzZWxlY3RlZC1mb250JyApO1xuXG4vLyBBIE1vZGVsIGZvciBhIGN1cnJlbnRseSBzZXQgZm9udCBzZXR0aW5nIGZvciB0aGlzIHRoZW1lXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCgge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm1heWJlU2V0Q3VycmVudEZ2ZCgpO1xuXHR9LFxuXHRkZWZhdWx0czoge1xuXHRcdCdkaXNwbGF5TmFtZSc6IHRyYW5zbGF0ZSggJ0RlZmF1bHQgVGhlbWUgRm9udCcgKVxuXHR9LFxuXHRzZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdEJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5zZXQuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdHRoaXMubWF5YmVTZXRDdXJyZW50RnZkKCk7XG5cdH0sXG5cdG1heWJlU2V0Q3VycmVudEZ2ZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHR5cGU7XG5cdFx0aWYgKCB0aGlzLmdldCggJ2N1cnJlbnRGdmQnICkgKSB7XG5cdFx0XHRkZWJ1ZyggJ0ZvbnQgYWxyZWFkeSBoYXMgYW4gZnZkJywgdGhpcy5nZXQoICdjdXJyZW50RnZkJyApICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmICggISB0aGlzLmdldCggJ2lkJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0eXBlID0gXy5maW5kV2hlcmUoIGF2YWlsYWJsZVR5cGVzLCB7IGlkOiB0aGlzLmdldCggJ3R5cGUnICkgfSApO1xuXHRcdGlmICggISB0eXBlIHx8ICEgdHlwZS5mdmRBZGp1c3QgfHwgISB0aGlzLmdldCggJ2Z2ZHMnICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuc2V0KCAnY3VycmVudEZ2ZCcsIHRoaXMucGlja0Z2ZCgpICk7XG5cdFx0ZGVidWcoICdGdmQgbm93IHNldCB0bzogJywgdGhpcy5nZXQoICdjdXJyZW50RnZkJyApICk7XG5cdH0sXG5cdHBpY2tGdmQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGFsZ29yaXRobSBoZXJlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9DU1MvZm9udC13ZWlnaHQjRmFsbGJhY2tcblx0XHQvLyB3ZSBhbHdheXMgZ28gZm9yIDQwMCB3ZWlnaHQgZmlyc3QuXG5cdFx0dmFyIHZhcmlhdGlvbnMgPSB0aGlzLmdldCggJ2Z2ZHMnICk7XG5cdFx0Ly8gZmlyc3QgdHJ5IG40XG5cdFx0dmFyIGkgPSA0O1xuXHRcdGlmICggdGhpcy5oYXNWYXJpYXRpb24oICduJyArIGksIHZhcmlhdGlvbnMgKSApIHtcblx0XHRcdHJldHVybiAnbicgKyBpO1xuXHRcdH1cblx0XHQvLyBuZXh0IHdlIHRyeSBuNVxuXHRcdGkgPSA1O1xuXHRcdGlmICggdGhpcy5oYXNWYXJpYXRpb24oICduJyArIGksIHZhcmlhdGlvbnMgKSApIHtcblx0XHRcdHJldHVybiAnbicgKyBpO1xuXHRcdH1cblx0XHQvLyBub3cgd2UgZ28gbGlnaHRlciwgdG8gMy0xXG5cdFx0Zm9yICggaSA9IDM7IGkgPj0gMTsgaS0tICkge1xuXHRcdFx0aWYgKCB0aGlzLmhhc1ZhcmlhdGlvbiggJ24nICsgaSwgdmFyaWF0aW9ucyApICkge1xuXHRcdFx0XHRyZXR1cm4gJ24nICsgaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gbm93IGRhcmtlciwgNi05XG5cdFx0Zm9yICggaSA9IDY7IGkgPD0gOTsgaSsrICkge1xuXHRcdFx0aWYgKCB0aGlzLmhhc1ZhcmlhdGlvbiggJ24nICsgaSwgdmFyaWF0aW9ucyApICkge1xuXHRcdFx0XHRyZXR1cm4gJ24nICsgaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gSSBndWVzcyBqdXN0IHJldHVybiBuNCBhbnl3YXlcblx0XHRyZXR1cm4gJ240Jztcblx0fSxcblx0aGFzVmFyaWF0aW9uOiBmdW5jdGlvbiggZnZkLCBmdmRzICkge1xuXHRcdHJldHVybiBfLmNvbnRhaW5zKCBmdmRzLCBmdmQgKTtcblx0fVxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpzZWxlY3RlZC1mb250cycgKSxcblx0dHJhbnNsYXRlID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdHJhbnNsYXRlJyApO1xuXG52YXIgU2VsZWN0ZWRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9zZWxlY3RlZC1mb250JyApO1xuXG4vLyBBIENvbGxlY3Rpb24gb2YgdGhlIGN1cnJlbnQgZm9udCBzZXR0aW5ncyBmb3IgdGhpcyB0aGVtZVxuLy8gV2UgdXNlIGEgTW9kZWwgaW5zdGVhZCBvZiBhbiBhY3R1YWwgQ29sbGVjdGlvbiBiZWNhdXNlIHdlIGNhbid0IG90aGVyd2lzZVxuLy8gaG9sZCB0d28gY29waWVzIG9mIHRoZSBzYW1lIGZvbnQgKHNhbWUgaWQpLlxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoIHtcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRpZiAoICEgZGF0YSApIHtcblx0XHRcdGRhdGEgPSBbXTtcblx0XHR9XG5cdFx0dmFyIGZvbnRzID0gZGF0YS5tYXAoIGZ1bmN0aW9uKCBmb250ICkge1xuXHRcdFx0cmV0dXJuIG5ldyBTZWxlY3RlZEZvbnQoIGZvbnQgKTtcblx0XHR9ICk7XG5cdFx0dGhpcy5zZXQoICdmb250cycsIGZvbnRzICk7XG5cdH0sXG5cblx0Z2V0Rm9udEJ5VHlwZTogZnVuY3Rpb24oIHR5cGUgKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5nZXQoICdmb250cycgKS5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2aW91cywgbW9kICkge1xuXHRcdFx0aWYgKCBtb2QuZ2V0KCAndHlwZScgKSA9PT0gdHlwZSApIHtcblx0XHRcdFx0cmV0dXJuIG1vZDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwcmV2aW91cztcblx0XHR9LCBudWxsICk7XG5cdFx0aWYgKCAhIG1vZGVsICkge1xuXHRcdFx0bW9kZWwgPSBuZXcgU2VsZWN0ZWRGb250KCB7IHR5cGU6IHR5cGUsIGRpc3BsYXlOYW1lOiB0cmFuc2xhdGUoICdEZWZhdWx0IFRoZW1lIEZvbnQnICkgfSApO1xuXHRcdFx0dGhpcy5nZXQoICdmb250cycgKS5wdXNoKCBtb2RlbCApO1xuXHRcdH1cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH0sXG5cblx0c2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0KCAnZm9udHMnICkubGVuZ3RoO1xuXHR9LFxuXG5cdHNldFNlbGVjdGVkRm9udDogZnVuY3Rpb24oIGZvbnQgKSB7XG5cdFx0ZGVidWcoICdzZXR0aW5nIHNlbGVjdGVkIGZvbnQgdG8nLCBmb250ICk7XG5cdFx0aWYgKCAhIGZvbnQudHlwZSApIHtcblx0XHRcdGRlYnVnKCAnQ2Fubm90IHNldCBzZWxlY3RlZCBmb250IGJlY2F1c2UgaXQgaGFzIG5vIHR5cGUnLCBmb250ICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHZhciBtb2RlbCA9IHRoaXMuZ2V0Rm9udEJ5VHlwZSggZm9udC50eXBlICk7XG5cdFx0bW9kZWwuY2xlYXIoIHsgc2lsZW50OiB0cnVlIH0gKTtcblx0XHRpZiAoIG1vZGVsICkge1xuXHRcdFx0bW9kZWwuc2V0KCBmb250ICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZ2V0KCAnZm9udHMnICkucHVzaCggbmV3IFNlbGVjdGVkRm9udCggZm9udCApICk7XG5cdFx0fVxuXHRcdHRoaXMudHJpZ2dlciggJ2NoYW5nZScgKTtcblx0fSxcblxuXHR0b0pTT046IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHNraXAgYW55IGZvbnRzIHNldCB0byB0aGUgZGVmYXVsdFxuXHRcdHJldHVybiB0aGlzLmdldCggJ2ZvbnRzJyApLnJlZHVjZSggZnVuY3Rpb24oIHByZXZpb3VzLCBtb2RlbCApIHtcblx0XHRcdGlmICggbW9kZWwuZ2V0KCAnaWQnICkgKSB7XG5cdFx0XHRcdHByZXZpb3VzLnB1c2goIG1vZGVsLnRvSlNPTigpICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcHJldmlvdXM7XG5cdFx0fSwgW10gKTtcblx0fVxufSApO1xuXG4iLCJ2YXIgYXBpID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXBpJyApLFxuXHRib290c3RyYXAgPSByZXF1aXJlKCAnLi4vaGVscGVycy9ib290c3RyYXAnICk7XG5cbnZhciBXZWJGb250ID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvd2ViZm9udCcgKTtcblxudmFyIGxvYWRlZEZvbnRJZHMgPSBbXTtcblxuZnVuY3Rpb24gYWRkRm9udFRvQ29udHJvbHMoIGZvbnQsIHRleHQgKSB7XG5cdGlmICggfiBsb2FkZWRGb250SWRzLmluZGV4T2YoIGZvbnQuaWQgKSApIHtcblx0XHRyZXR1cm47XG5cdH1cblx0bG9hZGVkRm9udElkcy5wdXNoKCBmb250LmlkICk7XG5cdFdlYkZvbnQubG9hZCh7XG5cdFx0Z29vZ2xlOiB7IGZhbWlsaWVzOiBbIGZvbnQuaWQgXSwgdGV4dDogdGV4dCB9LFxuXHRcdGNsYXNzZXM6IGZhbHNlLFxuXHRcdGV2ZW50czogZmFsc2Vcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFkZEZvbnRUb1ByZXZpZXcoIGZvbnQgKSB7XG5cdGlmICggfiBsb2FkZWRGb250SWRzLmluZGV4T2YoIGZvbnQuaWQgKSApIHtcblx0XHRyZXR1cm47XG5cdH1cblx0bG9hZGVkRm9udElkcy5wdXNoKCBmb250LmlkICk7XG5cdHZhciBmYW1pbHlTdHJpbmcgPSBmb250LmlkICsgJzoxMDAsMjAwLDMwMCw0MDAsNTAwLDYwMCw3MDAsODAwLDkwMCwxMDBpdGFsaWMsMjAwaXRhbGljLDMwMGl0YWxpYyw0MDBpdGFsaWMsNTAwaXRhbGljLDYwMGl0YWxpYyw3MDBpdGFsaWMsODAwaXRhbGljLDkwMGl0YWxpYyc7XG5cdGlmICggYm9vdHN0cmFwLnByb3ZpZGVyRGF0YSAmJiBib290c3RyYXAucHJvdmlkZXJEYXRhLmdvb2dsZVN1YnNldFN0cmluZyApIHtcblx0XHR2YXIgc3Vic2V0U3RyaW5nID0gYm9vdHN0cmFwLnByb3ZpZGVyRGF0YS5nb29nbGVTdWJzZXRTdHJpbmc7XG5cdFx0aWYgKCBzdWJzZXRTdHJpbmcgJiYgc3Vic2V0U3RyaW5nLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHRmYW1pbHlTdHJpbmcgKz0gJzonICsgc3Vic2V0U3RyaW5nO1xuXHRcdH1cblx0fVxuXHRXZWJGb250LmxvYWQoIHsgZ29vZ2xlOiB7IGZhbWlsaWVzOiBbIGZhbWlseVN0cmluZyBdIH0gfSApO1xufVxuXG52YXIgR29vZ2xlUHJvdmlkZXJWaWV3ID0gYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXcuZXh0ZW5kKCB7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm1vZGVsLmdldCggJ2Rpc3BsYXlOYW1lJyApICk7XG5cblx0XHR0aGlzLiRlbC5jc3MoICdmb250LWZhbWlseScsICdcIicgKyB0aGlzLm1vZGVsLmdldCggJ2Nzc05hbWUnICkgKyAnXCInICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250ICYmIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgPT09IHRoaXMubW9kZWwuZ2V0KCAnaWQnICkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0fVxuXHRcdGlmICggIXRoaXMuZGlzYWJsZUZvY3VzICkge1xuXHRcdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0fVxuXHRcdGFkZEZvbnRUb0NvbnRyb2xzKCB0aGlzLm1vZGVsLnRvSlNPTigpLCB0aGlzLm1vZGVsLmdldCggJ2lkJyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0gKTtcblxuR29vZ2xlUHJvdmlkZXJWaWV3LmFkZEZvbnRUb1ByZXZpZXcgPSBhZGRGb250VG9QcmV2aWV3O1xuXG5hcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MuZ29vZ2xlID0gR29vZ2xlUHJvdmlkZXJWaWV3O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdvb2dsZVByb3ZpZGVyVmlldztcbiIsInZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtc2l6ZSBmb250LXByb3BlcnR5LWNvbnRyb2wtY3VycmVudCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gb3B0cy5jdXJyZW50Rm9udFNpemU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLmN1cnJlbnRGb250U2l6ZSApO1xuXHRcdHRoaXMuJGVsLmF0dHIoICd0YWJpbmRleCcsICcwJyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG52YXIgZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZnZkLXRvLXJlYWRhYmxlJyApLmdldEZvbnRWYXJpYW50TmFtZUZyb21JZDtcblxudmFyIEN1cnJlbnRGb250VmFyaWFudCA9IERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtdmFyaWFudCBmb250LXByb3BlcnR5LWNvbnRyb2wtY3VycmVudCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdFx0dGhpcy5tdWx0aU9wdGlvbnMgPSBvcHRzLm11bHRpT3B0aW9ucztcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIGdldEZvbnRWYXJpYW50TmFtZUZyb21JZCggdGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgKSApO1xuXHRcdGlmICggdGhpcy5tdWx0aU9wdGlvbnMgPT09IGZhbHNlICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdpbmFjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdpbmFjdGl2ZScgKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEN1cnJlbnRGb250VmFyaWFudDtcbiIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6Q3VycmVudEZvbnRWaWV3JyApO1xuXG52YXIgZ2V0Vmlld0ZvclByb3ZpZGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJvdmlkZXItdmlld3MnICkuZ2V0Vmlld0ZvclByb3ZpZGVyLFxuXHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG52YXIgQ3VycmVudEZvbnRWaWV3ID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udCcsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J21vdXNlZW50ZXInOiAnZGlzcGF0Y2hIb3ZlcicsXG5cdFx0J21vdXNlbGVhdmUnOiAnZGlzcGF0Y2hIb3ZlcicsXG5cdFx0J2NsaWNrJzogJ3RvZ2dsZURyb3Bkb3duJyxcblx0XHQna2V5ZG93bic6ICdjaGVja0tleWJvYXJkVG9nZ2xlJyxcblx0fSxcblxuXHRkaXNwYXRjaEhvdmVyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cblx0XHRpZiAoICEgKCBldmVudC50eXBlID09PSAnbW91c2VlbnRlcicgfHwgZXZlbnQudHlwZSA9PT0gJ21vdXNlbGVhdmUnICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMucHJvdmlkZXJWaWV3ICYmIHRoaXMucHJvdmlkZXJWaWV3WyBldmVudC50eXBlIF0oIGV2ZW50ICk7XG5cdH0sXG5cblx0Y2hlY2tLZXlib2FyZFRvZ2dsZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0dGhpcy50b2dnbGVEcm9wZG93bigpO1xuXHRcdH1cblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5hY3RpdmUgPSBvcHRzLmFjdGl2ZTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1lbnVTdGF0dXMsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmFjdGl2ZSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLm1lbnVTdGF0dXMuZ2V0KCAnaXNPcGVuJyApICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtLW9wZW4nICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LS1vcGVuJyApO1xuXHRcdH1cblx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBjdXJyZW50Rm9udDonLCB0aGlzLmN1cnJlbnRGb250LnRvSlNPTigpICk7XG5cdFx0aWYgKCAhIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udC0tZGVmYXVsdCcgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtLWRlZmF1bHQnICk7XG5cdFx0fVxuXHRcdGlmICggdGhpcy5wcm92aWRlclZpZXcgKSB7XG5cdFx0XHR0aGlzLnByb3ZpZGVyVmlldy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwudGV4dCggJycgKTtcblx0XHR0aGlzLiRlbC5hdHRyKCAndGFiaW5kZXgnLCAnMCcgKTtcblx0XHR2YXIgUHJvdmlkZXJWaWV3ID0gZ2V0Vmlld0ZvclByb3ZpZGVyKCB0aGlzLmN1cnJlbnRGb250LmdldCggJ3Byb3ZpZGVyJyApICk7XG5cdFx0aWYgKCAhIFByb3ZpZGVyVmlldyApIHtcblx0XHRcdGRlYnVnKCAncmVuZGVyaW5nIGN1cnJlbnRGb250IHdpdGggbm8gcHJvdmlkZXJWaWV3IGZvcicsIHRoaXMuY3VycmVudEZvbnQudG9KU09OKCkgKTtcblx0XHRcdGlmICggISB0aGlzLmN1cnJlbnRGb250LmdldCggJ2Rpc3BsYXlOYW1lJyApICkge1xuXHRcdFx0XHRkZWJ1ZyggJ2Vycm9yIHJlbmRlcmluZyBjdXJyZW50Rm9udCBiZWNhdXNlIGl0IGhhcyBubyBkaXNwbGF5TmFtZSEnLCB0aGlzLmN1cnJlbnRGb250LnRvSlNPTigpICk7XG5cdFx0XHRcdHRoaXMuJGVsLmh0bWwoICdVbmtub3duJyApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5jdXJyZW50Rm9udC5nZXQoICdkaXNwbGF5TmFtZScgKSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGRlYnVnKCAncmVuZGVyaW5nIGN1cnJlbnRGb250IHByb3ZpZGVyVmlldyBmb3InLCB0aGlzLmN1cnJlbnRGb250LnRvSlNPTigpICk7XG5cdFx0dGhpcy5wcm92aWRlclZpZXcgPSBuZXcgUHJvdmlkZXJWaWV3KCB7XG5cdFx0XHRtb2RlbDogdGhpcy5jdXJyZW50Rm9udCxcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdGRpc2FibGVGb2N1czogdHJ1ZVxuXHRcdH0gKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIHRoaXMucHJvdmlkZXJWaWV3LnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEN1cnJlbnRGb250VmlldztcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBEZWZhdWx0Rm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvZGVmYXVsdC1mb250JyApO1xuXG4vLyAneCcgYnV0dG9uIHRoYXQgcmVzZXRzIGZvbnQgdG8gZGVmYXVsdFxudmFyIERlZmF1bHRGb250QnV0dG9uID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZGVmYXVsdC1idXR0b24nLFxuXHR0YWdOYW1lOiAnc3BhbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ3Jlc2V0VG9EZWZhdWx0Jyxcblx0XHQna2V5ZG93bic6ICdjaGVja0tleWJvYXJkUmVzZXQnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdGlmICggISB0aGlzLnR5cGUgKSB7XG5cdFx0XHR0aHJvdyAnRXJyb3I6IGNhbm5vdCBjcmVhdGUgRGVmYXVsdEZvbnRCdXR0b24gd2l0aG91dCBhIHR5cGUnO1xuXHRcdH1cblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBvcHRzLm1lbnVTdGF0dXM7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tZW51U3RhdHVzLCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250LmlkICYmICEgdGhpcy5tZW51U3RhdHVzLmdldCggJ2lzT3BlbicgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlLWJ1dHRvbicgKTtcblx0XHRcdHRoaXMuJGVsLnNob3coKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUtYnV0dG9uJyApO1xuXHRcdFx0dGhpcy4kZWwuaGlkZSgpO1xuXHRcdH1cblx0XHR0aGlzLiRlbC5hdHRyKCAndGFiaW5kZXgnLCAnMCcgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRyZXNldFRvRGVmYXVsdDogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2hhbmdlLWZvbnQnLCB7IGZvbnQ6IG5ldyBEZWZhdWx0Rm9udCgpLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHR9LFxuXG5cdGNoZWNrS2V5Ym9hcmRSZXNldDogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRpZiAoZXZlbnQua2V5ID09PSAnRW50ZXInKSB7XG5cdFx0XHR0aGlzLnJlc2V0VG9EZWZhdWx0KCk7XG5cdFx0fVxuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVmYXVsdEZvbnRCdXR0b247XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOkRyb3Bkb3duQ3VycmVudFRlbXBsYXRlJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICd0b2dnbGVEcm9wZG93bicsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tLZXlib2FyZFRvZ2dsZScsXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMubWVudSA9IG9wdHMubWVudTtcblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBvcHRzLm1lbnVTdGF0dXM7XG5cdFx0dGhpcy5hY3RpdmUgPSB0cnVlO1xuXHR9LFxuXG5cdHRvZ2dsZURyb3Bkb3duOiBmdW5jdGlvbiggZSApIHtcblx0XHRpZiAoIGUgKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH1cblx0XHRpZiAoICEgdGhpcy5hY3RpdmUgKSB7XG5cdFx0XHRkZWJ1ZyggJ21lbnUgaXMgaW5hY3RpdmU7IGlnbm9yaW5nIGNsaWNrJywgdGhpcy5tZW51LCB0aGlzLnR5cGUgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLm1lbnVTdGF0dXMuZ2V0KCAnaXNPcGVuJyApICkge1xuXHRcdFx0ZGVidWcoICdtZW51IGlzIG9wZW47IGNsb3NpbmcgbWVudXMnLCB0aGlzLm1lbnUsIHRoaXMudHlwZSApO1xuXHRcdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVidWcoICdtZW51IGlzIGNsb3NlZDsgb3BlbmluZyBtZW51JywgdGhpcy5tZW51LCB0aGlzLnR5cGUgKTtcblx0XHRcdEVtaXR0ZXIudHJpZ2dlciggJ29wZW4tbWVudScsIHsgdHlwZTogdGhpcy50eXBlLCBtZW51OiB0aGlzLm1lbnUgfSApO1xuXHRcdH1cblx0fSxcblxuXHRjaGVja0tleWJvYXJkVG9nZ2xlOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC5rZXkgPT09ICdFbnRlcicgKSB7XG5cdFx0XHR0aGlzLiRlbC5jbGljaygpO1xuXHRcdH1cblx0fSxcbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbi8vIEFuIGluZGl2aWR1YWwgZm9udCBpbiB0aGUgZHJvcGRvd24gbGlzdCwgZXhwb3J0ZWQgYXNcbi8vIGBhcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlld2AuIEV4dGVuZCB0aGlzIG9iamVjdCBmb3IgZWFjaCBwcm92aWRlci4gVGhlXG4vLyBleHRlbmRlZCBvYmplY3RzIG5lZWQgdG8gZGVmaW5lIGEgYHJlbmRlcmAgbWV0aG9kIHRvIHJlbmRlciB0aGVpciBwcm92aWRlcidzXG4vLyBmb250IG5hbWUsIGFzIHdlbGwgYXMgYGFkZEZvbnRUb0NvbnRyb2xzYCBhbmQgYGFkZEZvbnRUb1ByZXZpZXdgIG1ldGhvZHMgb24gdGhlIG9iamVjdCBpdHNlbGYuXG52YXIgUHJvdmlkZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fb3B0aW9uJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnZm9udENoYW5nZWQnLFxuXHRcdCdrZXlkb3duJzogJ2NoZWNrS2V5Ym9hcmRTZWxlY3QnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMuZGlzYWJsZUZvY3VzID0gQm9vbGVhbiggb3B0cy5kaXNhYmxlRm9jdXMgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgKSB7XG5cdFx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0XHR9XG5cdH0sXG5cblx0Y2hlY2tLZXlib2FyZFNlbGVjdDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0dGhpcy4kZWwuY2xpY2soKTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gV2FybmluZzogdGhpcyBzaG91bGQgYmUgb3ZlcnJpZGVuIGluIHRoZSBwcm92aWRlclxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubW9kZWwuZ2V0KCAnZGlzcGxheU5hbWUnICkgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRmb250Q2hhbmdlZDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250ICYmIHRoaXMuY3VycmVudEZvbnQgIT09IHRoaXMubW9kZWwgKSB7XG5cdFx0XHRFbWl0dGVyLnRyaWdnZXIoICdjaGFuZ2UtZm9udCcsIHsgZm9udDogdGhpcy5tb2RlbCwgdHlwZTogdGhpcy50eXBlLmlkIH0gKTtcblx0XHR9XG5cdH1cbn0gKTtcblxuUHJvdmlkZXJWaWV3LmFkZEZvbnRUb0NvbnRyb2xzID0gZnVuY3Rpb24oKSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm92aWRlclZpZXc7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIERyb3Bkb3duVGVtcGxhdGUgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5tZW51ID0gb3B0cy5tZW51O1xuXHRcdHRoaXMubWVudVN0YXR1cyA9IG9wdHMubWVudVN0YXR1cztcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1lbnVTdGF0dXMsICdjaGFuZ2UnLCB0aGlzLnVwZGF0ZVN0YXR1cyApO1xuXHR9LFxuXG5cdHVwZGF0ZVN0YXR1czogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLm1lbnVTdGF0dXMuZ2V0KCAnaXNPcGVuJyApICkge1xuXHRcdFx0dGhpcy5vcGVuKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuY2xvc2UoKTtcblx0XHR9XG5cdH0sXG5cblx0b3BlbjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdvcGVuJyApO1xuXHRcdHRoaXMuaXNPcGVuID0gdHJ1ZTtcblx0fSxcblxuXHRjbG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdvcGVuJyApO1xuXHRcdHRoaXMuaXNPcGVuID0gZmFsc2U7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93blRlbXBsYXRlO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdG1lbnVWaWV3TWl4aW4gPSByZXF1aXJlKCAnLi4vbWl4aW5zL21lbnUtdmlldy1taXhpbicgKTtcblxudmFyIEZvbnREcm9wZG93biA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LWRyb3Bkb3duJyApLFxuXHRDdXJyZW50Rm9udFZpZXcgPSByZXF1aXJlKCAnLi4vdmlld3MvY3VycmVudC1mb250JyApLFxuXHREZWZhdWx0Rm9udEJ1dHRvbiA9IHJlcXVpcmUoICcuLi92aWV3cy9kZWZhdWx0LWZvbnQtYnV0dG9uJyApO1xuXG4vLyBDb250YWluZXIgZm9yIHRoZSBsaXN0IG9mIGF2YWlsYWJsZSBmb250cyBhbmQgJ3gnIGJ1dHRvblxudmFyIEZvbnRDb250cm9sVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX21lbnUtY29udGFpbmVyJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5tZW51ID0gJ2ZvbnRGYW1pbHknO1xuXHRcdHRoaXMubWVudUtleSA9IHRoaXMudHlwZS5pZCArICc6JyArIHRoaXMubWVudTtcblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBtZW51Vmlld01peGluKCB0aGlzICk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY3VycmVudEZvbnRWaWV3ID0gbmV3IEN1cnJlbnRGb250Vmlldygge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWwsXG5cdFx0XHRhY3RpdmU6ICggdGhpcy5mb250RGF0YS5sZW5ndGggPiAwIClcblx0XHR9ICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBjdXJyZW50Rm9udFZpZXcucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250RHJvcGRvd24oIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsLFxuXHRcdFx0Y3VycmVudEZvbnRWaWV3OiBjdXJyZW50Rm9udFZpZXcsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IERlZmF1bHRGb250QnV0dG9uKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51U3RhdHVzOiB0aGlzLm1lbnVTdGF0dXMsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbFxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9udENvbnRyb2xWaWV3O1xuIiwidmFyIGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpGb250RHJvcGRvd24nICksXG5cdEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG52YXIgZ2V0Vmlld0ZvclByb3ZpZGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJvdmlkZXItdmlld3MnICkuZ2V0Vmlld0ZvclByb3ZpZGVyLFxuXHREcm9wZG93blRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlJyApLFxuXHQkID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICkuJDtcblxuLy8gRHJvcGRvd24gb2YgYXZhaWxhYmxlIGZvbnRzXG52YXIgRm9udERyb3Bkb3duID0gRHJvcGRvd25UZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fbWVudScsXG5cdGlkOiAnZm9udC1zZWxlY3QnLFxuXG5cdGV2ZW50czoge1xuXHRcdCdtb3VzZWVudGVyID4gLmpldHBhY2stZm9udHNfX29wdGlvbic6ICdkaXNwYXRjaEhvdmVyJyxcblx0XHQnbW91c2VsZWF2ZSA+IC5qZXRwYWNrLWZvbnRzX19vcHRpb24nOiAnZGlzcGF0Y2hIb3ZlcicsXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy5hdmFpbGFibGVGb250cyA9IFtdO1xuXHRcdHRoaXMuc3ViVmlld3MgPSB7fTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLmN1cnJlbnRGb250VmlldyA9IG9wdHMuY3VycmVudEZvbnRWaWV3O1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdsb2FkLW1lbnUtZm9udHMnLCB0aGlzLmxvYWRGb250cyApO1xuXHR9LFxuXG5cdGxvYWRGb250czogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmF2YWlsYWJsZUZvbnRzLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuYXZhaWxhYmxlRm9udHMgPSB0aGlzLmZvbnREYXRhO1xuXHRcdHRoaXMucmVuZGVyKCk7XG5cdH0sXG5cblx0ZGlzcGF0Y2hIb3ZlcjogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdHZhciBlbDtcblx0XHRpZiAoICEgKCBldmVudC50eXBlID09PSAnbW91c2VlbnRlcicgfHwgZXZlbnQudHlwZSA9PT0gJ21vdXNlbGVhdmUnICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGVsID0gZXZlbnQuY3VycmVudFRhcmdldDtcblx0XHRpZiAoIGVsLmNpZCAmJiB0aGlzLnN1YlZpZXdzWyBlbC5jaWQgXSApIHtcblx0XHRcdHRoaXMuc3ViVmlld3NbIGVsLmNpZCBdWyBldmVudC50eXBlIF0oIGV2ZW50ICk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0T2JqZWN0LmtleXMoIHRoaXMuc3ViVmlld3MgKS5mb3JFYWNoKCBmdW5jdGlvbiggY2lkICkge1xuXHRcdFx0dGhpcy5zdWJWaWV3c1sgY2lkIF0ucmVtb3ZlKCk7XG5cdFx0fS5iaW5kKCB0aGlzICkgKTtcblx0XHRkZWJ1ZyggJ3JlbmRlcmluZycsIHRoaXMuYXZhaWxhYmxlRm9udHMubGVuZ3RoLCAnYXZhaWxhYmxlRm9udHMgZm9yJywgdGhpcy50eXBlICk7XG5cdFx0dGhpcy5hdmFpbGFibGVGb250cy5mb3JFYWNoKCBmdW5jdGlvbiggZm9udCApIHtcblx0XHRcdHZhciBQcm92aWRlclZpZXcgPSBnZXRWaWV3Rm9yUHJvdmlkZXIoIGZvbnQuZ2V0KCAncHJvdmlkZXInICkgKTtcblx0XHRcdGlmICggISBQcm92aWRlclZpZXcgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGRlYnVnKCAncmVuZGVyaW5nIHByb3ZpZGVyVmlldyBpbicsIHRoaXMudHlwZSwgJ2ZvbnQgbGlzdCBmb3InLCBmb250LnRvSlNPTigpICk7XG5cdFx0XHR2YXIgdmlldyA9IG5ldyBQcm92aWRlclZpZXcoIHtcblx0XHRcdFx0bW9kZWw6IGZvbnQsXG5cdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuY3VycmVudEZvbnRcblx0XHRcdH0gKS5yZW5kZXIoKTtcblxuXHRcdFx0dmlldy5lbC5jaWQgPSB2aWV3LmNpZDtcblx0XHRcdHRoaXMuc3ViVmlld3NbIHZpZXcuY2lkIF0gPSB2aWV3O1xuXHRcdFx0dGhpcy4kZWwuYXBwZW5kKCB2aWV3LmVsICk7XG5cdFx0fSwgdGhpcyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdG9wZW46IGZ1bmN0aW9uKCkge1xuXHRcdERyb3Bkb3duVGVtcGxhdGUucHJvdG90eXBlLm9wZW4uY2FsbCggdGhpcyApO1xuXHRcdHRoaXMuYWRqdXN0UG9zaXRpb24oKTtcblx0fSxcblxuXHRhZGp1c3RQb3NpdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG9mZnNldCA9IHRoaXMuY3VycmVudEZvbnRWaWV3LiRlbC5vZmZzZXQoKTtcblx0XHR2YXIgbXlIZWlnaHQgPSB0aGlzLmN1cnJlbnRGb250Vmlldy4kZWwuaGVpZ2h0KCk7XG5cdFx0dmFyIGF2YWlsYWJsZUhlaWdodCA9ICQoICcud3AtZnVsbC1vdmVybGF5LXNpZGViYXItY29udGVudCcgKS5oZWlnaHQoKTtcblx0XHR2YXIgbWlkZGxlID0gYXZhaWxhYmxlSGVpZ2h0IC8gMjtcblxuXHRcdGRlYnVnKCAnYWRqdXN0aW5nIHBvc2l0aW9uIG9mIG1lbnU7IG9mZnNldC50b3AnLCBvZmZzZXQudG9wLCAnbWlkZGxlJywgbWlkZGxlLCAnY2FsYycsIG9mZnNldC50b3AgLSAoIG15SGVpZ2h0IC8gMiApICk7XG5cdFx0aWYgKCBvZmZzZXQudG9wIC0gKCBteUhlaWdodCAvIDIgKSA+PSBtaWRkbGUgKSB7XG5cdFx0XHRkZWJ1ZyggJ21lbnU6IGNsb3NlciB0byBib3R0b20nICk7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ29wZW4tZG93bicgKS5jc3MoIHtcblx0XHRcdFx0aGVpZ2h0OiBvZmZzZXQudG9wIC0gbXlIZWlnaHQgLSAxMFxuXHRcdFx0fSApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWJ1ZyggJ21lbnU6IGNsb3NlciB0byB0b3AnICk7XG5cdFx0XHRkZWJ1ZyggJ29mZnNldC50b3AnLCBvZmZzZXQudG9wLCAnYXZhaWxhYmxlSGVpZ2h0JywgYXZhaWxhYmxlSGVpZ2h0LCAnbXlIZWlnaHQnLCBteUhlaWdodCApO1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdvcGVuLWRvd24nICkuY3NzKCB7XG5cdFx0XHRcdGhlaWdodDogYXZhaWxhYmxlSGVpZ2h0IC0gb2Zmc2V0LnRvcCAtIDEwXG5cdFx0XHR9ICk7XG5cdFx0fVxuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9udERyb3Bkb3duO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdG1lbnVWaWV3TWl4aW4gPSByZXF1aXJlKCAnLi4vbWl4aW5zL21lbnUtdmlldy1taXhpbicgKTtcblxudmFyIEZvbnRTaXplRHJvcGRvd24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1zaXplLWRyb3Bkb3duJyApLFxuQ3VycmVudEZvbnRTaXplID0gcmVxdWlyZSggJy4uL3ZpZXdzL2N1cnJlbnQtZm9udC1zaXplJyApLFxudHJhbnNsYXRlID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdHJhbnNsYXRlJyApO1xuXG52YXIgRm9udFNpemVDb250cm9sID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC1zaXplLWNvbnRyb2wgZm9udC1wcm9wZXJ0eS1jb250cm9sJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLm1lbnUgPSAnZm9udFNpemUnO1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0XHR0aGlzLm1lbnVLZXkgPSB0aGlzLnR5cGUuaWQgKyAnOicgKyB0aGlzLm1lbnU7XG5cdFx0dGhpcy5tZW51U3RhdHVzID0gbWVudVZpZXdNaXhpbiggdGhpcyApO1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkQXZhaWxhYmxlRm9udDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZm9udERhdGEuZmluZFdoZXJlKCB7IGlkOiB0aGlzLmN1cnJlbnRGb250LmdldCggJ2lkJyApIH0gKTtcblx0XHRpZiAoICFzZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQ7XG5cdH0sXG5cblx0Z2V0Q3VycmVudEZvbnRTaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5nZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQoKTtcblx0XHRpZiAoIHNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHZhciBzaXplID0gdGhpcy5jdXJyZW50Rm9udC5nZXQoICdzaXplJyApO1xuXHRcdFx0aWYgKCBzaXplICYmIHNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250U2l6ZU5hbWVGcm9tSWQoIHNpemUgKSApIHtcblx0XHRcdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250U2l6ZU5hbWVGcm9tSWQoIHNpemUgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0cmFuc2xhdGUoICdOb3JtYWwgU2l6ZScgKTtcblx0XHR9XG5cdH0sXG5cblx0aXNEZWZhdWx0Rm9udDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICggISAoIHRoaXMuY3VycmVudEZvbnQuaGFzKCAnaWQnICkgJiYgdGhpcy5jdXJyZW50Rm9udC5nZXQoICdpZCcgKS5sZW5ndGggPiAwICkgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0aWYgKCB0aGlzLmlzRGVmYXVsdEZvbnQoKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnamV0cGFjay1mb250c19fZm9udC1wcm9wZXJ0eS1jb250cm9sLS1pbmFjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19mb250LXByb3BlcnR5LWNvbnRyb2wtLWluYWN0aXZlJyApO1xuXHRcdH1cblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBDdXJyZW50Rm9udFNpemUoIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdGN1cnJlbnRGb250U2l6ZTogdGhpcy5nZXRDdXJyZW50Rm9udFNpemUoKVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRTaXplRHJvcGRvd24oIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdHNlbGVjdGVkQXZhaWxhYmxlRm9udDogdGhpcy5nZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQoKSxcblx0XHRcdGN1cnJlbnRGb250U2l6ZTogdGhpcy5nZXRDdXJyZW50Rm9udFNpemUoKVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250U2l6ZUNvbnRyb2w7XG4iLCJ2YXIgRm9udFNpemVPcHRpb24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1zaXplLW9wdGlvbicgKSxcbkRyb3Bkb3duVGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tdGVtcGxhdGUnICk7XG5cbnZhciBGb250U2l6ZURyb3Bkb3duID0gRHJvcGRvd25UZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC1zaXplLWRyb3Bkb3duIGZvbnQtcHJvcGVydHktY29udHJvbC1kcm9wZG93bicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSBvcHRzLnNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0XHR0aGlzLmN1cnJlbnRGb250U2l6ZSA9IG9wdHMuY3VycmVudEZvbnRTaXplO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJycgKTtcblx0XHRpZiAoIHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0dmFyIHNpemVPcHRpb25zID0gdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFNpemVPcHRpb25zKCk7XG5cdFx0XHRzaXplT3B0aW9ucy5mb3JFYWNoKCBmdW5jdGlvbiggb3B0aW9uICkge1xuXHRcdFx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250U2l6ZU9wdGlvbigge1xuXHRcdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0XHRpZDogb3B0aW9uLmlkLFxuXHRcdFx0XHRcdG5hbWU6IG9wdGlvbi5uYW1lLFxuXHRcdFx0XHRcdGN1cnJlbnRGb250U2l6ZTogdGhpcy5jdXJyZW50Rm9udFNpemVcblx0XHRcdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9udFNpemVEcm9wZG93bjtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC1zaXplLW9wdGlvbiBqZXRwYWNrLWZvbnRzX19mb250LXByb3BlcnR5LW9wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ3NldFNpemVPcHRpb24nLFxuXHRcdCdrZXlkb3duJzogJ2NoZWNrS2V5Ym9hcmRTZWxlY3QnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuaWQgPSBvcHRzLmlkO1xuXHRcdHRoaXMubmFtZSA9IG9wdHMubmFtZTtcblx0XHR0aGlzLmN1cnJlbnRGb250U2l6ZSA9IG9wdHMuY3VycmVudEZvbnRTaXplO1xuXHR9LFxuXG5cdGNoZWNrS2V5Ym9hcmRTZWxlY3Q6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoIGV2ZW50LmtleSA9PT0gJ0VudGVyJyApIHtcblx0XHRcdHRoaXMuJGVsLmNsaWNrKCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5uYW1lICk7XG5cdFx0dGhpcy4kZWwuYXR0ciggJ2RhdGEtbmFtZScsIHRoaXMubmFtZSApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udFNpemUgPT09IHRoaXMubmFtZSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnY3VycmVudCcgKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0c2V0U2l6ZU9wdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnc2V0LXNpemUnLCB7IHNpemU6IHRoaXMuaWQsIHR5cGU6IHRoaXMudHlwZS5pZCB9ICk7XG5cdH1cblxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpGb250VHlwZVZpZXcnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxudmFyIEZvbnRDb250cm9sVmlldyA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LWNvbnRyb2wnICksXG5cdEZvbnRWYXJpYW50Q29udHJvbCA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXZhcmlhbnQtY29udHJvbCcgKSxcblx0Rm9udFNpemVDb250cm9sID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtc2l6ZS1jb250cm9sJyApO1xuXG4vLyBBIGZvbnQgY29udHJvbCBWaWV3IGZvciBhIHBhcnRpY3VsYXIgc2V0dGluZyB0eXBlXG52YXIgRm9udFR5cGVWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fdHlwZScsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ2Nsb3NlTWVudXMnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCAnPGRpdiBjbGFzcz1cImpldHBhY2stZm9udHNfX3R5cGVcIiBkYXRhLWZvbnQtdHlwZT1cIicgKyB0aGlzLnR5cGUuaWQgKyAnXCI+PGgzIGNsYXNzPVwiamV0cGFjay1mb250c19fdHlwZS1oZWFkZXJcIj4nICsgdGhpcy50eXBlLm5hbWUgKyAnPC9oMz48L2Rpdj4nICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udENvbnRyb2xWaWV3KCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtb2RlbDogdGhpcy5jdXJyZW50Rm9udCxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0dmFyIHN1Yk1lbnVzQ29udGFpbmVyID0gQmFja2JvbmUuJCggJzxkaXYgY2xhc3M9XCJqZXRwYWNrLWZvbnRzX190eXBlLW9wdGlvbnNcIj48L2Rpdj4nICk7XG5cdFx0c3ViTWVudXNDb250YWluZXIuYXBwZW5kKCBuZXcgRm9udFZhcmlhbnRDb250cm9sKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5jdXJyZW50Rm9udCxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0c3ViTWVudXNDb250YWluZXIuYXBwZW5kKCBuZXcgRm9udFNpemVDb250cm9sKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5jdXJyZW50Rm9udCxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBzdWJNZW51c0NvbnRhaW5lciApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGNsb3NlTWVudXM6IGZ1bmN0aW9uKCkge1xuXHRcdGRlYnVnKCAndHlwZSBjbGlja2VkOyBjbG9zaW5nIG1lbnVzJywgdGhpcy50eXBlICk7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbnRUeXBlVmlldztcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRtZW51Vmlld01peGluID0gcmVxdWlyZSggJy4uL21peGlucy9tZW51LXZpZXctbWl4aW4nICk7XG5cbnZhciBGb250VmFyaWFudERyb3Bkb3duID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdmFyaWFudC1kcm9wZG93bicgKSxcbkN1cnJlbnRGb250VmFyaWFudCA9IHJlcXVpcmUoICcuLi92aWV3cy9jdXJyZW50LWZvbnQtdmFyaWFudCcgKTtcblxudmFyIEZvbnRWYXJpYW50Q29udHJvbCA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtdmFyaWFudC1jb250cm9sIGZvbnQtcHJvcGVydHktY29udHJvbCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5tZW51ID0gJ2ZvbnRWYXJpYW50Jztcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0dGhpcy5tZW51S2V5ID0gdGhpcy50eXBlLmlkICsgJzonICsgdGhpcy5tZW51O1xuXHRcdHRoaXMubWVudVN0YXR1cyA9IG1lbnVWaWV3TWl4aW4oIHRoaXMgKTtcblx0fSxcblxuXHRnZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmZvbnREYXRhLmZpbmRXaGVyZSggeyBpZDogdGhpcy5jdXJyZW50Rm9udC5nZXQoICdpZCcgKSB9ICk7XG5cdFx0aWYgKCAhc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHR9LFxuXG5cdGdldEN1cnJlbnRGb250VmFyaWFudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCk7XG5cdFx0aWYgKCBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgJiYgdGhpcy50eXBlLmZ2ZEFkanVzdCApIHtcblx0XHRcdHJldHVybiB0aGlzLmN1cnJlbnRGb250LmdldCggJ2N1cnJlbnRGdmQnICk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCk7XG5cdFx0dmFyIG11bHRpT3B0aW9ucztcblx0XHRpZiAoIHNlbGVjdGVkQXZhaWxhYmxlRm9udCAmJiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFZhcmlhbnRPcHRpb25zKCkubGVuZ3RoID4gMSApIHtcblx0XHRcdG11bHRpT3B0aW9ucyA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG11bHRpT3B0aW9ucyA9IGZhbHNlO1xuXHRcdH1cblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRWaWV3ICkge1xuXHRcdFx0dGhpcy5jdXJyZW50Rm9udFZpZXcucmVtb3ZlKCk7XG5cdFx0fVxuXHRcdGlmICggdGhpcy5kcm9wRG93blZpZXcgKSB7XG5cdFx0XHR0aGlzLmRyb3BEb3duVmlldy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0aWYgKCBtdWx0aU9wdGlvbnMgJiYgdGhpcy50eXBlLmZ2ZEFkanVzdCApIHtcblx0XHRcdHRoaXMuY3VycmVudEZvbnRWaWV3ID0gbmV3IEN1cnJlbnRGb250VmFyaWFudCgge1xuXHRcdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0XHRjdXJyZW50Rm9udFZhcmlhbnQ6IHRoaXMuZ2V0Q3VycmVudEZvbnRWYXJpYW50KCksXG5cdFx0XHRcdG11bHRpT3B0aW9uczogbXVsdGlPcHRpb25zXG5cdFx0XHR9ICk7XG5cdFx0XHR0aGlzLiRlbC5hcHBlbmQoIHRoaXMuY3VycmVudEZvbnRWaWV3LnJlbmRlcigpLmVsICk7XG5cdFx0XHR0aGlzLmRyb3BEb3duVmlldyA9IG5ldyBGb250VmFyaWFudERyb3Bkb3duKCB7XG5cdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0XHRtZW51U3RhdHVzOiB0aGlzLm1lbnVTdGF0dXMsXG5cdFx0XHRcdHNlbGVjdGVkQXZhaWxhYmxlRm9udDogdGhpcy5nZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQoKSxcblx0XHRcdFx0Y3VycmVudEZvbnRWYXJpYW50OiB0aGlzLmdldEN1cnJlbnRGb250VmFyaWFudCgpXG5cdFx0XHR9ICk7XG5cdFx0XHR0aGlzLiRlbC5hcHBlbmQoIHRoaXMuZHJvcERvd25WaWV3LnJlbmRlcigpLmVsICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250VmFyaWFudENvbnRyb2w7XG4iLCJ2YXIgRm9udFZhcmlhbnRPcHRpb24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC12YXJpYW50LW9wdGlvbicgKSxcbkRyb3Bkb3duVGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tdGVtcGxhdGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25UZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC12YXJpYW50LWRyb3Bkb3duIGZvbnQtcHJvcGVydHktY29udHJvbC1kcm9wZG93bicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSBvcHRzLnNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0XHR0aGlzLmN1cnJlbnRGb250VmFyaWFudCA9IG9wdHMuY3VycmVudEZvbnRWYXJpYW50O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJycgKTtcblx0XHRpZiAoIHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250ICYmIHRoaXMudHlwZS5mdmRBZGp1c3QgKSB7XG5cdFx0XHR2YXIgdmFyaWFudE9wdGlvbnMgPSB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250VmFyaWFudE9wdGlvbnMoKTtcblx0XHRcdHZhcmlhbnRPcHRpb25zLmZvckVhY2goIGZ1bmN0aW9uKCBmdmQgKSB7XG5cdFx0XHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRWYXJpYW50T3B0aW9uKCB7XG5cdFx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRcdGlkOiBmdmQsXG5cdFx0XHRcdFx0Y3VycmVudEZvbnRWYXJpYW50OiB0aGlzLmN1cnJlbnRGb250VmFyaWFudFxuXHRcdFx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHRcdH0uYmluZCggdGhpcyApICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBnZXRGb250VmFyaWFudE5hbWVGcm9tSWQgPSByZXF1aXJlKCAnLi4vaGVscGVycy9mdmQtdG8tcmVhZGFibGUnICkuZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtdmFyaWFudC1vcHRpb24gamV0cGFjay1mb250c19fZm9udC1wcm9wZXJ0eS1vcHRpb24nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdzZXRWYXJpYW50T3B0aW9uJyxcblx0XHQna2V5ZG93bic6ICdjaGVja0tleWJvYXJkU2VsZWN0J1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmlkID0gb3B0cy5pZDtcblx0XHR0aGlzLmN1cnJlbnRGb250VmFyaWFudCA9IG9wdHMuY3VycmVudEZvbnRWYXJpYW50O1xuXHR9LFxuXG5cdGNoZWNrS2V5Ym9hcmRTZWxlY3Q6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoIGV2ZW50LmtleSA9PT0gJ0VudGVyJyApIHtcblx0XHRcdHRoaXMuJGVsLmNsaWNrKCk7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkKCB0aGlzLmlkICkgKTtcblx0XHR0aGlzLiRlbC5kYXRhKCAnaWQnLCB0aGlzLmlkICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250VmFyaWFudCA9PT0gdGhpcy5pZCApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnY3VycmVudCcgKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0c2V0VmFyaWFudE9wdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnc2V0LXZhcmlhbnQnLCB7IHZhcmlhbnQ6IHRoaXMuaWQsIHR5cGU6IHRoaXMudHlwZS5pZCB9ICk7XG5cdH1cblxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOk1hc3RlclZpZXcnICksXG5cdGF2YWlsYWJsZUZvbnRzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXZhaWxhYmxlLWZvbnRzJyApLFxuXHRhdmFpbGFibGVUeXBlcyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2F2YWlsYWJsZS10eXBlcycgKTtcblxudmFyIEZvbnRUeXBlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdHlwZScgKSxcblx0QXZhaWxhYmxlRm9udHMgPSByZXF1aXJlKCAnLi4vY29sbGVjdGlvbnMvYXZhaWxhYmxlLWZvbnRzJyApO1xuXG52YXIgRGVmYXVsdEZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL2RlZmF1bHQtZm9udCcgKTtcblxuLy8gSW5pdGlhbGl6ZSB0aGUgZGVmYXVsdCBQcm92aWRlciBWaWV3c1xucmVxdWlyZSggJy4uL3Byb3ZpZGVycy9nb29nbGUnICk7XG5cbi8vIFRoZSBtYWluIGZvbnQgY29udHJvbCBWaWV3LCBjb250YWluaW5nIHNlY3Rpb25zIGZvciBlYWNoIHNldHRpbmcgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMgPSBvcHRzLnNlbGVjdGVkRm9udHM7XG5cdFx0ZGVidWcoICdpbml0IHdpdGggY3VycmVudGx5IHNlbGVjdGVkIGZvbnRzOicsIHRoaXMuc2VsZWN0ZWRGb250cy50b0pTT04oKSApO1xuXHRcdHRoaXMudHlwZVZpZXdzID0gW107XG5cdFx0dGhpcy5oZWFkaW5nRm9udHMgPSBuZXcgQXZhaWxhYmxlRm9udHMoIGF2YWlsYWJsZUZvbnRzICk7XG5cdFx0dGhpcy5ib2R5Rm9udHMgPSBuZXcgQXZhaWxhYmxlRm9udHMoIHRoaXMuaGVhZGluZ0ZvbnRzLndoZXJlKCB7IGJvZHlUZXh0OiB0cnVlIH0gKSApO1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdjaGFuZ2UtZm9udCcsIHRoaXMudXBkYXRlQ3VycmVudEZvbnQgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnc2V0LXZhcmlhbnQnLCB0aGlzLnNldEZvbnRWYXJpYW50ICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ3NldC1zaXplJywgdGhpcy5zZXRGb250U2l6ZSApO1xuXHR9LFxuXG5cdGNsb3NlQWxsTWVudXM6IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0c2V0Rm9udFZhcmlhbnQ6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGRlYnVnKCAnZm9udCB2YXJpYW50IGNoYW5nZWQnLCBkYXRhICk7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5zZWxlY3RlZEZvbnRzLmdldEZvbnRCeVR5cGUoIGRhdGEudHlwZSApO1xuXHRcdG1vZGVsLnNldCggJ2N1cnJlbnRGdmQnLCBkYXRhLnZhcmlhbnQgKTtcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMuc2V0U2VsZWN0ZWRGb250KCBtb2RlbC50b0pTT04oKSApO1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0c2V0Rm9udFNpemU6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGRlYnVnKCAnZm9udCBzaXplIGNoYW5nZWQnLCBkYXRhICk7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5zZWxlY3RlZEZvbnRzLmdldEZvbnRCeVR5cGUoIGRhdGEudHlwZSApO1xuXHRcdG1vZGVsLnNldCggJ3NpemUnLCBkYXRhLnNpemUgKTtcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMuc2V0U2VsZWN0ZWRGb250KCBtb2RlbC50b0pTT04oKSApO1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0dXBkYXRlQ3VycmVudEZvbnQ6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGRhdGEuZm9udC5zZXQoIHsgdHlwZTogZGF0YS50eXBlIH0gKTtcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMuc2V0U2VsZWN0ZWRGb250KCBkYXRhLmZvbnQudG9KU09OKCkgKTtcblx0XHRkZWJ1ZyggJ3VwZGF0ZUN1cnJlbnRGb250IHdpdGgnLCBkYXRhLmZvbnQudG9KU09OKCksICd0bycsIHRoaXMuc2VsZWN0ZWRGb250cy5nZXRGb250QnlUeXBlKCBkYXRhLnR5cGUgKS50b0pTT04oKSApO1xuXHRcdC8vIFNldHRpbmcgaGVhZGluZ3MgdHlwZSBvdmVyd3JpdGVzIHRoZSBkZXByZWNhdGVkIHNpdGUtdGl0bGUgdHlwZVxuXHRcdGlmICggZGF0YS50eXBlID09PSAnaGVhZGluZ3MnICkge1xuXHRcdFx0dGhpcy51cGRhdGVDdXJyZW50Rm9udCggeyBmb250OiBuZXcgRGVmYXVsdEZvbnQoKSwgdHlwZTogJ3NpdGUtdGl0bGUnIH0gKTtcblx0XHR9XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudHlwZVZpZXdzLmZvckVhY2goIGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRcdFx0dmlldy5yZW1vdmUoKTtcblx0XHR9ICk7XG5cdFx0dGhpcy4kZWwudGV4dCggJycgKTsgLy8gVE9ETzogYmV0dGVyIHRvIHVwZGF0ZSBlYWNoIFZpZXcgdGhhbiBvdmVyd3JpdGVcblx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBjb250cm9scyBmb3IgZm9udCB0eXBlcycsIGF2YWlsYWJsZVR5cGVzICk7XG5cdFx0dGhpcy50eXBlVmlld3MgPSBhdmFpbGFibGVUeXBlcy5tYXAoIHRoaXMucmVuZGVyVHlwZUNvbnRyb2wuYmluZCggdGhpcyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVuZGVyVHlwZUNvbnRyb2w6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdHZhciBmb250cztcblx0XHRpZiAoIHR5cGUuYm9keVRleHQgPT09IHRydWUgKSB7XG5cdFx0XHRmb250cyA9IHRoaXMuYm9keUZvbnRzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb250cyA9IHRoaXMuaGVhZGluZ0ZvbnRzO1xuXHRcdH1cblx0XHR2YXIgdmlldyA9IG5ldyBGb250VHlwZSgge1xuXHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLnNlbGVjdGVkRm9udHMuZ2V0Rm9udEJ5VHlwZSggdHlwZS5pZCApLFxuXHRcdFx0Zm9udERhdGE6IGZvbnRzXG5cdFx0fSApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggdmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB2aWV3O1xuXHR9LFxuXG5cdGxvYWRGb250czogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnbG9hZC1tZW51LWZvbnRzJyApO1xuXHR9XG5cbn0gKTtcbiJdfQ==
