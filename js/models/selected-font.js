var Backbone = require( '../helpers/backbone' ),
	translate = require( '../helpers/translate' ),
	availableTypes = require( '../helpers/available-types' ),
	_ = require( '../helpers/underscore' ),
	debug = require( 'debug' )( 'jetpack_fonts:selected-font' );

// A Model for a currently set font setting for this theme
module.exports = Backbone.Model.extend( {
	initialize: function() {
		this.maybeSetCurrentFvd();
	},
	defaults: {
		'displayName': translate( 'Default Theme Font' )
	},
	set: function() {
		Backbone.Model.prototype.set.apply( this, arguments );
		this.maybeSetCurrentFvd();
	},
	maybeSetCurrentFvd: function() {
		var type;
		if ( this.get( 'currentFvd' ) ) {
			debug( 'Font already has an fvd', this.get( 'currentFvd' ) );
			return;
		}
		if ( ! this.get( 'id' ) ) {
			return;
		}
		type = _.findWhere( availableTypes, { id: this.get( 'type' ) } );
		if ( ! type || ! type.fvdAdjust || ! this.get( 'fvds' ) ) {
			return;
		}
		this.set( 'currentFvd', this.pickFvd() );
		debug( 'Fvd now set to: ', this.get( 'currentFvd' ) );
	},
	pickFvd: function() {
		// algorithm here: https://developer.mozilla.org/en/docs/Web/CSS/font-weight#Fallback
		// we always go for 400 weight first.
		var variations = this.get( 'fvds' );
		// first try n4
		var i = 4;
		if ( this.hasVariation( 'n' + i, variations ) ) {
			return 'n' + i;
		}
		// next we try n5
		i = 5;
		if ( this.hasVariation( 'n' + i, variations ) ) {
			return 'n' + i;
		}
		// now we go lighter, to 3-1
		for ( i = 3; i >= 1; i-- ) {
			if ( this.hasVariation( 'n' + i, variations ) ) {
				return 'n' + i;
			}
		}
		// now darker, 6-9
		for ( i = 6; i <= 9; i++ ) {
			if ( this.hasVariation( 'n' + i, variations ) ) {
				return 'n' + i;
			}
		}
		// I guess just return n4 anyway
		return 'n4';
	},
	hasVariation: function( fvd, fvds ) {
		return _.contains( fvds, fvd );
	}
} );
