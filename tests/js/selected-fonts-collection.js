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
		selectedFonts = new SelectedFonts( [
			{ type: 'one', id: 'foobar', displayName: 'foobar' },
			{ type: 'two', id: 'foobar', displayName: 'foobar' },
			{ type: 'one', id: 'barfoo', displayName: 'barfoo' },
			{ type: 'test', displayName: 'test' }
		] );
	} );

	after( helpers.after );

	describe( '.toJSON()', function() {
		it( 'returns an object', function() {
			expect( selectedFonts.toJSON() ).to.be.instanceof( Object );
		} );

		it( 'returns models in the Collection', function() {
			expect( selectedFonts.toJSON() ).to.include( { id: 'foobar', type: 'one', displayName: 'foobar' } );
		} );

		it( 'does not return models without an id', function() {
			expect( selectedFonts.toJSON() ).to.not.include( { type: 'test', displayName: 'test' } );
		} );

		it( 'returns all models in the collection which have the same id', function() {
			expect( selectedFonts.toJSON() ).to.include( { id: 'foobar', type: 'one', displayName: 'foobar' } );
			expect( selectedFonts.toJSON() ).to.include( { id: 'foobar', type: 'two', displayName: 'foobar' } );
		} );
	} );
} );

