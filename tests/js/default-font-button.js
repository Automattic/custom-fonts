var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' ),
	sinon = require( 'sinon' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var DefaultFontButton, defaultFontButton, currentFont, Emitter, menuStatus, type;

describe( 'DefaultFontButton', function() {
	before( function() {
		helpers.before();
		currentFont = new Backbone.Model();
		menuStatus = new Backbone.Model({ isOpen: false });
		type = { id: 'foobar' };
		mockery.registerMock( '../helpers/bootstrap', { types: [] } );
		DefaultFontButton = require( '../../src/js/views/default-font-button' );
		Emitter = require( '../../src/js/helpers/emitter' );
		defaultFontButton = new DefaultFontButton({ currentFont: currentFont, menuStatus: menuStatus, type: type });
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			expect( defaultFontButton ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			menuStatus.set({ isOpen: false });
			defaultFontButton.remove();
		} );

		it( 'outputs some html', function() {
			Backbone.$( 'body' ).append( defaultFontButton.render().el );
			expect( Backbone.$( '.jetpack-fonts__default-button' ) ).to.have.length.above( 0 );
		} );

		it( 'renders as not active initially', function() {
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( view ).hasClass( 'active-button' ) ).to.be.false;
		} );

		it( 'renders as not active when the current font is the default and the menu is open', function() {
			currentFont.unset( 'id' );
			menuStatus.set({ isOpen: true });
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( view ).hasClass( 'active-button' ) ).to.be.false;
		} );

		it( 'renders as not active when the current font is the default and the menu is closed', function() {
			currentFont.unset( 'id' );
			menuStatus.set({ isOpen: false });
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( view ).hasClass( 'active-button' ) ).to.be.false;
		} );

		it( 'renders as active when the current font is not the default and the menu is closed', function() {
			currentFont.set( 'id', 'foobar' );
			menuStatus.set({ isOpen: false });
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( view ).hasClass( 'active-button' ) ).to.be.true;
		} );

		it( 'renders as not active when the current font is not the default and the menu is open', function() {
			currentFont.set( 'id', 'foobar' );
			menuStatus.set({ isOpen: true });
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			expect( Backbone.$( view ).hasClass( 'active-button' ) ).to.be.false;
		} );

		it ( 'is re-rendered when the current font changes', function() {
			var spy = sinon.spy( defaultFontButton, 'render' );
			// We have to re-initialize because the event listener binding happens
			// there and it needs to bind to the spy.
			defaultFontButton.initialize({ currentFont: currentFont, menuStatus: menuStatus, type: type });
			currentFont.set( 'id', 'barfoo' );
			expect( spy ).to.have.been.called;
		} );
	} );

	describe( '.click()', function() {
		it ( 'triggers change-font emitter event when clicked', function() {
			var spy = sinon.spy();
			Emitter.on( 'change-font', spy );
			var view = defaultFontButton.render().el;
			Backbone.$( 'body' ).append( view );
			defaultFontButton.resetToDefault();
			expect( spy ).to.have.been.called;
		} );

		it ( 'calls resetToDefault on click events', function() {
			expect( defaultFontButton.events ).to.include( { 'click': 'resetToDefault' } );
		} );
	} );
} );
