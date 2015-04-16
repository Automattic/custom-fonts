(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// TODO: import these from the annotations files for this theme
var annotations = [
	{
		type: 'body-text',
		rules: [
			{ 'property': 'font-size', 'value': '16px' },
		],
		selector: 'body, button, input, select, textarea'
	},
	{
		type: 'headings',
		rules: [
			{ 'property': 'font-size', 'value': '33px' },
		],
		selector: '.entry-title'
	},
	{
		type: 'headings',
		rules: [
			{ 'property': 'font-size', 'value': '18px' },
		],
		selector: '.site-title'
	},
];

module.exports = annotations;

},{}],2:[function(require,module,exports){
module.exports = window.wp.customize;

},{}],3:[function(require,module,exports){
/* globals Backbone */
module.exports = Backbone;

},{}],4:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	_ = require( '../helpers/underscore' );

module.exports = _.extend( Backbone.Events );


},{"../helpers/backbone":3,"../helpers/underscore":8}],5:[function(require,module,exports){
var api = require( '../helpers/api' ),
	debug = require( 'debug' )( 'jetpack-fonts' ),
	PreviewStyles = require( '../helpers/preview-styles' ),
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider;

// Initialize the default Provider Views
require( '../providers/google' );

function addFontToPage( font ) {
	var ProviderView = getViewForProvider( font.provider );
	if ( ! ProviderView ) {
		debug( 'live update failed because no provider could be found for', font );
		return;
	}
	ProviderView.addFontToPage( font );
}

function liveUpdateFontsInPreview( selectedFonts ) {
	debug( 'rendering live update for new styles', selectedFonts );
	selectedFonts.forEach( addFontToPage );
	PreviewStyles.writeFontStyles( selectedFonts );
}

function init() {
	debug( 'binding live updates for custom-fonts' );
	api( 'jetpack_fonts[selected_fonts]', function( value ) {
		value.bind( function( selectedFonts ) {
			liveUpdateFontsInPreview( selectedFonts );
		} );
	} );
}

module.exports = {
	liveUpdateFontsInPreview: liveUpdateFontsInPreview
};

init();

},{"../helpers/api":2,"../helpers/preview-styles":6,"../helpers/provider-views":7,"../providers/google":9,"debug":11}],6:[function(require,module,exports){
var jQuery = require( '../helpers/backbone' ).$,
	debug = require( 'debug' )( 'jetpack-fonts' ),
	fvd = require( 'fvd' ),
	annotations = require( '../helpers/annotations' );

function getAnnotationsForType( type ) {
	return annotations.filter( function( annotation ) {
		return ( annotation.type === type );
	} );
}

function generateCssForStyleObject( style ) {
	return getAnnotationsForType( style.type ).map( generateCssForAnnotation.bind( null, style ) ).join( ' ' );
}

function generateCssForAnnotation( style, annotation ) {
	if ( ! annotation.selector ) {
		return '';
	}
	var css = annotation.selector + ' {';
	if ( style.name ) {
		css += 'font-family:' + style.name + ';';
	}
	if ( style.fvds && Array.isArray( style.fvds ) && style.fvds.length === 1 ) {
		var code = style.fvds[ 0 ];
		var parsed = fvd.expand( code );
		if ( parsed ) {
			css += parsed;
		} else {
			debug( 'unable to parse fvd', code, 'for style', style );
		}
	} else {
		css += fvd.expand( 'n4' );
	}
	if ( style.size ) {
		css += 'font-size: ' + generateFontSize( style.size, annotation ) + ';';
	}
	css += '}';
	return css;
}

function generateFontSize( size, annotation ) {
	var originalSizeString = getFontSizeFromAnnotation( annotation ) || '16px';
	var units = parseUnits( originalSizeString );
	var originalSize = parseSize( originalSizeString );
	var scale = ( parseInt( size, 10 ) * 0.06 ) + 1;
	return ( scale * originalSize ).toFixed( 1 ) + units;
}

function getFontSizeFromAnnotation( annotation ) {
	if ( ! annotation.rules ) {
		return;
	}
	var originalSizeString;
	annotation.rules.forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-size' ) {
			originalSizeString = rule.value;
		}
	} );
	return originalSizeString;
}

function parseUnits( sizeString ) {
	// TODO: clean up this Regexp
	var matches = sizeString.match( /((\d*\.(\d+))|(\d+))([A-Za-z]{2,3}|%)/ );
	return matches[ 5 ];
}

function parseSize( sizeString ) {
	// TODO: clean up this Regexp
	var matches = sizeString.match( /((\d*\.(\d+))|(\d+))([A-Za-z]{2,3}|%)/ );
	var size, precision;
	if ( matches[ 4 ] ) {
		size = parseInt( matches[ 4 ], 10 );
		precision = ( size > 9 ) ? 1 : 3;
	} else {
		size = parseFloat( matches[ 2 ] );
		precision = matches[ 3 ].length + 1;
	}
	return size.toFixed( precision );
}

var PreviewStyles = {
	getFontStyleElement: function() {
		return jQuery( '#jetpack-custom-fonts-css' )[ 0 ];
	},

	writeFontStyles: function( styles ) {
		PreviewStyles.removeFontStyleElement();
		PreviewStyles.addStyleElementToPage( PreviewStyles.createStyleElementWith( PreviewStyles.generateCssFromStyles( styles ) ) );
	},

	generateCssFromStyles: function( styles ) {
		if ( ! styles ) {
			return '';
		}
		return styles.reduce( function( css, style ) {
			css += generateCssForStyleObject( style );
			return css;
		}, '' );
	},

	createStyleElementWith: function( css ) {
		return jQuery( '<style id="jetpack-custom-fonts-css">' + css + '</style>');
	},

	removeFontStyleElement: function() {
		var element = PreviewStyles.getFontStyleElement();
		if ( element ) {
			jQuery( element ).remove();
		}
	},

	addStyleElementToPage: function( element ) {
		jQuery( 'head' ).append( element );
	}

};

