var Backbone = require( '../helpers/backbone' );

var sizeOptions = { '-10': 'Tiny', '-5': 'Small' , '0': 'Normal', '5': 'Large', '10': 'Huge' };

module.exports = Backbone.Model.extend({
	getFontVariantOptions: function() {
		if ( this.get( 'fvds' ) ) {
			return this.get( 'fvds' );
		}
	},

	getFontVariantNameFromId: function( id ) {
		if ( this.get( 'fvds' ) ) {
			return this.get( 'fvds' )[id];
		}
	},

	getFontSizeOptions: function() {
		return sizeOptions;
	},

	getFontSizeNameFromId: function( id ) {
		return sizeOptions[id];
	}
});
