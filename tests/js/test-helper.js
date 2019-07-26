var chai = require( 'chai' ),
	sinonChai = require( 'sinon-chai' );
chai.use( sinonChai );

var mockery = require( 'mockery' ),
	Backbone = require( 'backbone' );

function FakejQuery() {
	// https://stackoverflow.com/a/48561448/62202
	const { JSDOM } = require('jsdom');
	const { window } = new JSDOM();
	const { document } = (new JSDOM('')).window;
	global.document = document;
	return require( 'jquery' )( window );
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

