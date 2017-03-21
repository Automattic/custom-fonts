var expect = require( 'chai' ).expect;

var helpers = require( './test-helper' );

var testFont = {
	id: 'Alegreya',
	cssName: 'Alegreya',
	displayName: 'Alegreya',
	provider: 'google',
	fvds: [ 'n4', 'i7' ]
};

var AvailableFont;

describe( 'availableFont', function() {
	before( function() {
		helpers.before();
		AvailableFont = require( '../../src/js/models/available-font' );
	} );

	after( helpers.after );

	describe( '.getFontVariantOptions()', function() {
		it( 'returns an array of fvd strings', function() {
			var availableFont = new AvailableFont( testFont );
			expect( availableFont.getFontVariantOptions() ).to.include( 'n4' );
			expect( availableFont.getFontVariantOptions() ).to.include( 'i7' );
		} );
	} );
} );

