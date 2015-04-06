var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' );

var testFont = {
	id: 'Alegreya',
	name: 'Alegreya',
	provider: 'google'
};

describe( 'availableFonts', function() {
	before( function() {
		helpers.before();
		mockery.registerMock( '../helpers/bootstrap', { fonts: [ testFont ] } );
	} );

	after( helpers.after );

	it( 'exports an array', function() {
		var availableFonts = require( '../../js/helpers/available-fonts' );
		expect( availableFonts ).to.be.instanceof( Array );
	} );

	it( 'exports fonts returned by the bootstrap module', function() {
		var availableFonts = require( '../../js/helpers/available-fonts' );
		expect( availableFonts ).to.include( testFont );
	} );
} );

