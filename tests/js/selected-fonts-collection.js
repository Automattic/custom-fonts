var expect = require( 'chai' ).expect,
	sinon = require( 'sinon' ),
	mockery = require( 'mockery' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var selectedFonts;

describe( 'SelectedFonts', function() {
	before( function() {
		helpers.before();
		mockery.registerMock( '../models/selected-font', Backbone.Model );
		var SelectedFonts = require( '../../src/js/models/selected-fonts' );
		selectedFonts = new SelectedFonts( [
			{ type: 'one', id: 'foobar', displayName: 'foobar' },
			{ type: 'two', id: 'foobar', displayName: 'foobar' },
			{ type: 'one', id: 'barfoo', displayName: 'barfoo' },
			{ type: 'four', id: 'something', displayName: 'something', currentFvd: 'n4' },
			{ type: 'test', displayName: 'test' }
		] );
	} );

	after( helpers.after );

	describe( '.setSelectedFont()', function() {
		it( 'adds a model to the collection if no matching type exists', function() {
			selectedFonts.setSelectedFont( { type: 'three', id: 'afont', displayName: 'afont' } );
			expect( selectedFonts.toJSON() ).to.include( { type: 'three', id: 'afont', displayName: 'afont' } );
		} );

		it( 'replaces the existing model of the same type if it exists', function() {
			selectedFonts.setSelectedFont( { type: 'four', id: 'anotherthing', displayName: 'anotherthing' } );
			expect( selectedFonts.toJSON() ).to.not.include( { type: 'four', id: 'something', displayName: 'something' } );
			expect( selectedFonts.toJSON() ).to.include( { type: 'four', id: 'anotherthing', displayName: 'anotherthing' } );
		} );

		it( 'triggers a change event when the font changes', function() {
			var spy = sinon.spy();
			selectedFonts.on( 'change', spy );
			selectedFonts.setSelectedFont( { type: 'three', id: 'afont', displayName: 'afont' } );
			expect( spy ).to.have.been.called;
		} );
	} );

	describe( '.getFontByType()', function() {
		it( 'returns a model matching the type', function() {
			expect( selectedFonts.getFontByType( 'two' ).toJSON() ).to.eql( { type: 'two', id: 'foobar', displayName: 'foobar' } );
		} );

		it( 'returns the default font if no model matches the type', function() {
			expect( selectedFonts.getFontByType( 'slartibartfast' ).toJSON() ).to.eql( { type: 'slartibartfast', displayName: 'Default Theme Font' } );
		} );

		it( 'adds the default font if no model matches the type', function() {
			var origCount = selectedFonts.size();
			selectedFonts.getFontByType( 'fordprefect' );
			expect( selectedFonts.size() ).to.equal( origCount + 1 );
		} );
	} );

	describe( '.toJSON()', function() {
		it( 'returns an object', function() {
			expect( selectedFonts.toJSON() ).to.be.instanceof( Object );
		} );

		it( 'returns models in the collection', function() {
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

