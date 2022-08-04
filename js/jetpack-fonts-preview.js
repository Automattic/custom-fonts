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

},{"ms":7}],3:[function(require,module,exports){
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

},{"own":8}],4:[function(require,module,exports){
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

},{"own":8}],5:[function(require,module,exports){
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

},{"./compactor":3,"./expander":4,"./parser":6}],6:[function(require,module,exports){
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

},{"own":8}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
module.exports = require( './bootstrap' ).annotations;

},{"./bootstrap":13}],10:[function(require,module,exports){
module.exports = window.wp.customize;

},{}],11:[function(require,module,exports){
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

},{"../helpers/bootstrap":13}],12:[function(require,module,exports){
/* globals Backbone */
module.exports = Backbone;

},{}],13:[function(require,module,exports){
var settings = window._JetpackFonts;

module.exports = settings;

},{}],14:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	_ = require( '../helpers/underscore' );

module.exports = _.extend( Backbone.Events );


},{"../helpers/backbone":12,"../helpers/underscore":18}],15:[function(require,module,exports){
var api = require( '../helpers/api' ),
	debug = require( 'debug' )( 'jetpack-fonts:live-update' ),
	PreviewStyles = require( '../helpers/preview-styles' ),
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider;

// Initialize the default Provider Views
require( '../providers/google' );

function addFontToPreview( font ) {
	var ProviderView = getViewForProvider( font.provider );
	if ( ! ProviderView ) {
		debug( 'live update failed because no provider could be found for', font );
		return;
	}
	ProviderView.addFontToPreview( font );
}

function validateSelectedFonts( selectedFonts ) {
	if ( selectedFonts.length ) {
		return selectedFonts;
	}
	debug( 'warning: selectedFonts is not an array. trying to convert', selectedFonts );
	var keys = Object.keys( selectedFonts );
	if ( ! keys || ! keys.length ) {
		return [];
	}
	return keys.reduce( function( fonts, key ) {
		if ( selectedFonts[ key ] && selectedFonts[ key ].provider ) {
			fonts.push( selectedFonts[ key ] );
		}
		return fonts;
	}, [] );
}

function liveUpdateFontsInPreview( selectedFonts ) {
	selectedFonts = validateSelectedFonts( selectedFonts );
	debug( 'rendering live update for new styles', selectedFonts );
	if ( selectedFonts ) {
		selectedFonts.forEach( addFontToPreview );
	}
	PreviewStyles.writeFontStyles( selectedFonts );
}

function init() {
	debug( 'binding live updates for custom-fonts' );
	api( 'jetpack_fonts[selected_fonts]', function( value ) {
		value.bind( function( selectedFonts ) {
			liveUpdateFontsInPreview( selectedFonts );
		} );
	} );
	// The Customizer doesn't give us the initial value,
	// so do it manually on first run
	liveUpdateFontsInPreview( api( 'jetpack_fonts[selected_fonts]' ).get() );
}

module.exports = {
	liveUpdateFontsInPreview: liveUpdateFontsInPreview
};

api.bind( 'preview-ready', init );

},{"../helpers/api":10,"../helpers/preview-styles":16,"../helpers/provider-views":17,"../providers/google":20,"debug":1}],16:[function(require,module,exports){
var jQuery = require( '../helpers/backbone' ).$,
	debug = require( 'debug' )( 'jetpack-fonts:preview-css' ),
	fvd = require( 'fvd' ),
	availableTypes = require( '../helpers/available-types' ),
	annotations = require( '../helpers/annotations' );

function generateCssForStyleObject( style ) {
	if ( ! annotations ) {
		debug( 'no annotations found at all; cannot generate css' );
		return '';
	}
	debug( 'generating css for style type', style.type, 'using these annotations:', annotations[ style.type ] );
	if ( ! annotations[ style.type ] || annotations[ style.type ].length < 1 ) {
		debug( 'no annotations found for style type', style.type, '; existing annotations:', annotations );
		return '';
	}
	return annotations[ style.type ].map( generateCssForAnnotation.bind( null, style ) ).join( ' ' );
}

function generateCssForAnnotation( style, annotation ) {
	if ( ! annotation.selector ) {
		return '';
	}
	debug( 'generateCssForAnnotation for style', style.cssName, 'and annotation', annotation );
	var css = '';
	if ( style.cssName && hasFontFamilyAnnotation( annotation ) ) {
		var family = generateFontFamily( style );
		if ( family && family.length > 0 ) {
			css += 'font-family:' + family + ';';
		}
	}
	var isFontAdjustable = isFontAdjustableForType( style.type );
	if ( isFontAdjustable ) {
		css += 'font-weight:' + generateFontWeight( style.currentFvd, annotation ) + ';';
		css += 'font-style:' + generateFontStyle( style.currentFvd, annotation ) + ';';
	}
	if ( style.size ) {
		var size = generateFontSize( style.size, annotation );
		if ( size && size.length > 0 ) {
			css += 'font-size:' + size + ';';
		}
	}
	if ( ! css.length ) {
		return css;
	}
	css = generateCssSelector( annotation.selector ) + ' {' + css + '}';
	debug( 'generated css for', style, 'is', css );
	return css;
}

function isFontAdjustableForType( styleType ) {
	if ( availableTypes.length < 1 ) {
		debug( 'cannot tell if ', styleType, ' is adjustable: no availableTypes' );
		return false;
	}
	return availableTypes.reduce( function( prev, type ) {
		if ( type.id === styleType && type.fvdAdjust === true ) {
			return true;
		}
		return prev;
	}, false );
}

function generateCssSelector( selectorGroup ) {
	return selectorGroup.split( /,\s*/ ).reduce( function( previous, selector ) {
		previous.push( '.wf-active ' + selector );
		return previous;
	}, [] ).join( ', ' );
}

function generateFontStyle( currentFvd, annotation ) {
	if ( currentFvd ) {
		var parsed = fvd.parse( currentFvd );
		if ( parsed && parsed['font-style'] ) {
			return parsed['font-style'];
		}
	}
	var annotationStyle = getFontStyleFromAnnotation( annotation );
	if ( annotationStyle ) {
		return annotationStyle;
	}
	return 'normal';
}

function getFontStyleFromAnnotation( annotation ) {
	var originalStyleString;
	getAnnotationRules( annotation ).forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-style' ) {
			originalStyleString = rule.value;
		}
	} );
	return originalStyleString;
}

function generateFontWeight( currentFvd, annotation ) {
	if ( currentFvd ) {
		var parsed = fvd.parse( currentFvd );
		if ( parsed && parsed['font-weight'] ) {
			return parsed['font-weight'];
		}
	}
	var annotationWeight = getFontWeightFromAnnotation( annotation );
	if ( annotationWeight ) {
		return annotationWeight;
	}
	return '400';
}

function getFontWeightFromAnnotation( annotation ) {
	var originalWeightString;
	getAnnotationRules( annotation ).forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-weight' ) {
			originalWeightString = rule.value;
		}
	} );
	return originalWeightString;
}

function generateFontFamily( font ) {
	return font.fontFamilies || font.cssName;
}

function getAnnotationRules( annotation ) {
	if ( ! annotation.rules || ! annotation.rules.length ) {
		debug( 'no annotation rules found for', annotation );
		return [];
	}
	return annotation.rules;
}

function hasFontFamilyAnnotation( annotation ) {
	var found = false;
	getAnnotationRules( annotation ).forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-family' && 'inherit' !== rule.value ) {
			found = true;
		}
	} );
	return found;
}

function generateFontSize( size, annotation ) {
	var originalSizeString = getFontSizeFromAnnotation( annotation );
	if ( ! originalSizeString ) {
		return;
	}
	var units = parseUnits( originalSizeString );
	var originalSize = parseSize( originalSizeString );
	if ( ! units || ! originalSize ) {
		debug( 'unable to parse size annotation', originalSizeString );
		return;
	}
	var scale = ( parseInt( size, 10 ) * 0.06 ) + 1;
	return ( scale * originalSize ).toFixed( 1 ) + units;
}

function getFontSizeFromAnnotation( annotation ) {
	var originalSizeString;
	getAnnotationRules( annotation ).forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-size' && ! /^inherit/.test( rule.value ) ) {
			originalSizeString = rule.value;
		}
	} );
	return originalSizeString;
}

function parseUnits( sizeString ) {
	var matches = sizeString.match( /[\d\.]+([A-Za-z]{2,3}|%)/ );
	if ( ! matches || ! matches[1] ) {
		return;
	}
	return matches[ 1 ];
}

