var Backbone = require( '../helpers/backbone' );
var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__current-font-variant',

	events: {
		'click' : 'toggleVariantDropdown'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.currentFontVariant = opts.currentFontVariant;
	},

	render: function() {
		this.$el.html( this.currentFontVariant );
		return this;
	},

	toggleVariantDropdown: function() {
		Emitter.trigger( 'toggle-dropdown', { type: this.type, menu: this.menu } );
	}

} );
