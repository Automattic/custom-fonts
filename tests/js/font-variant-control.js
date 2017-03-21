var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' ),
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

var AvailableFont, FontVariantControl, fontVariantControl, SelectedFont;

describe( 'FontVariantControl', function() {
	before( function() {
		helpers.before();
		mockery.registerMock( '../helpers/bootstrap', { types: [ bodyTextType, headingsTextType ] } );
		FontVariantControl = require( '../../src/js/views/font-variant-control' );
		AvailableFont = require( '../../src/js/models/available-font' );
		SelectedFont = require( '../../src/js/models/selected-font' );
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
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontVariantControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font-variant' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a FontVariantDropdown', function() {
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
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
		it( 'returns the current font variant fvd if one is set', function() {
			var testFont = {
				id: 'Alegreya',
				displayName: 'Alegreya',
				cssName: 'Alegreya',
				provider: 'google',
				fvds: [ 'n4', 'i7', 'n7' ],
				currentFvd: 'n7'
			};
			var currentFont = new AvailableFont( testFont );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontVariantControl.getCurrentFontVariant() ).to.equal( 'n7' );
		} );

		it( 'returns "n4" if a font is selected but has no currentFvd and n4 is available', function() {
			var testFont = {
				id: 'foobar',
				type: 'headings',
				displayName: 'foobar',
				cssName: 'foobar',
				provider: 'google',
				fvds: [ 'n4', 'i7' ]
			};
			var currentFont = new SelectedFont( testFont );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl( { currentFont: currentFont, fontData: availableFonts, type: headingsTextType } );
			expect( fontVariantControl.getCurrentFontVariant() ).to.equal( 'n4' );
		} );

		it( 'returns the first available fvd if a font is selected but has no currentFvd and n4 is not available', function() {
			var testFont = {
				id: 'foobar',
				type: 'headings',
				displayName: 'foobar',
				cssName: 'foobar',
				provider: 'google',
				fvds: [ 'n7', 'i7' ]
			};
			var currentFont = new SelectedFont( testFont );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl( { currentFont: currentFont, fontData: availableFonts, type: headingsTextType } );
			expect( fontVariantControl.getCurrentFontVariant() ).to.equal( 'n7' );
		} );

		it( 'returns null if no font is selected', function() {
			var currentFont = new AvailableFont( { id: 'foobar' } );
			var availableFonts = new Backbone.Collection();
			fontVariantControl = new FontVariantControl( { currentFont: currentFont, fontData: availableFonts, type: headingsTextType } );
			expect( fontVariantControl.getCurrentFontVariant() ).to.not.be.ok;
		} );

		it( 'returns null if a font is selected but has fvdAdjust set to false', function() {
			var testFont = {
				id: 'foobar',
				type: 'headings',
				displayName: 'foobar',
				cssName: 'foobar',
				provider: 'google',
				fvds: [ 'n7', 'i7' ]
			};
			var currentFont = new SelectedFont( testFont );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontVariantControl = new FontVariantControl( { currentFont: currentFont, fontData: availableFonts, type: bodyTextType } );
			expect( fontVariantControl.getCurrentFontVariant() ).to.not.be.ok;
		} );
	} );
} );
