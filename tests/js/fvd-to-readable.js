var expect = require( 'chai' ).expect;

var helpers = require( './test-helper' );

var FvdToReadable;

describe( 'FvdToReadable', function() {
	before( function() {
		helpers.before();
		FvdToReadable = require( '../../js/helpers/fvd-to-readable' );
	} );

	after( helpers.after );

	describe( '.getFontVariantNameFromId()', function() {

		it( 'returns Thin correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n1' ) ).to.equal( 'Thin' );
		} );

		it( 'returns Thin Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i1' ) ).to.equal( 'Thin Italic' );
		} );

		it( 'returns Extra Light correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n2' ) ).to.equal( 'Extra Light' );
		} );

		it( 'returns Extra Light Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i2' ) ).to.equal( 'Extra Light Italic' );
		} );

		it( 'returns Light correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n3' ) ).to.equal( 'Light' );
		} );

		it( 'returns Light Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i3' ) ).to.equal( 'Light Italic' );
		} );

		it( 'returns Regular correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n4' ) ).to.equal( 'Regular' );
		} );

		it( 'returns Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i4' ) ).to.equal( 'Italic' );
		} );

		it( 'returns Medium correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n5' ) ).to.equal( 'Medium' );
		} );

		it( 'returns Medium Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i5' ) ).to.equal( 'Medium Italic' );
		} );

		it( 'returns Semibold correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n6' ) ).to.equal( 'Semibold' );
		} );

		it( 'returns Semibold Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i6' ) ).to.equal( 'Semibold Italic' );
		} );

		it( 'returns Bold correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n7' ) ).to.equal( 'Bold' );
		} );

		it( 'returns Bold Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i7' ) ).to.equal( 'Bold Italic' );
		} );

		it( 'returns Extra Bold correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n8' ) ).to.equal( 'Extra Bold' );
		} );

		it( 'returns Extra Bold Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i8' ) ).to.equal( 'Extra Bold Italic' );
		} );

		it( 'returns Black correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'n9' ) ).to.equal( 'Black' );
		} );

		it( 'returns Black Italic correctly', function() {
			expect( FvdToReadable.getFontVariantNameFromId( 'i9' ) ).to.equal( 'Black Italic' );
		} );

	} );
} );

