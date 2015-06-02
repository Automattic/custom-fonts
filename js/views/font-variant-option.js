var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

var getFontVariantNameFromId = require( '../helpers/fvd-to-readable' ).getFontVariantNameFromId;

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-option jetpack-fonts__font-property-option',

	events: {
		'click' : 'setVariantOption'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.currentFontVariant = opts.currentFontVariant;
	},

	render: function() {
		this.$el.html( getFontVariantNameFromId( this.id ) );
		this.$el.data( 'id', this.id );
		if ( this.currentFontVariant === this.id ) {
			this.$el.addClass( 'current' );
		}
		return this;
	},

	setVariantOption: function() {
		Emitter.trigger( 'set-variant', { variant: this.id, type: this.type.id } );
	}

} );
