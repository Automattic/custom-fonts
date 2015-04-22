var Backbone = require( '../helpers/backbone' ),
_ = require( '../helpers/underscore' );

var sizeOptions = [ { id: -10, name: 'Tiny' }, { id: -5, name: 'Small' }, { id: 0, name: 'Normal' }, { id: 5, name: 'Large' }, { id: 10, name: 'Huge' } ];

module.exports = Backbone.Model.extend({
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
		} else {
			return false;
		}
	}
});