module.exports = PreviewStyles;

},{"../helpers/annotations":1,"../helpers/backbone":3,"debug":11,"fvd":16}],7:[function(require,module,exports){
/**
 * This helper sets up Views to render each font for specific providers. Each
 * View should be an instance of `wp.customize.JetpackFonts.ProviderView` (which
 * is a `Backbone.View`) that will render its font option to the font list.
 * Additional provider Views can be added by adding to the
 * `wp.customize.JetpackFonts.providerViews` object using the provider id as the
 * key. The only thing that needs to be added for each ProviderView is the
 * `render` method. Each ProviderView has as its `model` object the font object
 * it needs to display, including the `name` and `id` attributes.
 */

var api = require( '../helpers/api' ),
	debug = require( 'debug' )( 'jetpack-fonts' );

var DropdownItem = require( '../views/dropdown-item' );
if ( ! api.JetpackFonts ) {
	api.JetpackFonts = {};
}
if ( ! api.JetpackFonts.providerViews ) {
	api.JetpackFonts.providerViews = {};
}
api.JetpackFonts.ProviderView = DropdownItem;

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
		debug( 'found view for provider', provider, ':', providerViews[ provider ] );
		return providerViews[ provider ];
	}
	debug( 'no view found for provider', provider );
	return null;
}

module.exports = {
	getViewForProvider: getViewForProvider
};

},{"../helpers/api":2,"../views/dropdown-item":10,"debug":11}],8:[function(require,module,exports){
/* globals _ */
module.exports = _;

},{}],9:[function(require,module,exports){
/* globals WebFont */
var api = require( '../helpers/api' );

var loadedFontIds = [];

function addFontToPage( font, text ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	WebFont.load( { google: { families: [ font.id ], text: text } } );
}

var GoogleProviderView = api.JetpackFonts.ProviderView.extend({
	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		this.$el.css( 'font-family', '"' + this.model.get( 'name' ) + '"' );
		if ( this.currentFont && this.currentFont.get( 'name' ) === this.model.get( 'name' ) ) {
			this.$el.addClass( 'active' );
		} else {
			this.$el.removeClass( 'active' );
		}
		addFontToPage( this.model.toJSON(), this.model.get( 'id' ) );
		return this;
	}
});

GoogleProviderView.addFontToPage = addFontToPage;

api.JetpackFonts.providerViews.google = GoogleProviderView;

module.exports = GoogleProviderView;

},{"../helpers/api":2}],10:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

// An individual font in the dropdown list, exported as
// `api.JetpackFonts.ProviderView`. Extend this object for each provider. The
// extended objects need to define a `render` method to render their provider's
// font name, as well as an `addFontToPage` method on the object itself.
var ProviderView = Backbone.View.extend({
	className: 'jetpack-fonts__option',

	events: {
		'click' : 'fontChanged'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.currentFont = opts.currentFont;
		if ( this.currentFont ) {
			this.listenTo( this.currentFont, 'change', this.render );
		}
	},

	// Warning: this should be overriden in the provider
	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		return this;
	},

	fontChanged: function() {
		Emitter.trigger( 'change-font', { font: this.model, type: this.type } );
	}
});

ProviderView.addFontToPage = function() {};

