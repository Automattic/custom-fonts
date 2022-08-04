var api = require( '../helpers/api' ),
	bootstrap = require( '../helpers/bootstrap' );

var WebFont = require( '../helpers/webfont' );

var loadedFontIds = [];

function addFontToControls( font, text ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	WebFont.load({
		google: { families: [ font.id ], text: text },
		classes: false,
		events: false
	});
}

function addFontToPreview( font ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	var familyString = font.id + ':100,200,300,400,500,600,700,800,900,100italic,200italic,300italic,400italic,500italic,600italic,700italic,800italic,900italic';
	if ( bootstrap.providerData && bootstrap.providerData.googleSubsetString ) {
		var subsetString = bootstrap.providerData.googleSubsetString;
		if ( subsetString && subsetString.length > 0 ) {
			familyString += ':' + subsetString;
		}
	}
	WebFont.load( { google: { families: [ familyString ] } } );
}

var GoogleProviderView = api.JetpackFonts.ProviderView.extend( {

	render: function() {
		this.$el.html( this.model.get( 'displayName' ) );

		this.$el.css( 'font-family', '"' + this.model.get( 'cssName' ) + '"' );
		if ( this.currentFont && this.currentFont.get( 'id' ) === this.model.get( 'id' ) ) {
			this.$el.addClass( 'active' );
		} else {
			this.$el.removeClass( 'active' );
		}
		if ( !this.disableFocus ) {
			this.$el.attr( 'tabindex', '0' );
		}
		addFontToControls( this.model.toJSON(), this.model.get( 'id' ) );
		return this;
	}
} );

GoogleProviderView.addFontToPreview = addFontToPreview;

api.JetpackFonts.providerViews.google = GoogleProviderView;

module.exports = GoogleProviderView;
