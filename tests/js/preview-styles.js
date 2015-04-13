var expect = require( 'chai' ).expect,
	Backbone = require( 'backbone' );

var helpers = require( './test-helper' );

var currentFontData = [
  {
    'type': 'body-text',
    'name': 'Lobster Two',
    'id': 'Lobster+Two',
    'fvds': [ 'n8' ],
    'subsets': [
      'latin'
    ],
    'provider': 'google'
  },
  {
    'type': 'headings',
    'name': 'Cinzel',
    'id': 'Cinzel',
    'fvds': {
      'n4': 'Regular',
      'n7': 'Bold',
      'n9': 'Black'
    },
    'subsets': [
      'latin'
    ],
    'provider': 'google'
  }
];

var PreviewStyles;

describe( 'PreviewStyles', function() {
	before( function() {
		helpers.before();
		PreviewStyles = require( '../../js/helpers/preview-styles' );
	} );

	after( helpers.after );

	afterEach( function() {
		Backbone.$( '#jetpack-custom-fonts-css' ).remove();
	} );

	describe( 'getFontStyleElement', function() {
		it( 'returns the correct DOM element if one exists', function() {
			Backbone.$( 'head' ).append( '<style id="jetpack-custom-fonts-css">.site-title{ font-weight: 400; }</style>' );
			expect( PreviewStyles.getFontStyleElement().id ).to.equal( 'jetpack-custom-fonts-css' );
			Backbone.$( '#jetpack-custom-fonts-css' ).remove();
		} );

		it( 'returns falsy if no matching style element exists', function() {
			Backbone.$( '#jetpack-custom-fonts-css' ).remove();
			expect( PreviewStyles.getFontStyleElement() ).to.not.be.ok;
		} );
	} );

	describe( 'generateCssFromStyles', function() {
		it( 'returns the correct css font-family for a css object', function() {
			expect( PreviewStyles.generateCssFromStyles( currentFontData ) ).to.match( /font-family:\s?Lobster Two/ );
		} );

		it( 'returns the correct css font-weight for a css object', function() {
			expect( PreviewStyles.generateCssFromStyles( currentFontData ) ).to.match( /font-weight:\s?800/ );
		} );

		it( 'returns the correct css font-style for a css object', function() {
			expect( PreviewStyles.generateCssFromStyles( currentFontData ) ).to.match( /font-style:\s?normal/ );
		} );

		it ( 'returns the default css font-weight for a style that lists multiple fvds', function() {
			expect( PreviewStyles.generateCssFromStyles( [ currentFontData[ 1 ] ] ) ).to.match( /font-weight:\s?400/ );
		} );
	} );

	describe( 'createStyleElementWith', function() {
		it( 'returns a DOM element with the correct ID', function() {
			var out = PreviewStyles.createStyleElementWith( '.site-title{font-weight: 400;}' );
			expect( out[ 0 ].id ).to.equal( 'jetpack-custom-fonts-css' );
		} );
	} );

	describe( 'addStyleElementToPage', function() {
		it( 'appends the element to the DOM', function() {
			var element = Backbone.$( '<style id="something"></style>' );
			PreviewStyles.addStyleElementToPage( element );
			expect( Backbone.$( '#something' ) ).to.have.length.above( 0 );
		} );
	} );

	describe( 'removeFontStyleElement', function() {
		it( 'removes the existing style element from the DOM', function() {
			Backbone.$( 'head' ).append( '<style id="jetpack-custom-fonts-css">.site-title{ font-weight: 400; }</style>' );
			PreviewStyles.removeFontStyleElement();
			expect( Backbone.$( '#jetpack-custom-fonts-css' ) ).to.have.length( 0 );
		} );

		it( 'does not fail if there is no existing style element', function() {
			Backbone.$( '#jetpack-custom-fonts-css' ).remove();
			PreviewStyles.removeFontStyleElement();
			expect( Backbone.$( '#jetpack-custom-fonts-css' ) ).to.have.length( 0 );
		} );
	} );

	describe( 'writeFontStyles', function() {
		it( 'removes the existing style element from the DOM', function() {
			Backbone.$( 'head' ).append( '<style id="jetpack-custom-fonts-css">.site-title{ font-weight: 400; }</style>' );
			PreviewStyles.writeFontStyles( currentFontData );
			expect( Backbone.$( '#jetpack-custom-fonts-css' ) ).to.have.length( 1 );
		} );

		it( 'adds a style element to the DOM', function() {
			PreviewStyles.writeFontStyles( currentFontData );
			expect( Backbone.$( '#jetpack-custom-fonts-css' ) ).to.have.length( 1 );
		} );

		it( 'adds the correct css styles to the page', function() {
			PreviewStyles.writeFontStyles( currentFontData );
			var element = Backbone.$( '#jetpack-custom-fonts-css' );
			expect( element.text() ).to.match( /font-style:\s?normal/ );
			expect( element.text() ).to.match( /font-weight:\s?400/ );
			expect( element.text() ).to.match( /font-family:\s?Lobster Two/ );
		} );
	} );

} );

