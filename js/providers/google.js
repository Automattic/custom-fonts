/* globals WebFont */
var api = require( '../helpers/api' );

var loadedFontIds = [];

function addFontToPage( fontId ) {
	if ( ~ loadedFontIds.indexOf( fontId ) ) {
		return;
	}
	loadedFontIds.push( fontId );
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
