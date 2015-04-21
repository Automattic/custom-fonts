var expect = require( 'chai' ).expect,
	sinon = require( 'sinon' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var headingsTextType = {
	fvdAdjust: true,
	id: 'headings',
	name: 'Heading Text',
	sizeRange: 3
};

var bodyTextType = {
	fvdAdjust: false,
	id: 'body-text',
	name: 'Body Text',
	sizeRange: 3
};

var testFont = {
	id: 'Alegreya',
	displayName: 'Alegreya',
	cssName: 'Alegreya',
	provider: 'google',
	fvds: [ 'n8' ]
};

var AvailableFont, FontVariantControl, fontVariantControl;

describe( 'FontVariantControl', function() {
	before( function() {
		helpers.before();
		FontVariantControl = require( '../../js/views/font-variant-control' );
		AvailableFont = require( '../../js/models/available-font' );
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontVariantControl ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			fontVariantControl.remove();
		} );

		it( 'outputs some html', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontVariantControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-variant-control' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a CurrentFontVariant', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontVariantControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font-variant' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a FontVariantDropdown', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontVariantControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-variant-dropdown' ) ).to.have.length.above( 0 );
		} );

		it( 're-renders when currentFont changes', function() {
			var spy = sinon.spy( FontVariantControl.prototype, 'render' );
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			currentFont.set( 'id', 'barfoo' );
			expect( spy ).to.have.been.called;
			FontVariantControl.prototype.render.restore();
		} );
	} );

	describe( '.getSelectedAvailableFont()', function() {
		it( 'returns a model from the availableFonts collection if its id matches the currentFont', function() {
			var currentFont = new AvailableFont({ id: 'foobar' });
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontVariantControl.getSelectedAvailableFont().get( 'id' ) ).to.equal( 'foobar' );
		} );

		it( 'returns false if no availableFont matches the id of the currentFont', function() {
			var currentFont = new AvailableFont({ id: 'foobar' });
			var availableFonts = new Backbone.Collection();
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontVariantControl.getSelectedAvailableFont() ).to.not.be.ok;
		} );
	} );

	describe( '.getCurrentFontVariant()', function() {
		it( 'returns the current font variant name if one is set', function() {
			var currentFont = new AvailableFont( testFont );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontVariantControl.getCurrentFontVariant() ).to.equal( 'Bold' );
		} );

		it( 'returns "Regular" if a font is selected but has no fvd', function() {
			var currentFont = new AvailableFont({ id: 'foobar' });
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontVariantControl.getCurrentFontVariant() ).to.equal( 'Regular' );
		} );

		it( 'returns "Regular" if a font is selected but has more than one fvd', function() {
			var currentFont = new AvailableFont({ id: 'foobar', fvds: [ 'n7', 'n4' ] });
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontVariantControl.getCurrentFontVariant() ).to.equal( 'Regular' );
		} );

		it( 'returns null if no font is selected', function() {
			var currentFont = new AvailableFont({ id: 'foobar' });
			var availableFonts = new Backbone.Collection();
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontVariantControl.getCurrentFontVariant() ).to.not.be.ok;
		} );

		it( 'returns null if a font is selected but has fvdAdjust set to false', function() {
			var currentFont = new AvailableFont({ id: 'foobar', type: bodyTextType });
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: bodyTextType });
			expect( fontVariantControl.getCurrentFontVariant() ).to.not.be.ok;
		} );
	} );
} );
