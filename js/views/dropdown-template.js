var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend({
	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
		this.listenTo( Emitter, 'close-open-menus', this.close );
		this.listenTo( Emitter, 'toggle-dropdown', this.toggle );
	},

	toggle: function( data ) {
		if ( data.type !== this.type || data.menu !== this.menu ) {
			return;
		}
		if ( this.isOpen ) {
			this.close();
		} else {
			this.open();
		}
	},

	open: function() {
		Emitter.trigger( 'close-open-menus' );
		this.$el.addClass( 'open' );
		this.isOpen = true;
	},

	close: function() {
		this.$el.removeClass( 'open' );
		this.isOpen = false;
	}
} );
