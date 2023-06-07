(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){(function (){
/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = require('./common')(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};

}).call(this)}).call(this,require('_process'))

},{"./common":2,"_process":4}],2:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = require('ms');
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;

},{"ms":3}],3:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
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
  } else if (type === 'number' && isFinite(val)) {
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
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
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
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
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
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
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
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var AvailableFont = require( '../models/available-font' );

module.exports = Backbone.Collection.extend( {
	model: AvailableFont
} );

},{"../helpers/backbone":9,"../models/available-font":19}],6:[function(require,module,exports){
module.exports = window.wp.customize;

},{}],7:[function(require,module,exports){
var settings = require( '../helpers/bootstrap' );

var fonts = [];
if ( settings && settings.fonts ) {
	fonts = settings.fonts;
}

module.exports = fonts;


},{"../helpers/bootstrap":10}],8:[function(require,module,exports){
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

},{"../helpers/bootstrap":10}],9:[function(require,module,exports){
/* globals Backbone */
module.exports = Backbone;

},{}],10:[function(require,module,exports){
var settings = window._JetpackFonts;

module.exports = settings;

},{}],11:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	_ = require( '../helpers/underscore' );

module.exports = _.extend( Backbone.Events );


},{"../helpers/backbone":9,"../helpers/underscore":15}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"../helpers/api":6,"../views/dropdown-item":29,"debug":1}],14:[function(require,module,exports){
var translations = typeof window !== 'undefined'
	? window._JetpackFonts.i18n
	: {};

module.exports = function( string ) {
	if ( translations[ string ] ) {
		return translations[ string ];
	}
	return string;
};

},{}],15:[function(require,module,exports){
/* globals _ */
module.exports = _;

},{}],16:[function(require,module,exports){
/* globals WebFont */
module.exports = WebFont;

},{}],17:[function(require,module,exports){
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

},{"./helpers/api":6,"./models/selected-fonts":22,"./views/master":40}],18:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/emitter":11,"debug":1}],19:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/translate":14,"../helpers/underscore":15}],20:[function(require,module,exports){
var SelectedFont = require( '../models/selected-font' ),
	translate = require( '../helpers/translate' );

module.exports = SelectedFont.extend( {
	initialize: function() {
		this.set( { id: '', displayName: translate( 'Default Theme Font' ), provider: '' } );
	}
} );

},{"../helpers/translate":14,"../models/selected-font":21}],21:[function(require,module,exports){
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

},{"../helpers/available-types":8,"../helpers/backbone":9,"../helpers/translate":14,"../helpers/underscore":15,"debug":1}],22:[function(require,module,exports){
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


},{"../helpers/backbone":9,"../helpers/translate":14,"../models/selected-font":21,"debug":1}],23:[function(require,module,exports){
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

},{"../helpers/api":6,"../helpers/bootstrap":10,"../helpers/webfont":16}],24:[function(require,module,exports){
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

},{"../views/dropdown-current-template":28}],25:[function(require,module,exports){
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

},{"../helpers/fvd-to-readable":12,"../views/dropdown-current-template":28}],26:[function(require,module,exports){
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

},{"../helpers/provider-views":13,"../views/dropdown-current-template":28,"debug":1}],27:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/emitter":11,"../models/default-font":20}],28:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/emitter":11,"debug":1}],29:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/emitter":11}],30:[function(require,module,exports){
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

},{"../helpers/backbone":9}],31:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../mixins/menu-view-mixin":18,"../views/current-font":26,"../views/default-font-button":27,"../views/font-dropdown":32}],32:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/emitter":11,"../helpers/provider-views":13,"../views/dropdown-template":30,"debug":1}],33:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/translate":14,"../mixins/menu-view-mixin":18,"../views/current-font-size":24,"../views/font-size-dropdown":34}],34:[function(require,module,exports){
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

},{"../views/dropdown-template":30,"../views/font-size-option":35}],35:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/emitter":11}],36:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/emitter":11,"../views/font-control":31,"../views/font-size-control":33,"../views/font-variant-control":37,"debug":1}],37:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../mixins/menu-view-mixin":18,"../views/current-font-variant":25,"../views/font-variant-dropdown":38}],38:[function(require,module,exports){
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

},{"../views/dropdown-template":30,"../views/font-variant-option":39}],39:[function(require,module,exports){
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

},{"../helpers/backbone":9,"../helpers/emitter":11,"../helpers/fvd-to-readable":12}],40:[function(require,module,exports){
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

},{"../collections/available-fonts":5,"../helpers/available-fonts":7,"../helpers/available-types":8,"../helpers/backbone":9,"../helpers/emitter":11,"../models/default-font":20,"../providers/google":23,"../views/font-type":36,"debug":1}]},{},[17])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2NvbW1vbi5qcyIsIm5vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmMvanMvY29sbGVjdGlvbnMvYXZhaWxhYmxlLWZvbnRzLmpzIiwic3JjL2pzL2hlbHBlcnMvYXBpLmpzIiwic3JjL2pzL2hlbHBlcnMvYXZhaWxhYmxlLWZvbnRzLmpzIiwic3JjL2pzL2hlbHBlcnMvYXZhaWxhYmxlLXR5cGVzLmpzIiwic3JjL2pzL2hlbHBlcnMvYmFja2JvbmUuanMiLCJzcmMvanMvaGVscGVycy9ib290c3RyYXAuanMiLCJzcmMvanMvaGVscGVycy9lbWl0dGVyLmpzIiwic3JjL2pzL2hlbHBlcnMvZnZkLXRvLXJlYWRhYmxlLmpzIiwic3JjL2pzL2hlbHBlcnMvcHJvdmlkZXItdmlld3MuanMiLCJzcmMvanMvaGVscGVycy90cmFuc2xhdGUuanMiLCJzcmMvanMvaGVscGVycy91bmRlcnNjb3JlLmpzIiwic3JjL2pzL2hlbHBlcnMvd2ViZm9udC5qcyIsInNyYy9qcy9pbmRleC5qcyIsInNyYy9qcy9taXhpbnMvbWVudS12aWV3LW1peGluLmpzIiwic3JjL2pzL21vZGVscy9hdmFpbGFibGUtZm9udC5qcyIsInNyYy9qcy9tb2RlbHMvZGVmYXVsdC1mb250LmpzIiwic3JjL2pzL21vZGVscy9zZWxlY3RlZC1mb250LmpzIiwic3JjL2pzL21vZGVscy9zZWxlY3RlZC1mb250cy5qcyIsInNyYy9qcy9wcm92aWRlcnMvZ29vZ2xlLmpzIiwic3JjL2pzL3ZpZXdzL2N1cnJlbnQtZm9udC1zaXplLmpzIiwic3JjL2pzL3ZpZXdzL2N1cnJlbnQtZm9udC12YXJpYW50LmpzIiwic3JjL2pzL3ZpZXdzL2N1cnJlbnQtZm9udC5qcyIsInNyYy9qcy92aWV3cy9kZWZhdWx0LWZvbnQtYnV0dG9uLmpzIiwic3JjL2pzL3ZpZXdzL2Ryb3Bkb3duLWN1cnJlbnQtdGVtcGxhdGUuanMiLCJzcmMvanMvdmlld3MvZHJvcGRvd24taXRlbS5qcyIsInNyYy9qcy92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZS5qcyIsInNyYy9qcy92aWV3cy9mb250LWNvbnRyb2wuanMiLCJzcmMvanMvdmlld3MvZm9udC1kcm9wZG93bi5qcyIsInNyYy9qcy92aWV3cy9mb250LXNpemUtY29udHJvbC5qcyIsInNyYy9qcy92aWV3cy9mb250LXNpemUtZHJvcGRvd24uanMiLCJzcmMvanMvdmlld3MvZm9udC1zaXplLW9wdGlvbi5qcyIsInNyYy9qcy92aWV3cy9mb250LXR5cGUuanMiLCJzcmMvanMvdmlld3MvZm9udC12YXJpYW50LWNvbnRyb2wuanMiLCJzcmMvanMvdmlld3MvZm9udC12YXJpYW50LWRyb3Bkb3duLmpzIiwic3JjL2pzL3ZpZXdzL2ZvbnQtdmFyaWFudC1vcHRpb24uanMiLCJzcmMvanMvdmlld3MvbWFzdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcbmV4cG9ydHMuc3RvcmFnZSA9IGxvY2Fsc3RvcmFnZSgpO1xuZXhwb3J0cy5kZXN0cm95ID0gKCgpID0+IHtcblx0bGV0IHdhcm5lZCA9IGZhbHNlO1xuXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0aWYgKCF3YXJuZWQpIHtcblx0XHRcdHdhcm5lZCA9IHRydWU7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0luc3RhbmNlIG1ldGhvZCBgZGVidWcuZGVzdHJveSgpYCBpcyBkZXByZWNhdGVkIGFuZCBubyBsb25nZXIgZG9lcyBhbnl0aGluZy4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHZlcnNpb24gb2YgYGRlYnVnYC4nKTtcblx0XHR9XG5cdH07XG59KSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcblx0JyMwMDAwQ0MnLFxuXHQnIzAwMDBGRicsXG5cdCcjMDAzM0NDJyxcblx0JyMwMDMzRkYnLFxuXHQnIzAwNjZDQycsXG5cdCcjMDA2NkZGJyxcblx0JyMwMDk5Q0MnLFxuXHQnIzAwOTlGRicsXG5cdCcjMDBDQzAwJyxcblx0JyMwMENDMzMnLFxuXHQnIzAwQ0M2NicsXG5cdCcjMDBDQzk5Jyxcblx0JyMwMENDQ0MnLFxuXHQnIzAwQ0NGRicsXG5cdCcjMzMwMENDJyxcblx0JyMzMzAwRkYnLFxuXHQnIzMzMzNDQycsXG5cdCcjMzMzM0ZGJyxcblx0JyMzMzY2Q0MnLFxuXHQnIzMzNjZGRicsXG5cdCcjMzM5OUNDJyxcblx0JyMzMzk5RkYnLFxuXHQnIzMzQ0MwMCcsXG5cdCcjMzNDQzMzJyxcblx0JyMzM0NDNjYnLFxuXHQnIzMzQ0M5OScsXG5cdCcjMzNDQ0NDJyxcblx0JyMzM0NDRkYnLFxuXHQnIzY2MDBDQycsXG5cdCcjNjYwMEZGJyxcblx0JyM2NjMzQ0MnLFxuXHQnIzY2MzNGRicsXG5cdCcjNjZDQzAwJyxcblx0JyM2NkNDMzMnLFxuXHQnIzk5MDBDQycsXG5cdCcjOTkwMEZGJyxcblx0JyM5OTMzQ0MnLFxuXHQnIzk5MzNGRicsXG5cdCcjOTlDQzAwJyxcblx0JyM5OUNDMzMnLFxuXHQnI0NDMDAwMCcsXG5cdCcjQ0MwMDMzJyxcblx0JyNDQzAwNjYnLFxuXHQnI0NDMDA5OScsXG5cdCcjQ0MwMENDJyxcblx0JyNDQzAwRkYnLFxuXHQnI0NDMzMwMCcsXG5cdCcjQ0MzMzMzJyxcblx0JyNDQzMzNjYnLFxuXHQnI0NDMzM5OScsXG5cdCcjQ0MzM0NDJyxcblx0JyNDQzMzRkYnLFxuXHQnI0NDNjYwMCcsXG5cdCcjQ0M2NjMzJyxcblx0JyNDQzk5MDAnLFxuXHQnI0NDOTkzMycsXG5cdCcjQ0NDQzAwJyxcblx0JyNDQ0NDMzMnLFxuXHQnI0ZGMDAwMCcsXG5cdCcjRkYwMDMzJyxcblx0JyNGRjAwNjYnLFxuXHQnI0ZGMDA5OScsXG5cdCcjRkYwMENDJyxcblx0JyNGRjAwRkYnLFxuXHQnI0ZGMzMwMCcsXG5cdCcjRkYzMzMzJyxcblx0JyNGRjMzNjYnLFxuXHQnI0ZGMzM5OScsXG5cdCcjRkYzM0NDJyxcblx0JyNGRjMzRkYnLFxuXHQnI0ZGNjYwMCcsXG5cdCcjRkY2NjMzJyxcblx0JyNGRjk5MDAnLFxuXHQnI0ZGOTkzMycsXG5cdCcjRkZDQzAwJyxcblx0JyNGRkNDMzMnXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG5cdC8vIE5COiBJbiBhbiBFbGVjdHJvbiBwcmVsb2FkIHNjcmlwdCwgZG9jdW1lbnQgd2lsbCBiZSBkZWZpbmVkIGJ1dCBub3QgZnVsbHlcblx0Ly8gaW5pdGlhbGl6ZWQuIFNpbmNlIHdlIGtub3cgd2UncmUgaW4gQ2hyb21lLCB3ZSdsbCBqdXN0IGRldGVjdCB0aGlzIGNhc2Vcblx0Ly8gZXhwbGljaXRseVxuXHRpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnByb2Nlc3MgJiYgKHdpbmRvdy5wcm9jZXNzLnR5cGUgPT09ICdyZW5kZXJlcicgfHwgd2luZG93LnByb2Nlc3MuX19ud2pzKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0Ly8gSW50ZXJuZXQgRXhwbG9yZXIgYW5kIEVkZ2UgZG8gbm90IHN1cHBvcnQgY29sb3JzLlxuXHRpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goLyhlZGdlfHRyaWRlbnQpXFwvKFxcZCspLykpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBJcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuXHQvLyBkb2N1bWVudCBpcyB1bmRlZmluZWQgaW4gcmVhY3QtbmF0aXZlOiBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QtbmF0aXZlL3B1bGwvMTYzMlxuXHRyZXR1cm4gKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuV2Via2l0QXBwZWFyYW5jZSkgfHxcblx0XHQvLyBJcyBmaXJlYnVnPyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zOTgxMjAvMzc2NzczXG5cdFx0KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5jb25zb2xlICYmICh3aW5kb3cuY29uc29sZS5maXJlYnVnIHx8ICh3aW5kb3cuY29uc29sZS5leGNlcHRpb24gJiYgd2luZG93LmNvbnNvbGUudGFibGUpKSkgfHxcblx0XHQvLyBJcyBmaXJlZm94ID49IHYzMT9cblx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1Rvb2xzL1dlYl9Db25zb2xlI1N0eWxpbmdfbWVzc2FnZXNcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSkgfHxcblx0XHQvLyBEb3VibGUgY2hlY2sgd2Via2l0IGluIHVzZXJBZ2VudCBqdXN0IGluIGNhc2Ugd2UgYXJlIGluIGEgd29ya2VyXG5cdFx0KHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9hcHBsZXdlYmtpdFxcLyhcXGQrKS8pKTtcbn1cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKGFyZ3MpIHtcblx0YXJnc1swXSA9ICh0aGlzLnVzZUNvbG9ycyA/ICclYycgOiAnJykgK1xuXHRcdHRoaXMubmFtZXNwYWNlICtcblx0XHQodGhpcy51c2VDb2xvcnMgPyAnICVjJyA6ICcgJykgK1xuXHRcdGFyZ3NbMF0gK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICclYyAnIDogJyAnKSArXG5cdFx0JysnICsgbW9kdWxlLmV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuXHRpZiAoIXRoaXMudXNlQ29sb3JzKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XG5cdGFyZ3Muc3BsaWNlKDEsIDAsIGMsICdjb2xvcjogaW5oZXJpdCcpO1xuXG5cdC8vIFRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG5cdC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cblx0Ly8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG5cdGxldCBpbmRleCA9IDA7XG5cdGxldCBsYXN0QyA9IDA7XG5cdGFyZ3NbMF0ucmVwbGFjZSgvJVthLXpBLVolXS9nLCBtYXRjaCA9PiB7XG5cdFx0aWYgKG1hdGNoID09PSAnJSUnKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGluZGV4Kys7XG5cdFx0aWYgKG1hdGNoID09PSAnJWMnKSB7XG5cdFx0XHQvLyBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcblx0XHRcdC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG5cdFx0XHRsYXN0QyA9IGluZGV4O1xuXHRcdH1cblx0fSk7XG5cblx0YXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUuZGVidWcoKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmRlYnVnYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKiBJZiBgY29uc29sZS5kZWJ1Z2AgaXMgbm90IGF2YWlsYWJsZSwgZmFsbHMgYmFja1xuICogdG8gYGNvbnNvbGUubG9nYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnRzLmxvZyA9IGNvbnNvbGUuZGVidWcgfHwgY29uc29sZS5sb2cgfHwgKCgpID0+IHt9KTtcblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuXHR0cnkge1xuXHRcdGlmIChuYW1lc3BhY2VzKSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2Uuc2V0SXRlbSgnZGVidWcnLCBuYW1lc3BhY2VzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZXhwb3J0cy5zdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XG5cdFx0fVxuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBsb2FkKCkge1xuXHRsZXQgcjtcblx0dHJ5IHtcblx0XHRyID0gZXhwb3J0cy5zdG9yYWdlLmdldEl0ZW0oJ2RlYnVnJyk7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG5cblx0Ly8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuXHRpZiAoIXIgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICdlbnYnIGluIHByb2Nlc3MpIHtcblx0XHRyID0gcHJvY2Vzcy5lbnYuREVCVUc7XG5cdH1cblxuXHRyZXR1cm4gcjtcbn1cblxuLyoqXG4gKiBMb2NhbHN0b3JhZ2UgYXR0ZW1wdHMgdG8gcmV0dXJuIHRoZSBsb2NhbHN0b3JhZ2UuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzYWZhcmkgdGhyb3dzXG4gKiB3aGVuIGEgdXNlciBkaXNhYmxlcyBjb29raWVzL2xvY2Fsc3RvcmFnZVxuICogYW5kIHlvdSBhdHRlbXB0IHRvIGFjY2VzcyBpdC5cbiAqXG4gKiBAcmV0dXJuIHtMb2NhbFN0b3JhZ2V9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2NhbHN0b3JhZ2UoKSB7XG5cdHRyeSB7XG5cdFx0Ly8gVFZNTEtpdCAoQXBwbGUgVFYgSlMgUnVudGltZSkgZG9lcyBub3QgaGF2ZSBhIHdpbmRvdyBvYmplY3QsIGp1c3QgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dFxuXHRcdC8vIFRoZSBCcm93c2VyIGFsc28gaGFzIGxvY2FsU3RvcmFnZSBpbiB0aGUgZ2xvYmFsIGNvbnRleHQuXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2NvbW1vbicpKGV4cG9ydHMpO1xuXG5jb25zdCB7Zm9ybWF0dGVyc30gPSBtb2R1bGUuZXhwb3J0cztcblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24gKHYpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0cmV0dXJuICdbVW5leHBlY3RlZEpTT05QYXJzZUVycm9yXTogJyArIGVycm9yLm1lc3NhZ2U7XG5cdH1cbn07XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5mdW5jdGlvbiBzZXR1cChlbnYpIHtcblx0Y3JlYXRlRGVidWcuZGVidWcgPSBjcmVhdGVEZWJ1Zztcblx0Y3JlYXRlRGVidWcuZGVmYXVsdCA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5jb2VyY2UgPSBjb2VyY2U7XG5cdGNyZWF0ZURlYnVnLmRpc2FibGUgPSBkaXNhYmxlO1xuXHRjcmVhdGVEZWJ1Zy5lbmFibGUgPSBlbmFibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZWQgPSBlbmFibGVkO1xuXHRjcmVhdGVEZWJ1Zy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cdGNyZWF0ZURlYnVnLmRlc3Ryb3kgPSBkZXN0cm95O1xuXG5cdE9iamVjdC5rZXlzKGVudikuZm9yRWFjaChrZXkgPT4ge1xuXHRcdGNyZWF0ZURlYnVnW2tleV0gPSBlbnZba2V5XTtcblx0fSk7XG5cblx0LyoqXG5cdCogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG5cdCovXG5cblx0Y3JlYXRlRGVidWcubmFtZXMgPSBbXTtcblx0Y3JlYXRlRGVidWcuc2tpcHMgPSBbXTtcblxuXHQvKipcblx0KiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG5cdCpcblx0KiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlciBvciB1cHBlci1jYXNlIGxldHRlciwgaS5lLiBcIm5cIiBhbmQgXCJOXCIuXG5cdCovXG5cdGNyZWF0ZURlYnVnLmZvcm1hdHRlcnMgPSB7fTtcblxuXHQvKipcblx0KiBTZWxlY3RzIGEgY29sb3IgZm9yIGEgZGVidWcgbmFtZXNwYWNlXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIHN0cmluZyBmb3IgdGhlIGRlYnVnIGluc3RhbmNlIHRvIGJlIGNvbG9yZWRcblx0KiBAcmV0dXJuIHtOdW1iZXJ8U3RyaW5nfSBBbiBBTlNJIGNvbG9yIGNvZGUgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG5cdFx0bGV0IGhhc2ggPSAwO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lc3BhY2UubGVuZ3RoOyBpKyspIHtcblx0XHRcdGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuXHRcdFx0aGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcblx0XHR9XG5cblx0XHRyZXR1cm4gY3JlYXRlRGVidWcuY29sb3JzW01hdGguYWJzKGhhc2gpICUgY3JlYXRlRGVidWcuY29sb3JzLmxlbmd0aF07XG5cdH1cblx0Y3JlYXRlRGVidWcuc2VsZWN0Q29sb3IgPSBzZWxlY3RDb2xvcjtcblxuXHQvKipcblx0KiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAcmV0dXJuIHtGdW5jdGlvbn1cblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblx0XHRsZXQgcHJldlRpbWU7XG5cdFx0bGV0IGVuYWJsZU92ZXJyaWRlID0gbnVsbDtcblx0XHRsZXQgbmFtZXNwYWNlc0NhY2hlO1xuXHRcdGxldCBlbmFibGVkQ2FjaGU7XG5cblx0XHRmdW5jdGlvbiBkZWJ1ZyguLi5hcmdzKSB7XG5cdFx0XHQvLyBEaXNhYmxlZD9cblx0XHRcdGlmICghZGVidWcuZW5hYmxlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHNlbGYgPSBkZWJ1ZztcblxuXHRcdFx0Ly8gU2V0IGBkaWZmYCB0aW1lc3RhbXBcblx0XHRcdGNvbnN0IGN1cnIgPSBOdW1iZXIobmV3IERhdGUoKSk7XG5cdFx0XHRjb25zdCBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG5cdFx0XHRzZWxmLmRpZmYgPSBtcztcblx0XHRcdHNlbGYucHJldiA9IHByZXZUaW1lO1xuXHRcdFx0c2VsZi5jdXJyID0gY3Vycjtcblx0XHRcdHByZXZUaW1lID0gY3VycjtcblxuXHRcdFx0YXJnc1swXSA9IGNyZWF0ZURlYnVnLmNvZXJjZShhcmdzWzBdKTtcblxuXHRcdFx0aWYgKHR5cGVvZiBhcmdzWzBdICE9PSAnc3RyaW5nJykge1xuXHRcdFx0XHQvLyBBbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuXHRcdFx0XHRhcmdzLnVuc2hpZnQoJyVPJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG5cdFx0XHRsZXQgaW5kZXggPSAwO1xuXHRcdFx0YXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIChtYXRjaCwgZm9ybWF0KSA9PiB7XG5cdFx0XHRcdC8vIElmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcblx0XHRcdFx0aWYgKG1hdGNoID09PSAnJSUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuICclJztcblx0XHRcdFx0fVxuXHRcdFx0XHRpbmRleCsrO1xuXHRcdFx0XHRjb25zdCBmb3JtYXR0ZXIgPSBjcmVhdGVEZWJ1Zy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG5cdFx0XHRcdGlmICh0eXBlb2YgZm9ybWF0dGVyID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y29uc3QgdmFsID0gYXJnc1tpbmRleF07XG5cdFx0XHRcdFx0bWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xuXG5cdFx0XHRcdFx0Ly8gTm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuXHRcdFx0XHRcdGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0XHRpbmRleC0tO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBtYXRjaDtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBBcHBseSBlbnYtc3BlY2lmaWMgZm9ybWF0dGluZyAoY29sb3JzLCBldGMuKVxuXHRcdFx0Y3JlYXRlRGVidWcuZm9ybWF0QXJncy5jYWxsKHNlbGYsIGFyZ3MpO1xuXG5cdFx0XHRjb25zdCBsb2dGbiA9IHNlbGYubG9nIHx8IGNyZWF0ZURlYnVnLmxvZztcblx0XHRcdGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuXHRcdH1cblxuXHRcdGRlYnVnLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblx0XHRkZWJ1Zy51c2VDb2xvcnMgPSBjcmVhdGVEZWJ1Zy51c2VDb2xvcnMoKTtcblx0XHRkZWJ1Zy5jb2xvciA9IGNyZWF0ZURlYnVnLnNlbGVjdENvbG9yKG5hbWVzcGFjZSk7XG5cdFx0ZGVidWcuZXh0ZW5kID0gZXh0ZW5kO1xuXHRcdGRlYnVnLmRlc3Ryb3kgPSBjcmVhdGVEZWJ1Zy5kZXN0cm95OyAvLyBYWFggVGVtcG9yYXJ5LiBXaWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgcmVsZWFzZS5cblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShkZWJ1ZywgJ2VuYWJsZWQnLCB7XG5cdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcblx0XHRcdGdldDogKCkgPT4ge1xuXHRcdFx0XHRpZiAoZW5hYmxlT3ZlcnJpZGUgIT09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm4gZW5hYmxlT3ZlcnJpZGU7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG5hbWVzcGFjZXNDYWNoZSAhPT0gY3JlYXRlRGVidWcubmFtZXNwYWNlcykge1xuXHRcdFx0XHRcdG5hbWVzcGFjZXNDYWNoZSA9IGNyZWF0ZURlYnVnLm5hbWVzcGFjZXM7XG5cdFx0XHRcdFx0ZW5hYmxlZENhY2hlID0gY3JlYXRlRGVidWcuZW5hYmxlZChuYW1lc3BhY2UpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGVuYWJsZWRDYWNoZTtcblx0XHRcdH0sXG5cdFx0XHRzZXQ6IHYgPT4ge1xuXHRcdFx0XHRlbmFibGVPdmVycmlkZSA9IHY7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBFbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuXHRcdGlmICh0eXBlb2YgY3JlYXRlRGVidWcuaW5pdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y3JlYXRlRGVidWcuaW5pdChkZWJ1Zyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRlYnVnO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXh0ZW5kKG5hbWVzcGFjZSwgZGVsaW1pdGVyKSB7XG5cdFx0Y29uc3QgbmV3RGVidWcgPSBjcmVhdGVEZWJ1Zyh0aGlzLm5hbWVzcGFjZSArICh0eXBlb2YgZGVsaW1pdGVyID09PSAndW5kZWZpbmVkJyA/ICc6JyA6IGRlbGltaXRlcikgKyBuYW1lc3BhY2UpO1xuXHRcdG5ld0RlYnVnLmxvZyA9IHRoaXMubG9nO1xuXHRcdHJldHVybiBuZXdEZWJ1Zztcblx0fVxuXG5cdC8qKlxuXHQqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcblx0KiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuXHQqXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuXHRcdGNyZWF0ZURlYnVnLnNhdmUobmFtZXNwYWNlcyk7XG5cdFx0Y3JlYXRlRGVidWcubmFtZXNwYWNlcyA9IG5hbWVzcGFjZXM7XG5cblx0XHRjcmVhdGVEZWJ1Zy5uYW1lcyA9IFtdO1xuXHRcdGNyZWF0ZURlYnVnLnNraXBzID0gW107XG5cblx0XHRsZXQgaTtcblx0XHRjb25zdCBzcGxpdCA9ICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycgPyBuYW1lc3BhY2VzIDogJycpLnNwbGl0KC9bXFxzLF0rLyk7XG5cdFx0Y29uc3QgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoIXNwbGl0W2ldKSB7XG5cdFx0XHRcdC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcblxuXHRcdFx0aWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zbGljZSgxKSArICckJykpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y3JlYXRlRGVidWcubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cblx0KlxuXHQqIEByZXR1cm4ge1N0cmluZ30gbmFtZXNwYWNlc1xuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGRpc2FibGUoKSB7XG5cdFx0Y29uc3QgbmFtZXNwYWNlcyA9IFtcblx0XHRcdC4uLmNyZWF0ZURlYnVnLm5hbWVzLm1hcCh0b05hbWVzcGFjZSksXG5cdFx0XHQuLi5jcmVhdGVEZWJ1Zy5za2lwcy5tYXAodG9OYW1lc3BhY2UpLm1hcChuYW1lc3BhY2UgPT4gJy0nICsgbmFtZXNwYWNlKVxuXHRcdF0uam9pbignLCcpO1xuXHRcdGNyZWF0ZURlYnVnLmVuYWJsZSgnJyk7XG5cdFx0cmV0dXJuIG5hbWVzcGFjZXM7XG5cdH1cblxuXHQvKipcblx0KiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuXHQqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG5cdFx0aWYgKG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJyonKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgaTtcblx0XHRsZXQgbGVuO1xuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY3JlYXRlRGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChjcmVhdGVEZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCogQ29udmVydCByZWdleHAgdG8gbmFtZXNwYWNlXG5cdCpcblx0KiBAcGFyYW0ge1JlZ0V4cH0gcmVneGVwXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gdG9OYW1lc3BhY2UocmVnZXhwKSB7XG5cdFx0cmV0dXJuIHJlZ2V4cC50b1N0cmluZygpXG5cdFx0XHQuc3Vic3RyaW5nKDIsIHJlZ2V4cC50b1N0cmluZygpLmxlbmd0aCAtIDIpXG5cdFx0XHQucmVwbGFjZSgvXFwuXFwqXFw/JC8sICcqJyk7XG5cdH1cblxuXHQvKipcblx0KiBDb2VyY2UgYHZhbGAuXG5cdCpcblx0KiBAcGFyYW0ge01peGVkfSB2YWxcblx0KiBAcmV0dXJuIHtNaXhlZH1cblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuXHRcdGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0cmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcblx0XHR9XG5cdFx0cmV0dXJuIHZhbDtcblx0fVxuXG5cdC8qKlxuXHQqIFhYWCBETyBOT1QgVVNFLiBUaGlzIGlzIGEgdGVtcG9yYXJ5IHN0dWIgZnVuY3Rpb24uXG5cdCogWFhYIEl0IFdJTEwgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCBtYWpvciByZWxlYXNlLlxuXHQqL1xuXHRmdW5jdGlvbiBkZXN0cm95KCkge1xuXHRcdGNvbnNvbGUud2FybignSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLicpO1xuXHR9XG5cblx0Y3JlYXRlRGVidWcuZW5hYmxlKGNyZWF0ZURlYnVnLmxvYWQoKSk7XG5cblx0cmV0dXJuIGNyZWF0ZURlYnVnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHVwO1xuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB3ID0gZCAqIDc7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnd2Vla3MnOlxuICAgIGNhc2UgJ3dlZWsnOlxuICAgIGNhc2UgJ3cnOlxuICAgICAgcmV0dXJuIG4gKiB3O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBkLCAnZGF5Jyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgcywgJ3NlY29uZCcpO1xuICB9XG4gIHJldHVybiBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBuKSArICcgJyArIG5hbWUgKyAoaXNQbHVyYWwgPyAncycgOiAnJyk7XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBBdmFpbGFibGVGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9hdmFpbGFibGUtZm9udCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCgge1xuXHRtb2RlbDogQXZhaWxhYmxlRm9udFxufSApO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB3aW5kb3cud3AuY3VzdG9taXplO1xuIiwidmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYm9vdHN0cmFwJyApO1xuXG52YXIgZm9udHMgPSBbXTtcbmlmICggc2V0dGluZ3MgJiYgc2V0dGluZ3MuZm9udHMgKSB7XG5cdGZvbnRzID0gc2V0dGluZ3MuZm9udHM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZm9udHM7XG5cbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Jvb3RzdHJhcCcgKTtcblxuZnVuY3Rpb24gY29tcGFyZVR5cGVzKCBhLCBiICkge1xuXHRpZiAoIGEuaWQgPT09ICdoZWFkaW5ncycgKSB7XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdGlmICggYi5pZCA9PT0gJ2hlYWRpbmdzJyApIHtcblx0XHRyZXR1cm4gMTtcblx0fVxuXHRyZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlU2l0ZVRpdGxlKCB0eXBlcyApIHtcblx0cmV0dXJuIHR5cGVzLnJlZHVjZSggZnVuY3Rpb24oIHByZXZpb3VzLCB0eXBlICkge1xuXHRcdGlmICggdHlwZS5pZCAhPT0gJ3NpdGUtdGl0bGUnICkge1xuXHRcdFx0cHJldmlvdXMucHVzaCggdHlwZSApO1xuXHRcdH1cblx0XHRyZXR1cm4gcHJldmlvdXM7XG5cdH0sIFtdICk7XG59XG5cbnZhciB0eXBlcyA9IFtdO1xuaWYgKCBzZXR0aW5ncyAmJiBzZXR0aW5ncy50eXBlcyApIHtcblx0Ly8gQXJyYW5nZSB0aGUgY29udHJvbHMgc28gdGhhdCBib2R5LXRleHQgaXMgZmlyc3Rcblx0dHlwZXMgPSBzZXR0aW5ncy50eXBlcy5zb3J0KCBjb21wYXJlVHlwZXMgKTtcblx0Ly8gUmVtb3ZlIGRlcHJlY2F0ZWQgc2l0ZS10aXRsZSBjb250cm9sIGZyb20gVUlcblx0dHlwZXMgPSByZW1vdmVTaXRlVGl0bGUoIHR5cGVzICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdHlwZXM7XG4iLCIvKiBnbG9iYWxzIEJhY2tib25lICovXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lO1xuIiwidmFyIHNldHRpbmdzID0gd2luZG93Ll9KZXRwYWNrRm9udHM7XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3M7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0XyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gXy5leHRlbmQoIEJhY2tib25lLkV2ZW50cyApO1xuXG4iLCJ2YXIgc3R5bGVPcHRpb25zID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcblx0PyB3aW5kb3cuX0pldHBhY2tGb250cy5mdmRNYXBcblx0OiB7XG5cdFx0J24xJzogJ1RoaW4nLFxuXHRcdCdpMSc6ICdUaGluIEl0YWxpYycsXG5cdFx0J28xJzogJ1RoaW4gT2JsaXF1ZScsXG5cdFx0J24yJzogJ0V4dHJhIExpZ2h0Jyxcblx0XHQnaTInOiAnRXh0cmEgTGlnaHQgSXRhbGljJyxcblx0XHQnbzInOiAnRXh0cmEgTGlnaHQgT2JsaXF1ZScsXG5cdFx0J24zJzogJ0xpZ2h0Jyxcblx0XHQnaTMnOiAnTGlnaHQgSXRhbGljJyxcblx0XHQnbzMnOiAnTGlnaHQgT2JsaXF1ZScsXG5cdFx0J240JzogJ1JlZ3VsYXInLFxuXHRcdCdpNCc6ICdJdGFsaWMnLFxuXHRcdCdvNCc6ICdPYmxpcXVlJyxcblx0XHQnbjUnOiAnTWVkaXVtJyxcblx0XHQnaTUnOiAnTWVkaXVtIEl0YWxpYycsXG5cdFx0J281JzogJ01lZGl1bSBPYmxpcXVlJyxcblx0XHQnbjYnOiAnU2VtaWJvbGQnLFxuXHRcdCdpNic6ICdTZW1pYm9sZCBJdGFsaWMnLFxuXHRcdCdvNic6ICdTZW1pYm9sZCBPYmxpcXVlJyxcblx0XHQnbjcnOiAnQm9sZCcsXG5cdFx0J2k3JzogJ0JvbGQgSXRhbGljJyxcblx0XHQnbzcnOiAnQm9sZCBPYmxpcXVlJyxcblx0XHQnbjgnOiAnRXh0cmEgQm9sZCcsXG5cdFx0J2k4JzogJ0V4dHJhIEJvbGQgSXRhbGljJyxcblx0XHQnbzgnOiAnRXh0cmEgQm9sZCBPYmxpcXVlJyxcblx0XHQnbjknOiAnVWx0cmEgQm9sZCcsXG5cdFx0J2k5JzogJ1VsdHJhIEJvbGQgSXRhbGljJyxcblx0XHQnbzknOiAnVWx0cmEgQm9sZCBPYmxpcXVlJ1xuXHR9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkOiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0dmFyIG1hdGNoID0gc3R5bGVPcHRpb25zWyBpZCBdO1xuXHRcdGlmICggbWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0fVxuXHRcdHJldHVybiAnUmVndWxhcic7XG5cdH1cbn07XG4iLCIvKipcbiAqIFRoaXMgaGVscGVyIHNldHMgdXAgVmlld3MgdG8gcmVuZGVyIGVhY2ggZm9udCBmb3Igc3BlY2lmaWMgcHJvdmlkZXJzLiBFYWNoXG4gKiBWaWV3IHNob3VsZCBiZSBhbiBpbnN0YW5jZSBvZiBgd3AuY3VzdG9taXplLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXdgICh3aGljaFxuICogaXMgYSBgQmFja2JvbmUuVmlld2ApIHRoYXQgd2lsbCByZW5kZXIgaXRzIGZvbnQgb3B0aW9uIHRvIHRoZSBmb250IGxpc3QuXG4gKiBBZGRpdGlvbmFsIHByb3ZpZGVyIFZpZXdzIGNhbiBiZSBhZGRlZCBieSBhZGRpbmcgdG8gdGhlXG4gKiBgd3AuY3VzdG9taXplLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzYCBvYmplY3QgdXNpbmcgdGhlIHByb3ZpZGVyIGlkIGFzIHRoZVxuICoga2V5LiBUaGUgb25seSB0aGluZyB0aGF0IG5lZWRzIHRvIGJlIGFkZGVkIGZvciBlYWNoIFByb3ZpZGVyVmlldyBpcyB0aGVcbiAqIGByZW5kZXJgIG1ldGhvZC4gRWFjaCBQcm92aWRlclZpZXcgaGFzIGFzIGl0cyBgbW9kZWxgIG9iamVjdCB0aGUgZm9udCBvYmplY3RcbiAqIGl0IG5lZWRzIHRvIGRpc3BsYXksIGluY2x1ZGluZyB0aGUgYGNzc05hbWVgLCBgZGlzcGxheU5hbWVgLCBhbmQgYGlkYCBhdHRyaWJ1dGVzLlxuICpcbiAqIEFkZGl0aW9uYWxseSwgaWYgeW91ciBwcm92aWRlciBuZWVkcyBzcGVjaWZpYyBsb2dpYyBmb3IgaG92ZXIgc3RhdGVzICh0aGlua1xuICogYmFja2dyb3VuZCBpbWFnZSBzd2FwcGluZyksIHlvdSBjYW4gaW1wbGVtZW50IGBtb3VzZWVudGVyYCBhbmQgYG1vdXNlbGVhdmVgIG1ldGhvZHMuXG4gKi9cblxudmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOnByb3ZpZGVyLXZpZXdzJyApO1xuXG52YXIgRHJvcGRvd25JdGVtID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLWl0ZW0nICk7XG5pZiAoICEgYXBpLkpldHBhY2tGb250cyApIHtcblx0YXBpLkpldHBhY2tGb250cyA9IHt9O1xufVxuaWYgKCAhIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApIHtcblx0YXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzID0ge307XG59XG5hcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlldyA9IERyb3Bkb3duSXRlbS5leHRlbmQoIHtcblx0bW91c2VlbnRlcjogZnVuY3Rpb24oKSB7fSxcblx0bW91c2VsZWF2ZTogZnVuY3Rpb24oKSB7fVxufSApO1xuXG52YXIgcHJvdmlkZXJWaWV3cyA9IHt9O1xuXG5mdW5jdGlvbiBpbXBvcnRQcm92aWRlclZpZXdzKCkge1xuXHRkZWJ1ZyggJ2ltcG9ydGluZyBwcm92aWRlciB2aWV3cyBmcm9tJywgYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICk7XG5cdGlmICggYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkge1xuXHRcdE9iamVjdC5rZXlzKCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKS5mb3JFYWNoKCBmdW5jdGlvbiggcHJvdmlkZXJLZXkgKSB7XG5cdFx0XHRwcm92aWRlclZpZXdzWyBwcm92aWRlcktleSBdID0gYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzWyBwcm92aWRlcktleSBdO1xuXHRcdH0gKTtcblx0fVxufVxuXG5mdW5jdGlvbiBnZXRWaWV3Rm9yUHJvdmlkZXIoIHByb3ZpZGVyICkge1xuXHRpbXBvcnRQcm92aWRlclZpZXdzKCk7XG5cdGlmICggcHJvdmlkZXJWaWV3c1sgcHJvdmlkZXIgXSApIHtcblx0XHRkZWJ1ZyggJ2ZvdW5kIHZpZXcgZm9yIHByb3ZpZGVyJywgcHJvdmlkZXIgKTtcblx0XHRyZXR1cm4gcHJvdmlkZXJWaWV3c1sgcHJvdmlkZXIgXTtcblx0fVxuXHRkZWJ1ZyggJ25vIHZpZXcgZm91bmQgZm9yIHByb3ZpZGVyJywgcHJvdmlkZXIgKTtcblx0cmV0dXJuIG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRWaWV3Rm9yUHJvdmlkZXI6IGdldFZpZXdGb3JQcm92aWRlclxufTtcbiIsInZhciB0cmFuc2xhdGlvbnMgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuXHQ/IHdpbmRvdy5fSmV0cGFja0ZvbnRzLmkxOG5cblx0OiB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggc3RyaW5nICkge1xuXHRpZiAoIHRyYW5zbGF0aW9uc1sgc3RyaW5nIF0gKSB7XG5cdFx0cmV0dXJuIHRyYW5zbGF0aW9uc1sgc3RyaW5nIF07XG5cdH1cblx0cmV0dXJuIHN0cmluZztcbn07XG4iLCIvKiBnbG9iYWxzIF8gKi9cbm1vZHVsZS5leHBvcnRzID0gXztcbiIsIi8qIGdsb2JhbHMgV2ViRm9udCAqL1xubW9kdWxlLmV4cG9ydHMgPSBXZWJGb250O1xuIiwidmFyIGFwaSA9IHJlcXVpcmUoICcuL2hlbHBlcnMvYXBpJyApO1xuXG52YXIgTWFzdGVyID0gcmVxdWlyZSggJy4vdmlld3MvbWFzdGVyJyApO1xuXG52YXIgU2VsZWN0ZWRGb250cyA9IHJlcXVpcmUoICcuL21vZGVscy9zZWxlY3RlZC1mb250cycgKTtcblxuLy8gQ3VzdG9taXplciBDb250cm9sXG5hcGkuY29udHJvbENvbnN0cnVjdG9yLmpldHBhY2tGb250cyA9IGFwaS5Db250cm9sLmV4dGVuZCgge1xuXHRyZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gR2V0IHRoZSBleGlzdGluZyBzZXR0aW5nIGZyb20gdGhlIEN1c3RvbWl6ZXJcblx0XHR0aGlzLnNlbGVjdGVkRm9udHMgPSBuZXcgU2VsZWN0ZWRGb250cyggdGhpcy5zZXR0aW5nKCkgKTtcblxuXHRcdC8vIFVwZGF0ZSB0aGUgc2V0dGluZyB3aGVuIHRoZSBjdXJyZW50IGZvbnQgY2hhbmdlc1xuXHRcdHRoaXMuc2VsZWN0ZWRGb250cy5vbiggJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5zZXR0aW5nKCB0aGlzLnNlbGVjdGVkRm9udHMudG9KU09OKCkgKTtcblx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXG5cdFx0dGhpcy52aWV3ID0gbmV3IE1hc3Rlcigge1xuXHRcdFx0c2VsZWN0ZWRGb250czogdGhpcy5zZWxlY3RlZEZvbnRzLFxuXHRcdFx0ZWw6IHRoaXMuY29udGFpbmVyXG5cdFx0fSApLnJlbmRlcigpO1xuXG5cdFx0Ly8gRGVsYXkgbG9hZGluZyBmb250cyB1bnRpbCB0aGUgU2VjdGlvbiBpcyBvcGVuZWRcblx0XHRhcGkuc2VjdGlvbiggdGhpcy5zZWN0aW9uKCkgKS5jb250YWluZXJcblx0XHQub25lKCAnZXhwYW5kZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdHNldFRpbWVvdXQoIHRoaXMudmlldy5sb2FkRm9udHMsIDIwMCApO1xuXHRcdH0uYmluZCggdGhpcyApICk7XG5cblx0XHRhcGkuc2VjdGlvbiggdGhpcy5zZWN0aW9uKCkgKS5jb250YWluZXJcblx0XHQub24oICdjb2xsYXBzZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMudmlldy5jbG9zZUFsbE1lbnVzKCk7XG5cdFx0fS5iaW5kKCB0aGlzICkgKTtcblx0fVxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czptZW51LXZpZXcnICksXG5cdEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG5mdW5jdGlvbiBtYXliZU9wZW5NZW51KCBrZXkgKSB7XG5cdGlmICgga2V5LnR5cGUgJiYga2V5LnR5cGUuaWQgJiYga2V5Lm1lbnUgKSB7XG5cdFx0a2V5ID0ga2V5LnR5cGUuaWQgKyAnOicgKyBrZXkubWVudTtcblx0fVxuXHRpZiAoIGtleSAhPT0gdGhpcy5tZW51S2V5ICkge1xuXHRcdHJldHVybiB0aGlzLmNsb3NlTWVudSgpO1xuXHR9XG5cdHRoaXMub3Blbk1lbnUoKTtcbn1cblxuZnVuY3Rpb24gb3Blbk1lbnUoKSB7XG5cdGRlYnVnKCAnb3BlbmluZyBtZW51JywgdGhpcy5tZW51S2V5ICk7XG5cdHRoaXMubWVudVN0YXR1cy5zZXQoIHsgaXNPcGVuOiB0cnVlIH0gKTtcbn1cblxuZnVuY3Rpb24gY2xvc2VNZW51KCkge1xuXHRkZWJ1ZyggJ2Nsb3NpbmcgbWVudScsIHRoaXMubWVudUtleSApO1xuXHR0aGlzLm1lbnVTdGF0dXMuc2V0KCB7IGlzT3BlbjogZmFsc2UgfSApO1xufVxuXG52YXIgbWVudVZpZXdNaXhpbiA9IGZ1bmN0aW9uKCB2aWV3ICkge1xuXHRpZiAoICEgdmlldy5saXN0ZW5UbyApIHtcblx0XHR0aHJvdyAnbWVudVZpZXdNaXhpbiByZXF1aXJlcyBhIEJhY2tib25lIFZpZXcgd2l0aCB0aGUgYGxpc3RlblRvYCBtZXRob2QnO1xuXHR9XG5cdGlmICggISB2aWV3Lm1lbnVLZXkgKSB7XG5cdFx0dGhyb3cgJ21lbnVWaWV3TWl4aW4gcmVxdWlyZXMgYSBWaWV3IHdpdGggYSBgbWVudUtleWAgc3RyaW5nIHByb3BlcnR5IHRvIGlkZW50aWZ5IHRoZSBtZW51Jztcblx0fVxuXHRpZiAoICEgdmlldy5tZW51U3RhdHVzICkge1xuXHRcdHZpZXcubWVudVN0YXR1cyA9IG5ldyBCYWNrYm9uZS5Nb2RlbCggeyBpc09wZW46IGZhbHNlIH0gKTtcblx0fVxuXG5cdHZpZXcubWF5YmVPcGVuTWVudSA9IG1heWJlT3Blbk1lbnU7XG5cdHZpZXcub3Blbk1lbnUgPSBvcGVuTWVudTtcblx0dmlldy5jbG9zZU1lbnUgPSBjbG9zZU1lbnU7XG5cblx0dmlldy5saXN0ZW5UbyggRW1pdHRlciwgJ29wZW4tbWVudScsIHZpZXcubWF5YmVPcGVuTWVudSApO1xuXHR2aWV3Lmxpc3RlblRvKCBFbWl0dGVyLCAnY2xvc2Utb3Blbi1tZW51cycsIHZpZXcuY2xvc2VNZW51ICk7XG5cblx0ZGVidWcoICdhZGRlZCBtZW51IGNhcGFiaWxpdHkgdG8gdGhlIFZpZXcnLCB2aWV3Lm1lbnVLZXkgKTtcblxuXHRyZXR1cm4gdmlldy5tZW51U3RhdHVzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZW51Vmlld01peGluO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdF8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApLFxuXHR0cmFuc2xhdGUgPSByZXF1aXJlKCAnLi4vaGVscGVycy90cmFuc2xhdGUnICk7XG5cbnZhciBzaXplT3B0aW9ucyA9IFtcblx0eyBpZDogLTEwLCBuYW1lOiB0cmFuc2xhdGUoICdUaW55JyApIH0sXG5cdHsgaWQ6IC01LCAgbmFtZTogdHJhbnNsYXRlKCAnU21hbGwnICkgfSxcblx0eyBpZDogMCwgICBuYW1lOiB0cmFuc2xhdGUoICdOb3JtYWwnICkgfSxcblx0eyBpZDogNSwgICBuYW1lOiB0cmFuc2xhdGUoICdMYXJnZScgKSB9LFxuXHR7IGlkOiAxMCwgIG5hbWU6IHRyYW5zbGF0ZSggJ0h1Z2UnICkgfVxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoIHtcblx0Z2V0Rm9udFZhcmlhbnRPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuZ2V0KCAnZnZkcycgKSApIHtcblx0XHRcdHJldHVybiB0aGlzLmdldCggJ2Z2ZHMnICk7XG5cdFx0fVxuXHRcdHJldHVybiBbXTtcblx0fSxcblxuXHRnZXRGb250U2l6ZU9wdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzaXplT3B0aW9ucztcblx0fSxcblxuXHRnZXRGb250U2l6ZU5hbWVGcm9tSWQ6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgb3B0aW9uID0gXy5maW5kV2hlcmUoIHNpemVPcHRpb25zLCB7IGlkOiBpZCB9ICk7XG5cdFx0aWYgKCBvcHRpb24gKSB7XG5cdFx0XHRyZXR1cm4gb3B0aW9uLm5hbWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufSApO1xuIiwidmFyIFNlbGVjdGVkRm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvc2VsZWN0ZWQtZm9udCcgKSxcblx0dHJhbnNsYXRlID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdHJhbnNsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGVkRm9udC5leHRlbmQoIHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZXQoIHsgaWQ6ICcnLCBkaXNwbGF5TmFtZTogdHJhbnNsYXRlKCAnRGVmYXVsdCBUaGVtZSBGb250JyApLCBwcm92aWRlcjogJycgfSApO1xuXHR9XG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0dHJhbnNsYXRlID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdHJhbnNsYXRlJyApLFxuXHRhdmFpbGFibGVUeXBlcyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2F2YWlsYWJsZS10eXBlcycgKSxcblx0XyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFja19mb250czpzZWxlY3RlZC1mb250JyApO1xuXG4vLyBBIE1vZGVsIGZvciBhIGN1cnJlbnRseSBzZXQgZm9udCBzZXR0aW5nIGZvciB0aGlzIHRoZW1lXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCgge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm1heWJlU2V0Q3VycmVudEZ2ZCgpO1xuXHR9LFxuXHRkZWZhdWx0czoge1xuXHRcdCdkaXNwbGF5TmFtZSc6IHRyYW5zbGF0ZSggJ0RlZmF1bHQgVGhlbWUgRm9udCcgKVxuXHR9LFxuXHRzZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdEJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5zZXQuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdHRoaXMubWF5YmVTZXRDdXJyZW50RnZkKCk7XG5cdH0sXG5cdG1heWJlU2V0Q3VycmVudEZ2ZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHR5cGU7XG5cdFx0aWYgKCB0aGlzLmdldCggJ2N1cnJlbnRGdmQnICkgKSB7XG5cdFx0XHRkZWJ1ZyggJ0ZvbnQgYWxyZWFkeSBoYXMgYW4gZnZkJywgdGhpcy5nZXQoICdjdXJyZW50RnZkJyApICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmICggISB0aGlzLmdldCggJ2lkJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0eXBlID0gXy5maW5kV2hlcmUoIGF2YWlsYWJsZVR5cGVzLCB7IGlkOiB0aGlzLmdldCggJ3R5cGUnICkgfSApO1xuXHRcdGlmICggISB0eXBlIHx8ICEgdHlwZS5mdmRBZGp1c3QgfHwgISB0aGlzLmdldCggJ2Z2ZHMnICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuc2V0KCAnY3VycmVudEZ2ZCcsIHRoaXMucGlja0Z2ZCgpICk7XG5cdFx0ZGVidWcoICdGdmQgbm93IHNldCB0bzogJywgdGhpcy5nZXQoICdjdXJyZW50RnZkJyApICk7XG5cdH0sXG5cdHBpY2tGdmQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIGFsZ29yaXRobSBoZXJlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9DU1MvZm9udC13ZWlnaHQjRmFsbGJhY2tcblx0XHQvLyB3ZSBhbHdheXMgZ28gZm9yIDQwMCB3ZWlnaHQgZmlyc3QuXG5cdFx0dmFyIHZhcmlhdGlvbnMgPSB0aGlzLmdldCggJ2Z2ZHMnICk7XG5cdFx0Ly8gZmlyc3QgdHJ5IG40XG5cdFx0dmFyIGkgPSA0O1xuXHRcdGlmICggdGhpcy5oYXNWYXJpYXRpb24oICduJyArIGksIHZhcmlhdGlvbnMgKSApIHtcblx0XHRcdHJldHVybiAnbicgKyBpO1xuXHRcdH1cblx0XHQvLyBuZXh0IHdlIHRyeSBuNVxuXHRcdGkgPSA1O1xuXHRcdGlmICggdGhpcy5oYXNWYXJpYXRpb24oICduJyArIGksIHZhcmlhdGlvbnMgKSApIHtcblx0XHRcdHJldHVybiAnbicgKyBpO1xuXHRcdH1cblx0XHQvLyBub3cgd2UgZ28gbGlnaHRlciwgdG8gMy0xXG5cdFx0Zm9yICggaSA9IDM7IGkgPj0gMTsgaS0tICkge1xuXHRcdFx0aWYgKCB0aGlzLmhhc1ZhcmlhdGlvbiggJ24nICsgaSwgdmFyaWF0aW9ucyApICkge1xuXHRcdFx0XHRyZXR1cm4gJ24nICsgaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gbm93IGRhcmtlciwgNi05XG5cdFx0Zm9yICggaSA9IDY7IGkgPD0gOTsgaSsrICkge1xuXHRcdFx0aWYgKCB0aGlzLmhhc1ZhcmlhdGlvbiggJ24nICsgaSwgdmFyaWF0aW9ucyApICkge1xuXHRcdFx0XHRyZXR1cm4gJ24nICsgaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gSSBndWVzcyBqdXN0IHJldHVybiBuNCBhbnl3YXlcblx0XHRyZXR1cm4gJ240Jztcblx0fSxcblx0aGFzVmFyaWF0aW9uOiBmdW5jdGlvbiggZnZkLCBmdmRzICkge1xuXHRcdHJldHVybiBfLmNvbnRhaW5zKCBmdmRzLCBmdmQgKTtcblx0fVxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpzZWxlY3RlZC1mb250cycgKSxcblx0dHJhbnNsYXRlID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdHJhbnNsYXRlJyApO1xuXG52YXIgU2VsZWN0ZWRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9zZWxlY3RlZC1mb250JyApO1xuXG4vLyBBIENvbGxlY3Rpb24gb2YgdGhlIGN1cnJlbnQgZm9udCBzZXR0aW5ncyBmb3IgdGhpcyB0aGVtZVxuLy8gV2UgdXNlIGEgTW9kZWwgaW5zdGVhZCBvZiBhbiBhY3R1YWwgQ29sbGVjdGlvbiBiZWNhdXNlIHdlIGNhbid0IG90aGVyd2lzZVxuLy8gaG9sZCB0d28gY29waWVzIG9mIHRoZSBzYW1lIGZvbnQgKHNhbWUgaWQpLlxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoIHtcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRpZiAoICEgZGF0YSApIHtcblx0XHRcdGRhdGEgPSBbXTtcblx0XHR9XG5cdFx0dmFyIGZvbnRzID0gZGF0YS5tYXAoIGZ1bmN0aW9uKCBmb250ICkge1xuXHRcdFx0cmV0dXJuIG5ldyBTZWxlY3RlZEZvbnQoIGZvbnQgKTtcblx0XHR9ICk7XG5cdFx0dGhpcy5zZXQoICdmb250cycsIGZvbnRzICk7XG5cdH0sXG5cblx0Z2V0Rm9udEJ5VHlwZTogZnVuY3Rpb24oIHR5cGUgKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5nZXQoICdmb250cycgKS5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2aW91cywgbW9kICkge1xuXHRcdFx0aWYgKCBtb2QuZ2V0KCAndHlwZScgKSA9PT0gdHlwZSApIHtcblx0XHRcdFx0cmV0dXJuIG1vZDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwcmV2aW91cztcblx0XHR9LCBudWxsICk7XG5cdFx0aWYgKCAhIG1vZGVsICkge1xuXHRcdFx0bW9kZWwgPSBuZXcgU2VsZWN0ZWRGb250KCB7IHR5cGU6IHR5cGUsIGRpc3BsYXlOYW1lOiB0cmFuc2xhdGUoICdEZWZhdWx0IFRoZW1lIEZvbnQnICkgfSApO1xuXHRcdFx0dGhpcy5nZXQoICdmb250cycgKS5wdXNoKCBtb2RlbCApO1xuXHRcdH1cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH0sXG5cblx0c2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0KCAnZm9udHMnICkubGVuZ3RoO1xuXHR9LFxuXG5cdHNldFNlbGVjdGVkRm9udDogZnVuY3Rpb24oIGZvbnQgKSB7XG5cdFx0ZGVidWcoICdzZXR0aW5nIHNlbGVjdGVkIGZvbnQgdG8nLCBmb250ICk7XG5cdFx0aWYgKCAhIGZvbnQudHlwZSApIHtcblx0XHRcdGRlYnVnKCAnQ2Fubm90IHNldCBzZWxlY3RlZCBmb250IGJlY2F1c2UgaXQgaGFzIG5vIHR5cGUnLCBmb250ICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHZhciBtb2RlbCA9IHRoaXMuZ2V0Rm9udEJ5VHlwZSggZm9udC50eXBlICk7XG5cdFx0bW9kZWwuY2xlYXIoIHsgc2lsZW50OiB0cnVlIH0gKTtcblx0XHRpZiAoIG1vZGVsICkge1xuXHRcdFx0bW9kZWwuc2V0KCBmb250ICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZ2V0KCAnZm9udHMnICkucHVzaCggbmV3IFNlbGVjdGVkRm9udCggZm9udCApICk7XG5cdFx0fVxuXHRcdHRoaXMudHJpZ2dlciggJ2NoYW5nZScgKTtcblx0fSxcblxuXHR0b0pTT046IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHNraXAgYW55IGZvbnRzIHNldCB0byB0aGUgZGVmYXVsdFxuXHRcdHJldHVybiB0aGlzLmdldCggJ2ZvbnRzJyApLnJlZHVjZSggZnVuY3Rpb24oIHByZXZpb3VzLCBtb2RlbCApIHtcblx0XHRcdGlmICggbW9kZWwuZ2V0KCAnaWQnICkgKSB7XG5cdFx0XHRcdHByZXZpb3VzLnB1c2goIG1vZGVsLnRvSlNPTigpICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcHJldmlvdXM7XG5cdFx0fSwgW10gKTtcblx0fVxufSApO1xuXG4iLCJ2YXIgYXBpID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXBpJyApLFxuXHRib290c3RyYXAgPSByZXF1aXJlKCAnLi4vaGVscGVycy9ib290c3RyYXAnICk7XG5cbnZhciBXZWJGb250ID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvd2ViZm9udCcgKTtcblxudmFyIGxvYWRlZEZvbnRJZHMgPSBbXTtcblxuZnVuY3Rpb24gYWRkRm9udFRvQ29udHJvbHMoIGZvbnQsIHRleHQgKSB7XG5cdGlmICggfiBsb2FkZWRGb250SWRzLmluZGV4T2YoIGZvbnQuaWQgKSApIHtcblx0XHRyZXR1cm47XG5cdH1cblx0bG9hZGVkRm9udElkcy5wdXNoKCBmb250LmlkICk7XG5cdFdlYkZvbnQubG9hZCh7XG5cdFx0Z29vZ2xlOiB7IGZhbWlsaWVzOiBbIGZvbnQuaWQgXSwgdGV4dDogdGV4dCB9LFxuXHRcdGNsYXNzZXM6IGZhbHNlLFxuXHRcdGV2ZW50czogZmFsc2Vcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGFkZEZvbnRUb1ByZXZpZXcoIGZvbnQgKSB7XG5cdGlmICggfiBsb2FkZWRGb250SWRzLmluZGV4T2YoIGZvbnQuaWQgKSApIHtcblx0XHRyZXR1cm47XG5cdH1cblx0bG9hZGVkRm9udElkcy5wdXNoKCBmb250LmlkICk7XG5cdHZhciBmYW1pbHlTdHJpbmcgPSBmb250LmlkICsgJzoxMDAsMjAwLDMwMCw0MDAsNTAwLDYwMCw3MDAsODAwLDkwMCwxMDBpdGFsaWMsMjAwaXRhbGljLDMwMGl0YWxpYyw0MDBpdGFsaWMsNTAwaXRhbGljLDYwMGl0YWxpYyw3MDBpdGFsaWMsODAwaXRhbGljLDkwMGl0YWxpYyc7XG5cdGlmICggYm9vdHN0cmFwLnByb3ZpZGVyRGF0YSAmJiBib290c3RyYXAucHJvdmlkZXJEYXRhLmdvb2dsZVN1YnNldFN0cmluZyApIHtcblx0XHR2YXIgc3Vic2V0U3RyaW5nID0gYm9vdHN0cmFwLnByb3ZpZGVyRGF0YS5nb29nbGVTdWJzZXRTdHJpbmc7XG5cdFx0aWYgKCBzdWJzZXRTdHJpbmcgJiYgc3Vic2V0U3RyaW5nLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHRmYW1pbHlTdHJpbmcgKz0gJzonICsgc3Vic2V0U3RyaW5nO1xuXHRcdH1cblx0fVxuXHRXZWJGb250LmxvYWQoIHsgZ29vZ2xlOiB7IGZhbWlsaWVzOiBbIGZhbWlseVN0cmluZyBdIH0gfSApO1xufVxuXG52YXIgR29vZ2xlUHJvdmlkZXJWaWV3ID0gYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXcuZXh0ZW5kKCB7XG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm1vZGVsLmdldCggJ2Rpc3BsYXlOYW1lJyApICk7XG5cblx0XHR0aGlzLiRlbC5jc3MoICdmb250LWZhbWlseScsICdcIicgKyB0aGlzLm1vZGVsLmdldCggJ2Nzc05hbWUnICkgKyAnXCInICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250ICYmIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgPT09IHRoaXMubW9kZWwuZ2V0KCAnaWQnICkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0fVxuXHRcdGlmICggIXRoaXMuZGlzYWJsZUZvY3VzICkge1xuXHRcdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0fVxuXHRcdGFkZEZvbnRUb0NvbnRyb2xzKCB0aGlzLm1vZGVsLnRvSlNPTigpLCB0aGlzLm1vZGVsLmdldCggJ2lkJyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0gKTtcblxuR29vZ2xlUHJvdmlkZXJWaWV3LmFkZEZvbnRUb1ByZXZpZXcgPSBhZGRGb250VG9QcmV2aWV3O1xuXG5hcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MuZ29vZ2xlID0gR29vZ2xlUHJvdmlkZXJWaWV3O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdvb2dsZVByb3ZpZGVyVmlldztcbiIsInZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtc2l6ZSBmb250LXByb3BlcnR5LWNvbnRyb2wtY3VycmVudCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gb3B0cy5jdXJyZW50Rm9udFNpemU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLmN1cnJlbnRGb250U2l6ZSApO1xuXHRcdHRoaXMuJGVsLmF0dHIoICd0YWJpbmRleCcsICcwJyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG52YXIgZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZnZkLXRvLXJlYWRhYmxlJyApLmdldEZvbnRWYXJpYW50TmFtZUZyb21JZDtcblxudmFyIEN1cnJlbnRGb250VmFyaWFudCA9IERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtdmFyaWFudCBmb250LXByb3BlcnR5LWNvbnRyb2wtY3VycmVudCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdFx0dGhpcy5tdWx0aU9wdGlvbnMgPSBvcHRzLm11bHRpT3B0aW9ucztcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIGdldEZvbnRWYXJpYW50TmFtZUZyb21JZCggdGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgKSApO1xuXHRcdGlmICggdGhpcy5tdWx0aU9wdGlvbnMgPT09IGZhbHNlICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdpbmFjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdpbmFjdGl2ZScgKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEN1cnJlbnRGb250VmFyaWFudDtcbiIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6Q3VycmVudEZvbnRWaWV3JyApO1xuXG52YXIgZ2V0Vmlld0ZvclByb3ZpZGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJvdmlkZXItdmlld3MnICkuZ2V0Vmlld0ZvclByb3ZpZGVyLFxuXHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG52YXIgQ3VycmVudEZvbnRWaWV3ID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udCcsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J21vdXNlZW50ZXInOiAnZGlzcGF0Y2hIb3ZlcicsXG5cdFx0J21vdXNlbGVhdmUnOiAnZGlzcGF0Y2hIb3ZlcicsXG5cdFx0J2NsaWNrJzogJ3RvZ2dsZURyb3Bkb3duJyxcblx0XHQna2V5ZG93bic6ICdjaGVja0tleWJvYXJkVG9nZ2xlJyxcblx0fSxcblxuXHRkaXNwYXRjaEhvdmVyOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCAhICggZXZlbnQudHlwZSA9PT0gJ21vdXNlZW50ZXInIHx8IGV2ZW50LnR5cGUgPT09ICdtb3VzZWxlYXZlJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnByb3ZpZGVyVmlldyAmJiB0aGlzLnByb3ZpZGVyVmlld1sgZXZlbnQudHlwZSBdKCBldmVudCApO1xuXHR9LFxuXG5cdGNoZWNrS2V5Ym9hcmRUb2dnbGU6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoIGV2ZW50LmtleSA9PT0gJ0VudGVyJyApIHtcblx0XHRcdHRoaXMudG9nZ2xlRHJvcGRvd24oKTtcblx0XHR9XG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMuYWN0aXZlID0gb3B0cy5hY3RpdmU7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tZW51U3RhdHVzLCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5hY3RpdmUgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0fVxuXHRcdGlmICggdGhpcy5tZW51U3RhdHVzLmdldCggJ2lzT3BlbicgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LS1vcGVuJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udC0tb3BlbicgKTtcblx0XHR9XG5cdFx0ZGVidWcoICdyZW5kZXJpbmcgY3VycmVudEZvbnQ6JywgdGhpcy5jdXJyZW50Rm9udC50b0pTT04oKSApO1xuXHRcdGlmICggISB0aGlzLmN1cnJlbnRGb250LmdldCggJ2lkJyApICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtLWRlZmF1bHQnICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LS1kZWZhdWx0JyApO1xuXHRcdH1cblx0XHRpZiAoIHRoaXMucHJvdmlkZXJWaWV3ICkge1xuXHRcdFx0dGhpcy5wcm92aWRlclZpZXcucmVtb3ZlKCk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLnRleHQoICcnICk7XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0dmFyIFByb3ZpZGVyVmlldyA9IGdldFZpZXdGb3JQcm92aWRlciggdGhpcy5jdXJyZW50Rm9udC5nZXQoICdwcm92aWRlcicgKSApO1xuXHRcdGlmICggISBQcm92aWRlclZpZXcgKSB7XG5cdFx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBjdXJyZW50Rm9udCB3aXRoIG5vIHByb3ZpZGVyVmlldyBmb3InLCB0aGlzLmN1cnJlbnRGb250LnRvSlNPTigpICk7XG5cdFx0XHRpZiAoICEgdGhpcy5jdXJyZW50Rm9udC5nZXQoICdkaXNwbGF5TmFtZScgKSApIHtcblx0XHRcdFx0ZGVidWcoICdlcnJvciByZW5kZXJpbmcgY3VycmVudEZvbnQgYmVjYXVzZSBpdCBoYXMgbm8gZGlzcGxheU5hbWUhJywgdGhpcy5jdXJyZW50Rm9udC50b0pTT04oKSApO1xuXHRcdFx0XHR0aGlzLiRlbC5odG1sKCAnVW5rbm93bicgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnZGlzcGxheU5hbWUnICkgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBjdXJyZW50Rm9udCBwcm92aWRlclZpZXcgZm9yJywgdGhpcy5jdXJyZW50Rm9udC50b0pTT04oKSApO1xuXHRcdHRoaXMucHJvdmlkZXJWaWV3ID0gbmV3IFByb3ZpZGVyVmlldygge1xuXHRcdFx0bW9kZWw6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRkaXNhYmxlRm9jdXM6IHRydWVcblx0XHR9ICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCB0aGlzLnByb3ZpZGVyVmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDdXJyZW50Rm9udFZpZXc7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG52YXIgRGVmYXVsdEZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL2RlZmF1bHQtZm9udCcgKTtcblxuLy8gJ3gnIGJ1dHRvbiB0aGF0IHJlc2V0cyBmb250IHRvIGRlZmF1bHRcbnZhciBEZWZhdWx0Rm9udEJ1dHRvbiA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2RlZmF1bHQtYnV0dG9uJyxcblx0dGFnTmFtZTogJ3NwYW4nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdyZXNldFRvRGVmYXVsdCcsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tLZXlib2FyZFJlc2V0J1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHRpZiAoICEgdGhpcy50eXBlICkge1xuXHRcdFx0dGhyb3cgJ0Vycm9yOiBjYW5ub3QgY3JlYXRlIERlZmF1bHRGb250QnV0dG9uIHdpdGhvdXQgYSB0eXBlJztcblx0XHR9XG5cdFx0dGhpcy5tZW51U3RhdHVzID0gb3B0cy5tZW51U3RhdHVzO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubWVudVN0YXR1cywgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udC5pZCAmJiAhIHRoaXMubWVudVN0YXR1cy5nZXQoICdpc09wZW4nICkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2FjdGl2ZS1idXR0b24nICk7XG5cdFx0XHR0aGlzLiRlbC5zaG93KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnYWN0aXZlLWJ1dHRvbicgKTtcblx0XHRcdHRoaXMuJGVsLmhpZGUoKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXR0ciggJ3RhYmluZGV4JywgJzAnICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVzZXRUb0RlZmF1bHQ6IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2NoYW5nZS1mb250JywgeyBmb250OiBuZXcgRGVmYXVsdEZvbnQoKSwgdHlwZTogdGhpcy50eXBlLmlkIH0gKTtcblx0fSxcblxuXHRjaGVja0tleWJvYXJkUmVzZXQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKGV2ZW50LmtleSA9PT0gJ0VudGVyJykge1xuXHRcdFx0dGhpcy5yZXNldFRvRGVmYXVsdCgpO1xuXHRcdH1cblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHRGb250QnV0dG9uO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG52YXIgRHJvcGRvd25DdXJyZW50VGVtcGxhdGUgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAndG9nZ2xlRHJvcGRvd24nLFxuXHRcdCdrZXlkb3duJzogJ2NoZWNrS2V5Ym9hcmRUb2dnbGUnLFxuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLm1lbnUgPSBvcHRzLm1lbnU7XG5cdFx0dGhpcy5tZW51U3RhdHVzID0gb3B0cy5tZW51U3RhdHVzO1xuXHRcdHRoaXMuYWN0aXZlID0gdHJ1ZTtcblx0fSxcblxuXHR0b2dnbGVEcm9wZG93bjogZnVuY3Rpb24oIGUgKSB7XG5cdFx0aWYgKCBlICkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cdFx0aWYgKCAhIHRoaXMuYWN0aXZlICkge1xuXHRcdFx0ZGVidWcoICdtZW51IGlzIGluYWN0aXZlOyBpZ25vcmluZyBjbGljaycsIHRoaXMubWVudSwgdGhpcy50eXBlICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmICggdGhpcy5tZW51U3RhdHVzLmdldCggJ2lzT3BlbicgKSApIHtcblx0XHRcdGRlYnVnKCAnbWVudSBpcyBvcGVuOyBjbG9zaW5nIG1lbnVzJywgdGhpcy5tZW51LCB0aGlzLnR5cGUgKTtcblx0XHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlYnVnKCAnbWVudSBpcyBjbG9zZWQ7IG9wZW5pbmcgbWVudScsIHRoaXMubWVudSwgdGhpcy50eXBlICk7XG5cdFx0XHRFbWl0dGVyLnRyaWdnZXIoICdvcGVuLW1lbnUnLCB7IHR5cGU6IHRoaXMudHlwZSwgbWVudTogdGhpcy5tZW51IH0gKTtcblx0XHR9XG5cdH0sXG5cblx0Y2hlY2tLZXlib2FyZFRvZ2dsZTogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGlmICggZXZlbnQua2V5ID09PSAnRW50ZXInICkge1xuXHRcdFx0dGhpcy4kZWwuY2xpY2soKTtcblx0XHR9XG5cdH0sXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGU7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG4vLyBBbiBpbmRpdmlkdWFsIGZvbnQgaW4gdGhlIGRyb3Bkb3duIGxpc3QsIGV4cG9ydGVkIGFzXG4vLyBgYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXdgLiBFeHRlbmQgdGhpcyBvYmplY3QgZm9yIGVhY2ggcHJvdmlkZXIuIFRoZVxuLy8gZXh0ZW5kZWQgb2JqZWN0cyBuZWVkIHRvIGRlZmluZSBhIGByZW5kZXJgIG1ldGhvZCB0byByZW5kZXIgdGhlaXIgcHJvdmlkZXInc1xuLy8gZm9udCBuYW1lLCBhcyB3ZWxsIGFzIGBhZGRGb250VG9Db250cm9sc2AgYW5kIGBhZGRGb250VG9QcmV2aWV3YCBtZXRob2RzIG9uIHRoZSBvYmplY3QgaXRzZWxmLlxudmFyIFByb3ZpZGVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX29wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ2ZvbnRDaGFuZ2VkJyxcblx0XHQna2V5ZG93bic6ICdjaGVja0tleWJvYXJkU2VsZWN0J1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLmRpc2FibGVGb2N1cyA9IEJvb2xlYW4oIG9wdHMuZGlzYWJsZUZvY3VzICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250ICkge1xuXHRcdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0fVxuXHR9LFxuXG5cdGNoZWNrS2V5Ym9hcmRTZWxlY3Q6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRpZiAoIGV2ZW50LmtleSA9PT0gJ0VudGVyJyApIHtcblx0XHRcdHRoaXMuJGVsLmNsaWNrKCk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIFdhcm5pbmc6IHRoaXMgc2hvdWxkIGJlIG92ZXJyaWRlbiBpbiB0aGUgcHJvdmlkZXJcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm1vZGVsLmdldCggJ2Rpc3BsYXlOYW1lJyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Zm9udENoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udCAmJiB0aGlzLmN1cnJlbnRGb250ICE9PSB0aGlzLm1vZGVsICkge1xuXHRcdFx0RW1pdHRlci50cmlnZ2VyKCAnY2hhbmdlLWZvbnQnLCB7IGZvbnQ6IHRoaXMubW9kZWwsIHR5cGU6IHRoaXMudHlwZS5pZCB9ICk7XG5cdFx0fVxuXHR9XG59ICk7XG5cblByb3ZpZGVyVmlldy5hZGRGb250VG9Db250cm9scyA9IGZ1bmN0aW9uKCkge307XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvdmlkZXJWaWV3O1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBEcm9wZG93blRlbXBsYXRlID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMubWVudSA9IG9wdHMubWVudTtcblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBvcHRzLm1lbnVTdGF0dXM7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tZW51U3RhdHVzLCAnY2hhbmdlJywgdGhpcy51cGRhdGVTdGF0dXMgKTtcblx0fSxcblxuXHR1cGRhdGVTdGF0dXM6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5tZW51U3RhdHVzLmdldCggJ2lzT3BlbicgKSApIHtcblx0XHRcdHRoaXMub3BlbigpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmNsb3NlKCk7XG5cdFx0fVxuXHR9LFxuXG5cdG9wZW46IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnb3BlbicgKTtcblx0XHR0aGlzLmlzT3BlbiA9IHRydWU7XG5cdH0sXG5cblx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnb3BlbicgKTtcblx0XHR0aGlzLmlzT3BlbiA9IGZhbHNlO1xuXHR9XG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25UZW1wbGF0ZTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRtZW51Vmlld01peGluID0gcmVxdWlyZSggJy4uL21peGlucy9tZW51LXZpZXctbWl4aW4nICk7XG5cbnZhciBGb250RHJvcGRvd24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1kcm9wZG93bicgKSxcblx0Q3VycmVudEZvbnRWaWV3ID0gcmVxdWlyZSggJy4uL3ZpZXdzL2N1cnJlbnQtZm9udCcgKSxcblx0RGVmYXVsdEZvbnRCdXR0b24gPSByZXF1aXJlKCAnLi4vdmlld3MvZGVmYXVsdC1mb250LWJ1dHRvbicgKTtcblxuLy8gQ29udGFpbmVyIGZvciB0aGUgbGlzdCBvZiBhdmFpbGFibGUgZm9udHMgYW5kICd4JyBidXR0b25cbnZhciBGb250Q29udHJvbFZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19tZW51LWNvbnRhaW5lcicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMubWVudSA9ICdmb250RmFtaWx5Jztcblx0XHR0aGlzLm1lbnVLZXkgPSB0aGlzLnR5cGUuaWQgKyAnOicgKyB0aGlzLm1lbnU7XG5cdFx0dGhpcy5tZW51U3RhdHVzID0gbWVudVZpZXdNaXhpbiggdGhpcyApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGN1cnJlbnRGb250VmlldyA9IG5ldyBDdXJyZW50Rm9udFZpZXcoIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsLFxuXHRcdFx0YWN0aXZlOiAoIHRoaXMuZm9udERhdGEubGVuZ3RoID4gMCApXG5cdFx0fSApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggY3VycmVudEZvbnRWaWV3LnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udERyb3Bkb3duKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRtZW51U3RhdHVzOiB0aGlzLm1lbnVTdGF0dXMsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbCxcblx0XHRcdGN1cnJlbnRGb250VmlldzogY3VycmVudEZvbnRWaWV3LFxuXHRcdFx0Zm9udERhdGE6IHRoaXMuZm9udERhdGFcblx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBEZWZhdWx0Rm9udEJ1dHRvbigge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWxcblx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbnRDb250cm9sVmlldztcbiIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6Rm9udERyb3Bkb3duJyApLFxuXHRFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxudmFyIGdldFZpZXdGb3JQcm92aWRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3Byb3ZpZGVyLXZpZXdzJyApLmdldFZpZXdGb3JQcm92aWRlcixcblx0RHJvcGRvd25UZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZScgKSxcblx0JCA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLiQ7XG5cbi8vIERyb3Bkb3duIG9mIGF2YWlsYWJsZSBmb250c1xudmFyIEZvbnREcm9wZG93biA9IERyb3Bkb3duVGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX21lbnUnLFxuXHRpZDogJ2ZvbnQtc2VsZWN0JyxcblxuXHRldmVudHM6IHtcblx0XHQnbW91c2VlbnRlciA+IC5qZXRwYWNrLWZvbnRzX19vcHRpb24nOiAnZGlzcGF0Y2hIb3ZlcicsXG5cdFx0J21vdXNlbGVhdmUgPiAuamV0cGFjay1mb250c19fb3B0aW9uJzogJ2Rpc3BhdGNoSG92ZXInLFxuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duVGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuYXZhaWxhYmxlRm9udHMgPSBbXTtcblx0XHR0aGlzLnN1YlZpZXdzID0ge307XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZpZXcgPSBvcHRzLmN1cnJlbnRGb250Vmlldztcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnbG9hZC1tZW51LWZvbnRzJywgdGhpcy5sb2FkRm9udHMgKTtcblx0fSxcblxuXHRsb2FkRm9udHM6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5hdmFpbGFibGVGb250cy5sZW5ndGggPiAwICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLmF2YWlsYWJsZUZvbnRzID0gdGhpcy5mb250RGF0YTtcblx0XHR0aGlzLnJlbmRlcigpO1xuXHR9LFxuXG5cdGRpc3BhdGNoSG92ZXI6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHR2YXIgZWw7XG5cdFx0aWYgKCAhICggZXZlbnQudHlwZSA9PT0gJ21vdXNlZW50ZXInIHx8IGV2ZW50LnR5cGUgPT09ICdtb3VzZWxlYXZlJyApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRlbCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XG5cdFx0aWYgKCBlbC5jaWQgJiYgdGhpcy5zdWJWaWV3c1sgZWwuY2lkIF0gKSB7XG5cdFx0XHR0aGlzLnN1YlZpZXdzWyBlbC5jaWQgXVsgZXZlbnQudHlwZSBdKCBldmVudCApO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdE9iamVjdC5rZXlzKCB0aGlzLnN1YlZpZXdzICkuZm9yRWFjaCggZnVuY3Rpb24oIGNpZCApIHtcblx0XHRcdHRoaXMuc3ViVmlld3NbIGNpZCBdLnJlbW92ZSgpO1xuXHRcdH0uYmluZCggdGhpcyApICk7XG5cdFx0ZGVidWcoICdyZW5kZXJpbmcnLCB0aGlzLmF2YWlsYWJsZUZvbnRzLmxlbmd0aCwgJ2F2YWlsYWJsZUZvbnRzIGZvcicsIHRoaXMudHlwZSApO1xuXHRcdHRoaXMuYXZhaWxhYmxlRm9udHMuZm9yRWFjaCggZnVuY3Rpb24oIGZvbnQgKSB7XG5cdFx0XHR2YXIgUHJvdmlkZXJWaWV3ID0gZ2V0Vmlld0ZvclByb3ZpZGVyKCBmb250LmdldCggJ3Byb3ZpZGVyJyApICk7XG5cdFx0XHRpZiAoICEgUHJvdmlkZXJWaWV3ICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBwcm92aWRlclZpZXcgaW4nLCB0aGlzLnR5cGUsICdmb250IGxpc3QgZm9yJywgZm9udC50b0pTT04oKSApO1xuXHRcdFx0dmFyIHZpZXcgPSBuZXcgUHJvdmlkZXJWaWV3KCB7XG5cdFx0XHRcdG1vZGVsOiBmb250LFxuXHRcdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRcdGN1cnJlbnRGb250OiB0aGlzLmN1cnJlbnRGb250XG5cdFx0XHR9ICkucmVuZGVyKCk7XG5cblx0XHRcdHZpZXcuZWwuY2lkID0gdmlldy5jaWQ7XG5cdFx0XHR0aGlzLnN1YlZpZXdzWyB2aWV3LmNpZCBdID0gdmlldztcblx0XHRcdHRoaXMuJGVsLmFwcGVuZCggdmlldy5lbCApO1xuXHRcdH0sIHRoaXMgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRvcGVuOiBmdW5jdGlvbigpIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5vcGVuLmNhbGwoIHRoaXMgKTtcblx0XHR0aGlzLmFkanVzdFBvc2l0aW9uKCk7XG5cdH0sXG5cblx0YWRqdXN0UG9zaXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBvZmZzZXQgPSB0aGlzLmN1cnJlbnRGb250Vmlldy4kZWwub2Zmc2V0KCk7XG5cdFx0dmFyIG15SGVpZ2h0ID0gdGhpcy5jdXJyZW50Rm9udFZpZXcuJGVsLmhlaWdodCgpO1xuXHRcdHZhciBhdmFpbGFibGVIZWlnaHQgPSAkKCAnLndwLWZ1bGwtb3ZlcmxheS1zaWRlYmFyLWNvbnRlbnQnICkuaGVpZ2h0KCk7XG5cdFx0dmFyIG1pZGRsZSA9IGF2YWlsYWJsZUhlaWdodCAvIDI7XG5cblx0XHRkZWJ1ZyggJ2FkanVzdGluZyBwb3NpdGlvbiBvZiBtZW51OyBvZmZzZXQudG9wJywgb2Zmc2V0LnRvcCwgJ21pZGRsZScsIG1pZGRsZSwgJ2NhbGMnLCBvZmZzZXQudG9wIC0gKCBteUhlaWdodCAvIDIgKSApO1xuXHRcdGlmICggb2Zmc2V0LnRvcCAtICggbXlIZWlnaHQgLyAyICkgPj0gbWlkZGxlICkge1xuXHRcdFx0ZGVidWcoICdtZW51OiBjbG9zZXIgdG8gYm90dG9tJyApO1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdvcGVuLWRvd24nICkuY3NzKCB7XG5cdFx0XHRcdGhlaWdodDogb2Zmc2V0LnRvcCAtIG15SGVpZ2h0IC0gMTBcblx0XHRcdH0gKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVidWcoICdtZW51OiBjbG9zZXIgdG8gdG9wJyApO1xuXHRcdFx0ZGVidWcoICdvZmZzZXQudG9wJywgb2Zmc2V0LnRvcCwgJ2F2YWlsYWJsZUhlaWdodCcsIGF2YWlsYWJsZUhlaWdodCwgJ215SGVpZ2h0JywgbXlIZWlnaHQgKTtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnb3Blbi1kb3duJyApLmNzcygge1xuXHRcdFx0XHRoZWlnaHQ6IGF2YWlsYWJsZUhlaWdodCAtIG9mZnNldC50b3AgLSAxMFxuXHRcdFx0fSApO1xuXHRcdH1cblx0fVxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbnREcm9wZG93bjtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRtZW51Vmlld01peGluID0gcmVxdWlyZSggJy4uL21peGlucy9tZW51LXZpZXctbWl4aW4nICk7XG5cbnZhciBGb250U2l6ZURyb3Bkb3duID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtc2l6ZS1kcm9wZG93bicgKSxcbkN1cnJlbnRGb250U2l6ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9jdXJyZW50LWZvbnQtc2l6ZScgKSxcbnRyYW5zbGF0ZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3RyYW5zbGF0ZScgKTtcblxudmFyIEZvbnRTaXplQ29udHJvbCA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtc2l6ZS1jb250cm9sIGZvbnQtcHJvcGVydHktY29udHJvbCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5tZW51ID0gJ2ZvbnRTaXplJztcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0dGhpcy5tZW51S2V5ID0gdGhpcy50eXBlLmlkICsgJzonICsgdGhpcy5tZW51O1xuXHRcdHRoaXMubWVudVN0YXR1cyA9IG1lbnVWaWV3TWl4aW4oIHRoaXMgKTtcblx0fSxcblxuXHRnZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmZvbnREYXRhLmZpbmRXaGVyZSggeyBpZDogdGhpcy5jdXJyZW50Rm9udC5nZXQoICdpZCcgKSB9ICk7XG5cdFx0aWYgKCAhc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHR9LFxuXG5cdGdldEN1cnJlbnRGb250U2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCk7XG5cdFx0aWYgKCBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHR2YXIgc2l6ZSA9IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnc2l6ZScgKTtcblx0XHRcdGlmICggc2l6ZSAmJiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFNpemVOYW1lRnJvbUlkKCBzaXplICkgKSB7XG5cdFx0XHRcdHJldHVybiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFNpemVOYW1lRnJvbUlkKCBzaXplICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJhbnNsYXRlKCAnTm9ybWFsIFNpemUnICk7XG5cdFx0fVxuXHR9LFxuXG5cdGlzRGVmYXVsdEZvbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoICEgKCB0aGlzLmN1cnJlbnRGb250LmhhcyggJ2lkJyApICYmIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkubGVuZ3RoID4gMCApICk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdGlmICggdGhpcy5pc0RlZmF1bHRGb250KCkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2pldHBhY2stZm9udHNfX2ZvbnQtcHJvcGVydHktY29udHJvbC0taW5hY3RpdmUnICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnamV0cGFjay1mb250c19fZm9udC1wcm9wZXJ0eS1jb250cm9sLS1pbmFjdGl2ZScgKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgQ3VycmVudEZvbnRTaXplKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRtZW51U3RhdHVzOiB0aGlzLm1lbnVTdGF0dXMsXG5cdFx0XHRjdXJyZW50Rm9udFNpemU6IHRoaXMuZ2V0Q3VycmVudEZvbnRTaXplKClcblx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250U2l6ZURyb3Bkb3duKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRtZW51U3RhdHVzOiB0aGlzLm1lbnVTdGF0dXMsXG5cdFx0XHRzZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCksXG5cdFx0XHRjdXJyZW50Rm9udFNpemU6IHRoaXMuZ2V0Q3VycmVudEZvbnRTaXplKClcblx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9udFNpemVDb250cm9sO1xuIiwidmFyIEZvbnRTaXplT3B0aW9uID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtc2l6ZS1vcHRpb24nICksXG5Ecm9wZG93blRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlJyApO1xuXG52YXIgRm9udFNpemVEcm9wZG93biA9IERyb3Bkb3duVGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtc2l6ZS1kcm9wZG93biBmb250LXByb3BlcnR5LWNvbnRyb2wtZHJvcGRvd24nLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duVGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gb3B0cy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQ7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFNpemUgPSBvcHRzLmN1cnJlbnRGb250U2l6ZTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0aWYgKCB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHZhciBzaXplT3B0aW9ucyA9IHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRTaXplT3B0aW9ucygpO1xuXHRcdFx0c2l6ZU9wdGlvbnMuZm9yRWFjaCggZnVuY3Rpb24oIG9wdGlvbiApIHtcblx0XHRcdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFNpemVPcHRpb24oIHtcblx0XHRcdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRcdFx0aWQ6IG9wdGlvbi5pZCxcblx0XHRcdFx0XHRuYW1lOiBvcHRpb24ubmFtZSxcblx0XHRcdFx0XHRjdXJyZW50Rm9udFNpemU6IHRoaXMuY3VycmVudEZvbnRTaXplXG5cdFx0XHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdFx0fS5iaW5kKCB0aGlzICkgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbnRTaXplRHJvcGRvd247XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtc2l6ZS1vcHRpb24gamV0cGFjay1mb250c19fZm9udC1wcm9wZXJ0eS1vcHRpb24nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdzZXRTaXplT3B0aW9uJyxcblx0XHQna2V5ZG93bic6ICdjaGVja0tleWJvYXJkU2VsZWN0J1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmlkID0gb3B0cy5pZDtcblx0XHR0aGlzLm5hbWUgPSBvcHRzLm5hbWU7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFNpemUgPSBvcHRzLmN1cnJlbnRGb250U2l6ZTtcblx0fSxcblxuXHRjaGVja0tleWJvYXJkU2VsZWN0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC5rZXkgPT09ICdFbnRlcicgKSB7XG5cdFx0XHR0aGlzLiRlbC5jbGljaygpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubmFtZSApO1xuXHRcdHRoaXMuJGVsLmF0dHIoICdkYXRhLW5hbWUnLCB0aGlzLm5hbWUgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRTaXplID09PSB0aGlzLm5hbWUgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2N1cnJlbnQnICk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLmF0dHIoICd0YWJpbmRleCcsICcwJyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHNldFNpemVPcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ3NldC1zaXplJywgeyBzaXplOiB0aGlzLmlkLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6Rm9udFR5cGVWaWV3JyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBGb250Q29udHJvbFZpZXcgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1jb250cm9sJyApLFxuXHRGb250VmFyaWFudENvbnRyb2wgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC12YXJpYW50LWNvbnRyb2wnICksXG5cdEZvbnRTaXplQ29udHJvbCA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtY29udHJvbCcgKTtcblxuLy8gQSBmb250IGNvbnRyb2wgVmlldyBmb3IgYSBwYXJ0aWN1bGFyIHNldHRpbmcgdHlwZVxudmFyIEZvbnRUeXBlVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX3R5cGUnLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdjbG9zZU1lbnVzJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggJzxkaXYgY2xhc3M9XCJqZXRwYWNrLWZvbnRzX190eXBlXCIgZGF0YS1mb250LXR5cGU9XCInICsgdGhpcy50eXBlLmlkICsgJ1wiPjxoMyBjbGFzcz1cImpldHBhY2stZm9udHNfX3R5cGUtaGVhZGVyXCI+JyArIHRoaXMudHlwZS5uYW1lICsgJzwvaDM+PC9kaXY+JyApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRDb250cm9sVmlldygge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bW9kZWw6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHZhciBzdWJNZW51c0NvbnRhaW5lciA9IEJhY2tib25lLiQoICc8ZGl2IGNsYXNzPVwiamV0cGFjay1mb250c19fdHlwZS1vcHRpb25zXCI+PC9kaXY+JyApO1xuXHRcdHN1Yk1lbnVzQ29udGFpbmVyLmFwcGVuZCggbmV3IEZvbnRWYXJpYW50Q29udHJvbCgge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHN1Yk1lbnVzQ29udGFpbmVyLmFwcGVuZCggbmV3IEZvbnRTaXplQ29udHJvbCgge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggc3ViTWVudXNDb250YWluZXIgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRjbG9zZU1lbnVzOiBmdW5jdGlvbigpIHtcblx0XHRkZWJ1ZyggJ3R5cGUgY2xpY2tlZDsgY2xvc2luZyBtZW51cycsIHRoaXMudHlwZSApO1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH1cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb250VHlwZVZpZXc7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0bWVudVZpZXdNaXhpbiA9IHJlcXVpcmUoICcuLi9taXhpbnMvbWVudS12aWV3LW1peGluJyApO1xuXG52YXIgRm9udFZhcmlhbnREcm9wZG93biA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXZhcmlhbnQtZHJvcGRvd24nICksXG5DdXJyZW50Rm9udFZhcmlhbnQgPSByZXF1aXJlKCAnLi4vdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQnICk7XG5cbnZhciBGb250VmFyaWFudENvbnRyb2wgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXZhcmlhbnQtY29udHJvbCBmb250LXByb3BlcnR5LWNvbnRyb2wnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMubWVudSA9ICdmb250VmFyaWFudCc7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdHRoaXMubWVudUtleSA9IHRoaXMudHlwZS5pZCArICc6JyArIHRoaXMubWVudTtcblx0XHR0aGlzLm1lbnVTdGF0dXMgPSBtZW51Vmlld01peGluKCB0aGlzICk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRBdmFpbGFibGVGb250OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5mb250RGF0YS5maW5kV2hlcmUoIHsgaWQ6IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnaWQnICkgfSApO1xuXHRcdGlmICggIXNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0fSxcblxuXHRnZXRDdXJyZW50Rm9udFZhcmlhbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpO1xuXHRcdGlmICggc2VsZWN0ZWRBdmFpbGFibGVGb250ICYmIHRoaXMudHlwZS5mdmRBZGp1c3QgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5jdXJyZW50Rm9udC5nZXQoICdjdXJyZW50RnZkJyApO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpO1xuXHRcdHZhciBtdWx0aU9wdGlvbnM7XG5cdFx0aWYgKCBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgJiYgc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRWYXJpYW50T3B0aW9ucygpLmxlbmd0aCA+IDEgKSB7XG5cdFx0XHRtdWx0aU9wdGlvbnMgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtdWx0aU9wdGlvbnMgPSBmYWxzZTtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250VmlldyApIHtcblx0XHRcdHRoaXMuY3VycmVudEZvbnRWaWV3LnJlbW92ZSgpO1xuXHRcdH1cblx0XHRpZiAoIHRoaXMuZHJvcERvd25WaWV3ICkge1xuXHRcdFx0dGhpcy5kcm9wRG93blZpZXcucmVtb3ZlKCk7XG5cdFx0fVxuXHRcdGlmICggbXVsdGlPcHRpb25zICYmIHRoaXMudHlwZS5mdmRBZGp1c3QgKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRGb250VmlldyA9IG5ldyBDdXJyZW50Rm9udFZhcmlhbnQoIHtcblx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRcdG1lbnVTdGF0dXM6IHRoaXMubWVudVN0YXR1cyxcblx0XHRcdFx0Y3VycmVudEZvbnRWYXJpYW50OiB0aGlzLmdldEN1cnJlbnRGb250VmFyaWFudCgpLFxuXHRcdFx0XHRtdWx0aU9wdGlvbnM6IG11bHRpT3B0aW9uc1xuXHRcdFx0fSApO1xuXHRcdFx0dGhpcy4kZWwuYXBwZW5kKCB0aGlzLmN1cnJlbnRGb250Vmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdFx0dGhpcy5kcm9wRG93blZpZXcgPSBuZXcgRm9udFZhcmlhbnREcm9wZG93bigge1xuXHRcdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdFx0bWVudVN0YXR1czogdGhpcy5tZW51U3RhdHVzLFxuXHRcdFx0XHRzZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCksXG5cdFx0XHRcdGN1cnJlbnRGb250VmFyaWFudDogdGhpcy5nZXRDdXJyZW50Rm9udFZhcmlhbnQoKVxuXHRcdFx0fSApO1xuXHRcdFx0dGhpcy4kZWwuYXBwZW5kKCB0aGlzLmRyb3BEb3duVmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRm9udFZhcmlhbnRDb250cm9sO1xuIiwidmFyIEZvbnRWYXJpYW50T3B0aW9uID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdmFyaWFudC1vcHRpb24nICksXG5Ecm9wZG93blRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duVGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtdmFyaWFudC1kcm9wZG93biBmb250LXByb3BlcnR5LWNvbnRyb2wtZHJvcGRvd24nLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duVGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gb3B0cy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQ7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgPSBvcHRzLmN1cnJlbnRGb250VmFyaWFudDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0aWYgKCB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCAmJiB0aGlzLnR5cGUuZnZkQWRqdXN0ICkge1xuXHRcdFx0dmFyIHZhcmlhbnRPcHRpb25zID0gdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFZhcmlhbnRPcHRpb25zKCk7XG5cdFx0XHR2YXJpYW50T3B0aW9ucy5mb3JFYWNoKCBmdW5jdGlvbiggZnZkICkge1xuXHRcdFx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250VmFyaWFudE9wdGlvbigge1xuXHRcdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0XHRpZDogZnZkLFxuXHRcdFx0XHRcdGN1cnJlbnRGb250VmFyaWFudDogdGhpcy5jdXJyZW50Rm9udFZhcmlhbnRcblx0XHRcdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0XHR9LmJpbmQoIHRoaXMgKSApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG52YXIgZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZnZkLXRvLXJlYWRhYmxlJyApLmdldEZvbnRWYXJpYW50TmFtZUZyb21JZDtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXZhcmlhbnQtb3B0aW9uIGpldHBhY2stZm9udHNfX2ZvbnQtcHJvcGVydHktb3B0aW9uJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAnc2V0VmFyaWFudE9wdGlvbicsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tLZXlib2FyZFNlbGVjdCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5pZCA9IG9wdHMuaWQ7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgPSBvcHRzLmN1cnJlbnRGb250VmFyaWFudDtcblx0fSxcblxuXHRjaGVja0tleWJvYXJkU2VsZWN0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC5rZXkgPT09ICdFbnRlcicgKSB7XG5cdFx0XHR0aGlzLiRlbC5jbGljaygpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIGdldEZvbnRWYXJpYW50TmFtZUZyb21JZCggdGhpcy5pZCApICk7XG5cdFx0dGhpcy4kZWwuZGF0YSggJ2lkJywgdGhpcy5pZCApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgPT09IHRoaXMuaWQgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2N1cnJlbnQnICk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLmF0dHIoICd0YWJpbmRleCcsICcwJyApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHNldFZhcmlhbnRPcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ3NldC12YXJpYW50JywgeyB2YXJpYW50OiB0aGlzLmlkLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpNYXN0ZXJWaWV3JyApLFxuXHRhdmFpbGFibGVGb250cyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2F2YWlsYWJsZS1mb250cycgKSxcblx0YXZhaWxhYmxlVHlwZXMgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hdmFpbGFibGUtdHlwZXMnICk7XG5cbnZhciBGb250VHlwZSA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXR5cGUnICksXG5cdEF2YWlsYWJsZUZvbnRzID0gcmVxdWlyZSggJy4uL2NvbGxlY3Rpb25zL2F2YWlsYWJsZS1mb250cycgKTtcblxudmFyIERlZmF1bHRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9kZWZhdWx0LWZvbnQnICk7XG5cbi8vIEluaXRpYWxpemUgdGhlIGRlZmF1bHQgUHJvdmlkZXIgVmlld3NcbnJlcXVpcmUoICcuLi9wcm92aWRlcnMvZ29vZ2xlJyApO1xuXG4vLyBUaGUgbWFpbiBmb250IGNvbnRyb2wgVmlldywgY29udGFpbmluZyBzZWN0aW9ucyBmb3IgZWFjaCBzZXR0aW5nIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5zZWxlY3RlZEZvbnRzID0gb3B0cy5zZWxlY3RlZEZvbnRzO1xuXHRcdGRlYnVnKCAnaW5pdCB3aXRoIGN1cnJlbnRseSBzZWxlY3RlZCBmb250czonLCB0aGlzLnNlbGVjdGVkRm9udHMudG9KU09OKCkgKTtcblx0XHR0aGlzLnR5cGVWaWV3cyA9IFtdO1xuXHRcdHRoaXMuaGVhZGluZ0ZvbnRzID0gbmV3IEF2YWlsYWJsZUZvbnRzKCBhdmFpbGFibGVGb250cyApO1xuXHRcdHRoaXMuYm9keUZvbnRzID0gbmV3IEF2YWlsYWJsZUZvbnRzKCB0aGlzLmhlYWRpbmdGb250cy53aGVyZSggeyBib2R5VGV4dDogdHJ1ZSB9ICkgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnY2hhbmdlLWZvbnQnLCB0aGlzLnVwZGF0ZUN1cnJlbnRGb250ICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ3NldC12YXJpYW50JywgdGhpcy5zZXRGb250VmFyaWFudCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdzZXQtc2l6ZScsIHRoaXMuc2V0Rm9udFNpemUgKTtcblx0fSxcblxuXHRjbG9zZUFsbE1lbnVzOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHR9LFxuXG5cdHNldEZvbnRWYXJpYW50OiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRkZWJ1ZyggJ2ZvbnQgdmFyaWFudCBjaGFuZ2VkJywgZGF0YSApO1xuXHRcdHZhciBtb2RlbCA9IHRoaXMuc2VsZWN0ZWRGb250cy5nZXRGb250QnlUeXBlKCBkYXRhLnR5cGUgKTtcblx0XHRtb2RlbC5zZXQoICdjdXJyZW50RnZkJywgZGF0YS52YXJpYW50ICk7XG5cdFx0dGhpcy5zZWxlY3RlZEZvbnRzLnNldFNlbGVjdGVkRm9udCggbW9kZWwudG9KU09OKCkgKTtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHR9LFxuXG5cdHNldEZvbnRTaXplOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRkZWJ1ZyggJ2ZvbnQgc2l6ZSBjaGFuZ2VkJywgZGF0YSApO1xuXHRcdHZhciBtb2RlbCA9IHRoaXMuc2VsZWN0ZWRGb250cy5nZXRGb250QnlUeXBlKCBkYXRhLnR5cGUgKTtcblx0XHRtb2RlbC5zZXQoICdzaXplJywgZGF0YS5zaXplICk7XG5cdFx0dGhpcy5zZWxlY3RlZEZvbnRzLnNldFNlbGVjdGVkRm9udCggbW9kZWwudG9KU09OKCkgKTtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHR9LFxuXG5cdHVwZGF0ZUN1cnJlbnRGb250OiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRkYXRhLmZvbnQuc2V0KCB7IHR5cGU6IGRhdGEudHlwZSB9ICk7XG5cdFx0dGhpcy5zZWxlY3RlZEZvbnRzLnNldFNlbGVjdGVkRm9udCggZGF0YS5mb250LnRvSlNPTigpICk7XG5cdFx0ZGVidWcoICd1cGRhdGVDdXJyZW50Rm9udCB3aXRoJywgZGF0YS5mb250LnRvSlNPTigpLCAndG8nLCB0aGlzLnNlbGVjdGVkRm9udHMuZ2V0Rm9udEJ5VHlwZSggZGF0YS50eXBlICkudG9KU09OKCkgKTtcblx0XHQvLyBTZXR0aW5nIGhlYWRpbmdzIHR5cGUgb3ZlcndyaXRlcyB0aGUgZGVwcmVjYXRlZCBzaXRlLXRpdGxlIHR5cGVcblx0XHRpZiAoIGRhdGEudHlwZSA9PT0gJ2hlYWRpbmdzJyApIHtcblx0XHRcdHRoaXMudXBkYXRlQ3VycmVudEZvbnQoIHsgZm9udDogbmV3IERlZmF1bHRGb250KCksIHR5cGU6ICdzaXRlLXRpdGxlJyB9ICk7XG5cdFx0fVxuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnR5cGVWaWV3cy5mb3JFYWNoKCBmdW5jdGlvbiggdmlldyApIHtcblx0XHRcdHZpZXcucmVtb3ZlKCk7XG5cdFx0fSApO1xuXHRcdHRoaXMuJGVsLnRleHQoICcnICk7IC8vIFRPRE86IGJldHRlciB0byB1cGRhdGUgZWFjaCBWaWV3IHRoYW4gb3ZlcndyaXRlXG5cdFx0ZGVidWcoICdyZW5kZXJpbmcgY29udHJvbHMgZm9yIGZvbnQgdHlwZXMnLCBhdmFpbGFibGVUeXBlcyApO1xuXHRcdHRoaXMudHlwZVZpZXdzID0gYXZhaWxhYmxlVHlwZXMubWFwKCB0aGlzLnJlbmRlclR5cGVDb250cm9sLmJpbmQoIHRoaXMgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHJlbmRlclR5cGVDb250cm9sOiBmdW5jdGlvbiggdHlwZSApIHtcblx0XHR2YXIgZm9udHM7XG5cdFx0aWYgKCB0eXBlLmJvZHlUZXh0ID09PSB0cnVlICkge1xuXHRcdFx0Zm9udHMgPSB0aGlzLmJvZHlGb250cztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9udHMgPSB0aGlzLmhlYWRpbmdGb250cztcblx0XHR9XG5cdFx0dmFyIHZpZXcgPSBuZXcgRm9udFR5cGUoIHtcblx0XHRcdHR5cGU6IHR5cGUsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5zZWxlY3RlZEZvbnRzLmdldEZvbnRCeVR5cGUoIHR5cGUuaWQgKSxcblx0XHRcdGZvbnREYXRhOiBmb250c1xuXHRcdH0gKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIHZpZXcucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdmlldztcblx0fSxcblxuXHRsb2FkRm9udHM6IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2xvYWQtbWVudS1mb250cycgKTtcblx0fVxuXG59ICk7XG4iXX0=
