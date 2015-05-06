var api = require( '../helpers/api' );

var fvd = require( 'fvd' );

var WebFont = require( '../helpers/webfont' );

var loadedFontIds = [];

function addFontToControls( font, text ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	WebFont.load( { google: { families: [ font.id ], text: text } } );
}

function addFontToPreview( font ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	var familyString = font.id + ':100,200,300,400,500,600,700,800,900,100italic,200italic,300italic,400italic,500italic,600italic,700italic,800italic,900italic';
	WebFont.load( { google: { families: [ familyString ] } } );
}

var GoogleProviderView = api.JetpackFonts.ProviderView.extend({


	render: function() {
		this.$el.html( this.model.get( 'displayName' ) );

		var currentFvd;
		if ( this.model.get( 'currentFvd' ) ) {
			currentFvd = this.model.get( 'currentFvd' );
		} else if ( this.currentFont && this.currentFont.get( 'currentFvd' ) ) {
			currentFvd = this.currentFont.get( 'currentFvd' );
		}
		if ( currentFvd ) {
			var cssBlock = fvd.expand( currentFvd );
			cssBlock.split(';').forEach( function( rule ) {
				var property = rule.split(':')[0];
				var value = rule.split(':')[1];

				if ( rule !== '' && property !== '' && value !== '' ) {
					this.$el.css( property, value );
				}
			}.bind( this ) );

			this.$el.attr( 'data-fvd', currentFvd );
		}

		this.$el.css( 'font-family', '"' + this.model.get( 'cssName' ) + '"' );
		if ( this.currentFont && this.currentFont.get( 'id' ) === this.model.get( 'id' ) ) {
			this.$el.addClass( 'active' );
		} else {
			this.$el.removeClass( 'active' );
		}
		addFontToControls( this.model.toJSON(), this.model.get( 'id' ) );
		return this;
	}
});

GoogleProviderView.addFontToPreview = addFontToPreview;

api.JetpackFonts.providerViews.google = GoogleProviderView;

module.exports = GoogleProviderView;
