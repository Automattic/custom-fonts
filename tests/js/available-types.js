var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' );

var headingsTextType = {
	fvdAdjust: false,
	id: 'headings',
	cssName: 'Heading Text',
	displayName: 'Heading Text',
	sizeRange: 3
};

var bodyTextType = {
	fvdAdjust: false,
	id: 'body-text',
	cssName: 'Body Text',
	displayName: 'Body Text',
	sizeRange: 3
};

var miscTextType = {
	fvdAdjust: false,
	id: 'whatever',
	cssName: 'Some Text',
	displayName: 'Some Text',
	sizeRange: 3
};

describe( 'availableTypes', function() {
	before( function() {
		helpers.before();
		mockery.registerMock( '../helpers/bootstrap', { types: [ bodyTextType, headingsTextType, miscTextType ] } );
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

	it( 'returns the headings type first', function() {
		var availableTypes = require( '../../js/helpers/available-types.js' );
		expect( availableTypes[ 0 ] ).to.equal( headingsTextType );
	} );

	it( 'returns the headings type first', function() {
		var availableTypes = require( '../../js/helpers/available-types.js' );
		expect( availableTypes[ 0 ] ).to.equal( headingsTextType );
	} );

	it ( 'returns the first type first if no headings type exists', function() {
		mockery.deregisterMock( '../helpers/bootstrap' );
		mockery.registerMock( '../helpers/bootstrap', { types: [ bodyTextType, miscTextType ] } );
		mockery.resetCache();
		var availableTypes = require( '../../js/helpers/available-types.js' );
		expect( availableTypes[ 0 ] ).to.equal( bodyTextType );
	} );
} );
