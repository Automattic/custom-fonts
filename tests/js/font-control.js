var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var headingsTextType = {
	fvdAdjust: true,
	id: 'headings',
	name: 'Heading Text',
	sizeRange: 3
};

var testFont = {
	id: 'Alegreya',
	cssName: 'Alegreya',
	displayName: 'Alegreya',
	provider: 'google',
	fvds: [ 'n4', 'i7' ]
};

var WebFont = {
	load: function() {
		return true;
	}
};

var api = {};

var AvailableFont, FontControlView, fontControlView, providerViews, Emitter;

describe( 'FontControlView', function() {
	before( function() {
		helpers.before();
		mockery.registerMock( '../helpers/api', api );
		mockery.registerMock( '../helpers/bootstrap', api );
		Emitter = require( '../../src/js/helpers/emitter' );
		FontControlView = require( '../../src/js/views/font-control' );
		AvailableFont = require( '../../src/js/models/available-font' );
		mockery.registerMock( '../helpers/webfont', WebFont );
		providerViews = require( '../../src/js/helpers/provider-views' );
		api.JetpackFonts.providerViews.google = require( '../../src/js/providers/google' );
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontControlView = new FontControlView({ model: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontControlView ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			fontControlView.remove();
		} );

		it( 'outputs some html', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontControlView = new FontControlView({ model: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontControlView.render().el );
			expect( Backbone.$( '.jetpack-fonts__menu-container' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a CurrentFontView', function() {
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontControlView = new FontControlView({ model: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontControlView.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a DefaultFontButton', function() {
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontControlView = new FontControlView({ model: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontControlView.render().el );
			expect( Backbone.$( '.jetpack-fonts__default-button' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a FontDropdown', function() {
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontControlView = new FontControlView({ model: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontControlView.render().el );
			expect( Backbone.$( '.jetpack-fonts__menu' ) ).to.have.length.above( 0 );
		} );

		it( 'does not render the fonts before load-menu-fonts is triggered', function() {
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			availableFonts.add( new AvailableFont( testFont ) );
			fontControlView = new FontControlView({ model: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontControlView.render().el );
			expect( Backbone.$( '.jetpack-fonts__option' ) ).not.to.have.length.above( 0 );
		} );

		it( 'renders the fonts when load-menu-fonts is triggered', function() {
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			availableFonts.add( new AvailableFont( testFont ) );
			fontControlView = new FontControlView({ model: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontControlView.render().el );
			Emitter.trigger( 'load-menu-fonts' );
			expect( Backbone.$( '.jetpack-fonts__option' ) ).to.have.length.above( 0 );
		} );
	} );

} );

