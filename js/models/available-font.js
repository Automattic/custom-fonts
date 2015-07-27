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
