var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' );

var bodyTextType = {
	fvdAdjust: false,
	id: 'body-text',
	name: 'Body Text',
	sizeRange: 3
};

describe( 'availableTypes', function() {
	before( function() {
		helpers.before();
		mockery.registerMock( '../helpers/bootstrap', { types: [ bodyTextType ] } );
	} );

	after( helpers.after );

	it( 'exports an array', function() {
		var availableTypes = require( '../../js/helpers/available-types.js' );
		expect( availableTypes ).to.be.instanceof( Array );
	} );

	it( 'exports types returned by the bootstrap module', function() {
		var availableTypes = require( '../../js/helpers/available-types.js' );
		expect( availableTypes ).to.include( bodyTextType );
	} );
} );
