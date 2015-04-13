var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

// An individual font in the dropdown list, exported as
// `api.JetpackFonts.ProviderView`. Extend this object for each provider. The
// extended objects need to define a `render` method to render their provider's
// font name, as well as an `addFontToPage` method on the object itself.
var ProviderView = Backbone.View.extend({
	className: 'jetpack-fonts__option',

	events: {
		'click' : 'fontChanged'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.currentFont = opts.currentFont;
		if ( this.currentFont ) {
			this.listenTo( this.currentFont, 'change', this.render );
		}
	},

	// Warning: this should be overriden in the provider
	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		return this;
	},

	fontChanged: function() {
		Emitter.trigger( 'change-font', { font: this.model, type: this.type } );
	}
});

ProviderView.addFontToPage = function() {};

module.exports = ProviderView;
