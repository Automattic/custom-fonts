var mockery = require( 'mockery' ),
	Backbone = require( 'backbone' );

function FakejQuery() {
	return require( 'jquery' )( require( 'jsdom' ).jsdom().parentWindow );
}

module.exports = {
	before: function() {
		Backbone.$ = FakejQuery();
		mockery.enable( { warnOnUnregistered: false } );
		mockery.registerSubstitute( '../helpers/backbone', 'backbone' );
		mockery.registerSubstitute( '../helpers/underscore', 'underscore' );
	},

	after: function() {
		mockery.disable();
		mockery.deregisterAll();
	},

	jQuery: FakejQuery
};

