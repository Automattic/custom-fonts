var expect = require( 'chai' ).expect;

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var defaultFontButton, currentFont;

describe( 'DefaultFontButton', function() {
	before( function() {
		helpers.before();
		var DefaultFontButton = require( '../../js/views/default-font-button' );
		currentFont = new Backbone.Model();
		defaultFontButton = new DefaultFontButton({ currentFont: currentFont });
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			expect( defaultFontButton ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		it( 'outputs some html', function() {
			Backbone.$( 'body' ).append( defaultFontButton.render().el );
			expect( Backbone.$( '.jetpack-fonts__default_button' ) ).to.have.length.above( 0 );
		} );

		it( 'is not active initially', function() {
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( view ).hasClass( 'active-button' ) ).to.be.equal( false );
		} );

		it( 'is not active when the current font is the default', function() {
			currentFont.set( 'id', 'jetpack-default-theme-font' );
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( view ).hasClass( 'active-button' ) ).to.be.false;
		} );

		it( 'is active when the current font is not the default', function() {
			currentFont.set( 'id', 'foobar' );
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( view ).hasClass( 'active-button' ) ).to.be.true;
		} );
	} );
} );
