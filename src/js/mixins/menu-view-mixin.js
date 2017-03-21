var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts:menu-view' ),
	Emitter = require( '../helpers/emitter' );

function maybeOpenMenu( key ) {
	if ( key.type && key.type.id && key.menu ) {
		key = key.type.id + ':' + key.menu;
	}
	if ( key !== this.menuKey ) {
		return this.closeMenu();
	}
	this.openMenu();
}

function openMenu() {
	debug( 'opening menu', this.menuKey );
	this.menuStatus.set( { isOpen: true } );
}

function closeMenu() {
	debug( 'closing menu', this.menuKey );
	this.menuStatus.set( { isOpen: false } );
}

var menuViewMixin = function( view ) {
	if ( ! view.listenTo ) {
		throw 'menuViewMixin requires a Backbone View with the `listenTo` method';
	}
	if ( ! view.menuKey ) {
		throw 'menuViewMixin requires a View with a `menuKey` string property to identify the menu';
	}
	if ( ! view.menuStatus ) {
		view.menuStatus = new Backbone.Model( { isOpen: false } );
	}

	view.maybeOpenMenu = maybeOpenMenu;
	view.openMenu = openMenu;
	view.closeMenu = closeMenu;

	view.listenTo( Emitter, 'open-menu', view.maybeOpenMenu );
	view.listenTo( Emitter, 'close-open-menus', view.closeMenu );

	debug( 'added menu capability to the View', view.menuKey );

	return view.menuStatus;
};

module.exports = menuViewMixin;
