var expect = require( 'chai' ).expect,
	mockery = require( 'mockery' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var selectedFonts;

describe( 'SelectedFonts', function() {
	before( function() {
		helpers.before();
		mockery.registerMock( '../models/selected-font', Backbone.Model );
		var SelectedFonts = require( '../../js/collections/selected-fonts' );
		selectedFonts = new SelectedFonts();
		selectedFonts.add( { type: 'one', id: 'foobar' } );
		selectedFonts.add( { type: 'one', id: 'barfoo' } );
		selectedFonts.add( { type: 'one', id: 'jetpack-default-theme-font' } );
		selectedFonts.add( { type: 'test' } );
	} );

	after( helpers.after );

	describe( '.toJSON()', function() {
		it( 'returns an object', function() {
			expect( selectedFonts.toJSON() ).to.be.instanceof( Object );
		} );

		it( 'returns models in the Collection', function() {
			expect( selectedFonts.toJSON() ).to.include( { id: 'foobar', type: 'one' } );
		} );

		it( 'does not return models without an id', function() {
			expect( selectedFonts.toJSON() ).to.not.include( { type: 'test' } );
		} );

		it( 'does not return models with a default id', function() {
			expect( selectedFonts.toJSON() ).to.not.include( { id: 'jetpack-default-theme-font' } );
		} );
	} );
} );

