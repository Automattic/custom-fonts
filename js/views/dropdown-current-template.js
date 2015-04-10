var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend({
	events: {
		'click': 'toggleDropdown'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
	},

	toggleDropdown: function() {
		Emitter.trigger( 'toggle-dropdown', { type: this.type, menu: this.menu } );
	}
} );
