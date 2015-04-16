var expect = require( 'chai' ).expect,
	sinon = require( 'sinon' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var FontVariantControl, fontVariantControl, currentFont;

describe( 'FontVariantControl', function() {
	before( function() {
		helpers.before();
		FontVariantControl = require( '../../js/views/font-variant-control' );
		currentFont = new Backbone.Model();
		var availableFonts = new Backbone.Collection();
		fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: 'headings' });
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			expect( fontVariantControl ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			fontVariantControl.remove();
		} );

		it( 'outputs some html', function() {
			Backbone.$( 'body' ).append( fontVariantControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-variant-control' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a CurrentFontVariant', function() {
			Backbone.$( 'body' ).append( fontVariantControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font-variant' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a FontVariantDropdown', function() {
			Backbone.$( 'body' ).append( fontVariantControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-variant-dropdown' ) ).to.have.length.above( 0 );
		} );

		it( 're-renders when currentFont changes', function() {
			var spy = sinon.spy( fontVariantControl, 'render' );
			// We have to re-initialize because the event listener binding happens
			// there and it needs to bind to the spy.
			fontVariantControl.initialize( fontVariantControl );
			currentFont.set( 'id', 'barfoo' );
			expect( spy ).to.have.been.called;
		} );
	} );

	describe( '.currentFontVariant()', function() {
		it( 'returns the current font variant name if one is set' );
		it( 'returns "Regular" if a font is selected but has no fvd' );
		it( 'returns null if no font is selected' );
		it( 'returns null if a font is selected but has fvdAdjust set to false' );
	} );
} );

