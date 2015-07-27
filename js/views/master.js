var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' ),
	debug = require( 'debug' )( 'jetpack-fonts:MasterView' ),
	availableFonts = require( '../helpers/available-fonts' ),
	availableTypes = require( '../helpers/available-types' );

var FontType = require( '../views/font-type' ),
	AvailableFonts = require( '../collections/available-fonts' );

var DefaultFont = require( '../models/default-font' );

// Initialize the default Provider Views
require( '../providers/google' );

// The main font control View, containing sections for each setting type
module.exports = Backbone.View.extend( {
	initialize: function( opts ) {
		this.selectedFonts = opts.selectedFonts;
		debug( 'init with currently selected fonts:', this.selectedFonts.toJSON() );
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
		var model = this.selectedFonts.getFontByType( data.type );
		model.set( 'currentFvd', data.variant );
		this.selectedFonts.setSelectedFont( model.toJSON() );
		Emitter.trigger( 'close-open-menus' );
	},

	setFontSize: function( data ) {
		debug( 'font size changed', data );
		var model = this.selectedFonts.getFontByType( data.type );
		model.set( 'size', data.size );
		this.selectedFonts.setSelectedFont( model.toJSON() );
		Emitter.trigger( 'close-open-menus' );
	},

	updateCurrentFont: function( data ) {
		data.font.set( { type: data.type } );
		this.selectedFonts.setSelectedFont( data.font.toJSON() );
		debug( 'updateCurrentFont with', data.font.toJSON(), 'to', this.selectedFonts.getFontByType( data.type ).toJSON() );
		// Setting headings type overwrites the deprecated site-title type
		if ( data.type === 'headings' ) {
			this.updateCurrentFont( { font: new DefaultFont(), type: 'site-title' } );
		}
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
		var view = new FontType( {
			type: type,
			currentFont: this.selectedFonts.getFontByType( type.id ),
			fontData: fonts
		} );
		this.$el.append( view.render().el );
		return view;
	},

	loadFonts: function() {
		Emitter.trigger( 'load-menu-fonts' );
	}

} );
