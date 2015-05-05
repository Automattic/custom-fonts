var Backbone = require( '../helpers/backbone' ),
	debug = require( 'debug' )( 'jetpack-fonts' );

var Emitter = require( '../helpers/emitter' );

var FontVariantDropdown = require( '../views/font-variant-dropdown' ),
CurrentFontVariant = require( '../views/current-font-variant' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-control font-property-control',

	initialize: function( opts ) {
		this.menu = 'fontVariant';
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.menuStatus = new Backbone.Model({ isOpen: false });
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
		this.listenTo( Emitter, 'open-menu', this.openMenu );
		this.listenTo( Emitter, 'close-open-menus', this.closeMenu );
	},

	getSelectedAvailableFont: function() {
		var selectedAvailableFont = this.fontData.findWhere( { id: this.currentFont.get( 'id' ) } );
		if ( !selectedAvailableFont ) {
			return false;
		}
		return selectedAvailableFont;
	},

	getCurrentFontVariant: function() {
		var selectedAvailableFont = this.getSelectedAvailableFont();
		if ( selectedAvailableFont && this.type.fvdAdjust ) {
			var currentFontVariant = this.currentFont.get( 'currentFvd' ) || 'n4';
			var availableVariants = this.currentFont.get( 'fvds' );
			if ( ~ availableVariants.indexOf( currentFontVariant ) ) {
				return currentFontVariant;
			} else {
				return availableVariants[0];
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
		var selectedAvailableFont = this.getSelectedAvailableFont();
		var multiOptions;
		if ( selectedAvailableFont && selectedAvailableFont.getFontVariantOptions().length > 1 ) {
			multiOptions = true;
		} else {
			multiOptions = false;
		}
		if ( this.currentFontView ) {
			this.currentFontView.remove();
		}
		if ( this.dropDownView ) {
			this.dropDownView.remove();
		}
		if ( multiOptions && this.type.fvdAdjust ) {
			this.currentFontView = new CurrentFontVariant( {
				type: this.type,
				menu: this.menu,
				menuStatus: this.menuStatus,
				currentFontVariant: this.getCurrentFontVariant(),
				multiOptions: multiOptions
			});
			this.$el.append( this.currentFontView.render().el );
			this.dropDownView = new FontVariantDropdown( {
				type: this.type,
				menu: this.menu,
				menuStatus: this.menuStatus,
				selectedAvailableFont: this.getSelectedAvailableFont(),
				currentFontVariant: this.getCurrentFontVariant()
			});
			this.$el.append( this.dropDownView.render().el );
		}
		return this;
	}

} );