function parseSize( sizeString ) {
	var matches = sizeString.match( /((\d*\.(\d+))|(\d+))([A-Za-z]{2,3}|%)/ );
	if ( ! matches ) {
		return;
	}
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
		annotations = PreviewStyles.maybeMergeAnnotationsForStyles( annotations, styles );
		var css = PreviewStyles.generateCssFromStyles( styles );
		debug( 'css generation complete:', css );
		PreviewStyles.addStyleElementToPage( PreviewStyles.createStyleElementWith( css ) );
	},

	// Merges site-title annotations into headings if we don't have site-title fonts
	maybeMergeAnnotationsForStyles: function( origAnnotations, fonts ) {
		var hasSiteTitle;
		if ( ! origAnnotations ) {
			return;
		}
		if ( ! origAnnotations['site-title'] || ! origAnnotations.headings ) {
			return origAnnotations;
		}
		hasSiteTitle = fonts.length && fonts.some( function( font ) {
			return font.type === 'site-title';
		} );
		if ( hasSiteTitle ) {
			return origAnnotations;
		}
		debug( 'merging site-title annotations into headings' );
		origAnnotations.headings = origAnnotations.headings.concat( origAnnotations['site-title'] );
		delete origAnnotations['site-title'];
		return origAnnotations;
	},

	generateCssFromStyles: function( styles ) {
		if ( ! styles ) {
			debug( 'generating empty css because there are no styles' );
			return '';
		}
		debug( 'generating css for styles', styles );
		return styles.reduce( function( css, style ) {
			var generatedCss = generateCssForStyleObject( style );
			if ( generatedCss ) {
				css += ' ' + generatedCss;
			}
			return css;
		// enforce the 400 weight default below that is assumed everywhere else
		}, '.wf-active > body { font-weight: 400; }' );
	},

	createStyleElementWith: function( css ) {
		return jQuery( '<style id="jetpack-custom-fonts-css">' + css + '</style>' );
	},

	removeFontStyleElement: function() {
		var element = PreviewStyles.getFontStyleElement();
		if ( element ) {
			jQuery( element ).remove();
		}
	},

	addStyleElementToPage: function( element ) {
		jQuery( 'head' ).prepend( element );
	}

};

