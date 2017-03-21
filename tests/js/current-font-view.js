var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' ),
	sinon = require( 'sinon' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var CurrentFontView, currentFontView, currentFont, Emitter, menuStatus;

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
		CurrentFontView = require( '../../src/js/views/current-font' );
		Emitter = require( '../../src/js/helpers/emitter' );
		menuStatus = new Backbone.Model({ isOpen: false });
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			expect( currentFontView ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			currentFontView.remove();
			menuStatus.set({ isOpen: false });
		} );

		it( 'outputs some html', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font' ) ).to.have.length.above( 0 );
		} );

		it( 'adds the open class if the menu is open', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			menuStatus.set({ isOpen: true });
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font.active' ) ).to.have.length.above( 0 );
		} );

		it( 'does not have the open class if the menu is closed', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: false, menuStatus: menuStatus });
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font.active' ) ).to.not.have.length.above( 0 );
		} );

		it( 'adds the active class if it is active', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font.active' ) ).to.have.length.above( 0 );
		} );

		it( 'does not have the active class if it is not active', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: false, menuStatus: menuStatus });
			Backbone.$( 'body' ).append( currentFontView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font.active' ) ).to.not.have.length.above( 0 );
		} );

		it ( 'calls render when the current font changes', function() {
			var spy = sinon.spy( CurrentFontView.prototype, 'render' );
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			currentFont.set( 'id', 'barfoo' );
			expect( spy ).to.have.been.called;
		} );

		it ( 'has the font name in its html', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			currentFont.set( 'displayName', 'Helvetica' );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__current-font' ).text() ).to.include( 'Helvetica' );
		} );

		it ( 'renders a provider View if one is available', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			currentFont.set( { 'displayName': 'Helvetica', 'provider': 'google' } );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( '.jetpack-fonts__current-font .jetpack-fonts__option' ) ).to.have.length.above( 0 );
		} );
	} );

	describe( '.click()', function() {
		afterEach( function() {
			currentFontView.remove();
		} );

		it ( 'triggers open-menu emitter event if menu is closed when clicked', function() {
			var menuStatus = new Backbone.Model({ isOpen: false });
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			var spy = sinon.spy();
			Emitter.on( 'open-menu', spy );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			currentFontView.toggleDropdown();
			expect( spy ).to.have.been.called;
		} );

		it ( 'triggers close-open-menus emitter event if menu is open when clicked', function() {
			var menuStatus = new Backbone.Model({ isOpen: false });
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			menuStatus.set({ isOpen: true });
			var spy = sinon.spy();
			Emitter.on( 'close-open-menus', spy );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			currentFontView.toggleDropdown();
			expect( spy ).to.have.been.called;
		} );

		it ( 'does not trigger open-menu emitter event when clicked if active is false', function() {
			var menuStatus = new Backbone.Model({ isOpen: false });
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: false, menuStatus: menuStatus });
			var spy = sinon.spy();
			Emitter.on( 'open-menu', spy );
			var view = currentFontView.render().el;
			Backbone.$( 'body' ).append( view );
			currentFontView.toggleDropdown();
			expect( spy ).to.not.have.been.called;
		} );

		it ( 'calls toggleDropdown on click events', function() {
			currentFontView = new CurrentFontView({ currentFont: currentFont, active: true, menuStatus: menuStatus });
			expect( currentFontView.events ).to.include( { 'click': 'toggleDropdown' } );
		} );
	} );
} );
