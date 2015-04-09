var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' ),
	debug = require( 'debug' )( 'jetpack-fonts' ),
	availableFonts = require( '../helpers/available-fonts' ),
	availableTypes = require( '../helpers/available-types' );

var FontType = require( '../views/font-type' ),
	AvailableFonts = require( '../collections/available-fonts' );

// Initialize the default Provider Views
require( '../providers/google' );

// The main font control View, containing sections for each setting type
module.exports = Backbone.View.extend({
	initialize: function() {
		debug( 'init' );
		this.availableFonts = new AvailableFonts( availableFonts );
		this.listenTo( Emitter, 'change-font', this.updateCurrentFont );
		this.listenTo( Emitter, 'set-weight', this.setFontWeight );
	},

	setFontWeight: function( data ) {
		var model = this.findModelWithType( data.type );
		model.set( 'fvds', [data.weight] );
	},

	updateCurrentFont: function( data ) {
		var model = this.findModelWithType( data.type );
		model.set( data.font.attributes );
		debug( 'updateCurrentFont with', data.font.toJSON(), 'to', model.toJSON() );
	},

	render: function() {
		this.$el.text( '' ); // TODO: better to update each View than overwrite
		debug( 'rendering controls for font types', availableTypes );
		availableTypes.forEach( this.renderTypeControl.bind( this ) );
		return this;
	},

	renderTypeControl: function( type ) {
		this.$el.append( new FontType({
			type: type,
			currentFont: this.findModelWithType( type ),
			fontData: this.availableFonts
		}).render().el );
	},

	findModelWithType: function( type ) {
		var model = this.collection.find( function( model ) {
			return ( model.get( 'type' ) === type.id );
		} );
		if ( ! model ) {
			model = this.collection.add( {
				type: type.id,
				name: 'Default Theme font'
			} );
		}
		return model;
	}
});
