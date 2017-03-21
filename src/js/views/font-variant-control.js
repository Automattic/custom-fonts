var Backbone = require( '../helpers/backbone' ),
	menuViewMixin = require( '../mixins/menu-view-mixin' );

var FontVariantDropdown = require( '../views/font-variant-dropdown' ),
CurrentFontVariant = require( '../views/current-font-variant' );

var FontVariantControl = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-control font-property-control',

	initialize: function( opts ) {
		this.menu = 'fontVariant';
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
		this.menuKey = this.type.id + ':' + this.menu;
		this.menuStatus = menuViewMixin( this );
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
			return this.currentFont.get( 'currentFvd' );
		}
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
			} );
			this.$el.append( this.currentFontView.render().el );
			this.dropDownView = new FontVariantDropdown( {
				type: this.type,
				menu: this.menu,
				menuStatus: this.menuStatus,
				selectedAvailableFont: this.getSelectedAvailableFont(),
				currentFontVariant: this.getCurrentFontVariant()
			} );
			this.$el.append( this.dropDownView.render().el );
		}
		return this;
	}

} );

module.exports = FontVariantControl;
