/* globals WebFont */
var api = require( '../helpers/api' );

var loadedFontIds = [];

function addFontToPage( font, text ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	WebFont.load( { google: { families: [ font.id ], text: text } } );
}

var GoogleProviderView = api.JetpackFonts.ProviderView.extend({
	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		this.$el.css( 'font-family', '"' + this.model.get( 'name' ) + '"' );
		if ( this.currentFont && this.currentFont.get( 'name' ) === this.model.get( 'name' ) ) {
			this.$el.addClass( 'active' );
		} else {
			this.$el.removeClass( 'active' );
		}
		addFontToPage( this.model.toJSON(), this.model.get( 'id' ) );
		return this;
	},

	addFontToPage: addFontToPage
});

api.JetpackFonts.providerViews.google = GoogleProviderView;

module.exports = GoogleProviderView;
