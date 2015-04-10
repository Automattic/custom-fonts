var Backbone = require( '../helpers/backbone' );
var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__current-font-weight',

	events: {
		'click' : 'toggleWeightDropdown'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.currentFontWeight = opts.currentFontWeight;
	},

	render: function() {
		this.$el.html( this.currentFontWeight );
		return this;
	},

	toggleWeightDropdown: function() {
		Emitter.trigger( 'toggle-font-weight', this.type );
	}

} );
