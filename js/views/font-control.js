var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts' );

var Emitter = require( '../helpers/emitter' );

var FontDropdown = require( '../views/font-dropdown' ),
	CurrentFontView = require( '../views/current-font' ),
	DefaultFontButton = require( '../views/default-font-button' );

// Container for the list of available fonts and 'x' button
var FontControlView = Backbone.View.extend({
	className: 'jetpack-fonts__menu-container',

	initialize: function( opts ) {
		this.fontData = opts.fontData;
		this.type = opts.type;
		this.menu = 'fontFamily';
		this.menuStatus = new Backbone.Model({ isOpen: false });
		this.listenTo( Emitter, 'open-menu', this.openMenu );
		this.listenTo( Emitter, 'close-open-menus', this.closeMenu );
	},

	openMenu: function( opts ) {
		if ( opts.menu !== this.menu || opts.type !== this.type ) {
			return this.closeMenu();
		}
		debug( 'opening menu', this.menu, this.type );
		this.menuStatus.set({ isOpen: true });
	},

	closeMenu: function() {
		debug( 'closing menu', this.menu, this.type );
		this.menuStatus.set({ isOpen: false });
	},

	render: function() {
		var currentFontView = new CurrentFontView({
			type: this.type,
			menu: this.menu,
			menuStatus: this.menuStatus,
			currentFont: this.model,
			active: ( this.fontData.length > 0 )
		});
		this.$el.append( currentFontView.render().el );
		this.$el.append( new FontDropdown({
			type: this.type,
			menu: this.menu,
			menuStatus: this.menuStatus,
			currentFont: this.model,
			currentFontView: currentFontView,
			fontData: this.fontData
		}).render().el );
		this.$el.append( new DefaultFontButton({
			type: this.type,
			menuStatus: this.menuStatus,
			currentFont: this.model
		}).render().el );
		return this;
	}
});

module.exports = FontControlView;
