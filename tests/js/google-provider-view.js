var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' ),
	Backbone = require( 'backbone' );

var api, providerViews;

var ProviderView, providerView;

var WebFont = {
	load: function() {
		return true;
	}
};

var font = {
	model: new Backbone.Model(),
	type: 'headings',
	currentFont: new Backbone.Model()
};

describe( 'googleProviderView', function() {
	before( function() {
		helpers.before();
		api = {};
		mockery.registerMock( '../helpers/api', api );
		mockery.registerMock( '../helpers/bootstrap', api );
		mockery.registerMock( '../helpers/webfont', WebFont );
		providerViews = require( '../../src/js/helpers/provider-views' );
		api.JetpackFonts.providerViews.google = require( '../../src/js/providers/google' );
		ProviderView = providerViews.getViewForProvider( 'google' );
	} );

	after( helpers.after );

	describe( '.render()', function() {

		afterEach( function() {
			providerView.remove();
			font.model = new Backbone.Model();
		} );

		it( 'renders a Backbone view', function() {
			providerView = new ProviderView( font );
			expect( providerView ).to.be.instanceof( Backbone.View );
		} );

		it( 'outputs some html', function() {
			providerView = new ProviderView( font );
			Backbone.$( 'body' ).append( providerView.render().el );
			expect( Backbone.$( '.jetpack-fonts__option' ) ).to.have.length.above( 0 );
		} );

		it ( 'has the font name in its html', function() {
			providerView = new ProviderView( font );
			font.model.set( 'displayName', 'Helvetica' );
			var view = providerView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__option' ).text() ).to.include( 'Helvetica' );
		} );

		it ( 'has the correct font family', function() {
			providerView = new ProviderView( font );
			font.model.set( 'cssName', 'Helvetica' );
			var view = providerView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__option' ).css( 'font-family' ) ).to.include( 'Helvetica' );
		} );
	} );
} );
