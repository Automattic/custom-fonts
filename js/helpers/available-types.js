var settings = require( '../helpers/bootstrap' );
var _ = require( '../helpers/underscore' );

var types = [];
if ( settings && settings.types ) {
	types = settings.types;
	var idx;
	_.find( types, function( type, i ){
		if ( type.id === 'headings' ) {
			idx = i;
			return true;
		}
	} ) ;
	types.splice(0, 0, types.splice(idx, 1)[0] );
}

module.exports = types;
