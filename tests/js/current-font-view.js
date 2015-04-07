var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' ),
	sinon = require( 'sinon' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var CurrentFontView, currentFontView, currentFont, Emitter;

var api = {};

function getViewForProvider( provider ) {
	if ( provider === 'google' ) {
		return Backbone.View.extend( { className: 'jetpack-fonts__option' } );
	}
}

describe( 'CurrentFontView', function() {
	before( function() {
		helpers.before();
		currentFont = new Backbone.Model();
		mockery.registerMock( '../helpers/api', api );
		mockery.registerMock( '../helpers/provider-views', { getViewForProvider: getViewForProvider } );
		CurrentFontView = require( '../../js/views/current-font' );
		Emitter = require( '../../js/helpers/emitter' );
		currentFontView = new CurrentFontView({ currentFont: currentFont });
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			expect( currentFontView ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			currentFontView.remove();
		} );

		it( 'outputs some html', function() {
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current_font' ) ).to.have.length.above( 0 );
		} );

		it ( 'calls render when the current font changes', function() {
			var spy = sinon.spy( currentFontView, 'render' );
			// We have to re-initialize because the event listener binding happens
			// there and it needs to bind to the spy.
			currentFontView.initialize({ currentFont: currentFont });
			currentFont.set( 'id', 'barfoo' );
			expect( spy ).to.have.been.called;
		} );

		it ( 'has the font name in its html', function() {
			currentFont.set( 'name', 'Helvetica' );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__current_font' ).text() ).to.include( 'Helvetica' );
		} );

		it ( 'renders a provider View if one is available', function() {
			currentFont.set( { 'name': 'Helvetica', 'provider': 'google' } );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__current_font .jetpack-fonts__option' ) ).to.have.length.above( 0 );
		} );

		it ( 'triggers toggle-dropdown emitter event when clicked', function() {
			var spy = sinon.spy();
			Emitter.on('toggle-dropdown', spy);
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			currentFontView.toggleDropdown();
			expect( spy ).to.have.been.called;
		} );

		it ( 'calls toggleDropdown on click events', function() {
			expect( currentFontView.events ).to.include( { 'click': 'toggleDropdown' } );
		} );
	} );
} );
