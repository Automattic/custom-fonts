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
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true });
			expect( currentFontView ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			currentFontView.remove();
		} );

		it( 'outputs some html', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true });
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font' ) ).to.have.length.above( 0 );
		} );

		it( 'adds the active class if it is active', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true });
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font.active' ) ).to.have.length.above( 0 );
		} );

		it( 'does not have the active class if it is not active', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: false });
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font.active' ) ).to.not.have.length.above( 0 );
		} );

		it ( 'calls render when the current font changes', function() {
			var spy = sinon.spy( CurrentFontView.prototype, 'render' );
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true });
			currentFont.set( 'id', 'barfoo' );
			expect( spy ).to.have.been.called;
		} );

		it ( 'has the font name in its html', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true });
			currentFont.set( 'displayName', 'Helvetica' );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__current-font' ).text() ).to.include( 'Helvetica' );
		} );

		it ( 'renders a provider View if one is available', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true });
			currentFont.set( { 'displayName': 'Helvetica', 'provider': 'google' } );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__current-font .jetpack-fonts__option' ) ).to.have.length.above( 0 );
		} );
	} );

	describe( '.click()', function() {
		it ( 'triggers toggle-dropdown emitter event when clicked', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true });
			var spy = sinon.spy();
			Emitter.on('toggle-dropdown', spy);
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			currentFontView.toggleDropdown();
			expect( spy ).to.have.been.called;
		} );

		it ( 'does not trigger toggle-dropdown emitter event when clicked if active is false', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: false });
			var spy = sinon.spy();
			Emitter.on('toggle-dropdown', spy);
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			currentFontView.toggleDropdown();
			expect( spy ).to.not.have.been.called;
		} );

		it ( 'calls toggleDropdown on click events', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true });
			expect( currentFontView.events ).to.include( { 'click': 'toggleDropdown' } );
		} );
	} );
} );
