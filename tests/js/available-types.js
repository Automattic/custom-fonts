var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' );

var siteTitleTextType = {
	fvdAdjust: false,
	id: 'site-title',
	cssName: 'Site Title Text',
	displayName: 'Site Title Text',
	sizeRange: 3
};

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
		mockery.registerMock( '../helpers/bootstrap', { types: [ siteTitleTextType, bodyTextType, headingsTextType, miscTextType ] } );
	} );

	after( helpers.after );

	it( 'exports an array', function() {
		var availableTypes = require( '../../src/js/helpers/available-types.js' );
		expect( availableTypes ).to.be.instanceof( Array );
	} );

	it( 'exports types returned by the bootstrap module', function() {
		var availableTypes = require( '../../src/js/helpers/available-types.js' );
		expect( availableTypes ).to.include( bodyTextType );
		expect( availableTypes ).to.include( headingsTextType );
	} );

	it( 'returns the headings type first', function() {
		var availableTypes = require( '../../src/js/helpers/available-types.js' );
		expect( availableTypes[ 0 ] ).to.equal( headingsTextType );
	} );

	it( 'does not return site-title since that is deprecated', function() {
		var availableTypes = require( '../../src/js/helpers/available-types.js' );
		expect( availableTypes ).not.to.include( siteTitleTextType );
	} );

	it( 'returns the first type first if no headings type exists', function() {
		mockery.deregisterMock( '../helpers/bootstrap' );
		mockery.registerMock( '../helpers/bootstrap', { types: [ bodyTextType, miscTextType ] } );
		mockery.resetCache();
		var availableTypes = require( '../../src/js/helpers/available-types.js' );
		expect( availableTypes[ 0 ] ).to.equal( bodyTextType );
	} );
} );
