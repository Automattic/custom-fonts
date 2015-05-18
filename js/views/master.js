var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' ),
	debug = require( 'debug' )( 'jetpack-fonts' ),
	availableFonts = require( '../helpers/available-fonts' ),
	availableTypes = require( '../helpers/available-types' ),
	translate = require( '../helpers/translate' );

var FontType = require( '../views/font-type' ),
	AvailableFonts = require( '../collections/available-fonts' );

// Initialize the default Provider Views
require( '../providers/google' );

// The main font control View, containing sections for each setting type
module.exports = Backbone.View.extend({
	initialize: function() {
		debug( 'init with currently selected fonts:', this.collection.toJSON() );
		this.typeViews = [];
		this.headingFonts = new AvailableFonts( availableFonts );
		this.bodyFonts = new AvailableFonts( this.headingFonts.where( { bodyText: true } ) );
		this.listenTo( Emitter, 'change-font', this.updateCurrentFont );
		this.listenTo( Emitter, 'set-variant', this.setFontVariant );
		this.listenTo( Emitter, 'set-size', this.setFontSize );
	},

	closeAllMenus: function() {
		Emitter.trigger( 'close-open-menus' );
	},

	setFontVariant: function( data ) {
		debug( 'font variant changed', data );
		var model = this.findModelWithType( data.type );
		model.set( 'currentFvd', data.variant );
		Emitter.trigger( 'close-open-menus' );
	},

	setFontSize: function( data ) {
		debug( 'font size changed', data );
		var model = this.findModelWithType( data.type );
		model.set( 'size', data.size );
		Emitter.trigger( 'close-open-menus' );
	},

	updateCurrentFont: function( data ) {
		var model = this.findModelWithType( data.type );
		model.set( data.font.attributes );
		if ( data.fvd ) {
			model.set( 'currentFvd', data.fvd );
		} else {
			model.unset( 'currentFvd' );
		}
		model.unset( 'size' );
		debug( 'updateCurrentFont with', data.font.toJSON(), 'to', model.toJSON() );
		Emitter.trigger( 'close-open-menus' );
	},

	render: function() {
		this.typeViews.forEach( function( view ) {
			view.remove();
		} );
		this.$el.text( '' ); // TODO: better to update each View than overwrite
		debug( 'rendering controls for font types', availableTypes );
		this.typeViews = availableTypes.map( this.renderTypeControl.bind( this ) );
		return this;
	},

	renderTypeControl: function( type ) {
		var fonts;
		if ( type.bodyText === true ) {
			fonts = this.bodyFonts;
		} else {
			fonts = this.headingFonts;
		}
		var view = new FontType({
			type: type,
			currentFont: this.findModelWithType( type ),
			fontData: fonts
		});
		this.$el.append( view.render().el );
		return view;
	},

	loadFonts: function() {
		Emitter.trigger( 'load-menu-fonts' );
	},

	findModelWithType: function( type ) {
		var model = this.collection.find( function( model ) {
			return ( model.get( 'type' ) === type.id );
		} );
		if ( ! model ) {
			model = this.collection.add( {
				type: type.id,
				displayName: translate( 'Default Theme Font' )
			} );
		}
		return model;
	}
});
