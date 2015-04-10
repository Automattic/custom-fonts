var Backbone = require( '../helpers/backbone' );

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
	}
});
