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
	fvds: [ 'n7' ]
};

var AvailableFont, FontVariantOption, fontVariantOption;

describe( 'FontVariantOption', function() {
	before( function() {
		helpers.before();
		FontVariantOption = require( '../../src/js/views/font-variant-option' );
		AvailableFont = require( '../../src/js/models/available-font' );
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates a new View', function() {
			fontVariantOption = new FontVariantOption({ currentFontVariant: 'n4', id: 'i7', type: headingsTextType });
			expect( fontVariantOption ).to.be.instanceof( Backbone.View );
		} );
	} );

	describe( '.render()', function() {
		afterEach( function() {
			fontVariantOption.remove();
		} );

		it( 'outputs some html', function() {
			fontVariantOption = new FontVariantOption({ currentFontVariant: 'n4', id: 'i7', type: headingsTextType });
			Backbone.$( 'body' ).append( fontVariantOption.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-variant-option' ) ).to.have.length.above( 0 );
		} );

		it( 'outputs the readable font variant name', function() {
			fontVariantOption = new FontVariantOption({ currentFontVariant: 'n4', id: 'i7', type: headingsTextType });
			Backbone.$( 'body' ).append( fontVariantOption.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-variant-option' ).text() ).to.include( 'Bold Italic' );
		} );

		it( 'outputs the fvd as the "id" attribute', function() {
			fontVariantOption = new FontVariantOption({ currentFontVariant: 'n4', id: 'i7', type: headingsTextType });
			Backbone.$( 'body' ).append( fontVariantOption.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-variant-option' ).attr( 'id' ) ).to.equal( 'i7' );
		} );

		it( 'includes the current class if the current fvd matches this fvd', function() {
			fontVariantOption = new FontVariantOption({ currentFontVariant: 'i7', id: 'i7', type: headingsTextType });
			Backbone.$( 'body' ).append( fontVariantOption.render().el );
			expect( Backbone.$( '.jetpack-fonts__font-variant-option' ).hasClass( 'current' ) ).to.be.true;
		} );
	} );

	it ( 'triggers set-variant emitter event when clicked', function() {
		var Emitter = require( '../../src/js/helpers/emitter' );
		var spy = sinon.spy();
		Emitter.on( 'set-variant', spy );
		fontVariantOption = new FontVariantOption({ currentFontVariant: 'n4', id: 'i7', type: headingsTextType });
		fontVariantOption.setVariantOption();
		expect( spy ).to.have.been.called;
	} );

	it ( 'calls setVariantOption on click events', function() {
		fontVariantOption = new FontVariantOption({ currentFontVariant: 'n4', id: 'i7', type: headingsTextType });
		expect( fontVariantOption.events ).to.include( { 'click': 'setVariantOption' } );
	} );
} );

