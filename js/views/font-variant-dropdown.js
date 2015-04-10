var Emitter = require( '../helpers/emitter' );

var FontVariantOption = require( '../views/font-variant-option' ),
DropdownTemplate = require( '../views/dropdown-template' );

module.exports = DropdownTemplate.extend( {
	className: 'jetpack-fonts__font-variant-dropdown',

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call(this);
		this.type = opts.type;
		this.menu = opts.menu;
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.currentFontVariant = opts.currentFontVariant;
		this.listenTo( Emitter, 'set-variant', this.close );
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
	}

} );
