var jQuery = require( '../helpers/backbone' ).$,
	debug = require( 'debug' )( 'jetpack-fonts:css' ),
	fvd = require( 'fvd' ),
	annotations = require( '../helpers/annotations' );

function generateCssForStyleObject( style ) {
	if ( ! annotations ) {
		debug( 'no annotations found at all; cannot generate css' );
		return;
	}
	debug( 'generating css for style type', style.type, 'using these annotations:', annotations[ style.type ] );
	if ( ! annotations[ style.type ] || annotations[ style.type ].length < 1 ) {
		debug( 'no annotations found for style type', style.type, '; existing annotations:', annotations );
		return;
	}
	return annotations[ style.type ].map( generateCssForAnnotation.bind( null, style ) ).join( ' ' );
}

function generateCssForAnnotation( style, annotation ) {
	if ( ! annotation.selector ) {
		return '';
	}
	debug( 'generateCssForAnnotation for style', style.cssName, 'and annotation', annotation );
	var css = generateCssSelector( annotation.selector ) + ' {';
	if ( style.cssName ) {
		var family = generateFontFamily( style.cssName, annotation );
		if ( family && family.length > 0 ) {
			css += 'font-family:' + family + ';';
		}
	}
	css += 'font-weight:' + generateFontWeight( style.currentFvd, annotation ) + ';';
	css += 'font-style:' + generateFontStyle( style.currentFvd, annotation ) + ';';
	if ( style.size ) {
		var size = generateFontSize( style.size, annotation );
		if ( size && size.length > 0 ) {
			css += 'font-size:' + size + ';';
		}
	}
	css += '}';
	debug( 'generated css for', style, 'is', css );
	return css;
}

function generateCssSelector( selectorGroup ) {
	return selectorGroup.split( /,\s*/ ).reduce( function( previous, selector ) {
		previous.push( '.wf-active ' + selector );
		return previous;
	}, [] ).join( ', ' );
}

function generateFontStyle( currentFvd, annotation ) {
	if ( currentFvd ) {
		var parsed = fvd.parse( currentFvd );
		if ( parsed && parsed['font-style'] ) {
			return parsed['font-style'];
		}
	}
	var annotationStyle = getFontStyleFromAnnotation( annotation );
	if ( annotationStyle ) {
		return annotationStyle;
	}
	return 'normal';
}

function getFontStyleFromAnnotation( annotation ) {
	var originalStyleString;
	getAnnotationRules( annotation ).forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-style' ) {
			originalStyleString = rule.value;
		}
	} );
	return originalStyleString;
}

function generateFontWeight( currentFvd, annotation ) {
	if ( currentFvd ) {
		var parsed = fvd.parse( currentFvd );
		if ( parsed && parsed['font-weight'] ) {
			return parsed['font-weight'];
		}
	}
	var annotationWeight = getFontWeightFromAnnotation( annotation );
	if ( annotationWeight ) {
		return annotationWeight;
	}
	return '400';
}

function getFontWeightFromAnnotation( annotation ) {
	var originalWeightString;
	getAnnotationRules( annotation ).forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-weight' ) {
			originalWeightString = rule.value;
		}
	} );
	return originalWeightString;
}

function generateFontFamily( family, annotation ) {
	var families = [];
	var annotationFamily = getFontFamilyFromAnnotation( annotation );
	if ( annotationFamily ) {
		if ( family[0] !== '"' && family[0] !== "'" ) {
			family = '"' + family + '"';
		}
		families.push( family );
		families.push( annotationFamily );
	}
	return families.join( ', ' );
}

function getAnnotationRules( annotation ) {
	if ( ! annotation.rules || ! annotation.rules.length ) {
		debug( 'no annotation rules found for', annotation );
		return [];
	}
	return annotation.rules;
}

function getFontFamilyFromAnnotation( annotation ) {
	var original;
	getAnnotationRules( annotation ).forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-family' && 'inherit' !== rule.value ) {
			original = rule.value;
		}
	} );
	return original;
}

function generateFontSize( size, annotation ) {
	var originalSizeString = getFontSizeFromAnnotation( annotation );
	if ( ! originalSizeString ) {
		return;
	}
	var units = parseUnits( originalSizeString );
	var originalSize = parseSize( originalSizeString );
	var scale = ( parseInt( size, 10 ) * 0.06 ) + 1;
	return ( scale * originalSize ).toFixed( 1 ) + units;
}

function getFontSizeFromAnnotation( annotation ) {
	var originalSizeString;
	getAnnotationRules( annotation ).forEach( function( rule ) {
		if ( rule.value && rule.property === 'font-size' ) {
			originalSizeString = rule.value;
		}
	} );
	return originalSizeString;
}

function parseUnits( sizeString ) {
	var matches = sizeString.match( /((\d*\.(\d+))|(\d+))([A-Za-z]{2,3}|%)/ );
	return matches[ 5 ];
}

function parseSize( sizeString ) {
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
		var css = PreviewStyles.generateCssFromStyles( styles );
		debug( 'css generation complete:', css );
		PreviewStyles.addStyleElementToPage( PreviewStyles.createStyleElementWith( css ) );
	},

	generateCssFromStyles: function( styles ) {
		if ( ! styles ) {
			debug( 'generating empty css because there are no styles' );
			return '';
		}
		debug( 'generating css for styles', styles );
		return styles.reduce( function( css, style ) {
			css += generateCssForStyleObject( style );
			return css;
		}, '' );
	},

	createStyleElementWith: function( css ) {
		return jQuery( '<style id="jetpack-custom-fonts-css">' + css + '</style>' );
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
