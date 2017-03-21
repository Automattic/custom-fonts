var api = require( './helpers/api' );

var Master = require( './views/master' );

var SelectedFonts = require( './models/selected-fonts' );

// Customizer Control
api.controlConstructor.jetpackFonts = api.Control.extend( {
	ready: function() {
		// Get the existing setting from the Customizer
		this.selectedFonts = new SelectedFonts( this.setting() );

		// Update the setting when the current font changes
		this.selectedFonts.on( 'change', function() {
			this.setting( this.selectedFonts.toJSON() );
		}.bind( this ) );

		this.view = new Master( {
			selectedFonts: this.selectedFonts,
			el: this.container
		} ).render();

		// Delay loading fonts until the Section is opened
		api.section( this.section() ).container
		.one( 'expanded', function() {
			setTimeout( this.view.loadFonts, 200 );
		}.bind( this ) );

		api.section( this.section() ).container
		.on( 'collapsed', function() {
			this.view.closeAllMenus();
		}.bind( this ) );
	}
} );
