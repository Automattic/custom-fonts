var expect = require( 'chai' ).expect;

var mockery = require( 'mockery' );

var bodyTextType = {
	fvdAdjust: false,
	id: 'body-text',
	name: 'Body Text',
	sizeRange: 3
};

describe( 'availableTypes', function() {
	before( function() {
		mockery.enable();
		mockery.registerAllowable( '../../js/helpers/available-types.js' );
		mockery.registerMock( '../helpers/bootstrap', { types: [ bodyTextType ] } );
	} );

	after( function() {
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'exports an array', function() {
		var availableTypes = require( '../../js/helpers/available-types.js' );
		expect( availableTypes ).to.be.instanceof( Array );
	} );

	it( 'exports types returned by the bootstrap module', function() {
		var availableTypes = require( '../../js/helpers/available-types.js' );
		expect( availableTypes ).to.include( bodyTextType );
	} );
} );
