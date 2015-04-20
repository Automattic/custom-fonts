var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' ),
	Backbone = require( 'backbone' );

var api, providerViews;

var ProviderView, providerView;

var font = {
	model: new Backbone.Model(),
	type: 'headings',
	currentFont: new Backbone.Model()
};

function addFontToPage() {
	return true;
}

describe( 'googleProviderView', function() {
	before( function() {
		helpers.before();
		api = {};
		mockery.registerMock( '../helpers/api', api );
		providerViews = require( '../../js/helpers/provider-views' );
		api.JetpackFonts.providerViews.google = require( '../../js/providers/google' );
		mockery.registerMock( '../js/providers/google', { addFontToPage: addFontToPage } );
		ProviderView = providerViews.getViewForProvider( 'google' );
	} );

	after( helpers.after );

	describe( '.render()', function() {

		afterEach( function() {
			providerView.remove();
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
			font.currentFont.set( 'name', 'Helvetica' );
			var view = providerView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__option' ).text() ).to.include( 'Helvetica' );
		} );
	} );
} );
