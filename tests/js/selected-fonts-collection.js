var expect = require( 'chai' ).expect,
	sinon = require( 'sinon' ),
	mockery = require( 'mockery' );

var helpers = require( './test-helper' );
var Backbone = require( 'backbone' );

var SelectedFonts, selectedFonts, api = { JetpackFonts: { providerViews: {} } };

describe( 'SelectedFonts', function() {
	before( function() {
		helpers.before();
		mockery.registerMock( '../models/selected-font', Backbone.Model );
		mockery.registerMock( '../helpers/api', api );
		api.JetpackFonts.providerViews.myprovider = new Backbone.View({});
		SelectedFonts = require( '../../js/models/selected-fonts' );
		selectedFonts = new SelectedFonts( [
			{ type: 'one', id: 'foobar', displayName: 'foobar', provider: 'myprovider' },
			{ type: 'two', id: 'foobar', displayName: 'foobar', provider: 'myprovider' },
			{ type: 'one', id: 'barfoo', displayName: 'barfoo', provider: 'myprovider' },
			{ type: 'four', id: 'something', displayName: 'something', currentFvd: 'n4', provider: 'myprovider' },
			{ type: 'test', displayName: 'test', provider: 'myprovider' }
		] );
	} );

	after( helpers.after );

	describe( '.initialize()', function() {
		it( 'creates an array of models from the provided raw objects', function() {
			var myFonts = new SelectedFonts( [
				{ type: 'one', id: 'foobar', displayName: 'foobar', provider: 'myprovider' },
				{ type: 'two', id: 'foobar', displayName: 'foobar', provider: 'myprovider' }
			] );
			expect( myFonts.toJSON().length ).to.equal( 2 );
		} );

		it( 'does not add fonts for which there is no provider', function() {
			var myFonts = new SelectedFonts( [
				{ type: 'one', id: 'foobar', displayName: 'foobar', provider: 'myprovider' },
				{ type: 'two', id: 'foobar', displayName: 'foobar' }
			] );
			expect( myFonts.toJSON() ).to.include( { type: 'one', id: 'foobar', displayName: 'foobar', provider: 'myprovider' } );
			expect( myFonts.toJSON().length ).to.equal( 1 );
		} );
	} );

	describe( '.setSelectedFont()', function() {
		it( 'adds a model to the collection if no matching type exists', function() {
			selectedFonts.setSelectedFont( { type: 'three', id: 'afont', displayName: 'afont', provider: 'myprovider' } );
			expect( selectedFonts.toJSON() ).to.include( { type: 'three', id: 'afont', displayName: 'afont', provider: 'myprovider' } );
		} );

		it( 'replaces the existing model of the same type if it exists', function() {
			selectedFonts.setSelectedFont( { type: 'four', id: 'anotherthing', displayName: 'anotherthing', provider: 'myprovider' } );
			expect( selectedFonts.toJSON() ).to.not.include( { type: 'four', id: 'something', displayName: 'something', provider: 'myprovider' } );
			expect( selectedFonts.toJSON() ).to.include( { type: 'four', id: 'anotherthing', displayName: 'anotherthing', provider: 'myprovider' } );
		} );

		it( 'triggers a change event when the font changes', function() {
			var spy = sinon.spy();
			selectedFonts.on( 'change', spy );
			selectedFonts.setSelectedFont( { type: 'three', id: 'afont', displayName: 'afont', provider: 'myprovider' } );
			expect( spy ).to.have.been.called;
		} );
	} );

	describe( '.getFontByType()', function() {
		it( 'returns a model matching the type', function() {
			expect( selectedFonts.getFontByType( 'two' ).toJSON() ).to.eql( { type: 'two', id: 'foobar', displayName: 'foobar', provider: 'myprovider' } );
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
			expect( selectedFonts.toJSON() ).to.include( { id: 'foobar', type: 'one', displayName: 'foobar', provider: 'myprovider' } );
		} );

		it( 'does not return models without an id', function() {
			expect( selectedFonts.toJSON() ).to.not.include( { type: 'test', displayName: 'test', provider: 'myprovider' } );
		} );

		it( 'returns all models in the collection which have the same id', function() {
			expect( selectedFonts.toJSON() ).to.include( { id: 'foobar', type: 'one', displayName: 'foobar', provider: 'myprovider' } );
			expect( selectedFonts.toJSON() ).to.include( { id: 'foobar', type: 'two', displayName: 'foobar', provider: 'myprovider' } );
		} );
	} );
} );

