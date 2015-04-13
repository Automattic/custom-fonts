var api = require( '../helpers/api' ),
	debug = require( 'debug' )( 'jetpack-fonts' ),
	parseFvd = require( 'fvd' ).parse,
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
	var ProviderView = getViewForProvider( font.provider );
	if ( ! ProviderView ) {
		debug( 'live update failed because no provider could be found for', font );
		return;
	}
	ProviderView.addFontToPage( font );
}

function changeElementFontTo( font ) {
	var selector = getElementSelectorForType( font.type );
	setElementFontFamily( selector, font.name );
	var fvd = getFvdFromFont( font );
	setElementFontVariant( selector, fvd );
}

function getFvdFromFont( font ) {
	if ( font.fvds.length === 1 ) {
		return font.fvds[ 0 ];
	}
	return 'n4';
}

function resetFontToDefaultForType( type ) {
	var selector = getElementSelectorForType( type );
	setElementFontFamily( selector, '' );
	setElementFontVariant( selector, '' );
}

function setElementFontVariant( selector, fvd ) {
	var preview = getPrevewDocument();
	var elements = preview.querySelectorAll( selector );
	if ( ! elements || elements.length < 1 ) {
		debug( 'live update failed because no page element could be found for', selector );
		return;
	}
	debug( 'live updating fvd to', fvd, 'for selector', selector, 'found', elements.length, 'elements' );
	var styles = parseFvd( fvd ) || {};
	[ 'font-style', 'font-weight' ].forEach( function( property ) {
		Array.prototype.forEach.call( elements, function( element ) {
			if ( styles[ property ] ) {
				element.style[ property ] = styles[ property ];
			} else {
				element.style[ property ] = 'inherit';
			}
		} );
	} );
}

function setElementFontFamily( selector, fontFamily ) {
	var preview = getPrevewDocument();
	var elements = preview.querySelectorAll( selector );
	if ( ! elements || elements.length < 1 ) {
		debug( 'live update failed because no page element could be found for', selector );
		return;
	}
	debug( 'live updating family to', fontFamily, 'for selector', selector, 'found', elements.length, 'elements' );
	Array.prototype.forEach.call( elements, function( element ) {
		element.style.fontFamily = fontFamily;
	} );
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

function init() {
	debug( 'binding live updates for custom-fonts' );
	api( 'jetpack_fonts[selected_fonts]', function( value ) {
		value.bind( function( selectedFonts ) {
			liveUpdateFontsInPreview( selectedFonts );
		} );
	} );
}

module.exports = {
	liveUpdateFontsInPreview: liveUpdateFontsInPreview
};

init();
