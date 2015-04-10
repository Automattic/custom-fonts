var api = require( '../helpers/api' ),
	debug = require( 'debug' )( 'jetpack-fonts' ),
	getPrevewDocument = require( '../helpers/preview' ).getPrevewDocument,
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider;

// Initialize the default Provider Views
require( '../providers/google' );

// TODO: import these from the annotations files for this theme
var annotations = [
	{
		type: 'body-text',
		selector: 'body, button, input, select, textarea'
	},
	{
		type: 'headings',
		selector: '.entry-title, .site-title'
	},
];

function renderFontInPreview( font ) {
	debug( 'rendering live update for font', font );
	addFontToPage( font );
	changeElementFontTo( font );
}

function addFontToPage( font ) {
	// TODO: can we do this without instantiating the View?
	var ProviderView = getViewForProvider( font.provider );
	if ( ! ProviderView ) {
		debug( 'live update failed because no provider could be found for', font );
		return;
	}
	var providerView = new ProviderView({});
	providerView.addFontToPage( font );
}

function changeElementFontTo( font ) {
	setElementFontFamily( getElementSelectorForType( font.type ), font.name );
}

function resetFontToDefaultForType( type ) {
	setElementFontFamily( getElementSelectorForType( type ), '' );
}

function setElementFontFamily( selector, fontFamily ) {
	var preview = getPrevewDocument();
	var element = preview.querySelector( selector );
	if ( ! element ) {
		debug( 'live update failed because no page element could be found for', selector );
		return;
	}
	element.style.fontFamily = fontFamily;
}

function getElementSelectorForType( type ) {
	var match;
	annotations.forEach( function( annotation ) {
		if ( annotation.type === type ) {
			match = annotation.selector;
		}
	} );
	return match;
}

function getTypes() {
	return annotations.map( function( annotation ) {
		return annotation.type;
	} );
}

function liveUpdateFontsInPreview( selectedFonts ) {
	getTypes().forEach( function( type ) {
		resetFontToDefaultForType( type );
	} );
	selectedFonts.forEach( renderFontInPreview );
}

debug( 'binding live updates for custom-fonts' );
api( 'jetpack_fonts[selected_fonts]', function( value ) {
	value.bind( function( selectedFonts ) {
		liveUpdateFontsInPreview( selectedFonts );
	} );
} );


