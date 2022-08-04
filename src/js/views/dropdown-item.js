var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

// An individual font in the dropdown list, exported as
// `api.JetpackFonts.ProviderView`. Extend this object for each provider. The
// extended objects need to define a `render` method to render their provider's
// font name, as well as `addFontToControls` and `addFontToPreview` methods on the object itself.
var ProviderView = Backbone.View.extend( {
	className: 'jetpack-fonts__option',

	events: {
		'click': 'fontChanged',
		'keydown': 'checkKeyboardSelect'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.currentFont = opts.currentFont;
		this.disableFocus = Boolean( opts.disableFocus );
		if ( this.currentFont ) {
			this.listenTo( this.currentFont, 'change', this.render );
		}
	},

	checkKeyboardSelect: function( event ) {
		if ( event.key === 'Enter' ) {
			this.$el.click();
		}
	},

	// Warning: this should be overriden in the provider
	render: function() {
		this.$el.html( this.model.get( 'displayName' ) );
		return this;
	},

	fontChanged: function() {
		if ( this.currentFont && this.currentFont !== this.model ) {
			Emitter.trigger( 'change-font', { font: this.model, type: this.type.id } );
		}
	}
} );

ProviderView.addFontToControls = function() {};

module.exports = ProviderView;
