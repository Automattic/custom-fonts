var chai = require( 'chai' ),
	sinonChai = require( 'sinon-chai' );
chai.use( sinonChai );

var mockery = require( 'mockery' ),
	Backbone = require( 'backbone' );

function FakejQuery() {
	return require( 'jquery' )( require( 'jsdom' ).jsdom().parentWindow );
}

module.exports = {
	before: function() {
		Backbone.$ = FakejQuery();
		mockery.enable( { warnOnUnregistered: false, useCleanCache: true } );
		mockery.registerMock( '../helpers/backbone', Backbone );
		mockery.registerSubstitute( '../helpers/underscore', 'underscore' );
	},

	after: function() {
		mockery.disable();
		mockery.deregisterAll();
	},

	jQuery: FakejQuery
};

