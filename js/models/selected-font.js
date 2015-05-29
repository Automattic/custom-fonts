var Backbone = require( '../helpers/backbone' ),
	translate = require( '../helpers/translate' );

// A Model for a currently set font setting for this theme
module.exports = Backbone.Model.extend({
	defaults: {
		'displayName': translate( 'Default Theme Font' )
	}
});
