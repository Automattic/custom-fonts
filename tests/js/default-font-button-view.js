var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var currentFont = {
	'type': 'headings',
	'provider': 'google',
	'id': 'Cinzel',
	'fvds': ['n9'],
	'size': 2
};

var Backbone = require( 'backbone' );

describe( 'defaultFontButtonView', function() {
	before( function() {
		mockery.enable();
		mockery.registerAllowable( '../../js/views/default-font-button' );
		mockery.registerAllowable( 'underscore' );
		mockery.registerMock( '../helpers/backbone', Backbone );
		mockery.registerMock( '../helpers/emitter', Backbone.Events );
	} );

	after( function() {
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'is not active initially', function() {
		var DefaultFontButtonView = require( '../../js/views/default-font-button' );
		this.view = new DefaultFontButtonView( {
			type: 'headings',
			currentFont: currentFont
		} );
		expect( this.view.$el.hasClass( 'active-button' ) ).to.be.equal( false );
	} );
} );
