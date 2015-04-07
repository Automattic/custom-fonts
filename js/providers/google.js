/* globals WebFont */
var api = require( '../helpers/api' );

function addFontToPage( fontId ) {
	// TODO: only load the characters we need and prevent duplicate loads
	WebFont.load( { google: { families: [ fontId ] } } );
}

var GoogleProviderView = api.JetpackFonts.ProviderView.extend({
	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		this.$el.css( 'font-family', '"' + this.model.get( 'name' ) + '"' );
		addFontToPage( this.model.get( 'id' ) );
		return this;
	}
});

api.JetpackFonts.providerViews.google = GoogleProviderView;

module.exports = GoogleProviderView;
