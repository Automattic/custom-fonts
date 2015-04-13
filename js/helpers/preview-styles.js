var jQuery = require( '../helpers/backbone' ).$,
	debug = require( 'debug' )( 'jetpack-fonts' ),
	fvd = require( 'fvd' );

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

function getFontStyleElement() {
	return jQuery( '#jetpack-custom-fonts-css' )[ 0 ];
}

function removeFontStyleElement() {
	var element = getFontStyleElement();
	if ( element ) {
		jQuery( element ).remove();
	}
}

function writeFontStyles( styles ) {
	removeFontStyleElement();
	addStyleElementToPage( createStyleElementWith( generateCssFromStyles( styles ) ) );
}

function generateCssFromStyles( styles ) {
	if ( ! styles ) {
		return '';
	}
	return styles.reduce( function( css, style ) {
		css += generateCssForStyleObject( style );
		return css;
	}, '' );
}

function getSelectorForType( type ) {
	var match;
	annotations.forEach( function( annotation ) {
		if ( annotation.type === type ) {
			match = annotation.selector;
		}
	} );
	return match;
}

function generateCssForStyleObject( style ) {
	var selector = getSelectorForType( style.type );
	if ( ! selector ) {
		return '';
	}
	var css = selector + ' {';
	if ( style.name ) {
		css += 'font-family: ' + style.name + ';';
	}
	if ( style.fvds && Array.isArray( style.fvds ) && style.fvds.length === 1 ) {
		var code = style.fvds[ 0 ];
		var parsed = fvd.expand( code );
		if ( parsed ) {
			css += parsed;
		} else {
			debug( 'unable to parse fvd', code, 'for style', style );
		}
	} else {
		css += fvd.expand( 'n4' );
	}
	css += '} ';
	return css;
}

function createStyleElementWith( css ) {
	return jQuery( '<style id="jetpack-custom-fonts-css">' + css + '</style>');
}

function addStyleElementToPage( element ) {
	jQuery( 'head' ).append( element );
}

module.exports = {
	getFontStyleElement: getFontStyleElement,
	writeFontStyles: writeFontStyles,
	generateCssFromStyles: generateCssFromStyles,
	createStyleElementWith: createStyleElementWith,
	removeFontStyleElement: removeFontStyleElement,
	addStyleElementToPage: addStyleElementToPage
};
