var Backbone = require( '../helpers/backbone' ),
	translate = require( '../helpers/translate' );

var SelectedFont = require( '../models/selected-font' );

// A Collection of the current font settings for this theme
// We use a Model instead of an actual Collection because we can't otherwise
// hold two copies of the same font (same id).
module.exports = Backbone.Model.extend({

	initialize: function( data ) {
		if ( ! data ) {
			data = [];
		}
		var fonts = data.map( function( font ) {
			return new SelectedFont( font );
		} );
		this.set( 'fonts', fonts );
	},

	getFontByType: function( type ) {
		return this.get( 'fonts' ).reduce( function( previous, model ) {
			if ( model.get( 'type' ) === type ) {
				return model;
			}
			return previous;
		}, new SelectedFont( { type: type, displayName: translate( 'Default Theme Font' ) } ) );
	},

	setSelectedFont: function( font ) {
		var model = this.getFontByType( font.get( 'type' ) );
		model.clear( { silent: true } );
		if ( model && model.get( 'id' ) ) {
			model.set( font.attributes );
		} else {
			this.get( 'fonts' ).push( font );
		}
		this.trigger( 'change' );
	},

	toJSON: function() {
		// skip any fonts set to the default
		return this.get( 'fonts' ).reduce( function( previous, model ) {
			if ( model.get( 'id' ) ) {
				previous.push( model.toJSON() );
			}
			return previous;
		}, [] );
	}
});

