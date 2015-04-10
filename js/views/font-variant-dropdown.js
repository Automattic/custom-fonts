var Backbone = require( '../helpers/backbone' );
var Emitter = require( '../helpers/emitter' );

var FontVariantOption = require( '../views/font-variant-option' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-dropdown',

	initialize: function( opts ) {
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.currentFontVariant = opts.currentFontVariant;
		this.listenTo( Emitter, 'set-variant', this.close );
		this.listenTo( Emitter, 'toggle-font-variant', this.toggle );
		this.listenTo( Emitter, 'close-open-menus', this.close );
	},

	render: function() {
		this.$el.html( '' );
		if ( this.selectedAvailableFont ) {
			var variantOptions = this.selectedAvailableFont.getFontVariantOptions();
			for ( var k in variantOptions ) {
				this.$el.append( new FontVariantOption( {
					type: this.type,
					id: k,
					name: variantOptions[k],
					currentFontVariant: this.currentFontVariant
				} ).render().el );
			}
		}
		return this;
	},

	toggle: function( type ) {
		if ( type !== this.type ) {
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
