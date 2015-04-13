var jQuery = require( '../helpers/backbone' ).$,
	debug = require( 'debug' )( 'jetpack-fonts' ),
	fvd = require( 'fvd' ),
	annotations = require( '../helpers/annotations' );

function getAnnotationsForType( type ) {
	return annotations.filter( function( annotation ) {
		return ( annotation.type === type );
	} );
}

function generateCssForStyleObject( style ) {
	return getAnnotationsForType( style.type ).map( generateCssForAnnotation.bind( null, style ) ).join( ' ' );
}

function generateCssForAnnotation( style, annotation ) {
	if ( ! annotation.selector ) {
		return '';
	}
	var css = annotation.selector + ' {';
	if ( style.name ) {
		css += 'font-family:' + style.name + ';';
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
	if ( style.size ) {
		css += 'font-size: ' + generateFontSize( style.size, annotation ) + ';';
	}
	css += '}';
	return css;
}

function generateFontSize( size, annotation ) {
	var originalSizeString = getFontSizeFromAnnotation( annotation ) || '16px';
	var units = parseUnits( originalSizeString );
	var originalSize = parseSize( originalSizeString );
	var scale = ( parseInt( size, 10 ) * 0.06 ) + 1;
	return ( scale * originalSize ).toFixed( 1 ) + units;
}

function getFontSizeFromAnnotation( annotation ) {
	if ( ! annotation.rules ) {
		return;
	}
	var originalSizeString;
	annotation.rules.forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-size' ) {
			originalSizeString = rule.value;
		}
	} );
	return originalSizeString;
}

function parseUnits( sizeString ) {
	// TODO: clean up this Regexp
	var matches = sizeString.match( /((\d*\.(\d+))|(\d+))([A-Za-z]{2,3}|%)/ );
	return matches[ 5 ];
}

function parseSize( sizeString ) {
	// TODO: clean up this Regexp
	var matches = sizeString.match( /((\d*\.(\d+))|(\d+))([A-Za-z]{2,3}|%)/ );
	var size, precision;
	if ( matches[ 4 ] ) {
		size = parseInt( matches[ 4 ], 10 );
		precision = ( size > 9 ) ? 1 : 3;
	} else {
		size = parseFloat( matches[ 2 ] );
		precision = matches[ 3 ].length + 1;
	}
	return size.toFixed( precision );
}

var PreviewStyles = {
	getFontStyleElement: function() {
		return jQuery( '#jetpack-custom-fonts-css' )[ 0 ];
	},

	writeFontStyles: function( styles ) {
		PreviewStyles.removeFontStyleElement();
		PreviewStyles.addStyleElementToPage( PreviewStyles.createStyleElementWith( PreviewStyles.generateCssFromStyles( styles ) ) );
	},

	generateCssFromStyles: function( styles ) {
		if ( ! styles ) {
			return '';
		}
		return styles.reduce( function( css, style ) {
			css += generateCssForStyleObject( style );
			return css;
		}, '' );
	},

	createStyleElementWith: function( css ) {
		return jQuery( '<style id="jetpack-custom-fonts-css">' + css + '</style>');
	},

	removeFontStyleElement: function() {
		var element = PreviewStyles.getFontStyleElement();
		if ( element ) {
			jQuery( element ).remove();
		}
	},

	addStyleElementToPage: function( element ) {
		jQuery( 'head' ).append( element );
	}

};

module.exports = PreviewStyles;
