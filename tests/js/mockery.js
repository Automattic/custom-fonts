var Module = require( 'module' );

var originalLoad;
var mocks = {};

function clearProjectCache() {
	Object.keys( require.cache ).forEach( function( path ) {
		if ( path.indexOf( '/src/js/' ) !== -1 ) {
			delete require.cache[ path ];
		}
	} );
}

module.exports = {
	enable: function() {
		if ( originalLoad ) {
			return;
		}

		originalLoad = Module._load;
		Module._load = function( request, parent, isMain ) {
			if ( Object.prototype.hasOwnProperty.call( mocks, request ) ) {
				return mocks[ request ];
			}

			return originalLoad.call( this, request, parent, isMain );
		};
	},

	disable: function() {
		if ( originalLoad ) {
			Module._load = originalLoad;
			originalLoad = null;
		}
	},

	registerMock: function( name, value ) {
		mocks[ name ] = value;
		clearProjectCache();
	},

	registerSubstitute: function( name, substitute ) {
		mocks[ name ] = require( substitute );
		clearProjectCache();
	},

	deregisterMock: function( name ) {
		delete mocks[ name ];
		clearProjectCache();
	},

	deregisterAll: function() {
		mocks = {};
		clearProjectCache();
	},

	resetCache: clearProjectCache
};