module.exports = ProviderView;

},{"../helpers/backbone":3,"../helpers/emitter":4}],11:[function(require,module,exports){

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

},{"./debug":12}],12:[function(require,module,exports){

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

},{"ms":13}],13:[function(require,module,exports){
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
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],14:[function(require,module,exports){
var own = require('own')

var DESCRIPTOR_RE = /\s+/g
var PROTOTYPE = {

    compact: function (input) {
        var result = ['n', '4']
        var descriptors = (input || '').split(';')
        var pair, property, value, index, values
        for (var i = 0; i < descriptors.length; i++) {
            pair = descriptors[i].replace(DESCRIPTOR_RE, '').split(':')
            if (pair.length !== 2) continue
            property = pair[0]
            value = pair[1]
            values = this.values[property]
            if (!values) continue
            for (var j = 0; j < values.length; j++) {
                if (values[j][1] !== value) continue
                result[this.properties.indexOf(property)] = values[j][0]
            }
        }
        return result.join('')
    }

}

exports.create = create

function create(properties, values) {
    return Object.create(PROTOTYPE, own({
        properties: properties,
        values: values
    }))
}

},{"own":18}],15:[function(require,module,exports){
var own = require('own')

var PROTOTYPE = {

    expand: function (input) {
        if (typeof input !== 'string' || input.length !== 2) return null
        var result = [null, null]
        var key, property, values, value
        for (var i = 0; i < this.properties.length; i++) {
            key = input[i]
            property = this.properties[i]
            values = this.values[property]
            for (j = 0; j < values.length; j++) {
                value = values[j]
                if (value[0] !== key) continue
                result[i] = [this.properties[i], value[1]].join(':')
            }
        }
        return (result.indexOf(null) < 0) ? (result.join(';') + ';') : null
    }

}

exports.create = create

function create(properties, values) {
    return Object.create(PROTOTYPE, own({
        properties: properties,
        values: values
    }))
}

},{"own":18}],16:[function(require,module,exports){
var Compactor = require('./compactor')
var Expander = require('./expander')
var Parser = require('./parser')

var PROPERTIES = [
    'font-style',
    'font-weight'
]
var VALUES = {
    'font-style': [
        ['n', 'normal'],
        ['i', 'italic'],
        ['o', 'oblique']
    ],
    'font-weight': [
        ['4', 'normal'],
        ['7', 'bold'],
        ['1', '100'],
        ['2', '200'],
        ['3', '300'],
        ['4', '400'],
        ['5', '500'],
        ['6', '600'],
        ['7', '700'],
        ['8', '800'],
        ['9', '900']
    ]
}

var compactor, expander, parser

exports.compact = compact
exports.expand = expand
exports.parse = parse

function compact(input) {
    if (!compactor) compactor = Compactor.create(PROPERTIES, VALUES)
    return compactor.compact(input)
}

function expand(input) {
    if (!expander) expander = Expander.create(PROPERTIES, VALUES)
    return expander.expand(input)
}

function parse(input) {
    if (!parser) parser = Parser.create(PROPERTIES, VALUES)
    return parser.parse(input)
}

},{"./compactor":14,"./expander":15,"./parser":17}],17:[function(require,module,exports){
var own = require('own')

var PROTOTYPE = {

    parse: function (input) {
        if (typeof input !== 'string' || input.length !== 2) return null
        var result = {}
        var key, property, values, value
        for (var i = 0; i < this.properties.length; i++) {
            key = input[i]
            property = this.properties[i]
            values = this.values[property]
            for (j = 0; j < values.length; j++) {
                value = values[j]
                if (value[0] !== key) continue
                result[this.properties[i]] = value[1]
            }
        }
        return (result[this.properties[0]] && result[this.properties[1]]) ? result : null
    }

}

exports.create = create

function create(properties, values) {
    return Object.create(PROTOTYPE, own({
        properties: properties,
        values: values
    }))
}

},{"own":18}],18:[function(require,module,exports){
create.readonly = readonly
module.exports = create

function create(properties, isWritable, isConfigurable) {
    if (properties !== Object(properties)) return undefined
    var result = {}
    var name, descriptors, descriptorName, descriptor
    for (name in properties) {
        if (!properties.hasOwnProperty(name)) continue
        result[name] = Object.getOwnPropertyDescriptor(properties, name)
        if (typeof isWritable === 'boolean') result[name].writable = isWritable
        if (typeof isConfigurable === 'boolean') result[name].configurable = isConfigurable
    }
    return result
}

function readonly(properties) {
    return create(properties, false, false)
}

},{}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9oZWxwZXJzL2Fubm90YXRpb25zLmpzIiwianMvaGVscGVycy9hcGkuanMiLCJqcy9oZWxwZXJzL2JhY2tib25lLmpzIiwianMvaGVscGVycy9lbWl0dGVyLmpzIiwianMvaGVscGVycy9saXZlLXVwZGF0ZS5qcyIsImpzL2hlbHBlcnMvcHJldmlldy1zdHlsZXMuanMiLCJqcy9oZWxwZXJzL3Byb3ZpZGVyLXZpZXdzLmpzIiwianMvaGVscGVycy91bmRlcnNjb3JlLmpzIiwianMvcHJvdmlkZXJzL2dvb2dsZS5qcyIsImpzL3ZpZXdzL2Ryb3Bkb3duLWl0ZW0uanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnZkL2xpYi9jb21wYWN0b3IuanMiLCJub2RlX21vZHVsZXMvZnZkL2xpYi9leHBhbmRlci5qcyIsIm5vZGVfbW9kdWxlcy9mdmQvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Z2ZC9saWIvcGFyc2VyLmpzIiwibm9kZV9tb2R1bGVzL2Z2ZC9ub2RlX21vZHVsZXMvb3duL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gVE9ETzogaW1wb3J0IHRoZXNlIGZyb20gdGhlIGFubm90YXRpb25zIGZpbGVzIGZvciB0aGlzIHRoZW1lXG52YXIgYW5ub3RhdGlvbnMgPSBbXG5cdHtcblx0XHR0eXBlOiAnYm9keS10ZXh0Jyxcblx0XHRydWxlczogW1xuXHRcdFx0eyAncHJvcGVydHknOiAnZm9udC1zaXplJywgJ3ZhbHVlJzogJzE2cHgnIH0sXG5cdFx0XSxcblx0XHRzZWxlY3RvcjogJ2JvZHksIGJ1dHRvbiwgaW5wdXQsIHNlbGVjdCwgdGV4dGFyZWEnXG5cdH0sXG5cdHtcblx0XHR0eXBlOiAnaGVhZGluZ3MnLFxuXHRcdHJ1bGVzOiBbXG5cdFx0XHR7ICdwcm9wZXJ0eSc6ICdmb250LXNpemUnLCAndmFsdWUnOiAnMzNweCcgfSxcblx0XHRdLFxuXHRcdHNlbGVjdG9yOiAnLmVudHJ5LXRpdGxlJ1xuXHR9LFxuXHR7XG5cdFx0dHlwZTogJ2hlYWRpbmdzJyxcblx0XHRydWxlczogW1xuXHRcdFx0eyAncHJvcGVydHknOiAnZm9udC1zaXplJywgJ3ZhbHVlJzogJzE4cHgnIH0sXG5cdFx0XSxcblx0XHRzZWxlY3RvcjogJy5zaXRlLXRpdGxlJ1xuXHR9LFxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSBhbm5vdGF0aW9ucztcbiIsIm1vZHVsZS5leHBvcnRzID0gd2luZG93LndwLmN1c3RvbWl6ZTtcbiIsIi8qIGdsb2JhbHMgQmFja2JvbmUgKi9cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmU7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0XyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gXy5leHRlbmQoIEJhY2tib25lLkV2ZW50cyApO1xuXG4iLCJ2YXIgYXBpID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXBpJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHMnICksXG5cdFByZXZpZXdTdHlsZXMgPSByZXF1aXJlKCAnLi4vaGVscGVycy9wcmV2aWV3LXN0eWxlcycgKSxcblx0Z2V0Vmlld0ZvclByb3ZpZGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJvdmlkZXItdmlld3MnICkuZ2V0Vmlld0ZvclByb3ZpZGVyO1xuXG4vLyBJbml0aWFsaXplIHRoZSBkZWZhdWx0IFByb3ZpZGVyIFZpZXdzXG5yZXF1aXJlKCAnLi4vcHJvdmlkZXJzL2dvb2dsZScgKTtcblxuZnVuY3Rpb24gYWRkRm9udFRvUGFnZSggZm9udCApIHtcblx0dmFyIFByb3ZpZGVyVmlldyA9IGdldFZpZXdGb3JQcm92aWRlciggZm9udC5wcm92aWRlciApO1xuXHRpZiAoICEgUHJvdmlkZXJWaWV3ICkge1xuXHRcdGRlYnVnKCAnbGl2ZSB1cGRhdGUgZmFpbGVkIGJlY2F1c2Ugbm8gcHJvdmlkZXIgY291bGQgYmUgZm91bmQgZm9yJywgZm9udCApO1xuXHRcdHJldHVybjtcblx0fVxuXHRQcm92aWRlclZpZXcuYWRkRm9udFRvUGFnZSggZm9udCApO1xufVxuXG5mdW5jdGlvbiBsaXZlVXBkYXRlRm9udHNJblByZXZpZXcoIHNlbGVjdGVkRm9udHMgKSB7XG5cdGRlYnVnKCAncmVuZGVyaW5nIGxpdmUgdXBkYXRlIGZvciBuZXcgc3R5bGVzJywgc2VsZWN0ZWRGb250cyApO1xuXHRzZWxlY3RlZEZvbnRzLmZvckVhY2goIGFkZEZvbnRUb1BhZ2UgKTtcblx0UHJldmlld1N0eWxlcy53cml0ZUZvbnRTdHlsZXMoIHNlbGVjdGVkRm9udHMgKTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcblx0ZGVidWcoICdiaW5kaW5nIGxpdmUgdXBkYXRlcyBmb3IgY3VzdG9tLWZvbnRzJyApO1xuXHRhcGkoICdqZXRwYWNrX2ZvbnRzW3NlbGVjdGVkX2ZvbnRzXScsIGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHR2YWx1ZS5iaW5kKCBmdW5jdGlvbiggc2VsZWN0ZWRGb250cyApIHtcblx0XHRcdGxpdmVVcGRhdGVGb250c0luUHJldmlldyggc2VsZWN0ZWRGb250cyApO1xuXHRcdH0gKTtcblx0fSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0bGl2ZVVwZGF0ZUZvbnRzSW5QcmV2aWV3OiBsaXZlVXBkYXRlRm9udHNJblByZXZpZXdcbn07XG5cbmluaXQoKTtcbiIsInZhciBqUXVlcnkgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKS4kLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHMnICksXG5cdGZ2ZCA9IHJlcXVpcmUoICdmdmQnICksXG5cdGFubm90YXRpb25zID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYW5ub3RhdGlvbnMnICk7XG5cbmZ1bmN0aW9uIGdldEFubm90YXRpb25zRm9yVHlwZSggdHlwZSApIHtcblx0cmV0dXJuIGFubm90YXRpb25zLmZpbHRlciggZnVuY3Rpb24oIGFubm90YXRpb24gKSB7XG5cdFx0cmV0dXJuICggYW5ub3RhdGlvbi50eXBlID09PSB0eXBlICk7XG5cdH0gKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVDc3NGb3JTdHlsZU9iamVjdCggc3R5bGUgKSB7XG5cdHJldHVybiBnZXRBbm5vdGF0aW9uc0ZvclR5cGUoIHN0eWxlLnR5cGUgKS5tYXAoIGdlbmVyYXRlQ3NzRm9yQW5ub3RhdGlvbi5iaW5kKCBudWxsLCBzdHlsZSApICkuam9pbiggJyAnICk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQ3NzRm9yQW5ub3RhdGlvbiggc3R5bGUsIGFubm90YXRpb24gKSB7XG5cdGlmICggISBhbm5vdGF0aW9uLnNlbGVjdG9yICkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXHR2YXIgY3NzID0gYW5ub3RhdGlvbi5zZWxlY3RvciArICcgeyc7XG5cdGlmICggc3R5bGUubmFtZSApIHtcblx0XHRjc3MgKz0gJ2ZvbnQtZmFtaWx5OicgKyBzdHlsZS5uYW1lICsgJzsnO1xuXHR9XG5cdGlmICggc3R5bGUuZnZkcyAmJiBBcnJheS5pc0FycmF5KCBzdHlsZS5mdmRzICkgJiYgc3R5bGUuZnZkcy5sZW5ndGggPT09IDEgKSB7XG5cdFx0dmFyIGNvZGUgPSBzdHlsZS5mdmRzWyAwIF07XG5cdFx0dmFyIHBhcnNlZCA9IGZ2ZC5leHBhbmQoIGNvZGUgKTtcblx0XHRpZiAoIHBhcnNlZCApIHtcblx0XHRcdGNzcyArPSBwYXJzZWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlYnVnKCAndW5hYmxlIHRvIHBhcnNlIGZ2ZCcsIGNvZGUsICdmb3Igc3R5bGUnLCBzdHlsZSApO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRjc3MgKz0gZnZkLmV4cGFuZCggJ240JyApO1xuXHR9XG5cdGlmICggc3R5bGUuc2l6ZSApIHtcblx0XHRjc3MgKz0gJ2ZvbnQtc2l6ZTogJyArIGdlbmVyYXRlRm9udFNpemUoIHN0eWxlLnNpemUsIGFubm90YXRpb24gKSArICc7Jztcblx0fVxuXHRjc3MgKz0gJ30nO1xuXHRyZXR1cm4gY3NzO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUZvbnRTaXplKCBzaXplLCBhbm5vdGF0aW9uICkge1xuXHR2YXIgb3JpZ2luYWxTaXplU3RyaW5nID0gZ2V0Rm9udFNpemVGcm9tQW5ub3RhdGlvbiggYW5ub3RhdGlvbiApIHx8ICcxNnB4Jztcblx0dmFyIHVuaXRzID0gcGFyc2VVbml0cyggb3JpZ2luYWxTaXplU3RyaW5nICk7XG5cdHZhciBvcmlnaW5hbFNpemUgPSBwYXJzZVNpemUoIG9yaWdpbmFsU2l6ZVN0cmluZyApO1xuXHR2YXIgc2NhbGUgPSAoIHBhcnNlSW50KCBzaXplLCAxMCApICogMC4wNiApICsgMTtcblx0cmV0dXJuICggc2NhbGUgKiBvcmlnaW5hbFNpemUgKS50b0ZpeGVkKCAxICkgKyB1bml0cztcbn1cblxuZnVuY3Rpb24gZ2V0Rm9udFNpemVGcm9tQW5ub3RhdGlvbiggYW5ub3RhdGlvbiApIHtcblx0aWYgKCAhIGFubm90YXRpb24ucnVsZXMgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBvcmlnaW5hbFNpemVTdHJpbmc7XG5cdGFubm90YXRpb24ucnVsZXMuZm9yRWFjaCggZnVuY3Rpb24oIHJ1bGUgKSB7XG5cdFx0aWYgKCBydWxlLnZhbHVlICYmIHJ1bGUucHJvcGVydHkgPT09ICdmb250LXNpemUnICkge1xuXHRcdFx0b3JpZ2luYWxTaXplU3RyaW5nID0gcnVsZS52YWx1ZTtcblx0XHR9XG5cdH0gKTtcblx0cmV0dXJuIG9yaWdpbmFsU2l6ZVN0cmluZztcbn1cblxuZnVuY3Rpb24gcGFyc2VVbml0cyggc2l6ZVN0cmluZyApIHtcblx0Ly8gVE9ETzogY2xlYW4gdXAgdGhpcyBSZWdleHBcblx0dmFyIG1hdGNoZXMgPSBzaXplU3RyaW5nLm1hdGNoKCAvKChcXGQqXFwuKFxcZCspKXwoXFxkKykpKFtBLVphLXpdezIsM318JSkvICk7XG5cdHJldHVybiBtYXRjaGVzWyA1IF07XG59XG5cbmZ1bmN0aW9uIHBhcnNlU2l6ZSggc2l6ZVN0cmluZyApIHtcblx0Ly8gVE9ETzogY2xlYW4gdXAgdGhpcyBSZWdleHBcblx0dmFyIG1hdGNoZXMgPSBzaXplU3RyaW5nLm1hdGNoKCAvKChcXGQqXFwuKFxcZCspKXwoXFxkKykpKFtBLVphLXpdezIsM318JSkvICk7XG5cdHZhciBzaXplLCBwcmVjaXNpb247XG5cdGlmICggbWF0Y2hlc1sgNCBdICkge1xuXHRcdHNpemUgPSBwYXJzZUludCggbWF0Y2hlc1sgNCBdLCAxMCApO1xuXHRcdHByZWNpc2lvbiA9ICggc2l6ZSA+IDkgKSA/IDEgOiAzO1xuXHR9IGVsc2Uge1xuXHRcdHNpemUgPSBwYXJzZUZsb2F0KCBtYXRjaGVzWyAyIF0gKTtcblx0XHRwcmVjaXNpb24gPSBtYXRjaGVzWyAzIF0ubGVuZ3RoICsgMTtcblx0fVxuXHRyZXR1cm4gc2l6ZS50b0ZpeGVkKCBwcmVjaXNpb24gKTtcbn1cblxudmFyIFByZXZpZXdTdHlsZXMgPSB7XG5cdGdldEZvbnRTdHlsZUVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBqUXVlcnkoICcjamV0cGFjay1jdXN0b20tZm9udHMtY3NzJyApWyAwIF07XG5cdH0sXG5cblx0d3JpdGVGb250U3R5bGVzOiBmdW5jdGlvbiggc3R5bGVzICkge1xuXHRcdFByZXZpZXdTdHlsZXMucmVtb3ZlRm9udFN0eWxlRWxlbWVudCgpO1xuXHRcdFByZXZpZXdTdHlsZXMuYWRkU3R5bGVFbGVtZW50VG9QYWdlKCBQcmV2aWV3U3R5bGVzLmNyZWF0ZVN0eWxlRWxlbWVudFdpdGgoIFByZXZpZXdTdHlsZXMuZ2VuZXJhdGVDc3NGcm9tU3R5bGVzKCBzdHlsZXMgKSApICk7XG5cdH0sXG5cblx0Z2VuZXJhdGVDc3NGcm9tU3R5bGVzOiBmdW5jdGlvbiggc3R5bGVzICkge1xuXHRcdGlmICggISBzdHlsZXMgKSB7XG5cdFx0XHRyZXR1cm4gJyc7XG5cdFx0fVxuXHRcdHJldHVybiBzdHlsZXMucmVkdWNlKCBmdW5jdGlvbiggY3NzLCBzdHlsZSApIHtcblx0XHRcdGNzcyArPSBnZW5lcmF0ZUNzc0ZvclN0eWxlT2JqZWN0KCBzdHlsZSApO1xuXHRcdFx0cmV0dXJuIGNzcztcblx0XHR9LCAnJyApO1xuXHR9LFxuXG5cdGNyZWF0ZVN0eWxlRWxlbWVudFdpdGg6IGZ1bmN0aW9uKCBjc3MgKSB7XG5cdFx0cmV0dXJuIGpRdWVyeSggJzxzdHlsZSBpZD1cImpldHBhY2stY3VzdG9tLWZvbnRzLWNzc1wiPicgKyBjc3MgKyAnPC9zdHlsZT4nKTtcblx0fSxcblxuXHRyZW1vdmVGb250U3R5bGVFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxlbWVudCA9IFByZXZpZXdTdHlsZXMuZ2V0Rm9udFN0eWxlRWxlbWVudCgpO1xuXHRcdGlmICggZWxlbWVudCApIHtcblx0XHRcdGpRdWVyeSggZWxlbWVudCApLnJlbW92ZSgpO1xuXHRcdH1cblx0fSxcblxuXHRhZGRTdHlsZUVsZW1lbnRUb1BhZ2U6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdGpRdWVyeSggJ2hlYWQnICkuYXBwZW5kKCBlbGVtZW50ICk7XG5cdH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcmV2aWV3U3R5bGVzO1xuIiwiLyoqXG4gKiBUaGlzIGhlbHBlciBzZXRzIHVwIFZpZXdzIHRvIHJlbmRlciBlYWNoIGZvbnQgZm9yIHNwZWNpZmljIHByb3ZpZGVycy4gRWFjaFxuICogVmlldyBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YgYHdwLmN1c3RvbWl6ZS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3YCAod2hpY2hcbiAqIGlzIGEgYEJhY2tib25lLlZpZXdgKSB0aGF0IHdpbGwgcmVuZGVyIGl0cyBmb250IG9wdGlvbiB0byB0aGUgZm9udCBsaXN0LlxuICogQWRkaXRpb25hbCBwcm92aWRlciBWaWV3cyBjYW4gYmUgYWRkZWQgYnkgYWRkaW5nIHRvIHRoZVxuICogYHdwLmN1c3RvbWl6ZS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3c2Agb2JqZWN0IHVzaW5nIHRoZSBwcm92aWRlciBpZCBhcyB0aGVcbiAqIGtleS4gVGhlIG9ubHkgdGhpbmcgdGhhdCBuZWVkcyB0byBiZSBhZGRlZCBmb3IgZWFjaCBQcm92aWRlclZpZXcgaXMgdGhlXG4gKiBgcmVuZGVyYCBtZXRob2QuIEVhY2ggUHJvdmlkZXJWaWV3IGhhcyBhcyBpdHMgYG1vZGVsYCBvYmplY3QgdGhlIGZvbnQgb2JqZWN0XG4gKiBpdCBuZWVkcyB0byBkaXNwbGF5LCBpbmNsdWRpbmcgdGhlIGBuYW1lYCBhbmQgYGlkYCBhdHRyaWJ1dGVzLlxuICovXG5cbnZhciBhcGkgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hcGknICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250cycgKTtcblxudmFyIERyb3Bkb3duSXRlbSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1pdGVtJyApO1xuaWYgKCAhIGFwaS5KZXRwYWNrRm9udHMgKSB7XG5cdGFwaS5KZXRwYWNrRm9udHMgPSB7fTtcbn1cbmlmICggISBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKSB7XG5cdGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyA9IHt9O1xufVxuYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXcgPSBEcm9wZG93bkl0ZW07XG5cbnZhciBwcm92aWRlclZpZXdzID0ge307XG5cbmZ1bmN0aW9uIGltcG9ydFByb3ZpZGVyVmlld3MoKSB7XG5cdGRlYnVnKCAnaW1wb3J0aW5nIHByb3ZpZGVyIHZpZXdzIGZyb20nLCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKTtcblx0aWYgKCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKSB7XG5cdFx0T2JqZWN0LmtleXMoIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApLmZvckVhY2goIGZ1bmN0aW9uKCBwcm92aWRlcktleSApIHtcblx0XHRcdHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyS2V5IF0gPSBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3NbIHByb3ZpZGVyS2V5IF07XG5cdFx0fSApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFZpZXdGb3JQcm92aWRlciggcHJvdmlkZXIgKSB7XG5cdGltcG9ydFByb3ZpZGVyVmlld3MoKTtcblx0aWYgKCBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdICkge1xuXHRcdGRlYnVnKCAnZm91bmQgdmlldyBmb3IgcHJvdmlkZXInLCBwcm92aWRlciwgJzonLCBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdICk7XG5cdFx0cmV0dXJuIHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyIF07XG5cdH1cblx0ZGVidWcoICdubyB2aWV3IGZvdW5kIGZvciBwcm92aWRlcicsIHByb3ZpZGVyICk7XG5cdHJldHVybiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0Vmlld0ZvclByb3ZpZGVyOiBnZXRWaWV3Rm9yUHJvdmlkZXJcbn07XG4iLCIvKiBnbG9iYWxzIF8gKi9cbm1vZHVsZS5leHBvcnRzID0gXztcbiIsIi8qIGdsb2JhbHMgV2ViRm9udCAqL1xudmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKTtcblxudmFyIGxvYWRlZEZvbnRJZHMgPSBbXTtcblxuZnVuY3Rpb24gYWRkRm9udFRvUGFnZSggZm9udCwgdGV4dCApIHtcblx0aWYgKCB+IGxvYWRlZEZvbnRJZHMuaW5kZXhPZiggZm9udC5pZCApICkge1xuXHRcdHJldHVybjtcblx0fVxuXHRsb2FkZWRGb250SWRzLnB1c2goIGZvbnQuaWQgKTtcblx0V2ViRm9udC5sb2FkKCB7IGdvb2dsZTogeyBmYW1pbGllczogWyBmb250LmlkIF0sIHRleHQ6IHRleHQgfSB9ICk7XG59XG5cbnZhciBHb29nbGVQcm92aWRlclZpZXcgPSBhcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlldy5leHRlbmQoe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubW9kZWwuZ2V0KCAnbmFtZScgKSApO1xuXHRcdHRoaXMuJGVsLmNzcyggJ2ZvbnQtZmFtaWx5JywgJ1wiJyArIHRoaXMubW9kZWwuZ2V0KCAnbmFtZScgKSArICdcIicgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgJiYgdGhpcy5jdXJyZW50Rm9udC5nZXQoICduYW1lJyApID09PSB0aGlzLm1vZGVsLmdldCggJ25hbWUnICkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0fVxuXHRcdGFkZEZvbnRUb1BhZ2UoIHRoaXMubW9kZWwudG9KU09OKCksIHRoaXMubW9kZWwuZ2V0KCAnaWQnICkgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSk7XG5cbkdvb2dsZVByb3ZpZGVyVmlldy5hZGRGb250VG9QYWdlID0gYWRkRm9udFRvUGFnZTtcblxuYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzLmdvb2dsZSA9IEdvb2dsZVByb3ZpZGVyVmlldztcblxubW9kdWxlLmV4cG9ydHMgPSBHb29nbGVQcm92aWRlclZpZXc7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG4vLyBBbiBpbmRpdmlkdWFsIGZvbnQgaW4gdGhlIGRyb3Bkb3duIGxpc3QsIGV4cG9ydGVkIGFzXG4vLyBgYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXdgLiBFeHRlbmQgdGhpcyBvYmplY3QgZm9yIGVhY2ggcHJvdmlkZXIuIFRoZVxuLy8gZXh0ZW5kZWQgb2JqZWN0cyBuZWVkIHRvIGRlZmluZSBhIGByZW5kZXJgIG1ldGhvZCB0byByZW5kZXIgdGhlaXIgcHJvdmlkZXInc1xuLy8gZm9udCBuYW1lLCBhcyB3ZWxsIGFzIGFuIGBhZGRGb250VG9QYWdlYCBtZXRob2Qgb24gdGhlIG9iamVjdCBpdHNlbGYuXG52YXIgUHJvdmlkZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19vcHRpb24nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljaycgOiAnZm9udENoYW5nZWQnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udCApIHtcblx0XHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdH1cblx0fSxcblxuXHQvLyBXYXJuaW5nOiB0aGlzIHNob3VsZCBiZSBvdmVycmlkZW4gaW4gdGhlIHByb3ZpZGVyXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5tb2RlbC5nZXQoICduYW1lJyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Zm9udENoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2NoYW5nZS1mb250JywgeyBmb250OiB0aGlzLm1vZGVsLCB0eXBlOiB0aGlzLnR5cGUgfSApO1xuXHR9XG59KTtcblxuUHJvdmlkZXJWaWV3LmFkZEZvbnRUb1BhZ2UgPSBmdW5jdGlvbigpIHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyVmlldztcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgcmV0dXJuICgnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LFxuICAvLyB3aGVyZSB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gbG9jYWxTdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXJjYXNlZCBsZXR0ZXIsIGkuZS4gXCJuXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcigpIHtcbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW3ByZXZDb2xvcisrICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZXNwYWNlKSB7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZGlzYWJsZWQoKSB7XG4gIH1cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIC8vIGRlZmluZSB0aGUgYGVuYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcblxuICAgIHZhciBzZWxmID0gZW5hYmxlZDtcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcbiAgICBpZiAobnVsbCA9PSBzZWxmLnVzZUNvbG9ycykgc2VsZi51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICAgIGlmIChudWxsID09IHNlbGYuY29sb3IgJiYgc2VsZi51c2VDb2xvcnMpIHNlbGYuY29sb3IgPSBzZWxlY3RDb2xvcigpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuZm9ybWF0QXJncykge1xuICAgICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICB9XG4gICAgdmFyIGxvZ0ZuID0gZW5hYmxlZC5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBlbmFibGVkLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHZhciBmbiA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpID8gZW5hYmxlZCA6IGRpc2FibGVkO1xuXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICByZXR1cm4gZm47XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWVzcGFjZXMgfHwgJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucyl7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZhbCkgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIHJldHVybiBvcHRpb25zLmxvbmdcbiAgICA/IGxvbmcodmFsKVxuICAgIDogc2hvcnQodmFsKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtc3xzZWNvbmRzP3xzfG1pbnV0ZXM/fG18aG91cnM/fGh8ZGF5cz98ZHx5ZWFycz98eSk/JC9pLmV4ZWMoc3RyKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuO1xuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgaWYgKG1zID49IHMpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKVxuICAgIHx8IHBsdXJhbChtcywgaCwgJ2hvdXInKVxuICAgIHx8IHBsdXJhbChtcywgbSwgJ21pbnV0ZScpXG4gICAgfHwgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJylcbiAgICB8fCBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSByZXR1cm47XG4gIGlmIChtcyA8IG4gKiAxLjUpIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwidmFyIG93biA9IHJlcXVpcmUoJ293bicpXG5cbnZhciBERVNDUklQVE9SX1JFID0gL1xccysvZ1xudmFyIFBST1RPVFlQRSA9IHtcblxuICAgIGNvbXBhY3Q6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gWyduJywgJzQnXVxuICAgICAgICB2YXIgZGVzY3JpcHRvcnMgPSAoaW5wdXQgfHwgJycpLnNwbGl0KCc7JylcbiAgICAgICAgdmFyIHBhaXIsIHByb3BlcnR5LCB2YWx1ZSwgaW5kZXgsIHZhbHVlc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwYWlyID0gZGVzY3JpcHRvcnNbaV0ucmVwbGFjZShERVNDUklQVE9SX1JFLCAnJykuc3BsaXQoJzonKVxuICAgICAgICAgICAgaWYgKHBhaXIubGVuZ3RoICE9PSAyKSBjb250aW51ZVxuICAgICAgICAgICAgcHJvcGVydHkgPSBwYWlyWzBdXG4gICAgICAgICAgICB2YWx1ZSA9IHBhaXJbMV1cbiAgICAgICAgICAgIHZhbHVlcyA9IHRoaXMudmFsdWVzW3Byb3BlcnR5XVxuICAgICAgICAgICAgaWYgKCF2YWx1ZXMpIGNvbnRpbnVlXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZXNbal1bMV0gIT09IHZhbHVlKSBjb250aW51ZVxuICAgICAgICAgICAgICAgIHJlc3VsdFt0aGlzLnByb3BlcnRpZXMuaW5kZXhPZihwcm9wZXJ0eSldID0gdmFsdWVzW2pdWzBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdC5qb2luKCcnKVxuICAgIH1cblxufVxuXG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZVxuXG5mdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcywgdmFsdWVzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUoUFJPVE9UWVBFLCBvd24oe1xuICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLFxuICAgICAgICB2YWx1ZXM6IHZhbHVlc1xuICAgIH0pKVxufVxuIiwidmFyIG93biA9IHJlcXVpcmUoJ293bicpXG5cbnZhciBQUk9UT1RZUEUgPSB7XG5cbiAgICBleHBhbmQ6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJyB8fCBpbnB1dC5sZW5ndGggIT09IDIpIHJldHVybiBudWxsXG4gICAgICAgIHZhciByZXN1bHQgPSBbbnVsbCwgbnVsbF1cbiAgICAgICAgdmFyIGtleSwgcHJvcGVydHksIHZhbHVlcywgdmFsdWVcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGtleSA9IGlucHV0W2ldXG4gICAgICAgICAgICBwcm9wZXJ0eSA9IHRoaXMucHJvcGVydGllc1tpXVxuICAgICAgICAgICAgdmFsdWVzID0gdGhpcy52YWx1ZXNbcHJvcGVydHldXG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgdmFsdWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZXNbal1cbiAgICAgICAgICAgICAgICBpZiAodmFsdWVbMF0gIT09IGtleSkgY29udGludWVcbiAgICAgICAgICAgICAgICByZXN1bHRbaV0gPSBbdGhpcy5wcm9wZXJ0aWVzW2ldLCB2YWx1ZVsxXV0uam9pbignOicpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChyZXN1bHQuaW5kZXhPZihudWxsKSA8IDApID8gKHJlc3VsdC5qb2luKCc7JykgKyAnOycpIDogbnVsbFxuICAgIH1cblxufVxuXG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZVxuXG5mdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcywgdmFsdWVzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUoUFJPVE9UWVBFLCBvd24oe1xuICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLFxuICAgICAgICB2YWx1ZXM6IHZhbHVlc1xuICAgIH0pKVxufVxuIiwidmFyIENvbXBhY3RvciA9IHJlcXVpcmUoJy4vY29tcGFjdG9yJylcbnZhciBFeHBhbmRlciA9IHJlcXVpcmUoJy4vZXhwYW5kZXInKVxudmFyIFBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2VyJylcblxudmFyIFBST1BFUlRJRVMgPSBbXG4gICAgJ2ZvbnQtc3R5bGUnLFxuICAgICdmb250LXdlaWdodCdcbl1cbnZhciBWQUxVRVMgPSB7XG4gICAgJ2ZvbnQtc3R5bGUnOiBbXG4gICAgICAgIFsnbicsICdub3JtYWwnXSxcbiAgICAgICAgWydpJywgJ2l0YWxpYyddLFxuICAgICAgICBbJ28nLCAnb2JsaXF1ZSddXG4gICAgXSxcbiAgICAnZm9udC13ZWlnaHQnOiBbXG4gICAgICAgIFsnNCcsICdub3JtYWwnXSxcbiAgICAgICAgWyc3JywgJ2JvbGQnXSxcbiAgICAgICAgWycxJywgJzEwMCddLFxuICAgICAgICBbJzInLCAnMjAwJ10sXG4gICAgICAgIFsnMycsICczMDAnXSxcbiAgICAgICAgWyc0JywgJzQwMCddLFxuICAgICAgICBbJzUnLCAnNTAwJ10sXG4gICAgICAgIFsnNicsICc2MDAnXSxcbiAgICAgICAgWyc3JywgJzcwMCddLFxuICAgICAgICBbJzgnLCAnODAwJ10sXG4gICAgICAgIFsnOScsICc5MDAnXVxuICAgIF1cbn1cblxudmFyIGNvbXBhY3RvciwgZXhwYW5kZXIsIHBhcnNlclxuXG5leHBvcnRzLmNvbXBhY3QgPSBjb21wYWN0XG5leHBvcnRzLmV4cGFuZCA9IGV4cGFuZFxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlXG5cbmZ1bmN0aW9uIGNvbXBhY3QoaW5wdXQpIHtcbiAgICBpZiAoIWNvbXBhY3RvcikgY29tcGFjdG9yID0gQ29tcGFjdG9yLmNyZWF0ZShQUk9QRVJUSUVTLCBWQUxVRVMpXG4gICAgcmV0dXJuIGNvbXBhY3Rvci5jb21wYWN0KGlucHV0KVxufVxuXG5mdW5jdGlvbiBleHBhbmQoaW5wdXQpIHtcbiAgICBpZiAoIWV4cGFuZGVyKSBleHBhbmRlciA9IEV4cGFuZGVyLmNyZWF0ZShQUk9QRVJUSUVTLCBWQUxVRVMpXG4gICAgcmV0dXJuIGV4cGFuZGVyLmV4cGFuZChpbnB1dClcbn1cblxuZnVuY3Rpb24gcGFyc2UoaW5wdXQpIHtcbiAgICBpZiAoIXBhcnNlcikgcGFyc2VyID0gUGFyc2VyLmNyZWF0ZShQUk9QRVJUSUVTLCBWQUxVRVMpXG4gICAgcmV0dXJuIHBhcnNlci5wYXJzZShpbnB1dClcbn1cbiIsInZhciBvd24gPSByZXF1aXJlKCdvd24nKVxuXG52YXIgUFJPVE9UWVBFID0ge1xuXG4gICAgcGFyc2U6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJyB8fCBpbnB1dC5sZW5ndGggIT09IDIpIHJldHVybiBudWxsXG4gICAgICAgIHZhciByZXN1bHQgPSB7fVxuICAgICAgICB2YXIga2V5LCBwcm9wZXJ0eSwgdmFsdWVzLCB2YWx1ZVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAga2V5ID0gaW5wdXRbaV1cbiAgICAgICAgICAgIHByb3BlcnR5ID0gdGhpcy5wcm9wZXJ0aWVzW2ldXG4gICAgICAgICAgICB2YWx1ZXMgPSB0aGlzLnZhbHVlc1twcm9wZXJ0eV1cbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB2YWx1ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlc1tqXVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZVswXSAhPT0ga2V5KSBjb250aW51ZVxuICAgICAgICAgICAgICAgIHJlc3VsdFt0aGlzLnByb3BlcnRpZXNbaV1dID0gdmFsdWVbMV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHJlc3VsdFt0aGlzLnByb3BlcnRpZXNbMF1dICYmIHJlc3VsdFt0aGlzLnByb3BlcnRpZXNbMV1dKSA/IHJlc3VsdCA6IG51bGxcbiAgICB9XG5cbn1cblxuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGVcblxuZnVuY3Rpb24gY3JlYXRlKHByb3BlcnRpZXMsIHZhbHVlcykge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKFBST1RPVFlQRSwgb3duKHtcbiAgICAgICAgcHJvcGVydGllczogcHJvcGVydGllcyxcbiAgICAgICAgdmFsdWVzOiB2YWx1ZXNcbiAgICB9KSlcbn1cbiIsImNyZWF0ZS5yZWFkb25seSA9IHJlYWRvbmx5XG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVxuXG5mdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcywgaXNXcml0YWJsZSwgaXNDb25maWd1cmFibGUpIHtcbiAgICBpZiAocHJvcGVydGllcyAhPT0gT2JqZWN0KHByb3BlcnRpZXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgdmFyIHJlc3VsdCA9IHt9XG4gICAgdmFyIG5hbWUsIGRlc2NyaXB0b3JzLCBkZXNjcmlwdG9yTmFtZSwgZGVzY3JpcHRvclxuICAgIGZvciAobmFtZSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmICghcHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkgY29udGludWVcbiAgICAgICAgcmVzdWx0W25hbWVdID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm9wZXJ0aWVzLCBuYW1lKVxuICAgICAgICBpZiAodHlwZW9mIGlzV3JpdGFibGUgPT09ICdib29sZWFuJykgcmVzdWx0W25hbWVdLndyaXRhYmxlID0gaXNXcml0YWJsZVxuICAgICAgICBpZiAodHlwZW9mIGlzQ29uZmlndXJhYmxlID09PSAnYm9vbGVhbicpIHJlc3VsdFtuYW1lXS5jb25maWd1cmFibGUgPSBpc0NvbmZpZ3VyYWJsZVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIHJlYWRvbmx5KHByb3BlcnRpZXMpIHtcbiAgICByZXR1cm4gY3JlYXRlKHByb3BlcnRpZXMsIGZhbHNlLCBmYWxzZSlcbn1cbiJdfQ==