module.exports = PreviewStyles;

},{"../helpers/annotations":9,"../helpers/available-types":11,"../helpers/backbone":12,"debug":1,"fvd":5}],17:[function(require,module,exports){
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

},{"../helpers/api":10,"../views/dropdown-item":21,"debug":1}],18:[function(require,module,exports){
/* globals _ */
module.exports = _;

},{}],19:[function(require,module,exports){
/* globals WebFont */
module.exports = WebFont;

},{}],20:[function(require,module,exports){
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

},{"../helpers/api":10,"../helpers/bootstrap":13,"../helpers/webfont":19}],21:[function(require,module,exports){
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

},{"../helpers/backbone":12,"../helpers/emitter":14}]},{},[15])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9mdmQvbGliL2NvbXBhY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy9mdmQvbGliL2V4cGFuZGVyLmpzIiwibm9kZV9tb2R1bGVzL2Z2ZC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnZkL2xpYi9wYXJzZXIuanMiLCJub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb3duL2luZGV4LmpzIiwic3JjL2pzL2hlbHBlcnMvYW5ub3RhdGlvbnMuanMiLCJzcmMvanMvaGVscGVycy9hcGkuanMiLCJzcmMvanMvaGVscGVycy9hdmFpbGFibGUtdHlwZXMuanMiLCJzcmMvanMvaGVscGVycy9iYWNrYm9uZS5qcyIsInNyYy9qcy9oZWxwZXJzL2Jvb3RzdHJhcC5qcyIsInNyYy9qcy9oZWxwZXJzL2VtaXR0ZXIuanMiLCJzcmMvanMvaGVscGVycy9saXZlLXVwZGF0ZS5qcyIsInNyYy9qcy9oZWxwZXJzL3ByZXZpZXctc3R5bGVzLmpzIiwic3JjL2pzL2hlbHBlcnMvcHJvdmlkZXItdmlld3MuanMiLCJzcmMvanMvaGVscGVycy91bmRlcnNjb3JlLmpzIiwic3JjL2pzL2hlbHBlcnMvd2ViZm9udC5qcyIsInNyYy9qcy9wcm92aWRlcnMvZ29vZ2xlLmpzIiwic3JjL2pzL3ZpZXdzL2Ryb3Bkb3duLWl0ZW0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICdsaWdodHNlYWdyZWVuJyxcbiAgJ2ZvcmVzdGdyZWVuJyxcbiAgJ2dvbGRlbnJvZCcsXG4gICdkb2RnZXJibHVlJyxcbiAgJ2RhcmtvcmNoaWQnLFxuICAnY3JpbXNvbidcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICByZXR1cm4gKCdXZWJraXRBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh3aW5kb3cuY29uc29sZSAmJiAoY29uc29sZS5maXJlYnVnIHx8IChjb25zb2xlLmV4Y2VwdGlvbiAmJiBjb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuIGFyZ3M7XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzID0gW2FyZ3NbMF0sIGMsICdjb2xvcjogaW5oZXJpdCddLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSk7XG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EteiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgsXG4gIC8vIHdoZXJlIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PSB0eXBlb2YgY29uc29sZVxuICAgICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBsb2NhbFN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbcHJldkNvbG9yKysgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICAvLyBkZWZpbmUgdGhlIGBkaXNhYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcbiAgfVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZW5hYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBlbmFibGVkKCkge1xuXG4gICAgdmFyIHNlbGYgPSBlbmFibGVkO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyBhZGQgdGhlIGBjb2xvcmAgaWYgbm90IHNldFxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gICAgaWYgKG51bGwgPT0gc2VsZi5jb2xvciAmJiBzZWxmLnVzZUNvbG9ycykgc2VsZi5jb2xvciA9IHNlbGVjdENvbG9yKCk7XG5cbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlb1xuICAgICAgYXJncyA9IFsnJW8nXS5jb25jYXQoYXJncyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EteiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5mb3JtYXRBcmdzKSB7XG4gICAgICBhcmdzID0gZXhwb3J0cy5mb3JtYXRBcmdzLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIH1cbiAgICB2YXIgbG9nRm4gPSBlbmFibGVkLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG4gIGVuYWJsZWQuZW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XG5cbiAgZm4ubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCJ2YXIgb3duID0gcmVxdWlyZSgnb3duJylcblxudmFyIERFU0NSSVBUT1JfUkUgPSAvXFxzKy9nXG52YXIgUFJPVE9UWVBFID0ge1xuXG4gICAgY29tcGFjdDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbJ24nLCAnNCddXG4gICAgICAgIHZhciBkZXNjcmlwdG9ycyA9IChpbnB1dCB8fCAnJykuc3BsaXQoJzsnKVxuICAgICAgICB2YXIgcGFpciwgcHJvcGVydHksIHZhbHVlLCBpbmRleCwgdmFsdWVzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzY3JpcHRvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBhaXIgPSBkZXNjcmlwdG9yc1tpXS5yZXBsYWNlKERFU0NSSVBUT1JfUkUsICcnKS5zcGxpdCgnOicpXG4gICAgICAgICAgICBpZiAocGFpci5sZW5ndGggIT09IDIpIGNvbnRpbnVlXG4gICAgICAgICAgICBwcm9wZXJ0eSA9IHBhaXJbMF1cbiAgICAgICAgICAgIHZhbHVlID0gcGFpclsxXVxuICAgICAgICAgICAgdmFsdWVzID0gdGhpcy52YWx1ZXNbcHJvcGVydHldXG4gICAgICAgICAgICBpZiAoIXZhbHVlcykgY29udGludWVcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlc1tqXVsxXSAhPT0gdmFsdWUpIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgcmVzdWx0W3RoaXMucHJvcGVydGllcy5pbmRleE9mKHByb3BlcnR5KV0gPSB2YWx1ZXNbal1bMF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0LmpvaW4oJycpXG4gICAgfVxuXG59XG5cbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlXG5cbmZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShQUk9UT1RZUEUsIG93bih7XG4gICAgICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsXG4gICAgICAgIHZhbHVlczogdmFsdWVzXG4gICAgfSkpXG59XG4iLCJ2YXIgb3duID0gcmVxdWlyZSgnb3duJylcblxudmFyIFBST1RPVFlQRSA9IHtcblxuICAgIGV4cGFuZDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnIHx8IGlucHV0Lmxlbmd0aCAhPT0gMikgcmV0dXJuIG51bGxcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtudWxsLCBudWxsXVxuICAgICAgICB2YXIga2V5LCBwcm9wZXJ0eSwgdmFsdWVzLCB2YWx1ZVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAga2V5ID0gaW5wdXRbaV1cbiAgICAgICAgICAgIHByb3BlcnR5ID0gdGhpcy5wcm9wZXJ0aWVzW2ldXG4gICAgICAgICAgICB2YWx1ZXMgPSB0aGlzLnZhbHVlc1twcm9wZXJ0eV1cbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB2YWx1ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlc1tqXVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZVswXSAhPT0ga2V5KSBjb250aW51ZVxuICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IFt0aGlzLnByb3BlcnRpZXNbaV0sIHZhbHVlWzFdXS5qb2luKCc6JylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHJlc3VsdC5pbmRleE9mKG51bGwpIDwgMCkgPyAocmVzdWx0LmpvaW4oJzsnKSArICc7JykgOiBudWxsXG4gICAgfVxuXG59XG5cbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlXG5cbmZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShQUk9UT1RZUEUsIG93bih7XG4gICAgICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsXG4gICAgICAgIHZhbHVlczogdmFsdWVzXG4gICAgfSkpXG59XG4iLCJ2YXIgQ29tcGFjdG9yID0gcmVxdWlyZSgnLi9jb21wYWN0b3InKVxudmFyIEV4cGFuZGVyID0gcmVxdWlyZSgnLi9leHBhbmRlcicpXG52YXIgUGFyc2VyID0gcmVxdWlyZSgnLi9wYXJzZXInKVxuXG52YXIgUFJPUEVSVElFUyA9IFtcbiAgICAnZm9udC1zdHlsZScsXG4gICAgJ2ZvbnQtd2VpZ2h0J1xuXVxudmFyIFZBTFVFUyA9IHtcbiAgICAnZm9udC1zdHlsZSc6IFtcbiAgICAgICAgWyduJywgJ25vcm1hbCddLFxuICAgICAgICBbJ2knLCAnaXRhbGljJ10sXG4gICAgICAgIFsnbycsICdvYmxpcXVlJ11cbiAgICBdLFxuICAgICdmb250LXdlaWdodCc6IFtcbiAgICAgICAgWyc0JywgJ25vcm1hbCddLFxuICAgICAgICBbJzcnLCAnYm9sZCddLFxuICAgICAgICBbJzEnLCAnMTAwJ10sXG4gICAgICAgIFsnMicsICcyMDAnXSxcbiAgICAgICAgWyczJywgJzMwMCddLFxuICAgICAgICBbJzQnLCAnNDAwJ10sXG4gICAgICAgIFsnNScsICc1MDAnXSxcbiAgICAgICAgWyc2JywgJzYwMCddLFxuICAgICAgICBbJzcnLCAnNzAwJ10sXG4gICAgICAgIFsnOCcsICc4MDAnXSxcbiAgICAgICAgWyc5JywgJzkwMCddXG4gICAgXVxufVxuXG52YXIgY29tcGFjdG9yLCBleHBhbmRlciwgcGFyc2VyXG5cbmV4cG9ydHMuY29tcGFjdCA9IGNvbXBhY3RcbmV4cG9ydHMuZXhwYW5kID0gZXhwYW5kXG5leHBvcnRzLnBhcnNlID0gcGFyc2VcblxuZnVuY3Rpb24gY29tcGFjdChpbnB1dCkge1xuICAgIGlmICghY29tcGFjdG9yKSBjb21wYWN0b3IgPSBDb21wYWN0b3IuY3JlYXRlKFBST1BFUlRJRVMsIFZBTFVFUylcbiAgICByZXR1cm4gY29tcGFjdG9yLmNvbXBhY3QoaW5wdXQpXG59XG5cbmZ1bmN0aW9uIGV4cGFuZChpbnB1dCkge1xuICAgIGlmICghZXhwYW5kZXIpIGV4cGFuZGVyID0gRXhwYW5kZXIuY3JlYXRlKFBST1BFUlRJRVMsIFZBTFVFUylcbiAgICByZXR1cm4gZXhwYW5kZXIuZXhwYW5kKGlucHV0KVxufVxuXG5mdW5jdGlvbiBwYXJzZShpbnB1dCkge1xuICAgIGlmICghcGFyc2VyKSBwYXJzZXIgPSBQYXJzZXIuY3JlYXRlKFBST1BFUlRJRVMsIFZBTFVFUylcbiAgICByZXR1cm4gcGFyc2VyLnBhcnNlKGlucHV0KVxufVxuIiwidmFyIG93biA9IHJlcXVpcmUoJ293bicpXG5cbnZhciBQUk9UT1RZUEUgPSB7XG5cbiAgICBwYXJzZTogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnIHx8IGlucHV0Lmxlbmd0aCAhPT0gMikgcmV0dXJuIG51bGxcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9XG4gICAgICAgIHZhciBrZXksIHByb3BlcnR5LCB2YWx1ZXMsIHZhbHVlXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBrZXkgPSBpbnB1dFtpXVxuICAgICAgICAgICAgcHJvcGVydHkgPSB0aGlzLnByb3BlcnRpZXNbaV1cbiAgICAgICAgICAgIHZhbHVlcyA9IHRoaXMudmFsdWVzW3Byb3BlcnR5XVxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWVzW2pdXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlWzBdICE9PSBrZXkpIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgcmVzdWx0W3RoaXMucHJvcGVydGllc1tpXV0gPSB2YWx1ZVsxXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocmVzdWx0W3RoaXMucHJvcGVydGllc1swXV0gJiYgcmVzdWx0W3RoaXMucHJvcGVydGllc1sxXV0pID8gcmVzdWx0IDogbnVsbFxuICAgIH1cblxufVxuXG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZVxuXG5mdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcywgdmFsdWVzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUoUFJPVE9UWVBFLCBvd24oe1xuICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLFxuICAgICAgICB2YWx1ZXM6IHZhbHVlc1xuICAgIH0pKVxufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEB0aHJvd3Mge0Vycm9yfSB0aHJvdyBhbiBlcnJvciBpZiB2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIG51bWJlclxuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcbiAgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIHZhbC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgaXNOYU4odmFsKSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1pbGxpc2Vjb25kcz98bXNlY3M/fG1zfHNlY29uZHM/fHNlY3M/fHN8bWludXRlcz98bWlucz98bXxob3Vycz98aHJzP3xofGRheXM/fGR8eWVhcnM/fHlycz98eSk/JC9pLmV4ZWMoXG4gICAgc3RyXG4gICk7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgdmFyIHR5cGUgPSAobWF0Y2hbMl0gfHwgJ21zJykudG9Mb3dlckNhc2UoKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAneWVhcnMnOlxuICAgIGNhc2UgJ3llYXInOlxuICAgIGNhc2UgJ3lycyc6XG4gICAgY2FzZSAneXInOlxuICAgIGNhc2UgJ3knOlxuICAgICAgcmV0dXJuIG4gKiB5O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnO1xuICB9XG4gIGlmIChtcyA+PSBoKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJztcbiAgfVxuICBpZiAobXMgPj0gbSkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyAnbSc7XG4gIH1cbiAgaWYgKG1zID49IHMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnO1xuICB9XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRMb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKSB8fFxuICAgIHBsdXJhbChtcywgaCwgJ2hvdXInKSB8fFxuICAgIHBsdXJhbChtcywgbSwgJ21pbnV0ZScpIHx8XG4gICAgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJykgfHxcbiAgICBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChtcyA8IG4gKiAxLjUpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihtcyAvIG4pICsgJyAnICsgbmFtZTtcbiAgfVxuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwiY3JlYXRlLnJlYWRvbmx5ID0gcmVhZG9ubHlcbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlXG5cbmZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzLCBpc1dyaXRhYmxlLCBpc0NvbmZpZ3VyYWJsZSkge1xuICAgIGlmIChwcm9wZXJ0aWVzICE9PSBPYmplY3QocHJvcGVydGllcykpIHJldHVybiB1bmRlZmluZWRcbiAgICB2YXIgcmVzdWx0ID0ge31cbiAgICB2YXIgbmFtZSwgZGVzY3JpcHRvcnMsIGRlc2NyaXB0b3JOYW1lLCBkZXNjcmlwdG9yXG4gICAgZm9yIChuYW1lIGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKCFwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KG5hbWUpKSBjb250aW51ZVxuICAgICAgICByZXN1bHRbbmFtZV0gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3BlcnRpZXMsIG5hbWUpXG4gICAgICAgIGlmICh0eXBlb2YgaXNXcml0YWJsZSA9PT0gJ2Jvb2xlYW4nKSByZXN1bHRbbmFtZV0ud3JpdGFibGUgPSBpc1dyaXRhYmxlXG4gICAgICAgIGlmICh0eXBlb2YgaXNDb25maWd1cmFibGUgPT09ICdib29sZWFuJykgcmVzdWx0W25hbWVdLmNvbmZpZ3VyYWJsZSA9IGlzQ29uZmlndXJhYmxlXG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gcmVhZG9ubHkocHJvcGVydGllcykge1xuICAgIHJldHVybiBjcmVhdGUocHJvcGVydGllcywgZmFsc2UsIGZhbHNlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9ib290c3RyYXAnICkuYW5ub3RhdGlvbnM7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy53cC5jdXN0b21pemU7XG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAnLi4vaGVscGVycy9ib290c3RyYXAnICk7XG5cbmZ1bmN0aW9uIGNvbXBhcmVUeXBlcyggYSwgYiApIHtcblx0aWYgKCBhLmlkID09PSAnaGVhZGluZ3MnICkge1xuXHRcdHJldHVybiAtMTtcblx0fVxuXHRpZiAoIGIuaWQgPT09ICdoZWFkaW5ncycgKSB7XG5cdFx0cmV0dXJuIDE7XG5cdH1cblx0cmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVNpdGVUaXRsZSggdHlwZXMgKSB7XG5cdHJldHVybiB0eXBlcy5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2aW91cywgdHlwZSApIHtcblx0XHRpZiAoIHR5cGUuaWQgIT09ICdzaXRlLXRpdGxlJyApIHtcblx0XHRcdHByZXZpb3VzLnB1c2goIHR5cGUgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHByZXZpb3VzO1xuXHR9LCBbXSApO1xufVxuXG52YXIgdHlwZXMgPSBbXTtcbmlmICggc2V0dGluZ3MgJiYgc2V0dGluZ3MudHlwZXMgKSB7XG5cdC8vIEFycmFuZ2UgdGhlIGNvbnRyb2xzIHNvIHRoYXQgYm9keS10ZXh0IGlzIGZpcnN0XG5cdHR5cGVzID0gc2V0dGluZ3MudHlwZXMuc29ydCggY29tcGFyZVR5cGVzICk7XG5cdC8vIFJlbW92ZSBkZXByZWNhdGVkIHNpdGUtdGl0bGUgY29udHJvbCBmcm9tIFVJXG5cdHR5cGVzID0gcmVtb3ZlU2l0ZVRpdGxlKCB0eXBlcyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR5cGVzO1xuIiwiLyogZ2xvYmFscyBCYWNrYm9uZSAqL1xubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZTtcbiIsInZhciBzZXR0aW5ncyA9IHdpbmRvdy5fSmV0cGFja0ZvbnRzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHRpbmdzO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdF8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF8uZXh0ZW5kKCBCYWNrYm9uZS5FdmVudHMgKTtcblxuIiwidmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOmxpdmUtdXBkYXRlJyApLFxuXHRQcmV2aWV3U3R5bGVzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJldmlldy1zdHlsZXMnICksXG5cdGdldFZpZXdGb3JQcm92aWRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3Byb3ZpZGVyLXZpZXdzJyApLmdldFZpZXdGb3JQcm92aWRlcjtcblxuLy8gSW5pdGlhbGl6ZSB0aGUgZGVmYXVsdCBQcm92aWRlciBWaWV3c1xucmVxdWlyZSggJy4uL3Byb3ZpZGVycy9nb29nbGUnICk7XG5cbmZ1bmN0aW9uIGFkZEZvbnRUb1ByZXZpZXcoIGZvbnQgKSB7XG5cdHZhciBQcm92aWRlclZpZXcgPSBnZXRWaWV3Rm9yUHJvdmlkZXIoIGZvbnQucHJvdmlkZXIgKTtcblx0aWYgKCAhIFByb3ZpZGVyVmlldyApIHtcblx0XHRkZWJ1ZyggJ2xpdmUgdXBkYXRlIGZhaWxlZCBiZWNhdXNlIG5vIHByb3ZpZGVyIGNvdWxkIGJlIGZvdW5kIGZvcicsIGZvbnQgKTtcblx0XHRyZXR1cm47XG5cdH1cblx0UHJvdmlkZXJWaWV3LmFkZEZvbnRUb1ByZXZpZXcoIGZvbnQgKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVTZWxlY3RlZEZvbnRzKCBzZWxlY3RlZEZvbnRzICkge1xuXHRpZiAoIHNlbGVjdGVkRm9udHMubGVuZ3RoICkge1xuXHRcdHJldHVybiBzZWxlY3RlZEZvbnRzO1xuXHR9XG5cdGRlYnVnKCAnd2FybmluZzogc2VsZWN0ZWRGb250cyBpcyBub3QgYW4gYXJyYXkuIHRyeWluZyB0byBjb252ZXJ0Jywgc2VsZWN0ZWRGb250cyApO1xuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKCBzZWxlY3RlZEZvbnRzICk7XG5cdGlmICggISBrZXlzIHx8ICEga2V5cy5sZW5ndGggKSB7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cdHJldHVybiBrZXlzLnJlZHVjZSggZnVuY3Rpb24oIGZvbnRzLCBrZXkgKSB7XG5cdFx0aWYgKCBzZWxlY3RlZEZvbnRzWyBrZXkgXSAmJiBzZWxlY3RlZEZvbnRzWyBrZXkgXS5wcm92aWRlciApIHtcblx0XHRcdGZvbnRzLnB1c2goIHNlbGVjdGVkRm9udHNbIGtleSBdICk7XG5cdFx0fVxuXHRcdHJldHVybiBmb250cztcblx0fSwgW10gKTtcbn1cblxuZnVuY3Rpb24gbGl2ZVVwZGF0ZUZvbnRzSW5QcmV2aWV3KCBzZWxlY3RlZEZvbnRzICkge1xuXHRzZWxlY3RlZEZvbnRzID0gdmFsaWRhdGVTZWxlY3RlZEZvbnRzKCBzZWxlY3RlZEZvbnRzICk7XG5cdGRlYnVnKCAncmVuZGVyaW5nIGxpdmUgdXBkYXRlIGZvciBuZXcgc3R5bGVzJywgc2VsZWN0ZWRGb250cyApO1xuXHRpZiAoIHNlbGVjdGVkRm9udHMgKSB7XG5cdFx0c2VsZWN0ZWRGb250cy5mb3JFYWNoKCBhZGRGb250VG9QcmV2aWV3ICk7XG5cdH1cblx0UHJldmlld1N0eWxlcy53cml0ZUZvbnRTdHlsZXMoIHNlbGVjdGVkRm9udHMgKTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcblx0ZGVidWcoICdiaW5kaW5nIGxpdmUgdXBkYXRlcyBmb3IgY3VzdG9tLWZvbnRzJyApO1xuXHRhcGkoICdqZXRwYWNrX2ZvbnRzW3NlbGVjdGVkX2ZvbnRzXScsIGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHR2YWx1ZS5iaW5kKCBmdW5jdGlvbiggc2VsZWN0ZWRGb250cyApIHtcblx0XHRcdGxpdmVVcGRhdGVGb250c0luUHJldmlldyggc2VsZWN0ZWRGb250cyApO1xuXHRcdH0gKTtcblx0fSApO1xuXHQvLyBUaGUgQ3VzdG9taXplciBkb2Vzbid0IGdpdmUgdXMgdGhlIGluaXRpYWwgdmFsdWUsXG5cdC8vIHNvIGRvIGl0IG1hbnVhbGx5IG9uIGZpcnN0IHJ1blxuXHRsaXZlVXBkYXRlRm9udHNJblByZXZpZXcoIGFwaSggJ2pldHBhY2tfZm9udHNbc2VsZWN0ZWRfZm9udHNdJyApLmdldCgpICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRsaXZlVXBkYXRlRm9udHNJblByZXZpZXc6IGxpdmVVcGRhdGVGb250c0luUHJldmlld1xufTtcblxuYXBpLmJpbmQoICdwcmV2aWV3LXJlYWR5JywgaW5pdCApO1xuIiwidmFyIGpRdWVyeSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLiQsXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpwcmV2aWV3LWNzcycgKSxcblx0ZnZkID0gcmVxdWlyZSggJ2Z2ZCcgKSxcblx0YXZhaWxhYmxlVHlwZXMgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hdmFpbGFibGUtdHlwZXMnICksXG5cdGFubm90YXRpb25zID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYW5ub3RhdGlvbnMnICk7XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQ3NzRm9yU3R5bGVPYmplY3QoIHN0eWxlICkge1xuXHRpZiAoICEgYW5ub3RhdGlvbnMgKSB7XG5cdFx0ZGVidWcoICdubyBhbm5vdGF0aW9ucyBmb3VuZCBhdCBhbGw7IGNhbm5vdCBnZW5lcmF0ZSBjc3MnICk7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cdGRlYnVnKCAnZ2VuZXJhdGluZyBjc3MgZm9yIHN0eWxlIHR5cGUnLCBzdHlsZS50eXBlLCAndXNpbmcgdGhlc2UgYW5ub3RhdGlvbnM6JywgYW5ub3RhdGlvbnNbIHN0eWxlLnR5cGUgXSApO1xuXHRpZiAoICEgYW5ub3RhdGlvbnNbIHN0eWxlLnR5cGUgXSB8fCBhbm5vdGF0aW9uc1sgc3R5bGUudHlwZSBdLmxlbmd0aCA8IDEgKSB7XG5cdFx0ZGVidWcoICdubyBhbm5vdGF0aW9ucyBmb3VuZCBmb3Igc3R5bGUgdHlwZScsIHN0eWxlLnR5cGUsICc7IGV4aXN0aW5nIGFubm90YXRpb25zOicsIGFubm90YXRpb25zICk7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cdHJldHVybiBhbm5vdGF0aW9uc1sgc3R5bGUudHlwZSBdLm1hcCggZ2VuZXJhdGVDc3NGb3JBbm5vdGF0aW9uLmJpbmQoIG51bGwsIHN0eWxlICkgKS5qb2luKCAnICcgKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVDc3NGb3JBbm5vdGF0aW9uKCBzdHlsZSwgYW5ub3RhdGlvbiApIHtcblx0aWYgKCAhIGFubm90YXRpb24uc2VsZWN0b3IgKSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cdGRlYnVnKCAnZ2VuZXJhdGVDc3NGb3JBbm5vdGF0aW9uIGZvciBzdHlsZScsIHN0eWxlLmNzc05hbWUsICdhbmQgYW5ub3RhdGlvbicsIGFubm90YXRpb24gKTtcblx0dmFyIGNzcyA9ICcnO1xuXHRpZiAoIHN0eWxlLmNzc05hbWUgJiYgaGFzRm9udEZhbWlseUFubm90YXRpb24oIGFubm90YXRpb24gKSApIHtcblx0XHR2YXIgZmFtaWx5ID0gZ2VuZXJhdGVGb250RmFtaWx5KCBzdHlsZSApO1xuXHRcdGlmICggZmFtaWx5ICYmIGZhbWlseS5sZW5ndGggPiAwICkge1xuXHRcdFx0Y3NzICs9ICdmb250LWZhbWlseTonICsgZmFtaWx5ICsgJzsnO1xuXHRcdH1cblx0fVxuXHR2YXIgaXNGb250QWRqdXN0YWJsZSA9IGlzRm9udEFkanVzdGFibGVGb3JUeXBlKCBzdHlsZS50eXBlICk7XG5cdGlmICggaXNGb250QWRqdXN0YWJsZSApIHtcblx0XHRjc3MgKz0gJ2ZvbnQtd2VpZ2h0OicgKyBnZW5lcmF0ZUZvbnRXZWlnaHQoIHN0eWxlLmN1cnJlbnRGdmQsIGFubm90YXRpb24gKSArICc7Jztcblx0XHRjc3MgKz0gJ2ZvbnQtc3R5bGU6JyArIGdlbmVyYXRlRm9udFN0eWxlKCBzdHlsZS5jdXJyZW50RnZkLCBhbm5vdGF0aW9uICkgKyAnOyc7XG5cdH1cblx0aWYgKCBzdHlsZS5zaXplICkge1xuXHRcdHZhciBzaXplID0gZ2VuZXJhdGVGb250U2l6ZSggc3R5bGUuc2l6ZSwgYW5ub3RhdGlvbiApO1xuXHRcdGlmICggc2l6ZSAmJiBzaXplLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHRjc3MgKz0gJ2ZvbnQtc2l6ZTonICsgc2l6ZSArICc7Jztcblx0XHR9XG5cdH1cblx0aWYgKCAhIGNzcy5sZW5ndGggKSB7XG5cdFx0cmV0dXJuIGNzcztcblx0fVxuXHRjc3MgPSBnZW5lcmF0ZUNzc1NlbGVjdG9yKCBhbm5vdGF0aW9uLnNlbGVjdG9yICkgKyAnIHsnICsgY3NzICsgJ30nO1xuXHRkZWJ1ZyggJ2dlbmVyYXRlZCBjc3MgZm9yJywgc3R5bGUsICdpcycsIGNzcyApO1xuXHRyZXR1cm4gY3NzO1xufVxuXG5mdW5jdGlvbiBpc0ZvbnRBZGp1c3RhYmxlRm9yVHlwZSggc3R5bGVUeXBlICkge1xuXHRpZiAoIGF2YWlsYWJsZVR5cGVzLmxlbmd0aCA8IDEgKSB7XG5cdFx0ZGVidWcoICdjYW5ub3QgdGVsbCBpZiAnLCBzdHlsZVR5cGUsICcgaXMgYWRqdXN0YWJsZTogbm8gYXZhaWxhYmxlVHlwZXMnICk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdHJldHVybiBhdmFpbGFibGVUeXBlcy5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2LCB0eXBlICkge1xuXHRcdGlmICggdHlwZS5pZCA9PT0gc3R5bGVUeXBlICYmIHR5cGUuZnZkQWRqdXN0ID09PSB0cnVlICkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBwcmV2O1xuXHR9LCBmYWxzZSApO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUNzc1NlbGVjdG9yKCBzZWxlY3Rvckdyb3VwICkge1xuXHRyZXR1cm4gc2VsZWN0b3JHcm91cC5zcGxpdCggLyxcXHMqLyApLnJlZHVjZSggZnVuY3Rpb24oIHByZXZpb3VzLCBzZWxlY3RvciApIHtcblx0XHRwcmV2aW91cy5wdXNoKCAnLndmLWFjdGl2ZSAnICsgc2VsZWN0b3IgKTtcblx0XHRyZXR1cm4gcHJldmlvdXM7XG5cdH0sIFtdICkuam9pbiggJywgJyApO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUZvbnRTdHlsZSggY3VycmVudEZ2ZCwgYW5ub3RhdGlvbiApIHtcblx0aWYgKCBjdXJyZW50RnZkICkge1xuXHRcdHZhciBwYXJzZWQgPSBmdmQucGFyc2UoIGN1cnJlbnRGdmQgKTtcblx0XHRpZiAoIHBhcnNlZCAmJiBwYXJzZWRbJ2ZvbnQtc3R5bGUnXSApIHtcblx0XHRcdHJldHVybiBwYXJzZWRbJ2ZvbnQtc3R5bGUnXTtcblx0XHR9XG5cdH1cblx0dmFyIGFubm90YXRpb25TdHlsZSA9IGdldEZvbnRTdHlsZUZyb21Bbm5vdGF0aW9uKCBhbm5vdGF0aW9uICk7XG5cdGlmICggYW5ub3RhdGlvblN0eWxlICkge1xuXHRcdHJldHVybiBhbm5vdGF0aW9uU3R5bGU7XG5cdH1cblx0cmV0dXJuICdub3JtYWwnO1xufVxuXG5mdW5jdGlvbiBnZXRGb250U3R5bGVGcm9tQW5ub3RhdGlvbiggYW5ub3RhdGlvbiApIHtcblx0dmFyIG9yaWdpbmFsU3R5bGVTdHJpbmc7XG5cdGdldEFubm90YXRpb25SdWxlcyggYW5ub3RhdGlvbiApLmZvckVhY2goIGZ1bmN0aW9uKCBydWxlICkge1xuXHRcdGlmICggcnVsZS52YWx1ZSAmJiBydWxlLnByb3BlcnR5ID09PSAnZm9udC1zdHlsZScgKSB7XG5cdFx0XHRvcmlnaW5hbFN0eWxlU3RyaW5nID0gcnVsZS52YWx1ZTtcblx0XHR9XG5cdH0gKTtcblx0cmV0dXJuIG9yaWdpbmFsU3R5bGVTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlRm9udFdlaWdodCggY3VycmVudEZ2ZCwgYW5ub3RhdGlvbiApIHtcblx0aWYgKCBjdXJyZW50RnZkICkge1xuXHRcdHZhciBwYXJzZWQgPSBmdmQucGFyc2UoIGN1cnJlbnRGdmQgKTtcblx0XHRpZiAoIHBhcnNlZCAmJiBwYXJzZWRbJ2ZvbnQtd2VpZ2h0J10gKSB7XG5cdFx0XHRyZXR1cm4gcGFyc2VkWydmb250LXdlaWdodCddO1xuXHRcdH1cblx0fVxuXHR2YXIgYW5ub3RhdGlvbldlaWdodCA9IGdldEZvbnRXZWlnaHRGcm9tQW5ub3RhdGlvbiggYW5ub3RhdGlvbiApO1xuXHRpZiAoIGFubm90YXRpb25XZWlnaHQgKSB7XG5cdFx0cmV0dXJuIGFubm90YXRpb25XZWlnaHQ7XG5cdH1cblx0cmV0dXJuICc0MDAnO1xufVxuXG5mdW5jdGlvbiBnZXRGb250V2VpZ2h0RnJvbUFubm90YXRpb24oIGFubm90YXRpb24gKSB7XG5cdHZhciBvcmlnaW5hbFdlaWdodFN0cmluZztcblx0Z2V0QW5ub3RhdGlvblJ1bGVzKCBhbm5vdGF0aW9uICkuZm9yRWFjaCggZnVuY3Rpb24oIHJ1bGUgKSB7XG5cdFx0aWYgKCBydWxlLnZhbHVlICYmIHJ1bGUucHJvcGVydHkgPT09ICdmb250LXdlaWdodCcgKSB7XG5cdFx0XHRvcmlnaW5hbFdlaWdodFN0cmluZyA9IHJ1bGUudmFsdWU7XG5cdFx0fVxuXHR9ICk7XG5cdHJldHVybiBvcmlnaW5hbFdlaWdodFN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVGb250RmFtaWx5KCBmb250ICkge1xuXHRyZXR1cm4gZm9udC5mb250RmFtaWxpZXMgfHwgZm9udC5jc3NOYW1lO1xufVxuXG5mdW5jdGlvbiBnZXRBbm5vdGF0aW9uUnVsZXMoIGFubm90YXRpb24gKSB7XG5cdGlmICggISBhbm5vdGF0aW9uLnJ1bGVzIHx8ICEgYW5ub3RhdGlvbi5ydWxlcy5sZW5ndGggKSB7XG5cdFx0ZGVidWcoICdubyBhbm5vdGF0aW9uIHJ1bGVzIGZvdW5kIGZvcicsIGFubm90YXRpb24gKTtcblx0XHRyZXR1cm4gW107XG5cdH1cblx0cmV0dXJuIGFubm90YXRpb24ucnVsZXM7XG59XG5cbmZ1bmN0aW9uIGhhc0ZvbnRGYW1pbHlBbm5vdGF0aW9uKCBhbm5vdGF0aW9uICkge1xuXHR2YXIgZm91bmQgPSBmYWxzZTtcblx0Z2V0QW5ub3RhdGlvblJ1bGVzKCBhbm5vdGF0aW9uICkuZm9yRWFjaCggZnVuY3Rpb24oIHJ1bGUgKSB7XG5cdFx0aWYgKCBydWxlLnZhbHVlICYmIHJ1bGUucHJvcGVydHkgPT09ICdmb250LWZhbWlseScgJiYgJ2luaGVyaXQnICE9PSBydWxlLnZhbHVlICkge1xuXHRcdFx0Zm91bmQgPSB0cnVlO1xuXHRcdH1cblx0fSApO1xuXHRyZXR1cm4gZm91bmQ7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlRm9udFNpemUoIHNpemUsIGFubm90YXRpb24gKSB7XG5cdHZhciBvcmlnaW5hbFNpemVTdHJpbmcgPSBnZXRGb250U2l6ZUZyb21Bbm5vdGF0aW9uKCBhbm5vdGF0aW9uICk7XG5cdGlmICggISBvcmlnaW5hbFNpemVTdHJpbmcgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciB1bml0cyA9IHBhcnNlVW5pdHMoIG9yaWdpbmFsU2l6ZVN0cmluZyApO1xuXHR2YXIgb3JpZ2luYWxTaXplID0gcGFyc2VTaXplKCBvcmlnaW5hbFNpemVTdHJpbmcgKTtcblx0aWYgKCAhIHVuaXRzIHx8ICEgb3JpZ2luYWxTaXplICkge1xuXHRcdGRlYnVnKCAndW5hYmxlIHRvIHBhcnNlIHNpemUgYW5ub3RhdGlvbicsIG9yaWdpbmFsU2l6ZVN0cmluZyApO1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXIgc2NhbGUgPSAoIHBhcnNlSW50KCBzaXplLCAxMCApICogMC4wNiApICsgMTtcblx0cmV0dXJuICggc2NhbGUgKiBvcmlnaW5hbFNpemUgKS50b0ZpeGVkKCAxICkgKyB1bml0cztcbn1cblxuZnVuY3Rpb24gZ2V0Rm9udFNpemVGcm9tQW5ub3RhdGlvbiggYW5ub3RhdGlvbiApIHtcblx0dmFyIG9yaWdpbmFsU2l6ZVN0cmluZztcblx0Z2V0QW5ub3RhdGlvblJ1bGVzKCBhbm5vdGF0aW9uICkuZm9yRWFjaCggZnVuY3Rpb24oIHJ1bGUgKSB7XG5cdFx0aWYgKCBydWxlLnZhbHVlICYmIHJ1bGUucHJvcGVydHkgPT09ICdmb250LXNpemUnICYmICEgL15pbmhlcml0Ly50ZXN0KCBydWxlLnZhbHVlICkgKSB7XG5cdFx0XHRvcmlnaW5hbFNpemVTdHJpbmcgPSBydWxlLnZhbHVlO1xuXHRcdH1cblx0fSApO1xuXHRyZXR1cm4gb3JpZ2luYWxTaXplU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBwYXJzZVVuaXRzKCBzaXplU3RyaW5nICkge1xuXHR2YXIgbWF0Y2hlcyA9IHNpemVTdHJpbmcubWF0Y2goIC9bXFxkXFwuXSsoW0EtWmEtel17MiwzfXwlKS8gKTtcblx0aWYgKCAhIG1hdGNoZXMgfHwgISBtYXRjaGVzWzFdICkge1xuXHRcdHJldHVybjtcblx0fVxuXHRyZXR1cm4gbWF0Y2hlc1sgMSBdO1xufVxuXG5mdW5jdGlvbiBwYXJzZVNpemUoIHNpemVTdHJpbmcgKSB7XG5cdHZhciBtYXRjaGVzID0gc2l6ZVN0cmluZy5tYXRjaCggLygoXFxkKlxcLihcXGQrKSl8KFxcZCspKShbQS1aYS16XXsyLDN9fCUpLyApO1xuXHRpZiAoICEgbWF0Y2hlcyApIHtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIHNpemUsIHByZWNpc2lvbjtcblx0aWYgKCBtYXRjaGVzWyA0IF0gKSB7XG5cdFx0c2l6ZSA9IHBhcnNlSW50KCBtYXRjaGVzWyA0IF0sIDEwICk7XG5cdFx0cHJlY2lzaW9uID0gKCBzaXplID4gOSApID8gMSA6IDM7XG5cdH0gZWxzZSB7XG5cdFx0c2l6ZSA9IHBhcnNlRmxvYXQoIG1hdGNoZXNbIDIgXSApO1xuXHRcdHByZWNpc2lvbiA9IG1hdGNoZXNbIDMgXS5sZW5ndGggKyAxO1xuXHR9XG5cdHJldHVybiBzaXplLnRvRml4ZWQoIHByZWNpc2lvbiApO1xufVxuXG52YXIgUHJldmlld1N0eWxlcyA9IHtcblx0Z2V0Rm9udFN0eWxlRWxlbWVudDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGpRdWVyeSggJyNqZXRwYWNrLWN1c3RvbS1mb250cy1jc3MnIClbIDAgXTtcblx0fSxcblxuXHR3cml0ZUZvbnRTdHlsZXM6IGZ1bmN0aW9uKCBzdHlsZXMgKSB7XG5cdFx0UHJldmlld1N0eWxlcy5yZW1vdmVGb250U3R5bGVFbGVtZW50KCk7XG5cdFx0YW5ub3RhdGlvbnMgPSBQcmV2aWV3U3R5bGVzLm1heWJlTWVyZ2VBbm5vdGF0aW9uc0ZvclN0eWxlcyggYW5ub3RhdGlvbnMsIHN0eWxlcyApO1xuXHRcdHZhciBjc3MgPSBQcmV2aWV3U3R5bGVzLmdlbmVyYXRlQ3NzRnJvbVN0eWxlcyggc3R5bGVzICk7XG5cdFx0ZGVidWcoICdjc3MgZ2VuZXJhdGlvbiBjb21wbGV0ZTonLCBjc3MgKTtcblx0XHRQcmV2aWV3U3R5bGVzLmFkZFN0eWxlRWxlbWVudFRvUGFnZSggUHJldmlld1N0eWxlcy5jcmVhdGVTdHlsZUVsZW1lbnRXaXRoKCBjc3MgKSApO1xuXHR9LFxuXG5cdC8vIE1lcmdlcyBzaXRlLXRpdGxlIGFubm90YXRpb25zIGludG8gaGVhZGluZ3MgaWYgd2UgZG9uJ3QgaGF2ZSBzaXRlLXRpdGxlIGZvbnRzXG5cdG1heWJlTWVyZ2VBbm5vdGF0aW9uc0ZvclN0eWxlczogZnVuY3Rpb24oIG9yaWdBbm5vdGF0aW9ucywgZm9udHMgKSB7XG5cdFx0dmFyIGhhc1NpdGVUaXRsZTtcblx0XHRpZiAoICEgb3JpZ0Fubm90YXRpb25zICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAoICEgb3JpZ0Fubm90YXRpb25zWydzaXRlLXRpdGxlJ10gfHwgISBvcmlnQW5ub3RhdGlvbnMuaGVhZGluZ3MgKSB7XG5cdFx0XHRyZXR1cm4gb3JpZ0Fubm90YXRpb25zO1xuXHRcdH1cblx0XHRoYXNTaXRlVGl0bGUgPSBmb250cy5sZW5ndGggJiYgZm9udHMuc29tZSggZnVuY3Rpb24oIGZvbnQgKSB7XG5cdFx0XHRyZXR1cm4gZm9udC50eXBlID09PSAnc2l0ZS10aXRsZSc7XG5cdFx0fSApO1xuXHRcdGlmICggaGFzU2l0ZVRpdGxlICkge1xuXHRcdFx0cmV0dXJuIG9yaWdBbm5vdGF0aW9ucztcblx0XHR9XG5cdFx0ZGVidWcoICdtZXJnaW5nIHNpdGUtdGl0bGUgYW5ub3RhdGlvbnMgaW50byBoZWFkaW5ncycgKTtcblx0XHRvcmlnQW5ub3RhdGlvbnMuaGVhZGluZ3MgPSBvcmlnQW5ub3RhdGlvbnMuaGVhZGluZ3MuY29uY2F0KCBvcmlnQW5ub3RhdGlvbnNbJ3NpdGUtdGl0bGUnXSApO1xuXHRcdGRlbGV0ZSBvcmlnQW5ub3RhdGlvbnNbJ3NpdGUtdGl0bGUnXTtcblx0XHRyZXR1cm4gb3JpZ0Fubm90YXRpb25zO1xuXHR9LFxuXG5cdGdlbmVyYXRlQ3NzRnJvbVN0eWxlczogZnVuY3Rpb24oIHN0eWxlcyApIHtcblx0XHRpZiAoICEgc3R5bGVzICkge1xuXHRcdFx0ZGVidWcoICdnZW5lcmF0aW5nIGVtcHR5IGNzcyBiZWNhdXNlIHRoZXJlIGFyZSBubyBzdHlsZXMnICk7XG5cdFx0XHRyZXR1cm4gJyc7XG5cdFx0fVxuXHRcdGRlYnVnKCAnZ2VuZXJhdGluZyBjc3MgZm9yIHN0eWxlcycsIHN0eWxlcyApO1xuXHRcdHJldHVybiBzdHlsZXMucmVkdWNlKCBmdW5jdGlvbiggY3NzLCBzdHlsZSApIHtcblx0XHRcdHZhciBnZW5lcmF0ZWRDc3MgPSBnZW5lcmF0ZUNzc0ZvclN0eWxlT2JqZWN0KCBzdHlsZSApO1xuXHRcdFx0aWYgKCBnZW5lcmF0ZWRDc3MgKSB7XG5cdFx0XHRcdGNzcyArPSAnICcgKyBnZW5lcmF0ZWRDc3M7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gY3NzO1xuXHRcdC8vIGVuZm9yY2UgdGhlIDQwMCB3ZWlnaHQgZGVmYXVsdCBiZWxvdyB0aGF0IGlzIGFzc3VtZWQgZXZlcnl3aGVyZSBlbHNlXG5cdFx0fSwgJy53Zi1hY3RpdmUgPiBib2R5IHsgZm9udC13ZWlnaHQ6IDQwMDsgfScgKTtcblx0fSxcblxuXHRjcmVhdGVTdHlsZUVsZW1lbnRXaXRoOiBmdW5jdGlvbiggY3NzICkge1xuXHRcdHJldHVybiBqUXVlcnkoICc8c3R5bGUgaWQ9XCJqZXRwYWNrLWN1c3RvbS1mb250cy1jc3NcIj4nICsgY3NzICsgJzwvc3R5bGU+JyApO1xuXHR9LFxuXG5cdHJlbW92ZUZvbnRTdHlsZUVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlbGVtZW50ID0gUHJldmlld1N0eWxlcy5nZXRGb250U3R5bGVFbGVtZW50KCk7XG5cdFx0aWYgKCBlbGVtZW50ICkge1xuXHRcdFx0alF1ZXJ5KCBlbGVtZW50ICkucmVtb3ZlKCk7XG5cdFx0fVxuXHR9LFxuXG5cdGFkZFN0eWxlRWxlbWVudFRvUGFnZTogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0alF1ZXJ5KCAnaGVhZCcgKS5wcmVwZW5kKCBlbGVtZW50ICk7XG5cdH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcmV2aWV3U3R5bGVzO1xuIiwiLyoqXG4gKiBUaGlzIGhlbHBlciBzZXRzIHVwIFZpZXdzIHRvIHJlbmRlciBlYWNoIGZvbnQgZm9yIHNwZWNpZmljIHByb3ZpZGVycy4gRWFjaFxuICogVmlldyBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YgYHdwLmN1c3RvbWl6ZS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3YCAod2hpY2hcbiAqIGlzIGEgYEJhY2tib25lLlZpZXdgKSB0aGF0IHdpbGwgcmVuZGVyIGl0cyBmb250IG9wdGlvbiB0byB0aGUgZm9udCBsaXN0LlxuICogQWRkaXRpb25hbCBwcm92aWRlciBWaWV3cyBjYW4gYmUgYWRkZWQgYnkgYWRkaW5nIHRvIHRoZVxuICogYHdwLmN1c3RvbWl6ZS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3c2Agb2JqZWN0IHVzaW5nIHRoZSBwcm92aWRlciBpZCBhcyB0aGVcbiAqIGtleS4gVGhlIG9ubHkgdGhpbmcgdGhhdCBuZWVkcyB0byBiZSBhZGRlZCBmb3IgZWFjaCBQcm92aWRlclZpZXcgaXMgdGhlXG4gKiBgcmVuZGVyYCBtZXRob2QuIEVhY2ggUHJvdmlkZXJWaWV3IGhhcyBhcyBpdHMgYG1vZGVsYCBvYmplY3QgdGhlIGZvbnQgb2JqZWN0XG4gKiBpdCBuZWVkcyB0byBkaXNwbGF5LCBpbmNsdWRpbmcgdGhlIGBjc3NOYW1lYCwgYGRpc3BsYXlOYW1lYCwgYW5kIGBpZGAgYXR0cmlidXRlcy5cbiAqXG4gKiBBZGRpdGlvbmFsbHksIGlmIHlvdXIgcHJvdmlkZXIgbmVlZHMgc3BlY2lmaWMgbG9naWMgZm9yIGhvdmVyIHN0YXRlcyAodGhpbmtcbiAqIGJhY2tncm91bmQgaW1hZ2Ugc3dhcHBpbmcpLCB5b3UgY2FuIGltcGxlbWVudCBgbW91c2VlbnRlcmAgYW5kIGBtb3VzZWxlYXZlYCBtZXRob2RzLlxuICovXG5cbnZhciBhcGkgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hcGknICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpwcm92aWRlci12aWV3cycgKTtcblxudmFyIERyb3Bkb3duSXRlbSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1pdGVtJyApO1xuaWYgKCAhIGFwaS5KZXRwYWNrRm9udHMgKSB7XG5cdGFwaS5KZXRwYWNrRm9udHMgPSB7fTtcbn1cbmlmICggISBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKSB7XG5cdGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyA9IHt9O1xufVxuYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXcgPSBEcm9wZG93bkl0ZW0uZXh0ZW5kKCB7XG5cdG1vdXNlZW50ZXI6IGZ1bmN0aW9uKCkge30sXG5cdG1vdXNlbGVhdmU6IGZ1bmN0aW9uKCkge31cbn0gKTtcblxudmFyIHByb3ZpZGVyVmlld3MgPSB7fTtcblxuZnVuY3Rpb24gaW1wb3J0UHJvdmlkZXJWaWV3cygpIHtcblx0ZGVidWcoICdpbXBvcnRpbmcgcHJvdmlkZXIgdmlld3MgZnJvbScsIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApO1xuXHRpZiAoIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApIHtcblx0XHRPYmplY3Qua2V5cyggYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkuZm9yRWFjaCggZnVuY3Rpb24oIHByb3ZpZGVyS2V5ICkge1xuXHRcdFx0cHJvdmlkZXJWaWV3c1sgcHJvdmlkZXJLZXkgXSA9IGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3c1sgcHJvdmlkZXJLZXkgXTtcblx0XHR9ICk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0Vmlld0ZvclByb3ZpZGVyKCBwcm92aWRlciApIHtcblx0aW1wb3J0UHJvdmlkZXJWaWV3cygpO1xuXHRpZiAoIHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyIF0gKSB7XG5cdFx0ZGVidWcoICdmb3VuZCB2aWV3IGZvciBwcm92aWRlcicsIHByb3ZpZGVyICk7XG5cdFx0cmV0dXJuIHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyIF07XG5cdH1cblx0ZGVidWcoICdubyB2aWV3IGZvdW5kIGZvciBwcm92aWRlcicsIHByb3ZpZGVyICk7XG5cdHJldHVybiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0Vmlld0ZvclByb3ZpZGVyOiBnZXRWaWV3Rm9yUHJvdmlkZXJcbn07XG4iLCIvKiBnbG9iYWxzIF8gKi9cbm1vZHVsZS5leHBvcnRzID0gXztcbiIsIi8qIGdsb2JhbHMgV2ViRm9udCAqL1xubW9kdWxlLmV4cG9ydHMgPSBXZWJGb250O1xuIiwidmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKSxcblx0Ym9vdHN0cmFwID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYm9vdHN0cmFwJyApO1xuXG52YXIgV2ViRm9udCA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3dlYmZvbnQnICk7XG5cbnZhciBsb2FkZWRGb250SWRzID0gW107XG5cbmZ1bmN0aW9uIGFkZEZvbnRUb0NvbnRyb2xzKCBmb250LCB0ZXh0ICkge1xuXHRpZiAoIH4gbG9hZGVkRm9udElkcy5pbmRleE9mKCBmb250LmlkICkgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxvYWRlZEZvbnRJZHMucHVzaCggZm9udC5pZCApO1xuXHRXZWJGb250LmxvYWQoe1xuXHRcdGdvb2dsZTogeyBmYW1pbGllczogWyBmb250LmlkIF0sIHRleHQ6IHRleHQgfSxcblx0XHRjbGFzc2VzOiBmYWxzZSxcblx0XHRldmVudHM6IGZhbHNlXG5cdH0pO1xufVxuXG5mdW5jdGlvbiBhZGRGb250VG9QcmV2aWV3KCBmb250ICkge1xuXHRpZiAoIH4gbG9hZGVkRm9udElkcy5pbmRleE9mKCBmb250LmlkICkgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxvYWRlZEZvbnRJZHMucHVzaCggZm9udC5pZCApO1xuXHR2YXIgZmFtaWx5U3RyaW5nID0gZm9udC5pZCArICc6MTAwLDIwMCwzMDAsNDAwLDUwMCw2MDAsNzAwLDgwMCw5MDAsMTAwaXRhbGljLDIwMGl0YWxpYywzMDBpdGFsaWMsNDAwaXRhbGljLDUwMGl0YWxpYyw2MDBpdGFsaWMsNzAwaXRhbGljLDgwMGl0YWxpYyw5MDBpdGFsaWMnO1xuXHRpZiAoIGJvb3RzdHJhcC5wcm92aWRlckRhdGEgJiYgYm9vdHN0cmFwLnByb3ZpZGVyRGF0YS5nb29nbGVTdWJzZXRTdHJpbmcgKSB7XG5cdFx0dmFyIHN1YnNldFN0cmluZyA9IGJvb3RzdHJhcC5wcm92aWRlckRhdGEuZ29vZ2xlU3Vic2V0U3RyaW5nO1xuXHRcdGlmICggc3Vic2V0U3RyaW5nICYmIHN1YnNldFN0cmluZy5sZW5ndGggPiAwICkge1xuXHRcdFx0ZmFtaWx5U3RyaW5nICs9ICc6JyArIHN1YnNldFN0cmluZztcblx0XHR9XG5cdH1cblx0V2ViRm9udC5sb2FkKCB7IGdvb2dsZTogeyBmYW1pbGllczogWyBmYW1pbHlTdHJpbmcgXSB9IH0gKTtcbn1cblxudmFyIEdvb2dsZVByb3ZpZGVyVmlldyA9IGFwaS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3LmV4dGVuZCgge1xuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5tb2RlbC5nZXQoICdkaXNwbGF5TmFtZScgKSApO1xuXG5cdFx0dGhpcy4kZWwuY3NzKCAnZm9udC1mYW1pbHknLCAnXCInICsgdGhpcy5tb2RlbC5nZXQoICdjc3NOYW1lJyApICsgJ1wiJyApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udCAmJiB0aGlzLmN1cnJlbnRGb250LmdldCggJ2lkJyApID09PSB0aGlzLm1vZGVsLmdldCggJ2lkJyApICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH1cblx0XHRpZiAoICF0aGlzLmRpc2FibGVGb2N1cyApIHtcblx0XHRcdHRoaXMuJGVsLmF0dHIoICd0YWJpbmRleCcsICcwJyApO1xuXHRcdH1cblx0XHRhZGRGb250VG9Db250cm9scyggdGhpcy5tb2RlbC50b0pTT04oKSwgdGhpcy5tb2RlbC5nZXQoICdpZCcgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59ICk7XG5cbkdvb2dsZVByb3ZpZGVyVmlldy5hZGRGb250VG9QcmV2aWV3ID0gYWRkRm9udFRvUHJldmlldztcblxuYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzLmdvb2dsZSA9IEdvb2dsZVByb3ZpZGVyVmlldztcblxubW9kdWxlLmV4cG9ydHMgPSBHb29nbGVQcm92aWRlclZpZXc7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG4vLyBBbiBpbmRpdmlkdWFsIGZvbnQgaW4gdGhlIGRyb3Bkb3duIGxpc3QsIGV4cG9ydGVkIGFzXG4vLyBgYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXdgLiBFeHRlbmQgdGhpcyBvYmplY3QgZm9yIGVhY2ggcHJvdmlkZXIuIFRoZVxuLy8gZXh0ZW5kZWQgb2JqZWN0cyBuZWVkIHRvIGRlZmluZSBhIGByZW5kZXJgIG1ldGhvZCB0byByZW5kZXIgdGhlaXIgcHJvdmlkZXInc1xuLy8gZm9udCBuYW1lLCBhcyB3ZWxsIGFzIGBhZGRGb250VG9Db250cm9sc2AgYW5kIGBhZGRGb250VG9QcmV2aWV3YCBtZXRob2RzIG9uIHRoZSBvYmplY3QgaXRzZWxmLlxudmFyIFByb3ZpZGVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX29wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ2ZvbnRDaGFuZ2VkJyxcblx0XHQna2V5ZG93bic6ICdjaGVja0tleWJvYXJkU2VsZWN0J1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLmRpc2FibGVGb2N1cyA9IEJvb2xlYW4oIG9wdHMuZGlzYWJsZUZvY3VzICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250ICkge1xuXHRcdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0fVxuXHR9LFxuXG5cdGNoZWNrS2V5Ym9hcmRTZWxlY3Q6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoIGV2ZW50LmtleSA9PT0gJ0VudGVyJyApIHtcblx0XHRcdHRoaXMuJGVsLmNsaWNrKCk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIFdhcm5pbmc6IHRoaXMgc2hvdWxkIGJlIG92ZXJyaWRlbiBpbiB0aGUgcHJvdmlkZXJcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm1vZGVsLmdldCggJ2Rpc3BsYXlOYW1lJyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Zm9udENoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udCAmJiB0aGlzLmN1cnJlbnRGb250ICE9PSB0aGlzLm1vZGVsICkge1xuXHRcdFx0RW1pdHRlci50cmlnZ2VyKCAnY2hhbmdlLWZvbnQnLCB7IGZvbnQ6IHRoaXMubW9kZWwsIHR5cGU6IHRoaXMudHlwZS5pZCB9ICk7XG5cdFx0fVxuXHR9XG59ICk7XG5cblByb3ZpZGVyVmlldy5hZGRGb250VG9Db250cm9scyA9IGZ1bmN0aW9uKCkge307XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvdmlkZXJWaWV3O1xuIl19
