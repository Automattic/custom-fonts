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

},{"./common":2,"_process":9}],2:[function(require,module,exports){

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

},{}],10:[function(require,module,exports){
module.exports = require( './bootstrap' ).annotations;

},{"./bootstrap":14}],11:[function(require,module,exports){
module.exports = window.wp.customize;

},{}],12:[function(require,module,exports){
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

},{"../helpers/bootstrap":14}],13:[function(require,module,exports){
/* globals Backbone */
module.exports = Backbone;

},{}],14:[function(require,module,exports){
var settings = window._JetpackFonts;

module.exports = settings;

},{}],15:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	_ = require( '../helpers/underscore' );

module.exports = _.extend( Backbone.Events );


},{"../helpers/backbone":13,"../helpers/underscore":19}],16:[function(require,module,exports){
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

},{"../helpers/api":11,"../helpers/preview-styles":17,"../helpers/provider-views":18,"../providers/google":21,"debug":1}],17:[function(require,module,exports){
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
			// on load the value is quoted and contains the parent family e.g. serif
			// but when changing via the Customizer dropdown the value is just an
			// unquoted font name
			if (family.startsWith('"')) {
				css += 'font-family:' + family + ';';
			} else {
				css += 'font-family:"' + family + '";';

			}
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

},{"../helpers/annotations":10,"../helpers/available-types":12,"../helpers/backbone":13,"debug":1,"fvd":5}],18:[function(require,module,exports){
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

},{"../helpers/api":11,"../views/dropdown-item":22,"debug":1}],19:[function(require,module,exports){
/* globals _ */
module.exports = _;

},{}],20:[function(require,module,exports){
/* globals WebFont */
module.exports = WebFont;

},{}],21:[function(require,module,exports){
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

},{"../helpers/api":11,"../helpers/bootstrap":14,"../helpers/webfont":20}],22:[function(require,module,exports){
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

},{"../helpers/backbone":13,"../helpers/emitter":15}]},{},[16])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvc3JjL2NvbW1vbi5qcyIsIm5vZGVfbW9kdWxlcy9mdmQvbGliL2NvbXBhY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy9mdmQvbGliL2V4cGFuZGVyLmpzIiwibm9kZV9tb2R1bGVzL2Z2ZC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZnZkL2xpYi9wYXJzZXIuanMiLCJub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb3duL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9qcy9oZWxwZXJzL2Fubm90YXRpb25zLmpzIiwic3JjL2pzL2hlbHBlcnMvYXBpLmpzIiwic3JjL2pzL2hlbHBlcnMvYXZhaWxhYmxlLXR5cGVzLmpzIiwic3JjL2pzL2hlbHBlcnMvYmFja2JvbmUuanMiLCJzcmMvanMvaGVscGVycy9ib290c3RyYXAuanMiLCJzcmMvanMvaGVscGVycy9lbWl0dGVyLmpzIiwic3JjL2pzL2hlbHBlcnMvbGl2ZS11cGRhdGUuanMiLCJzcmMvanMvaGVscGVycy9wcmV2aWV3LXN0eWxlcy5qcyIsInNyYy9qcy9oZWxwZXJzL3Byb3ZpZGVyLXZpZXdzLmpzIiwic3JjL2pzL2hlbHBlcnMvdW5kZXJzY29yZS5qcyIsInNyYy9qcy9oZWxwZXJzL3dlYmZvbnQuanMiLCJzcmMvanMvcHJvdmlkZXJzL2dvb2dsZS5qcyIsInNyYy9qcy92aWV3cy9kcm9wZG93bi1pdGVtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gbG9jYWxzdG9yYWdlKCk7XG5leHBvcnRzLmRlc3Ryb3kgPSAoKCkgPT4ge1xuXHRsZXQgd2FybmVkID0gZmFsc2U7XG5cblx0cmV0dXJuICgpID0+IHtcblx0XHRpZiAoIXdhcm5lZCkge1xuXHRcdFx0d2FybmVkID0gdHJ1ZTtcblx0XHRcdGNvbnNvbGUud2FybignSW5zdGFuY2UgbWV0aG9kIGBkZWJ1Zy5kZXN0cm95KClgIGlzIGRlcHJlY2F0ZWQgYW5kIG5vIGxvbmdlciBkb2VzIGFueXRoaW5nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiBvZiBgZGVidWdgLicpO1xuXHRcdH1cblx0fTtcbn0pKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuXHQnIzAwMDBDQycsXG5cdCcjMDAwMEZGJyxcblx0JyMwMDMzQ0MnLFxuXHQnIzAwMzNGRicsXG5cdCcjMDA2NkNDJyxcblx0JyMwMDY2RkYnLFxuXHQnIzAwOTlDQycsXG5cdCcjMDA5OUZGJyxcblx0JyMwMENDMDAnLFxuXHQnIzAwQ0MzMycsXG5cdCcjMDBDQzY2Jyxcblx0JyMwMENDOTknLFxuXHQnIzAwQ0NDQycsXG5cdCcjMDBDQ0ZGJyxcblx0JyMzMzAwQ0MnLFxuXHQnIzMzMDBGRicsXG5cdCcjMzMzM0NDJyxcblx0JyMzMzMzRkYnLFxuXHQnIzMzNjZDQycsXG5cdCcjMzM2NkZGJyxcblx0JyMzMzk5Q0MnLFxuXHQnIzMzOTlGRicsXG5cdCcjMzNDQzAwJyxcblx0JyMzM0NDMzMnLFxuXHQnIzMzQ0M2NicsXG5cdCcjMzNDQzk5Jyxcblx0JyMzM0NDQ0MnLFxuXHQnIzMzQ0NGRicsXG5cdCcjNjYwMENDJyxcblx0JyM2NjAwRkYnLFxuXHQnIzY2MzNDQycsXG5cdCcjNjYzM0ZGJyxcblx0JyM2NkNDMDAnLFxuXHQnIzY2Q0MzMycsXG5cdCcjOTkwMENDJyxcblx0JyM5OTAwRkYnLFxuXHQnIzk5MzNDQycsXG5cdCcjOTkzM0ZGJyxcblx0JyM5OUNDMDAnLFxuXHQnIzk5Q0MzMycsXG5cdCcjQ0MwMDAwJyxcblx0JyNDQzAwMzMnLFxuXHQnI0NDMDA2NicsXG5cdCcjQ0MwMDk5Jyxcblx0JyNDQzAwQ0MnLFxuXHQnI0NDMDBGRicsXG5cdCcjQ0MzMzAwJyxcblx0JyNDQzMzMzMnLFxuXHQnI0NDMzM2NicsXG5cdCcjQ0MzMzk5Jyxcblx0JyNDQzMzQ0MnLFxuXHQnI0NDMzNGRicsXG5cdCcjQ0M2NjAwJyxcblx0JyNDQzY2MzMnLFxuXHQnI0NDOTkwMCcsXG5cdCcjQ0M5OTMzJyxcblx0JyNDQ0NDMDAnLFxuXHQnI0NDQ0MzMycsXG5cdCcjRkYwMDAwJyxcblx0JyNGRjAwMzMnLFxuXHQnI0ZGMDA2NicsXG5cdCcjRkYwMDk5Jyxcblx0JyNGRjAwQ0MnLFxuXHQnI0ZGMDBGRicsXG5cdCcjRkYzMzAwJyxcblx0JyNGRjMzMzMnLFxuXHQnI0ZGMzM2NicsXG5cdCcjRkYzMzk5Jyxcblx0JyNGRjMzQ0MnLFxuXHQnI0ZGMzNGRicsXG5cdCcjRkY2NjAwJyxcblx0JyNGRjY2MzMnLFxuXHQnI0ZGOTkwMCcsXG5cdCcjRkY5OTMzJyxcblx0JyNGRkNDMDAnLFxuXHQnI0ZGQ0MzMydcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcblx0Ly8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuXHQvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuXHQvLyBleHBsaWNpdGx5XG5cdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiAod2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJyB8fCB3aW5kb3cucHJvY2Vzcy5fX253anMpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBjb2xvcnMuXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvKGVkZ2V8dHJpZGVudClcXC8oXFxkKykvKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIElzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG5cdC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG5cdHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuXHRcdC8vIElzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcblx0XHQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuXHRcdC8vIElzIGZpcmVmb3ggPj0gdjMxP1xuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuXHRcdCh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuXHRcdC8vIERvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuXHRhcmdzWzBdID0gKHRoaXMudXNlQ29sb3JzID8gJyVjJyA6ICcnKSArXG5cdFx0dGhpcy5uYW1lc3BhY2UgK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKSArXG5cdFx0YXJnc1swXSArXG5cdFx0KHRoaXMudXNlQ29sb3JzID8gJyVjICcgOiAnICcpICtcblx0XHQnKycgKyBtb2R1bGUuZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG5cdGlmICghdGhpcy51c2VDb2xvcnMpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcblx0YXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0Jyk7XG5cblx0Ly8gVGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcblx0Ly8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuXHQvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cblx0bGV0IGluZGV4ID0gMDtcblx0bGV0IGxhc3RDID0gMDtcblx0YXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIG1hdGNoID0+IHtcblx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aW5kZXgrKztcblx0XHRpZiAobWF0Y2ggPT09ICclYycpIHtcblx0XHRcdC8vIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuXHRcdFx0Ly8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcblx0XHRcdGxhc3RDID0gaW5kZXg7XG5cdFx0fVxuXHR9KTtcblxuXHRhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5kZWJ1ZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUuZGVidWdgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqIElmIGBjb25zb2xlLmRlYnVnYCBpcyBub3QgYXZhaWxhYmxlLCBmYWxscyBiYWNrXG4gKiB0byBgY29uc29sZS5sb2dgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydHMubG9nID0gY29uc29sZS5kZWJ1ZyB8fCBjb25zb2xlLmxvZyB8fCAoKCkgPT4ge30pO1xuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG5cdHRyeSB7XG5cdFx0aWYgKG5hbWVzcGFjZXMpIHtcblx0XHRcdGV4cG9ydHMuc3RvcmFnZS5zZXRJdGVtKCdkZWJ1ZycsIG5hbWVzcGFjZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGxvYWQoKSB7XG5cdGxldCByO1xuXHR0cnkge1xuXHRcdHIgPSBleHBvcnRzLnN0b3JhZ2UuZ2V0SXRlbSgnZGVidWcnKTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cblxuXHQvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG5cdGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuXHRcdHIgPSBwcm9jZXNzLmVudi5ERUJVRztcblx0fVxuXG5cdHJldHVybiByO1xufVxuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcblx0dHJ5IHtcblx0XHQvLyBUVk1MS2l0IChBcHBsZSBUViBKUyBSdW50aW1lKSBkb2VzIG5vdCBoYXZlIGEgd2luZG93IG9iamVjdCwganVzdCBsb2NhbFN0b3JhZ2UgaW4gdGhlIGdsb2JhbCBjb250ZXh0XG5cdFx0Ly8gVGhlIEJyb3dzZXIgYWxzbyBoYXMgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dC5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY29tbW9uJykoZXhwb3J0cyk7XG5cbmNvbnN0IHtmb3JtYXR0ZXJzfSA9IG1vZHVsZS5leHBvcnRzO1xuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbiAodikge1xuXHR0cnkge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRyZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyb3IubWVzc2FnZTtcblx0fVxufTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICovXG5cbmZ1bmN0aW9uIHNldHVwKGVudikge1xuXHRjcmVhdGVEZWJ1Zy5kZWJ1ZyA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5kZWZhdWx0ID0gY3JlYXRlRGVidWc7XG5cdGNyZWF0ZURlYnVnLmNvZXJjZSA9IGNvZXJjZTtcblx0Y3JlYXRlRGVidWcuZGlzYWJsZSA9IGRpc2FibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZSA9IGVuYWJsZTtcblx0Y3JlYXRlRGVidWcuZW5hYmxlZCA9IGVuYWJsZWQ7XG5cdGNyZWF0ZURlYnVnLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblx0Y3JlYXRlRGVidWcuZGVzdHJveSA9IGRlc3Ryb3k7XG5cblx0T2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0Y3JlYXRlRGVidWdba2V5XSA9IGVudltrZXldO1xuXHR9KTtcblxuXHQvKipcblx0KiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLCBhbmQgbmFtZXMgdG8gc2tpcC5cblx0Ki9cblxuXHRjcmVhdGVEZWJ1Zy5uYW1lcyA9IFtdO1xuXHRjcmVhdGVEZWJ1Zy5za2lwcyA9IFtdO1xuXG5cdC8qKlxuXHQqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cblx0KlxuXHQqIFZhbGlkIGtleSBuYW1lcyBhcmUgYSBzaW5nbGUsIGxvd2VyIG9yIHVwcGVyLWNhc2UgbGV0dGVyLCBpLmUuIFwiblwiIGFuZCBcIk5cIi5cblx0Ki9cblx0Y3JlYXRlRGVidWcuZm9ybWF0dGVycyA9IHt9O1xuXG5cdC8qKlxuXHQqIFNlbGVjdHMgYSBjb2xvciBmb3IgYSBkZWJ1ZyBuYW1lc3BhY2Vcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2Ugc3RyaW5nIGZvciB0aGUgZGVidWcgaW5zdGFuY2UgdG8gYmUgY29sb3JlZFxuXHQqIEByZXR1cm4ge051bWJlcnxTdHJpbmd9IEFuIEFOU0kgY29sb3IgY29kZSBmb3IgdGhlIGdpdmVuIG5hbWVzcGFjZVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiBzZWxlY3RDb2xvcihuYW1lc3BhY2UpIHtcblx0XHRsZXQgaGFzaCA9IDA7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5hbWVzcGFjZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0aGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgbmFtZXNwYWNlLmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuXHRcdH1cblxuXHRcdHJldHVybiBjcmVhdGVEZWJ1Zy5jb2xvcnNbTWF0aC5hYnMoaGFzaCkgJSBjcmVhdGVEZWJ1Zy5jb2xvcnMubGVuZ3RoXTtcblx0fVxuXHRjcmVhdGVEZWJ1Zy5zZWxlY3RDb2xvciA9IHNlbGVjdENvbG9yO1xuXG5cdC8qKlxuXHQqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuXHQqXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuXHQqIEByZXR1cm4ge0Z1bmN0aW9ufVxuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGNyZWF0ZURlYnVnKG5hbWVzcGFjZSkge1xuXHRcdGxldCBwcmV2VGltZTtcblx0XHRsZXQgZW5hYmxlT3ZlcnJpZGUgPSBudWxsO1xuXHRcdGxldCBuYW1lc3BhY2VzQ2FjaGU7XG5cdFx0bGV0IGVuYWJsZWRDYWNoZTtcblxuXHRcdGZ1bmN0aW9uIGRlYnVnKC4uLmFyZ3MpIHtcblx0XHRcdC8vIERpc2FibGVkP1xuXHRcdFx0aWYgKCFkZWJ1Zy5lbmFibGVkKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3Qgc2VsZiA9IGRlYnVnO1xuXG5cdFx0XHQvLyBTZXQgYGRpZmZgIHRpbWVzdGFtcFxuXHRcdFx0Y29uc3QgY3VyciA9IE51bWJlcihuZXcgRGF0ZSgpKTtcblx0XHRcdGNvbnN0IG1zID0gY3VyciAtIChwcmV2VGltZSB8fCBjdXJyKTtcblx0XHRcdHNlbGYuZGlmZiA9IG1zO1xuXHRcdFx0c2VsZi5wcmV2ID0gcHJldlRpbWU7XG5cdFx0XHRzZWxmLmN1cnIgPSBjdXJyO1xuXHRcdFx0cHJldlRpbWUgPSBjdXJyO1xuXG5cdFx0XHRhcmdzWzBdID0gY3JlYXRlRGVidWcuY29lcmNlKGFyZ3NbMF0pO1xuXG5cdFx0XHRpZiAodHlwZW9mIGFyZ3NbMF0gIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdC8vIEFueXRoaW5nIGVsc2UgbGV0J3MgaW5zcGVjdCB3aXRoICVPXG5cdFx0XHRcdGFyZ3MudW5zaGlmdCgnJU8nKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcblx0XHRcdGxldCBpbmRleCA9IDA7XG5cdFx0XHRhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXpBLVolXSkvZywgKG1hdGNoLCBmb3JtYXQpID0+IHtcblx0XHRcdFx0Ly8gSWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuXHRcdFx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdFx0XHRyZXR1cm4gJyUnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGluZGV4Kys7XG5cdFx0XHRcdGNvbnN0IGZvcm1hdHRlciA9IGNyZWF0ZURlYnVnLmZvcm1hdHRlcnNbZm9ybWF0XTtcblx0XHRcdFx0aWYgKHR5cGVvZiBmb3JtYXR0ZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjb25zdCB2YWwgPSBhcmdzW2luZGV4XTtcblx0XHRcdFx0XHRtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cblx0XHRcdFx0XHQvLyBOb3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG5cdFx0XHRcdFx0YXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGluZGV4LS07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIEFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nIChjb2xvcnMsIGV0Yy4pXG5cdFx0XHRjcmVhdGVEZWJ1Zy5mb3JtYXRBcmdzLmNhbGwoc2VsZiwgYXJncyk7XG5cblx0XHRcdGNvbnN0IGxvZ0ZuID0gc2VsZi5sb2cgfHwgY3JlYXRlRGVidWcubG9nO1xuXHRcdFx0bG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG5cdFx0fVxuXG5cdFx0ZGVidWcubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXHRcdGRlYnVnLnVzZUNvbG9ycyA9IGNyZWF0ZURlYnVnLnVzZUNvbG9ycygpO1xuXHRcdGRlYnVnLmNvbG9yID0gY3JlYXRlRGVidWcuc2VsZWN0Q29sb3IobmFtZXNwYWNlKTtcblx0XHRkZWJ1Zy5leHRlbmQgPSBleHRlbmQ7XG5cdFx0ZGVidWcuZGVzdHJveSA9IGNyZWF0ZURlYnVnLmRlc3Ryb3k7IC8vIFhYWCBUZW1wb3JhcnkuIFdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCBtYWpvciByZWxlYXNlLlxuXG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGRlYnVnLCAnZW5hYmxlZCcsIHtcblx0XHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuXHRcdFx0Z2V0OiAoKSA9PiB7XG5cdFx0XHRcdGlmIChlbmFibGVPdmVycmlkZSAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdHJldHVybiBlbmFibGVPdmVycmlkZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAobmFtZXNwYWNlc0NhY2hlICE9PSBjcmVhdGVEZWJ1Zy5uYW1lc3BhY2VzKSB7XG5cdFx0XHRcdFx0bmFtZXNwYWNlc0NhY2hlID0gY3JlYXRlRGVidWcubmFtZXNwYWNlcztcblx0XHRcdFx0XHRlbmFibGVkQ2FjaGUgPSBjcmVhdGVEZWJ1Zy5lbmFibGVkKG5hbWVzcGFjZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZW5hYmxlZENhY2hlO1xuXHRcdFx0fSxcblx0XHRcdHNldDogdiA9PiB7XG5cdFx0XHRcdGVuYWJsZU92ZXJyaWRlID0gdjtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIEVudi1zcGVjaWZpYyBpbml0aWFsaXphdGlvbiBsb2dpYyBmb3IgZGVidWcgaW5zdGFuY2VzXG5cdFx0aWYgKHR5cGVvZiBjcmVhdGVEZWJ1Zy5pbml0ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRjcmVhdGVEZWJ1Zy5pbml0KGRlYnVnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZGVidWc7XG5cdH1cblxuXHRmdW5jdGlvbiBleHRlbmQobmFtZXNwYWNlLCBkZWxpbWl0ZXIpIHtcblx0XHRjb25zdCBuZXdEZWJ1ZyA9IGNyZWF0ZURlYnVnKHRoaXMubmFtZXNwYWNlICsgKHR5cGVvZiBkZWxpbWl0ZXIgPT09ICd1bmRlZmluZWQnID8gJzonIDogZGVsaW1pdGVyKSArIG5hbWVzcGFjZSk7XG5cdFx0bmV3RGVidWcubG9nID0gdGhpcy5sb2c7XG5cdFx0cmV0dXJuIG5ld0RlYnVnO1xuXHR9XG5cblx0LyoqXG5cdCogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuXHQqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG5cdFx0Y3JlYXRlRGVidWcuc2F2ZShuYW1lc3BhY2VzKTtcblx0XHRjcmVhdGVEZWJ1Zy5uYW1lc3BhY2VzID0gbmFtZXNwYWNlcztcblxuXHRcdGNyZWF0ZURlYnVnLm5hbWVzID0gW107XG5cdFx0Y3JlYXRlRGVidWcuc2tpcHMgPSBbXTtcblxuXHRcdGxldCBpO1xuXHRcdGNvbnN0IHNwbGl0ID0gKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJyA/IG5hbWVzcGFjZXMgOiAnJykuc3BsaXQoL1tcXHMsXSsvKTtcblx0XHRjb25zdCBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmICghc3BsaXRbaV0pIHtcblx0XHRcdFx0Ly8gaWdub3JlIGVtcHR5IHN0cmluZ3Ncblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuXG5cdFx0XHRpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG5cdFx0XHRcdGNyZWF0ZURlYnVnLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnNsaWNlKDEpICsgJyQnKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuXHQqXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2VzXG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZGlzYWJsZSgpIHtcblx0XHRjb25zdCBuYW1lc3BhY2VzID0gW1xuXHRcdFx0Li4uY3JlYXRlRGVidWcubmFtZXMubWFwKHRvTmFtZXNwYWNlKSxcblx0XHRcdC4uLmNyZWF0ZURlYnVnLnNraXBzLm1hcCh0b05hbWVzcGFjZSkubWFwKG5hbWVzcGFjZSA9PiAnLScgKyBuYW1lc3BhY2UpXG5cdFx0XS5qb2luKCcsJyk7XG5cdFx0Y3JlYXRlRGVidWcuZW5hYmxlKCcnKTtcblx0XHRyZXR1cm4gbmFtZXNwYWNlcztcblx0fVxuXG5cdC8qKlxuXHQqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG5cdCogQHJldHVybiB7Qm9vbGVhbn1cblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcblx0XHRpZiAobmFtZVtuYW1lLmxlbmd0aCAtIDFdID09PSAnKicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGxldCBpO1xuXHRcdGxldCBsZW47XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGNyZWF0ZURlYnVnLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoY3JlYXRlRGVidWcubmFtZXNbaV0udGVzdChuYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0KiBDb252ZXJ0IHJlZ2V4cCB0byBuYW1lc3BhY2Vcblx0KlxuXHQqIEBwYXJhbSB7UmVnRXhwfSByZWd4ZXBcblx0KiBAcmV0dXJuIHtTdHJpbmd9IG5hbWVzcGFjZVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiB0b05hbWVzcGFjZShyZWdleHApIHtcblx0XHRyZXR1cm4gcmVnZXhwLnRvU3RyaW5nKClcblx0XHRcdC5zdWJzdHJpbmcoMiwgcmVnZXhwLnRvU3RyaW5nKCkubGVuZ3RoIC0gMilcblx0XHRcdC5yZXBsYWNlKC9cXC5cXCpcXD8kLywgJyonKTtcblx0fVxuXG5cdC8qKlxuXHQqIENvZXJjZSBgdmFsYC5cblx0KlxuXHQqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuXHQqIEByZXR1cm4ge01peGVkfVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiBjb2VyY2UodmFsKSB7XG5cdFx0aWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG5cdFx0XHRyZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuXHRcdH1cblx0XHRyZXR1cm4gdmFsO1xuXHR9XG5cblx0LyoqXG5cdCogWFhYIERPIE5PVCBVU0UuIFRoaXMgaXMgYSB0ZW1wb3Jhcnkgc3R1YiBmdW5jdGlvbi5cblx0KiBYWFggSXQgV0lMTCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHJlbGVhc2UuXG5cdCovXG5cdGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdFx0Y29uc29sZS53YXJuKCdJbnN0YW5jZSBtZXRob2QgYGRlYnVnLmRlc3Ryb3koKWAgaXMgZGVwcmVjYXRlZCBhbmQgbm8gbG9uZ2VyIGRvZXMgYW55dGhpbmcuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCBtYWpvciB2ZXJzaW9uIG9mIGBkZWJ1Z2AuJyk7XG5cdH1cblxuXHRjcmVhdGVEZWJ1Zy5lbmFibGUoY3JlYXRlRGVidWcubG9hZCgpKTtcblxuXHRyZXR1cm4gY3JlYXRlRGVidWc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dXA7XG4iLCJ2YXIgb3duID0gcmVxdWlyZSgnb3duJylcblxudmFyIERFU0NSSVBUT1JfUkUgPSAvXFxzKy9nXG52YXIgUFJPVE9UWVBFID0ge1xuXG4gICAgY29tcGFjdDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbJ24nLCAnNCddXG4gICAgICAgIHZhciBkZXNjcmlwdG9ycyA9IChpbnB1dCB8fCAnJykuc3BsaXQoJzsnKVxuICAgICAgICB2YXIgcGFpciwgcHJvcGVydHksIHZhbHVlLCBpbmRleCwgdmFsdWVzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzY3JpcHRvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBhaXIgPSBkZXNjcmlwdG9yc1tpXS5yZXBsYWNlKERFU0NSSVBUT1JfUkUsICcnKS5zcGxpdCgnOicpXG4gICAgICAgICAgICBpZiAocGFpci5sZW5ndGggIT09IDIpIGNvbnRpbnVlXG4gICAgICAgICAgICBwcm9wZXJ0eSA9IHBhaXJbMF1cbiAgICAgICAgICAgIHZhbHVlID0gcGFpclsxXVxuICAgICAgICAgICAgdmFsdWVzID0gdGhpcy52YWx1ZXNbcHJvcGVydHldXG4gICAgICAgICAgICBpZiAoIXZhbHVlcykgY29udGludWVcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlc1tqXVsxXSAhPT0gdmFsdWUpIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgcmVzdWx0W3RoaXMucHJvcGVydGllcy5pbmRleE9mKHByb3BlcnR5KV0gPSB2YWx1ZXNbal1bMF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0LmpvaW4oJycpXG4gICAgfVxuXG59XG5cbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlXG5cbmZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShQUk9UT1RZUEUsIG93bih7XG4gICAgICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsXG4gICAgICAgIHZhbHVlczogdmFsdWVzXG4gICAgfSkpXG59XG4iLCJ2YXIgb3duID0gcmVxdWlyZSgnb3duJylcblxudmFyIFBST1RPVFlQRSA9IHtcblxuICAgIGV4cGFuZDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnIHx8IGlucHV0Lmxlbmd0aCAhPT0gMikgcmV0dXJuIG51bGxcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtudWxsLCBudWxsXVxuICAgICAgICB2YXIga2V5LCBwcm9wZXJ0eSwgdmFsdWVzLCB2YWx1ZVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAga2V5ID0gaW5wdXRbaV1cbiAgICAgICAgICAgIHByb3BlcnR5ID0gdGhpcy5wcm9wZXJ0aWVzW2ldXG4gICAgICAgICAgICB2YWx1ZXMgPSB0aGlzLnZhbHVlc1twcm9wZXJ0eV1cbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB2YWx1ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlc1tqXVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZVswXSAhPT0ga2V5KSBjb250aW51ZVxuICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IFt0aGlzLnByb3BlcnRpZXNbaV0sIHZhbHVlWzFdXS5qb2luKCc6JylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHJlc3VsdC5pbmRleE9mKG51bGwpIDwgMCkgPyAocmVzdWx0LmpvaW4oJzsnKSArICc7JykgOiBudWxsXG4gICAgfVxuXG59XG5cbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlXG5cbmZ1bmN0aW9uIGNyZWF0ZShwcm9wZXJ0aWVzLCB2YWx1ZXMpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShQUk9UT1RZUEUsIG93bih7XG4gICAgICAgIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsXG4gICAgICAgIHZhbHVlczogdmFsdWVzXG4gICAgfSkpXG59XG4iLCJ2YXIgQ29tcGFjdG9yID0gcmVxdWlyZSgnLi9jb21wYWN0b3InKVxudmFyIEV4cGFuZGVyID0gcmVxdWlyZSgnLi9leHBhbmRlcicpXG52YXIgUGFyc2VyID0gcmVxdWlyZSgnLi9wYXJzZXInKVxuXG52YXIgUFJPUEVSVElFUyA9IFtcbiAgICAnZm9udC1zdHlsZScsXG4gICAgJ2ZvbnQtd2VpZ2h0J1xuXVxudmFyIFZBTFVFUyA9IHtcbiAgICAnZm9udC1zdHlsZSc6IFtcbiAgICAgICAgWyduJywgJ25vcm1hbCddLFxuICAgICAgICBbJ2knLCAnaXRhbGljJ10sXG4gICAgICAgIFsnbycsICdvYmxpcXVlJ11cbiAgICBdLFxuICAgICdmb250LXdlaWdodCc6IFtcbiAgICAgICAgWyc0JywgJ25vcm1hbCddLFxuICAgICAgICBbJzcnLCAnYm9sZCddLFxuICAgICAgICBbJzEnLCAnMTAwJ10sXG4gICAgICAgIFsnMicsICcyMDAnXSxcbiAgICAgICAgWyczJywgJzMwMCddLFxuICAgICAgICBbJzQnLCAnNDAwJ10sXG4gICAgICAgIFsnNScsICc1MDAnXSxcbiAgICAgICAgWyc2JywgJzYwMCddLFxuICAgICAgICBbJzcnLCAnNzAwJ10sXG4gICAgICAgIFsnOCcsICc4MDAnXSxcbiAgICAgICAgWyc5JywgJzkwMCddXG4gICAgXVxufVxuXG52YXIgY29tcGFjdG9yLCBleHBhbmRlciwgcGFyc2VyXG5cbmV4cG9ydHMuY29tcGFjdCA9IGNvbXBhY3RcbmV4cG9ydHMuZXhwYW5kID0gZXhwYW5kXG5leHBvcnRzLnBhcnNlID0gcGFyc2VcblxuZnVuY3Rpb24gY29tcGFjdChpbnB1dCkge1xuICAgIGlmICghY29tcGFjdG9yKSBjb21wYWN0b3IgPSBDb21wYWN0b3IuY3JlYXRlKFBST1BFUlRJRVMsIFZBTFVFUylcbiAgICByZXR1cm4gY29tcGFjdG9yLmNvbXBhY3QoaW5wdXQpXG59XG5cbmZ1bmN0aW9uIGV4cGFuZChpbnB1dCkge1xuICAgIGlmICghZXhwYW5kZXIpIGV4cGFuZGVyID0gRXhwYW5kZXIuY3JlYXRlKFBST1BFUlRJRVMsIFZBTFVFUylcbiAgICByZXR1cm4gZXhwYW5kZXIuZXhwYW5kKGlucHV0KVxufVxuXG5mdW5jdGlvbiBwYXJzZShpbnB1dCkge1xuICAgIGlmICghcGFyc2VyKSBwYXJzZXIgPSBQYXJzZXIuY3JlYXRlKFBST1BFUlRJRVMsIFZBTFVFUylcbiAgICByZXR1cm4gcGFyc2VyLnBhcnNlKGlucHV0KVxufVxuIiwidmFyIG93biA9IHJlcXVpcmUoJ293bicpXG5cbnZhciBQUk9UT1RZUEUgPSB7XG5cbiAgICBwYXJzZTogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnIHx8IGlucHV0Lmxlbmd0aCAhPT0gMikgcmV0dXJuIG51bGxcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9XG4gICAgICAgIHZhciBrZXksIHByb3BlcnR5LCB2YWx1ZXMsIHZhbHVlXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBrZXkgPSBpbnB1dFtpXVxuICAgICAgICAgICAgcHJvcGVydHkgPSB0aGlzLnByb3BlcnRpZXNbaV1cbiAgICAgICAgICAgIHZhbHVlcyA9IHRoaXMudmFsdWVzW3Byb3BlcnR5XVxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWVzW2pdXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlWzBdICE9PSBrZXkpIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgcmVzdWx0W3RoaXMucHJvcGVydGllc1tpXV0gPSB2YWx1ZVsxXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocmVzdWx0W3RoaXMucHJvcGVydGllc1swXV0gJiYgcmVzdWx0W3RoaXMucHJvcGVydGllc1sxXV0pID8gcmVzdWx0IDogbnVsbFxuICAgIH1cblxufVxuXG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZVxuXG5mdW5jdGlvbiBjcmVhdGUocHJvcGVydGllcywgdmFsdWVzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUoUFJPVE9UWVBFLCBvd24oe1xuICAgICAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLFxuICAgICAgICB2YWx1ZXM6IHZhbHVlc1xuICAgIH0pKVxufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB3ID0gZCAqIDc7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnd2Vla3MnOlxuICAgIGNhc2UgJ3dlZWsnOlxuICAgIGNhc2UgJ3cnOlxuICAgICAgcmV0dXJuIG4gKiB3O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBkLCAnZGF5Jyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgcywgJ3NlY29uZCcpO1xuICB9XG4gIHJldHVybiBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBuKSArICcgJyArIG5hbWUgKyAoaXNQbHVyYWwgPyAncycgOiAnJyk7XG59XG4iLCJjcmVhdGUucmVhZG9ubHkgPSByZWFkb25seVxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVcblxuZnVuY3Rpb24gY3JlYXRlKHByb3BlcnRpZXMsIGlzV3JpdGFibGUsIGlzQ29uZmlndXJhYmxlKSB7XG4gICAgaWYgKHByb3BlcnRpZXMgIT09IE9iamVjdChwcm9wZXJ0aWVzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHZhciByZXN1bHQgPSB7fVxuICAgIHZhciBuYW1lLCBkZXNjcmlwdG9ycywgZGVzY3JpcHRvck5hbWUsIGRlc2NyaXB0b3JcbiAgICBmb3IgKG5hbWUgaW4gcHJvcGVydGllcykge1xuICAgICAgICBpZiAoIXByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkobmFtZSkpIGNvbnRpbnVlXG4gICAgICAgIHJlc3VsdFtuYW1lXSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvcGVydGllcywgbmFtZSlcbiAgICAgICAgaWYgKHR5cGVvZiBpc1dyaXRhYmxlID09PSAnYm9vbGVhbicpIHJlc3VsdFtuYW1lXS53cml0YWJsZSA9IGlzV3JpdGFibGVcbiAgICAgICAgaWYgKHR5cGVvZiBpc0NvbmZpZ3VyYWJsZSA9PT0gJ2Jvb2xlYW4nKSByZXN1bHRbbmFtZV0uY29uZmlndXJhYmxlID0gaXNDb25maWd1cmFibGVcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiByZWFkb25seShwcm9wZXJ0aWVzKSB7XG4gICAgcmV0dXJuIGNyZWF0ZShwcm9wZXJ0aWVzLCBmYWxzZSwgZmFsc2UpXG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCAnLi9ib290c3RyYXAnICkuYW5ub3RhdGlvbnM7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy53cC5jdXN0b21pemU7XG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAnLi4vaGVscGVycy9ib290c3RyYXAnICk7XG5cbmZ1bmN0aW9uIGNvbXBhcmVUeXBlcyggYSwgYiApIHtcblx0aWYgKCBhLmlkID09PSAnaGVhZGluZ3MnICkge1xuXHRcdHJldHVybiAtMTtcblx0fVxuXHRpZiAoIGIuaWQgPT09ICdoZWFkaW5ncycgKSB7XG5cdFx0cmV0dXJuIDE7XG5cdH1cblx0cmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVNpdGVUaXRsZSggdHlwZXMgKSB7XG5cdHJldHVybiB0eXBlcy5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2aW91cywgdHlwZSApIHtcblx0XHRpZiAoIHR5cGUuaWQgIT09ICdzaXRlLXRpdGxlJyApIHtcblx0XHRcdHByZXZpb3VzLnB1c2goIHR5cGUgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHByZXZpb3VzO1xuXHR9LCBbXSApO1xufVxuXG52YXIgdHlwZXMgPSBbXTtcbmlmICggc2V0dGluZ3MgJiYgc2V0dGluZ3MudHlwZXMgKSB7XG5cdC8vIEFycmFuZ2UgdGhlIGNvbnRyb2xzIHNvIHRoYXQgYm9keS10ZXh0IGlzIGZpcnN0XG5cdHR5cGVzID0gc2V0dGluZ3MudHlwZXMuc29ydCggY29tcGFyZVR5cGVzICk7XG5cdC8vIFJlbW92ZSBkZXByZWNhdGVkIHNpdGUtdGl0bGUgY29udHJvbCBmcm9tIFVJXG5cdHR5cGVzID0gcmVtb3ZlU2l0ZVRpdGxlKCB0eXBlcyApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR5cGVzO1xuIiwiLyogZ2xvYmFscyBCYWNrYm9uZSAqL1xubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZTtcbiIsInZhciBzZXR0aW5ncyA9IHdpbmRvdy5fSmV0cGFja0ZvbnRzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHRpbmdzO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdF8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF8uZXh0ZW5kKCBCYWNrYm9uZS5FdmVudHMgKTtcblxuIiwidmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzOmxpdmUtdXBkYXRlJyApLFxuXHRQcmV2aWV3U3R5bGVzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJldmlldy1zdHlsZXMnICksXG5cdGdldFZpZXdGb3JQcm92aWRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3Byb3ZpZGVyLXZpZXdzJyApLmdldFZpZXdGb3JQcm92aWRlcjtcblxuLy8gSW5pdGlhbGl6ZSB0aGUgZGVmYXVsdCBQcm92aWRlciBWaWV3c1xucmVxdWlyZSggJy4uL3Byb3ZpZGVycy9nb29nbGUnICk7XG5cbmZ1bmN0aW9uIGFkZEZvbnRUb1ByZXZpZXcoIGZvbnQgKSB7XG5cdHZhciBQcm92aWRlclZpZXcgPSBnZXRWaWV3Rm9yUHJvdmlkZXIoIGZvbnQucHJvdmlkZXIgKTtcblx0aWYgKCAhIFByb3ZpZGVyVmlldyApIHtcblx0XHRkZWJ1ZyggJ2xpdmUgdXBkYXRlIGZhaWxlZCBiZWNhdXNlIG5vIHByb3ZpZGVyIGNvdWxkIGJlIGZvdW5kIGZvcicsIGZvbnQgKTtcblx0XHRyZXR1cm47XG5cdH1cblx0UHJvdmlkZXJWaWV3LmFkZEZvbnRUb1ByZXZpZXcoIGZvbnQgKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVTZWxlY3RlZEZvbnRzKCBzZWxlY3RlZEZvbnRzICkge1xuXHRpZiAoIHNlbGVjdGVkRm9udHMubGVuZ3RoICkge1xuXHRcdHJldHVybiBzZWxlY3RlZEZvbnRzO1xuXHR9XG5cdGRlYnVnKCAnd2FybmluZzogc2VsZWN0ZWRGb250cyBpcyBub3QgYW4gYXJyYXkuIHRyeWluZyB0byBjb252ZXJ0Jywgc2VsZWN0ZWRGb250cyApO1xuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKCBzZWxlY3RlZEZvbnRzICk7XG5cdGlmICggISBrZXlzIHx8ICEga2V5cy5sZW5ndGggKSB7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cdHJldHVybiBrZXlzLnJlZHVjZSggZnVuY3Rpb24oIGZvbnRzLCBrZXkgKSB7XG5cdFx0aWYgKCBzZWxlY3RlZEZvbnRzWyBrZXkgXSAmJiBzZWxlY3RlZEZvbnRzWyBrZXkgXS5wcm92aWRlciApIHtcblx0XHRcdGZvbnRzLnB1c2goIHNlbGVjdGVkRm9udHNbIGtleSBdICk7XG5cdFx0fVxuXHRcdHJldHVybiBmb250cztcblx0fSwgW10gKTtcbn1cblxuZnVuY3Rpb24gbGl2ZVVwZGF0ZUZvbnRzSW5QcmV2aWV3KCBzZWxlY3RlZEZvbnRzICkge1xuXHRzZWxlY3RlZEZvbnRzID0gdmFsaWRhdGVTZWxlY3RlZEZvbnRzKCBzZWxlY3RlZEZvbnRzICk7XG5cdGRlYnVnKCAncmVuZGVyaW5nIGxpdmUgdXBkYXRlIGZvciBuZXcgc3R5bGVzJywgc2VsZWN0ZWRGb250cyApO1xuXHRpZiAoIHNlbGVjdGVkRm9udHMgKSB7XG5cdFx0c2VsZWN0ZWRGb250cy5mb3JFYWNoKCBhZGRGb250VG9QcmV2aWV3ICk7XG5cdH1cblx0UHJldmlld1N0eWxlcy53cml0ZUZvbnRTdHlsZXMoIHNlbGVjdGVkRm9udHMgKTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcblx0ZGVidWcoICdiaW5kaW5nIGxpdmUgdXBkYXRlcyBmb3IgY3VzdG9tLWZvbnRzJyApO1xuXHRhcGkoICdqZXRwYWNrX2ZvbnRzW3NlbGVjdGVkX2ZvbnRzXScsIGZ1bmN0aW9uKCB2YWx1ZSApIHtcblx0XHR2YWx1ZS5iaW5kKCBmdW5jdGlvbiggc2VsZWN0ZWRGb250cyApIHtcblx0XHRcdGxpdmVVcGRhdGVGb250c0luUHJldmlldyggc2VsZWN0ZWRGb250cyApO1xuXHRcdH0gKTtcblx0fSApO1xuXHQvLyBUaGUgQ3VzdG9taXplciBkb2Vzbid0IGdpdmUgdXMgdGhlIGluaXRpYWwgdmFsdWUsXG5cdC8vIHNvIGRvIGl0IG1hbnVhbGx5IG9uIGZpcnN0IHJ1blxuXHRsaXZlVXBkYXRlRm9udHNJblByZXZpZXcoIGFwaSggJ2pldHBhY2tfZm9udHNbc2VsZWN0ZWRfZm9udHNdJyApLmdldCgpICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRsaXZlVXBkYXRlRm9udHNJblByZXZpZXc6IGxpdmVVcGRhdGVGb250c0luUHJldmlld1xufTtcblxuYXBpLmJpbmQoICdwcmV2aWV3LXJlYWR5JywgaW5pdCApO1xuIiwidmFyIGpRdWVyeSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLiQsXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250czpwcmV2aWV3LWNzcycgKSxcblx0ZnZkID0gcmVxdWlyZSggJ2Z2ZCcgKSxcblx0YXZhaWxhYmxlVHlwZXMgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hdmFpbGFibGUtdHlwZXMnICksXG5cdGFubm90YXRpb25zID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYW5ub3RhdGlvbnMnICk7XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQ3NzRm9yU3R5bGVPYmplY3QoIHN0eWxlICkge1xuXHRpZiAoICEgYW5ub3RhdGlvbnMgKSB7XG5cdFx0ZGVidWcoICdubyBhbm5vdGF0aW9ucyBmb3VuZCBhdCBhbGw7IGNhbm5vdCBnZW5lcmF0ZSBjc3MnICk7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cdGRlYnVnKCAnZ2VuZXJhdGluZyBjc3MgZm9yIHN0eWxlIHR5cGUnLCBzdHlsZS50eXBlLCAndXNpbmcgdGhlc2UgYW5ub3RhdGlvbnM6JywgYW5ub3RhdGlvbnNbIHN0eWxlLnR5cGUgXSApO1xuXHRpZiAoICEgYW5ub3RhdGlvbnNbIHN0eWxlLnR5cGUgXSB8fCBhbm5vdGF0aW9uc1sgc3R5bGUudHlwZSBdLmxlbmd0aCA8IDEgKSB7XG5cdFx0ZGVidWcoICdubyBhbm5vdGF0aW9ucyBmb3VuZCBmb3Igc3R5bGUgdHlwZScsIHN0eWxlLnR5cGUsICc7IGV4aXN0aW5nIGFubm90YXRpb25zOicsIGFubm90YXRpb25zICk7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cdHJldHVybiBhbm5vdGF0aW9uc1sgc3R5bGUudHlwZSBdLm1hcCggZ2VuZXJhdGVDc3NGb3JBbm5vdGF0aW9uLmJpbmQoIG51bGwsIHN0eWxlICkgKS5qb2luKCAnICcgKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVDc3NGb3JBbm5vdGF0aW9uKCBzdHlsZSwgYW5ub3RhdGlvbiApIHtcblx0aWYgKCAhIGFubm90YXRpb24uc2VsZWN0b3IgKSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cdGRlYnVnKCAnZ2VuZXJhdGVDc3NGb3JBbm5vdGF0aW9uIGZvciBzdHlsZScsIHN0eWxlLmNzc05hbWUsICdhbmQgYW5ub3RhdGlvbicsIGFubm90YXRpb24gKTtcblx0dmFyIGNzcyA9ICcnO1xuXHRpZiAoIHN0eWxlLmNzc05hbWUgJiYgaGFzRm9udEZhbWlseUFubm90YXRpb24oIGFubm90YXRpb24gKSApIHtcblx0XHR2YXIgZmFtaWx5ID0gZ2VuZXJhdGVGb250RmFtaWx5KCBzdHlsZSApO1xuXHRcdGlmICggZmFtaWx5ICYmIGZhbWlseS5sZW5ndGggPiAwICkge1xuXHRcdFx0Ly8gb24gbG9hZCB0aGUgdmFsdWUgaXMgcXVvdGVkIGFuZCBjb250YWlucyB0aGUgcGFyZW50IGZhbWlseSBlLmcuIHNlcmlmXG5cdFx0XHQvLyBidXQgd2hlbiBjaGFuZ2luZyB2aWEgdGhlIEN1c3RvbWl6ZXIgZHJvcGRvd24gdGhlIHZhbHVlIGlzIGp1c3QgYW5cblx0XHRcdC8vIHVucXVvdGVkIGZvbnQgbmFtZVxuXHRcdFx0aWYgKGZhbWlseS5zdGFydHNXaXRoKCdcIicpKSB7XG5cdFx0XHRcdGNzcyArPSAnZm9udC1mYW1pbHk6JyArIGZhbWlseSArICc7Jztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNzcyArPSAnZm9udC1mYW1pbHk6XCInICsgZmFtaWx5ICsgJ1wiOyc7XG5cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0dmFyIGlzRm9udEFkanVzdGFibGUgPSBpc0ZvbnRBZGp1c3RhYmxlRm9yVHlwZSggc3R5bGUudHlwZSApO1xuXHRpZiAoIGlzRm9udEFkanVzdGFibGUgKSB7XG5cdFx0Y3NzICs9ICdmb250LXdlaWdodDonICsgZ2VuZXJhdGVGb250V2VpZ2h0KCBzdHlsZS5jdXJyZW50RnZkLCBhbm5vdGF0aW9uICkgKyAnOyc7XG5cdFx0Y3NzICs9ICdmb250LXN0eWxlOicgKyBnZW5lcmF0ZUZvbnRTdHlsZSggc3R5bGUuY3VycmVudEZ2ZCwgYW5ub3RhdGlvbiApICsgJzsnO1xuXHR9XG5cdGlmICggc3R5bGUuc2l6ZSApIHtcblx0XHR2YXIgc2l6ZSA9IGdlbmVyYXRlRm9udFNpemUoIHN0eWxlLnNpemUsIGFubm90YXRpb24gKTtcblx0XHRpZiAoIHNpemUgJiYgc2l6ZS5sZW5ndGggPiAwICkge1xuXHRcdFx0Y3NzICs9ICdmb250LXNpemU6JyArIHNpemUgKyAnOyc7XG5cdFx0fVxuXHR9XG5cdGlmICggISBjc3MubGVuZ3RoICkge1xuXHRcdHJldHVybiBjc3M7XG5cdH1cblx0Y3NzID0gZ2VuZXJhdGVDc3NTZWxlY3RvciggYW5ub3RhdGlvbi5zZWxlY3RvciApICsgJyB7JyArIGNzcyArICd9Jztcblx0ZGVidWcoICdnZW5lcmF0ZWQgY3NzIGZvcicsIHN0eWxlLCAnaXMnLCBjc3MgKTtcblx0cmV0dXJuIGNzcztcbn1cblxuZnVuY3Rpb24gaXNGb250QWRqdXN0YWJsZUZvclR5cGUoIHN0eWxlVHlwZSApIHtcblx0aWYgKCBhdmFpbGFibGVUeXBlcy5sZW5ndGggPCAxICkge1xuXHRcdGRlYnVnKCAnY2Fubm90IHRlbGwgaWYgJywgc3R5bGVUeXBlLCAnIGlzIGFkanVzdGFibGU6IG5vIGF2YWlsYWJsZVR5cGVzJyApO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRyZXR1cm4gYXZhaWxhYmxlVHlwZXMucmVkdWNlKCBmdW5jdGlvbiggcHJldiwgdHlwZSApIHtcblx0XHRpZiAoIHR5cGUuaWQgPT09IHN0eWxlVHlwZSAmJiB0eXBlLmZ2ZEFkanVzdCA9PT0gdHJ1ZSApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gcHJldjtcblx0fSwgZmFsc2UgKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVDc3NTZWxlY3Rvciggc2VsZWN0b3JHcm91cCApIHtcblx0cmV0dXJuIHNlbGVjdG9yR3JvdXAuc3BsaXQoIC8sXFxzKi8gKS5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2aW91cywgc2VsZWN0b3IgKSB7XG5cdFx0cHJldmlvdXMucHVzaCggJy53Zi1hY3RpdmUgJyArIHNlbGVjdG9yICk7XG5cdFx0cmV0dXJuIHByZXZpb3VzO1xuXHR9LCBbXSApLmpvaW4oICcsICcgKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVGb250U3R5bGUoIGN1cnJlbnRGdmQsIGFubm90YXRpb24gKSB7XG5cdGlmICggY3VycmVudEZ2ZCApIHtcblx0XHR2YXIgcGFyc2VkID0gZnZkLnBhcnNlKCBjdXJyZW50RnZkICk7XG5cdFx0aWYgKCBwYXJzZWQgJiYgcGFyc2VkWydmb250LXN0eWxlJ10gKSB7XG5cdFx0XHRyZXR1cm4gcGFyc2VkWydmb250LXN0eWxlJ107XG5cdFx0fVxuXHR9XG5cdHZhciBhbm5vdGF0aW9uU3R5bGUgPSBnZXRGb250U3R5bGVGcm9tQW5ub3RhdGlvbiggYW5ub3RhdGlvbiApO1xuXHRpZiAoIGFubm90YXRpb25TdHlsZSApIHtcblx0XHRyZXR1cm4gYW5ub3RhdGlvblN0eWxlO1xuXHR9XG5cdHJldHVybiAnbm9ybWFsJztcbn1cblxuZnVuY3Rpb24gZ2V0Rm9udFN0eWxlRnJvbUFubm90YXRpb24oIGFubm90YXRpb24gKSB7XG5cdHZhciBvcmlnaW5hbFN0eWxlU3RyaW5nO1xuXHRnZXRBbm5vdGF0aW9uUnVsZXMoIGFubm90YXRpb24gKS5mb3JFYWNoKCBmdW5jdGlvbiggcnVsZSApIHtcblx0XHRpZiAoIHJ1bGUudmFsdWUgJiYgcnVsZS5wcm9wZXJ0eSA9PT0gJ2ZvbnQtc3R5bGUnICkge1xuXHRcdFx0b3JpZ2luYWxTdHlsZVN0cmluZyA9IHJ1bGUudmFsdWU7XG5cdFx0fVxuXHR9ICk7XG5cdHJldHVybiBvcmlnaW5hbFN0eWxlU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUZvbnRXZWlnaHQoIGN1cnJlbnRGdmQsIGFubm90YXRpb24gKSB7XG5cdGlmICggY3VycmVudEZ2ZCApIHtcblx0XHR2YXIgcGFyc2VkID0gZnZkLnBhcnNlKCBjdXJyZW50RnZkICk7XG5cdFx0aWYgKCBwYXJzZWQgJiYgcGFyc2VkWydmb250LXdlaWdodCddICkge1xuXHRcdFx0cmV0dXJuIHBhcnNlZFsnZm9udC13ZWlnaHQnXTtcblx0XHR9XG5cdH1cblx0dmFyIGFubm90YXRpb25XZWlnaHQgPSBnZXRGb250V2VpZ2h0RnJvbUFubm90YXRpb24oIGFubm90YXRpb24gKTtcblx0aWYgKCBhbm5vdGF0aW9uV2VpZ2h0ICkge1xuXHRcdHJldHVybiBhbm5vdGF0aW9uV2VpZ2h0O1xuXHR9XG5cdHJldHVybiAnNDAwJztcbn1cblxuZnVuY3Rpb24gZ2V0Rm9udFdlaWdodEZyb21Bbm5vdGF0aW9uKCBhbm5vdGF0aW9uICkge1xuXHR2YXIgb3JpZ2luYWxXZWlnaHRTdHJpbmc7XG5cdGdldEFubm90YXRpb25SdWxlcyggYW5ub3RhdGlvbiApLmZvckVhY2goIGZ1bmN0aW9uKCBydWxlICkge1xuXHRcdGlmICggcnVsZS52YWx1ZSAmJiBydWxlLnByb3BlcnR5ID09PSAnZm9udC13ZWlnaHQnICkge1xuXHRcdFx0b3JpZ2luYWxXZWlnaHRTdHJpbmcgPSBydWxlLnZhbHVlO1xuXHRcdH1cblx0fSApO1xuXHRyZXR1cm4gb3JpZ2luYWxXZWlnaHRTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlRm9udEZhbWlseSggZm9udCApIHtcblx0cmV0dXJuIGZvbnQuZm9udEZhbWlsaWVzIHx8IGZvbnQuY3NzTmFtZTtcbn1cblxuZnVuY3Rpb24gZ2V0QW5ub3RhdGlvblJ1bGVzKCBhbm5vdGF0aW9uICkge1xuXHRpZiAoICEgYW5ub3RhdGlvbi5ydWxlcyB8fCAhIGFubm90YXRpb24ucnVsZXMubGVuZ3RoICkge1xuXHRcdGRlYnVnKCAnbm8gYW5ub3RhdGlvbiBydWxlcyBmb3VuZCBmb3InLCBhbm5vdGF0aW9uICk7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cdHJldHVybiBhbm5vdGF0aW9uLnJ1bGVzO1xufVxuXG5mdW5jdGlvbiBoYXNGb250RmFtaWx5QW5ub3RhdGlvbiggYW5ub3RhdGlvbiApIHtcblx0dmFyIGZvdW5kID0gZmFsc2U7XG5cdGdldEFubm90YXRpb25SdWxlcyggYW5ub3RhdGlvbiApLmZvckVhY2goIGZ1bmN0aW9uKCBydWxlICkge1xuXHRcdGlmICggcnVsZS52YWx1ZSAmJiBydWxlLnByb3BlcnR5ID09PSAnZm9udC1mYW1pbHknICYmICdpbmhlcml0JyAhPT0gcnVsZS52YWx1ZSApIHtcblx0XHRcdGZvdW5kID0gdHJ1ZTtcblx0XHR9XG5cdH0gKTtcblx0cmV0dXJuIGZvdW5kO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUZvbnRTaXplKCBzaXplLCBhbm5vdGF0aW9uICkge1xuXHR2YXIgb3JpZ2luYWxTaXplU3RyaW5nID0gZ2V0Rm9udFNpemVGcm9tQW5ub3RhdGlvbiggYW5ub3RhdGlvbiApO1xuXHRpZiAoICEgb3JpZ2luYWxTaXplU3RyaW5nICkge1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXIgdW5pdHMgPSBwYXJzZVVuaXRzKCBvcmlnaW5hbFNpemVTdHJpbmcgKTtcblx0dmFyIG9yaWdpbmFsU2l6ZSA9IHBhcnNlU2l6ZSggb3JpZ2luYWxTaXplU3RyaW5nICk7XG5cdGlmICggISB1bml0cyB8fCAhIG9yaWdpbmFsU2l6ZSApIHtcblx0XHRkZWJ1ZyggJ3VuYWJsZSB0byBwYXJzZSBzaXplIGFubm90YXRpb24nLCBvcmlnaW5hbFNpemVTdHJpbmcgKTtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIHNjYWxlID0gKCBwYXJzZUludCggc2l6ZSwgMTAgKSAqIDAuMDYgKSArIDE7XG5cdHJldHVybiAoIHNjYWxlICogb3JpZ2luYWxTaXplICkudG9GaXhlZCggMSApICsgdW5pdHM7XG59XG5cbmZ1bmN0aW9uIGdldEZvbnRTaXplRnJvbUFubm90YXRpb24oIGFubm90YXRpb24gKSB7XG5cdHZhciBvcmlnaW5hbFNpemVTdHJpbmc7XG5cdGdldEFubm90YXRpb25SdWxlcyggYW5ub3RhdGlvbiApLmZvckVhY2goIGZ1bmN0aW9uKCBydWxlICkge1xuXHRcdGlmICggcnVsZS52YWx1ZSAmJiBydWxlLnByb3BlcnR5ID09PSAnZm9udC1zaXplJyAmJiAhIC9eaW5oZXJpdC8udGVzdCggcnVsZS52YWx1ZSApICkge1xuXHRcdFx0b3JpZ2luYWxTaXplU3RyaW5nID0gcnVsZS52YWx1ZTtcblx0XHR9XG5cdH0gKTtcblx0cmV0dXJuIG9yaWdpbmFsU2l6ZVN0cmluZztcbn1cblxuZnVuY3Rpb24gcGFyc2VVbml0cyggc2l6ZVN0cmluZyApIHtcblx0dmFyIG1hdGNoZXMgPSBzaXplU3RyaW5nLm1hdGNoKCAvW1xcZFxcLl0rKFtBLVphLXpdezIsM318JSkvICk7XG5cdGlmICggISBtYXRjaGVzIHx8ICEgbWF0Y2hlc1sxXSApIHtcblx0XHRyZXR1cm47XG5cdH1cblx0cmV0dXJuIG1hdGNoZXNbIDEgXTtcbn1cblxuZnVuY3Rpb24gcGFyc2VTaXplKCBzaXplU3RyaW5nICkge1xuXHR2YXIgbWF0Y2hlcyA9IHNpemVTdHJpbmcubWF0Y2goIC8oKFxcZCpcXC4oXFxkKykpfChcXGQrKSkoW0EtWmEtel17MiwzfXwlKS8gKTtcblx0aWYgKCAhIG1hdGNoZXMgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBzaXplLCBwcmVjaXNpb247XG5cdGlmICggbWF0Y2hlc1sgNCBdICkge1xuXHRcdHNpemUgPSBwYXJzZUludCggbWF0Y2hlc1sgNCBdLCAxMCApO1xuXHRcdHByZWNpc2lvbiA9ICggc2l6ZSA+IDkgKSA/IDEgOiAzO1xuXHR9IGVsc2Uge1xuXHRcdHNpemUgPSBwYXJzZUZsb2F0KCBtYXRjaGVzWyAyIF0gKTtcblx0XHRwcmVjaXNpb24gPSBtYXRjaGVzWyAzIF0ubGVuZ3RoICsgMTtcblx0fVxuXHRyZXR1cm4gc2l6ZS50b0ZpeGVkKCBwcmVjaXNpb24gKTtcbn1cblxudmFyIFByZXZpZXdTdHlsZXMgPSB7XG5cdGdldEZvbnRTdHlsZUVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBqUXVlcnkoICcjamV0cGFjay1jdXN0b20tZm9udHMtY3NzJyApWyAwIF07XG5cdH0sXG5cblx0d3JpdGVGb250U3R5bGVzOiBmdW5jdGlvbiggc3R5bGVzICkge1xuXHRcdFByZXZpZXdTdHlsZXMucmVtb3ZlRm9udFN0eWxlRWxlbWVudCgpO1xuXHRcdGFubm90YXRpb25zID0gUHJldmlld1N0eWxlcy5tYXliZU1lcmdlQW5ub3RhdGlvbnNGb3JTdHlsZXMoIGFubm90YXRpb25zLCBzdHlsZXMgKTtcblx0XHR2YXIgY3NzID0gUHJldmlld1N0eWxlcy5nZW5lcmF0ZUNzc0Zyb21TdHlsZXMoIHN0eWxlcyApO1xuXHRcdGRlYnVnKCAnY3NzIGdlbmVyYXRpb24gY29tcGxldGU6JywgY3NzICk7XG5cdFx0UHJldmlld1N0eWxlcy5hZGRTdHlsZUVsZW1lbnRUb1BhZ2UoIFByZXZpZXdTdHlsZXMuY3JlYXRlU3R5bGVFbGVtZW50V2l0aCggY3NzICkgKTtcblx0fSxcblxuXHQvLyBNZXJnZXMgc2l0ZS10aXRsZSBhbm5vdGF0aW9ucyBpbnRvIGhlYWRpbmdzIGlmIHdlIGRvbid0IGhhdmUgc2l0ZS10aXRsZSBmb250c1xuXHRtYXliZU1lcmdlQW5ub3RhdGlvbnNGb3JTdHlsZXM6IGZ1bmN0aW9uKCBvcmlnQW5ub3RhdGlvbnMsIGZvbnRzICkge1xuXHRcdHZhciBoYXNTaXRlVGl0bGU7XG5cdFx0aWYgKCAhIG9yaWdBbm5vdGF0aW9ucyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKCAhIG9yaWdBbm5vdGF0aW9uc1snc2l0ZS10aXRsZSddIHx8ICEgb3JpZ0Fubm90YXRpb25zLmhlYWRpbmdzICkge1xuXHRcdFx0cmV0dXJuIG9yaWdBbm5vdGF0aW9ucztcblx0XHR9XG5cdFx0aGFzU2l0ZVRpdGxlID0gZm9udHMubGVuZ3RoICYmIGZvbnRzLnNvbWUoIGZ1bmN0aW9uKCBmb250ICkge1xuXHRcdFx0cmV0dXJuIGZvbnQudHlwZSA9PT0gJ3NpdGUtdGl0bGUnO1xuXHRcdH0gKTtcblx0XHRpZiAoIGhhc1NpdGVUaXRsZSApIHtcblx0XHRcdHJldHVybiBvcmlnQW5ub3RhdGlvbnM7XG5cdFx0fVxuXHRcdGRlYnVnKCAnbWVyZ2luZyBzaXRlLXRpdGxlIGFubm90YXRpb25zIGludG8gaGVhZGluZ3MnICk7XG5cdFx0b3JpZ0Fubm90YXRpb25zLmhlYWRpbmdzID0gb3JpZ0Fubm90YXRpb25zLmhlYWRpbmdzLmNvbmNhdCggb3JpZ0Fubm90YXRpb25zWydzaXRlLXRpdGxlJ10gKTtcblx0XHRkZWxldGUgb3JpZ0Fubm90YXRpb25zWydzaXRlLXRpdGxlJ107XG5cdFx0cmV0dXJuIG9yaWdBbm5vdGF0aW9ucztcblx0fSxcblxuXHRnZW5lcmF0ZUNzc0Zyb21TdHlsZXM6IGZ1bmN0aW9uKCBzdHlsZXMgKSB7XG5cdFx0aWYgKCAhIHN0eWxlcyApIHtcblx0XHRcdGRlYnVnKCAnZ2VuZXJhdGluZyBlbXB0eSBjc3MgYmVjYXVzZSB0aGVyZSBhcmUgbm8gc3R5bGVzJyApO1xuXHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblx0XHRkZWJ1ZyggJ2dlbmVyYXRpbmcgY3NzIGZvciBzdHlsZXMnLCBzdHlsZXMgKTtcblx0XHRyZXR1cm4gc3R5bGVzLnJlZHVjZSggZnVuY3Rpb24oIGNzcywgc3R5bGUgKSB7XG5cdFx0XHR2YXIgZ2VuZXJhdGVkQ3NzID0gZ2VuZXJhdGVDc3NGb3JTdHlsZU9iamVjdCggc3R5bGUgKTtcblx0XHRcdGlmICggZ2VuZXJhdGVkQ3NzICkge1xuXHRcdFx0XHRjc3MgKz0gJyAnICsgZ2VuZXJhdGVkQ3NzO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNzcztcblx0XHQvLyBlbmZvcmNlIHRoZSA0MDAgd2VpZ2h0IGRlZmF1bHQgYmVsb3cgdGhhdCBpcyBhc3N1bWVkIGV2ZXJ5d2hlcmUgZWxzZVxuXHRcdH0sICcud2YtYWN0aXZlID4gYm9keSB7IGZvbnQtd2VpZ2h0OiA0MDA7IH0nICk7XG5cdH0sXG5cblx0Y3JlYXRlU3R5bGVFbGVtZW50V2l0aDogZnVuY3Rpb24oIGNzcyApIHtcblx0XHRyZXR1cm4galF1ZXJ5KCAnPHN0eWxlIGlkPVwiamV0cGFjay1jdXN0b20tZm9udHMtY3NzXCI+JyArIGNzcyArICc8L3N0eWxlPicgKTtcblx0fSxcblxuXHRyZW1vdmVGb250U3R5bGVFbGVtZW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZWxlbWVudCA9IFByZXZpZXdTdHlsZXMuZ2V0Rm9udFN0eWxlRWxlbWVudCgpO1xuXHRcdGlmICggZWxlbWVudCApIHtcblx0XHRcdGpRdWVyeSggZWxlbWVudCApLnJlbW92ZSgpO1xuXHRcdH1cblx0fSxcblxuXHRhZGRTdHlsZUVsZW1lbnRUb1BhZ2U6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdGpRdWVyeSggJ2hlYWQnICkucHJlcGVuZCggZWxlbWVudCApO1xuXHR9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJldmlld1N0eWxlcztcbiIsIi8qKlxuICogVGhpcyBoZWxwZXIgc2V0cyB1cCBWaWV3cyB0byByZW5kZXIgZWFjaCBmb250IGZvciBzcGVjaWZpYyBwcm92aWRlcnMuIEVhY2hcbiAqIFZpZXcgc2hvdWxkIGJlIGFuIGluc3RhbmNlIG9mIGB3cC5jdXN0b21pemUuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlld2AgKHdoaWNoXG4gKiBpcyBhIGBCYWNrYm9uZS5WaWV3YCkgdGhhdCB3aWxsIHJlbmRlciBpdHMgZm9udCBvcHRpb24gdG8gdGhlIGZvbnQgbGlzdC5cbiAqIEFkZGl0aW9uYWwgcHJvdmlkZXIgVmlld3MgY2FuIGJlIGFkZGVkIGJ5IGFkZGluZyB0byB0aGVcbiAqIGB3cC5jdXN0b21pemUuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3NgIG9iamVjdCB1c2luZyB0aGUgcHJvdmlkZXIgaWQgYXMgdGhlXG4gKiBrZXkuIFRoZSBvbmx5IHRoaW5nIHRoYXQgbmVlZHMgdG8gYmUgYWRkZWQgZm9yIGVhY2ggUHJvdmlkZXJWaWV3IGlzIHRoZVxuICogYHJlbmRlcmAgbWV0aG9kLiBFYWNoIFByb3ZpZGVyVmlldyBoYXMgYXMgaXRzIGBtb2RlbGAgb2JqZWN0IHRoZSBmb250IG9iamVjdFxuICogaXQgbmVlZHMgdG8gZGlzcGxheSwgaW5jbHVkaW5nIHRoZSBgY3NzTmFtZWAsIGBkaXNwbGF5TmFtZWAsIGFuZCBgaWRgIGF0dHJpYnV0ZXMuXG4gKlxuICogQWRkaXRpb25hbGx5LCBpZiB5b3VyIHByb3ZpZGVyIG5lZWRzIHNwZWNpZmljIGxvZ2ljIGZvciBob3ZlciBzdGF0ZXMgKHRoaW5rXG4gKiBiYWNrZ3JvdW5kIGltYWdlIHN3YXBwaW5nKSwgeW91IGNhbiBpbXBsZW1lbnQgYG1vdXNlZW50ZXJgIGFuZCBgbW91c2VsZWF2ZWAgbWV0aG9kcy5cbiAqL1xuXG52YXIgYXBpID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXBpJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHM6cHJvdmlkZXItdmlld3MnICk7XG5cbnZhciBEcm9wZG93bkl0ZW0gPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24taXRlbScgKTtcbmlmICggISBhcGkuSmV0cGFja0ZvbnRzICkge1xuXHRhcGkuSmV0cGFja0ZvbnRzID0ge307XG59XG5pZiAoICEgYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkge1xuXHRhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgPSB7fTtcbn1cbmFwaS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3ID0gRHJvcGRvd25JdGVtLmV4dGVuZCgge1xuXHRtb3VzZWVudGVyOiBmdW5jdGlvbigpIHt9LFxuXHRtb3VzZWxlYXZlOiBmdW5jdGlvbigpIHt9XG59ICk7XG5cbnZhciBwcm92aWRlclZpZXdzID0ge307XG5cbmZ1bmN0aW9uIGltcG9ydFByb3ZpZGVyVmlld3MoKSB7XG5cdGRlYnVnKCAnaW1wb3J0aW5nIHByb3ZpZGVyIHZpZXdzIGZyb20nLCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKTtcblx0aWYgKCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKSB7XG5cdFx0T2JqZWN0LmtleXMoIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApLmZvckVhY2goIGZ1bmN0aW9uKCBwcm92aWRlcktleSApIHtcblx0XHRcdHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyS2V5IF0gPSBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3NbIHByb3ZpZGVyS2V5IF07XG5cdFx0fSApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFZpZXdGb3JQcm92aWRlciggcHJvdmlkZXIgKSB7XG5cdGltcG9ydFByb3ZpZGVyVmlld3MoKTtcblx0aWYgKCBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdICkge1xuXHRcdGRlYnVnKCAnZm91bmQgdmlldyBmb3IgcHJvdmlkZXInLCBwcm92aWRlciApO1xuXHRcdHJldHVybiBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdO1xuXHR9XG5cdGRlYnVnKCAnbm8gdmlldyBmb3VuZCBmb3IgcHJvdmlkZXInLCBwcm92aWRlciApO1xuXHRyZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdldFZpZXdGb3JQcm92aWRlcjogZ2V0Vmlld0ZvclByb3ZpZGVyXG59O1xuIiwiLyogZ2xvYmFscyBfICovXG5tb2R1bGUuZXhwb3J0cyA9IF87XG4iLCIvKiBnbG9iYWxzIFdlYkZvbnQgKi9cbm1vZHVsZS5leHBvcnRzID0gV2ViRm9udDtcbiIsInZhciBhcGkgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hcGknICksXG5cdGJvb3RzdHJhcCA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Jvb3RzdHJhcCcgKTtcblxudmFyIFdlYkZvbnQgPSByZXF1aXJlKCAnLi4vaGVscGVycy93ZWJmb250JyApO1xuXG52YXIgbG9hZGVkRm9udElkcyA9IFtdO1xuXG5mdW5jdGlvbiBhZGRGb250VG9Db250cm9scyggZm9udCwgdGV4dCApIHtcblx0aWYgKCB+IGxvYWRlZEZvbnRJZHMuaW5kZXhPZiggZm9udC5pZCApICkge1xuXHRcdHJldHVybjtcblx0fVxuXHRsb2FkZWRGb250SWRzLnB1c2goIGZvbnQuaWQgKTtcblx0V2ViRm9udC5sb2FkKHtcblx0XHRnb29nbGU6IHsgZmFtaWxpZXM6IFsgZm9udC5pZCBdLCB0ZXh0OiB0ZXh0IH0sXG5cdFx0Y2xhc3NlczogZmFsc2UsXG5cdFx0ZXZlbnRzOiBmYWxzZVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gYWRkRm9udFRvUHJldmlldyggZm9udCApIHtcblx0aWYgKCB+IGxvYWRlZEZvbnRJZHMuaW5kZXhPZiggZm9udC5pZCApICkge1xuXHRcdHJldHVybjtcblx0fVxuXHRsb2FkZWRGb250SWRzLnB1c2goIGZvbnQuaWQgKTtcblx0dmFyIGZhbWlseVN0cmluZyA9IGZvbnQuaWQgKyAnOjEwMCwyMDAsMzAwLDQwMCw1MDAsNjAwLDcwMCw4MDAsOTAwLDEwMGl0YWxpYywyMDBpdGFsaWMsMzAwaXRhbGljLDQwMGl0YWxpYyw1MDBpdGFsaWMsNjAwaXRhbGljLDcwMGl0YWxpYyw4MDBpdGFsaWMsOTAwaXRhbGljJztcblx0aWYgKCBib290c3RyYXAucHJvdmlkZXJEYXRhICYmIGJvb3RzdHJhcC5wcm92aWRlckRhdGEuZ29vZ2xlU3Vic2V0U3RyaW5nICkge1xuXHRcdHZhciBzdWJzZXRTdHJpbmcgPSBib290c3RyYXAucHJvdmlkZXJEYXRhLmdvb2dsZVN1YnNldFN0cmluZztcblx0XHRpZiAoIHN1YnNldFN0cmluZyAmJiBzdWJzZXRTdHJpbmcubGVuZ3RoID4gMCApIHtcblx0XHRcdGZhbWlseVN0cmluZyArPSAnOicgKyBzdWJzZXRTdHJpbmc7XG5cdFx0fVxuXHR9XG5cdFdlYkZvbnQubG9hZCggeyBnb29nbGU6IHsgZmFtaWxpZXM6IFsgZmFtaWx5U3RyaW5nIF0gfSB9ICk7XG59XG5cbnZhciBHb29nbGVQcm92aWRlclZpZXcgPSBhcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlldy5leHRlbmQoIHtcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubW9kZWwuZ2V0KCAnZGlzcGxheU5hbWUnICkgKTtcblxuXHRcdHRoaXMuJGVsLmNzcyggJ2ZvbnQtZmFtaWx5JywgJ1wiJyArIHRoaXMubW9kZWwuZ2V0KCAnY3NzTmFtZScgKSArICdcIicgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgJiYgdGhpcy5jdXJyZW50Rm9udC5nZXQoICdpZCcgKSA9PT0gdGhpcy5tb2RlbC5nZXQoICdpZCcgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9XG5cdFx0aWYgKCAhdGhpcy5kaXNhYmxlRm9jdXMgKSB7XG5cdFx0XHR0aGlzLiRlbC5hdHRyKCAndGFiaW5kZXgnLCAnMCcgKTtcblx0XHR9XG5cdFx0YWRkRm9udFRvQ29udHJvbHMoIHRoaXMubW9kZWwudG9KU09OKCksIHRoaXMubW9kZWwuZ2V0KCAnaWQnICkgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSApO1xuXG5Hb29nbGVQcm92aWRlclZpZXcuYWRkRm9udFRvUHJldmlldyA9IGFkZEZvbnRUb1ByZXZpZXc7XG5cbmFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cy5nb29nbGUgPSBHb29nbGVQcm92aWRlclZpZXc7XG5cbm1vZHVsZS5leHBvcnRzID0gR29vZ2xlUHJvdmlkZXJWaWV3O1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxuLy8gQW4gaW5kaXZpZHVhbCBmb250IGluIHRoZSBkcm9wZG93biBsaXN0LCBleHBvcnRlZCBhc1xuLy8gYGFwaS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3YC4gRXh0ZW5kIHRoaXMgb2JqZWN0IGZvciBlYWNoIHByb3ZpZGVyLiBUaGVcbi8vIGV4dGVuZGVkIG9iamVjdHMgbmVlZCB0byBkZWZpbmUgYSBgcmVuZGVyYCBtZXRob2QgdG8gcmVuZGVyIHRoZWlyIHByb3ZpZGVyJ3Ncbi8vIGZvbnQgbmFtZSwgYXMgd2VsbCBhcyBgYWRkRm9udFRvQ29udHJvbHNgIGFuZCBgYWRkRm9udFRvUHJldmlld2AgbWV0aG9kcyBvbiB0aGUgb2JqZWN0IGl0c2VsZi5cbnZhciBQcm92aWRlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19vcHRpb24nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdmb250Q2hhbmdlZCcsXG5cdFx0J2tleWRvd24nOiAnY2hlY2tLZXlib2FyZFNlbGVjdCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5kaXNhYmxlRm9jdXMgPSBCb29sZWFuKCBvcHRzLmRpc2FibGVGb2N1cyApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udCApIHtcblx0XHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdH1cblx0fSxcblxuXHRjaGVja0tleWJvYXJkU2VsZWN0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0aWYgKCBldmVudC5rZXkgPT09ICdFbnRlcicgKSB7XG5cdFx0XHR0aGlzLiRlbC5jbGljaygpO1xuXHRcdH1cblx0fSxcblxuXHQvLyBXYXJuaW5nOiB0aGlzIHNob3VsZCBiZSBvdmVycmlkZW4gaW4gdGhlIHByb3ZpZGVyXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5tb2RlbC5nZXQoICdkaXNwbGF5TmFtZScgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGZvbnRDaGFuZ2VkOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgJiYgdGhpcy5jdXJyZW50Rm9udCAhPT0gdGhpcy5tb2RlbCApIHtcblx0XHRcdEVtaXR0ZXIudHJpZ2dlciggJ2NoYW5nZS1mb250JywgeyBmb250OiB0aGlzLm1vZGVsLCB0eXBlOiB0aGlzLnR5cGUuaWQgfSApO1xuXHRcdH1cblx0fVxufSApO1xuXG5Qcm92aWRlclZpZXcuYWRkRm9udFRvQ29udHJvbHMgPSBmdW5jdGlvbigpIHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyVmlldztcbiJdfQ==
