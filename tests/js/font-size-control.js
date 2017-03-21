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

var AvailableFont, FontSizeControl, fontSizeControl;

describe( 'FontSizeControl', function() {
	before( function() {
		helpers.before();
		FontSizeControl = require( '../../src/js/views/font-size-control' );
		AvailableFont = require( '../../src/js/models/available-font' );
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontSizeControl = new FontSizeControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			expect( fontSizeControl ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			fontSizeControl.remove();
		} );

		it( 'outputs some html', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontSizeControl = new FontSizeControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontSizeControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-size-control' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a CurrentFontVariant', function() {
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontSizeControl = new FontSizeControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontSizeControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__current-font-size' ) ).to.have.length.above( 0 );
		} );

		it( 'renders a FontSizeDropdown', function() {
			var currentFont = new AvailableFont( {fvds: [ 'n4', 'i7' ]} );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontSizeControl = new FontSizeControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontSizeControl.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-size-dropdown' ) ).to.have.length.above( 0 );
		} );

		it( 're-renders when currentFont changes', function() {
			var spy = sinon.spy( FontSizeControl.prototype, 'render' );
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			fontSizeControl = new FontSizeControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			currentFont.set( 'id', 'barfoo' );
			expect( spy ).to.have.been.called;
			FontSizeControl.prototype.render.restore();
		} );

		it( 'adds an inactive class when the currentFont is the default with no id', function() {
			var currentFont = new AvailableFont( { id: 'foobar' } );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontSizeControl = new FontSizeControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontSizeControl.render().el );
			currentFont.unset( 'id' );
			expect( Backbone.$( '.jetpack-fonts__font-property-control--inactive' ) ).to.have.length.above( 0 );
		} );

		it( 'adds an inactive class when the currentFont is the default with an empty id', function() {
			var currentFont = new AvailableFont( { id: 'foobar' } );
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontSizeControl = new FontSizeControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontSizeControl.render().el );
			currentFont.set( 'id', '' );
			expect( Backbone.$( '.jetpack-fonts__font-property-control--inactive' ) ).to.have.length.above( 0 );
		} );

		it( 'removes the inactive class when the currentFont is not the default', function() {
			var currentFont = new AvailableFont();
			var availableFonts = new Backbone.Collection();
			availableFonts.add( currentFont );
			fontSizeControl = new FontSizeControl({ currentFont: currentFont, fontData: availableFonts, type: headingsTextType });
			Backbone.$( 'body' ).append( fontSizeControl.render().el );
			currentFont.set( 'id', 'foobar' );
			expect( Backbone.$( '.jetpack-fonts__font-property-control--inactive' ) ).not.to.have.length.above( 0 );
		} );
	} );
} );

