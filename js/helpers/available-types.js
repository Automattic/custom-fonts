var settings = require( '../helpers/bootstrap' );

var types = [];
if ( settings && settings.types ) {
	types = settings.types;
}

module.exports = types;
