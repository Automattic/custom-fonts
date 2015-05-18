/* globals _ */

var api = require( './helpers/api' );

var Master = require( './views/master' );

var SelectedFonts = require( './collections/selected-fonts' );

// Customizer Control
api.controlConstructor.jetpackFonts = api.Control.extend({
	ready: function() {
		this.collection = new SelectedFonts( this.setting() );

		this.collection.on( 'change', _.bind( function(){
			this.setting( this.collection.toJSON() );
		}, this ) );

		this.view = new Master({
			collection: this.collection,
			el: this.container
		}).render();

		api.section( this.section() ).container
		.on( 'expanded', function() {
			this.view.loadFonts();
		}.bind( this ));

		api.section( this.section() ).container
		.on( 'collapsed', function() {
			this.view.closeAllMenus();
		}.bind( this ));
	}
});
