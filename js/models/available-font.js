var Backbone = require( '../helpers/backbone' );

module.exports = Backbone.Model.extend({
	getFontWeightOptions: function() {
		if ( this.get( 'fvds' ) ) {
			return this.get( 'fvds' );
		}
	},

	getFontWeightNameFromId: function( id ) {
		if ( this.get( 'fvds' ) ) {
			return this.get( 'fvds' )[id];
		}
	}
});
