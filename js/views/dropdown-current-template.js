var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts' );

var Emitter = require( '../helpers/emitter' );

var DropdownCurrentTemplate = Backbone.View.extend({
	events: {
		'click': 'toggleDropdown'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
		this.menuStatus = opts.menuStatus;
		this.active = true;
	},

	toggleDropdown: function( e ) {
		if ( e ) {
			e.stopPropagation();
		}
		if ( ! this.active ) {
			debug( 'menu is inactive; ignoring click', this.menu, this.type );
			return;
		}
		if ( this.menuStatus.get( 'isOpen' ) ) {
			debug( 'menu is open; closing menus', this.menu, this.type );
			Emitter.trigger( 'close-open-menus' );
		} else {
			debug( 'menu is closed; opening menu', this.menu, this.type );
			Emitter.trigger( 'open-menu', { type: this.type, menu: this.menu } );
		}
	}
} );

module.exports = DropdownCurrentTemplate;
