var expect = require( 'chai' ).expect;

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var defaultFontButton;

describe( 'DefaultFontButton', function() {
	before( function() {
		helpers.before();
		var DefaultFontButton = require( '../../js/views/default-font-button' );
		var font = new Backbone.Model();
		defaultFontButton = new DefaultFontButton({ currentFont: font });
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
	} );
} );


