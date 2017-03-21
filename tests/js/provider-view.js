var expect = require( 'chai' ).expect,
	sinon = require( 'sinon' );

var helpers = require( './test-helper' ),
	Emitter,
	Backbone = require( 'backbone' );

var ProviderView, providerView;

var font = {
	model: new Backbone.Model(),
	type: 'headings',
	currentFont: new Backbone.Model()
};

describe( 'ProviderView', function() {
	before( function() {
		helpers.before();
		ProviderView = require( '../../src/js/views/dropdown-item' );
		Emitter = require( '../../src/js/helpers/emitter' );
	} );

	after( helpers.after );

	afterEach( function() {
		providerView.remove();
		font = {
			model: new Backbone.Model(),
			type: 'headings',
			currentFont: new Backbone.Model()
		};
	} );

	describe( '.render()', function() {
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
	} );

	describe( '.click()', function() {
		it ( 'triggers change-font emitter event when clicked', function() {
			providerView = new ProviderView( font );
			var spy = sinon.spy();
			Emitter.on( 'change-font', spy );
			var view = providerView.render().el;
			Backbone.$( 'body' ).append( view );
			providerView.fontChanged();
			expect( spy ).to.have.been.called;
		} );

		it ( 'does not trigger change-font emitter event when clicked if it is the currentFont', function() {
			var model = new Backbone.Model();
			font = {
				model: model,
				type: 'headings',
				currentFont: model
			};
			providerView = new ProviderView( font );
			var spy = sinon.spy();
			Emitter.on( 'change-font', spy );
			var view = providerView.render().el;
			Backbone.$( 'body' ).append( view );
			providerView.fontChanged();
			expect( spy ).to.not.have.been.called;
		} );

		it ( 'calls fontChanged on click events', function() {
			providerView = new ProviderView( font );
			expect( providerView.events ).to.include( { 'click': 'fontChanged' } );
		} );
	} );
} );
