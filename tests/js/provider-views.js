var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' ),
	Backbone = require( 'backbone' );

var api, providerViews;

describe( 'providerViews', function() {
	before( function() {
		helpers.before();
		api = {};
		mockery.registerMock( '../helpers/api', api );
		providerViews = require( '../../src/js/helpers/provider-views' );
	} );

	after( helpers.after );

	it( 'exports the base ProviderView to the global space', function() {
		expect( api.JetpackFonts.ProviderView ).to.be.ok;
	} );

	it( 'exports the providerViews object to the global space', function() {
		expect( api.JetpackFonts.providerViews ).to.be.ok;
	} );

	describe( '.getViewForProvider()', function() {
		it( 'returns nothing for a provider that has no views', function() {
			expect( providerViews.getViewForProvider( 'foobar' ) ).to.not.be.ok;
		} );

		it( 'imports Views added to the global object', function() {
			api.JetpackFonts.providerViews.testprovider = Backbone.View;
			expect( providerViews.getViewForProvider( 'testprovider' ) ).to.be.ok;
		} );
	} );

} );


