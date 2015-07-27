var Backbone = require( '../helpers/backbone' );

var DropdownTemplate = Backbone.View.extend( {
	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
		this.menuStatus = opts.menuStatus;
		this.listenTo( this.menuStatus, 'change', this.updateStatus );
	},

	updateStatus: function() {
		if ( this.menuStatus.get( 'isOpen' ) ) {
			this.open();
		} else {
			this.close();
		}
	},

	open: function() {
		this.$el.addClass( 'open' );
		this.isOpen = true;
	},

	close: function() {
		this.$el.removeClass( 'open' );
		this.isOpen = false;
	}
} );

module.exports = DropdownTemplate;
