var api = require( './helpers/api' );

var Master = require( './views/master' );

var SelectedFonts = require( './collections/selected-fonts' );

// Customizer Control
api.controlConstructor.jetpackFonts = api.Control.extend({
	ready: function() {
		// Get the existing setting from the Customizer
		this.collection = new SelectedFonts( this.setting() );

		// Update the setting when the current font changes
		this.collection.on( 'change', function() {
			this.setting( this.collection.toJSON() );
		}.bind( this ) );

		this.view = new Master({
			collection: this.collection,
			el: this.container
		}).render();

		// Delay loading fonts until the Section is opened
		api.section( this.section() ).container
		.one( 'expanded', function() {
			this.view.loadFonts();
		}.bind( this ));

		api.section( this.section() ).container
		.on( 'collapsed', function() {
			this.view.closeAllMenus();
		}.bind( this ));
	}
});
