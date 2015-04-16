var expect = require( 'chai' ).expect;

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var FontVariantControl, fontVariantControl;

describe( 'FontVariantControl', function() {
	before( function() {
		helpers.before();
		FontVariantControl = require( '../../js/views/font-variant-control' );
		var currentFont = new Backbone.Model();
		var availableFonts = new Backbone.Collection();
		fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts });
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
	} );
} );

