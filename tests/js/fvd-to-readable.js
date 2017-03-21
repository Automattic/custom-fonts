var expect = require( 'chai' ).expect;

var helpers = require( './test-helper' );

var FvdToReadable;

describe( 'FvdToReadable', function() {
	before( function() {
		helpers.before();
		FvdToReadable = require( '../../src/js/helpers/fvd-to-readable' );
	} );

	after( helpers.after );

	describe( '.getFontVariantNameFromId()', function() {

		it( 'returns Thin correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n1' ) ).to.equal( 'Thin' );
		} );

		it( 'returns Thin Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i1' ) ).to.equal( 'Thin Italic' );
		} );

		it( 'returns Thin Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o1' ) ).to.equal( 'Thin Oblique' );
		} );

		it( 'returns Extra Light correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n2' ) ).to.equal( 'Extra Light' );
		} );

		it( 'returns Extra Light Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i2' ) ).to.equal( 'Extra Light Italic' );
		} );

		it( 'returns Extra Light Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o2' ) ).to.equal( 'Extra Light Oblique' );
		} );

		it( 'returns Light correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n3' ) ).to.equal( 'Light' );
		} );

		it( 'returns Light Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i3' ) ).to.equal( 'Light Italic' );
		} );

		it( 'returns Light Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o3' ) ).to.equal( 'Light Oblique' );
		} );

		it( 'returns Regular correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n4' ) ).to.equal( 'Regular' );
		} );

		it( 'returns Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i4' ) ).to.equal( 'Italic' );
		} );

		it( 'returns Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o4' ) ).to.equal( 'Oblique' );
		} );

		it( 'returns Medium correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n5' ) ).to.equal( 'Medium' );
		} );

		it( 'returns Medium Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i5' ) ).to.equal( 'Medium Italic' );
		} );

		it( 'returns Medium Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o5' ) ).to.equal( 'Medium Oblique' );
		} );

		it( 'returns Semibold correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n6' ) ).to.equal( 'Semibold' );
		} );

		it( 'returns Semibold Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i6' ) ).to.equal( 'Semibold Italic' );
		} );

		it( 'returns Semibold Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o6' ) ).to.equal( 'Semibold Oblique' );
		} );

		it( 'returns Bold correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n7' ) ).to.equal( 'Bold' );
		} );

		it( 'returns Bold Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i7' ) ).to.equal( 'Bold Italic' );
		} );

		it( 'returns Bold Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o7' ) ).to.equal( 'Bold Oblique' );
		} );

		it( 'returns Extra Bold correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n8' ) ).to.equal( 'Extra Bold' );
		} );

		it( 'returns Extra Bold Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i8' ) ).to.equal( 'Extra Bold Italic' );
		} );

		it( 'returns Extra Bold Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o8' ) ).to.equal( 'Extra Bold Oblique' );
		} );

		it( 'returns Ultra Bold correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n9' ) ).to.equal( 'Ultra Bold' );
		} );

		it( 'returns Ultra Bold Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i9' ) ).to.equal( 'Ultra Bold Italic' );
		} );

		it( 'returns Ultra Bold Oblique correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'o9' ) ).to.equal( 'Ultra Bold Oblique' );
		} );

		it( 'returns Regular if no match is found', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'x9' ) ).to.equal( 'Regular' );
		} );

	} );
} );

