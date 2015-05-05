var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts' );

var Emitter = require( '../helpers/emitter' );

var FontSizeDropdown = require( '../views/font-size-dropdown' ),
CurrentFontSize = require( '../views/current-font-size' ),
translate = require( '../helpers/translate' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-size-control font-property-control',

	initialize: function( opts ) {
		this.menu = 'fontSize';
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.menuStatus = new Backbone.Model({ isOpen: false });
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
		this.listenTo( Emitter, 'open-menu', this.openMenu );
		this.listenTo( Emitter, 'close-open-menus', this.closeMenu );
	},

	getSelectedAvailableFont: function() {
		var selectedAvailableFont = this.fontData.findWhere( { name: this.currentFont.get( 'name' ) } );
		if ( !selectedAvailableFont ) {
			return false;
		}
		return selectedAvailableFont;
	},

	getCurrentFontSize: function() {
		var selectedAvailableFont = this.getSelectedAvailableFont();
		if ( selectedAvailableFont ) {
			var size = this.currentFont.get( 'size' );
			if ( size && selectedAvailableFont.getFontSizeNameFromId( size ) ) {
				return selectedAvailableFont.getFontSizeNameFromId( size );
			} else {
				return translate( 'Normal Size' );
			}
		}
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
		this.$el.html( '' );
		this.$el.append( new CurrentFontSize( {
			type: this.type,
			menu: this.menu,
			menuStatus: this.menuStatus,
			currentFontSize: this.getCurrentFontSize()
		}).render().el );
		this.$el.append( new FontSizeDropdown( {
			type: this.type,
			menu: this.menu,
			menuStatus: this.menuStatus,
			selectedAvailableFont: this.getSelectedAvailableFont(),
			currentFontSize: this.getCurrentFontSize()
		}).render().el );
		return this;
	}

} );
