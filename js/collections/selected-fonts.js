/* globals Backbone */

var SelectedFont = require( '../models/selected-font' );

// A Collection of the current font settings for this theme
module.exports = Backbone.Collection.extend({

	model: SelectedFont,

	toJSON: function() {
		// skip any fonts set to the default
		return this.reduce( function( previous, model ) {
			if ( model.get( 'id' ) && model.get( 'id' ) !== 'jetpack-default-theme-font' ) {
				previous.push( model.toJSON() );
			}
			return previous;
		}, [] );
	}
});

