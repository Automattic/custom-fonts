var Backbone = require( '../helpers/backbone' );

var FontVariantDropdown = require( '../views/font-variant-dropdown' ),
CurrentFontVariant = require( '../views/current-font-variant' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-control font-property-control',

	initialize: function( opts ) {
		this.menu = 'fontVariant';
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
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
			var currentFontVariant = this.currentFont.get( 'currentFvd' );
			return currentFontVariant || 'n4';
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
		this.currentFontView = new CurrentFontVariant( {
			type: this.type,
			menu: this.menu,
			currentFontVariant: this.getCurrentFontVariant(),
			multiOptions: multiOptions
		});
		this.$el.append( this.currentFontView.render().el );
		//Don't create the dropdown view if there is only one option
		if ( multiOptions ) {
			this.dropDownView = new FontVariantDropdown( {
				type: this.type,
				menu: this.menu,
				selectedAvailableFont: this.getSelectedAvailableFont(),
				currentFontVariant: this.getCurrentFontVariant()
			});
			this.$el.append( this.dropDownView.render().el );
		}
		return this;
	}

} );
