var api = require( '../helpers/api' ),
	debug = require( 'debug' )( 'jetpack-fonts' ),
	PreviewStyles = require( '../helpers/preview-styles' ),
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider;

// Initialize the default Provider Views
require( '../providers/google' );

function addFontToPage( font ) {
	var ProviderView = getViewForProvider( font.provider );
	if ( ! ProviderView ) {
		debug( 'live update failed because no provider could be found for', font );
		return;
	}
	ProviderView.addFontToPage( font );
}

function liveUpdateFontsInPreview( selectedFonts ) {
	debug( 'rendering live update for new styles', selectedFonts );
	selectedFonts.forEach( addFontToPage );
	PreviewStyles.writeFontStyles( selectedFonts );
}

function init() {
	var interval;
	debug( 'binding live updates for custom-fonts' );
	api( 'jetpack_fonts[selected_fonts]', function( value ) {
		value.bind( liveUpdateFontsInPreview );
	} );

	// The Customizer doesn't give us the initial value
	// we need. Get it when we're able to initialize properly.
	interval = setInterval( function(){
		var val = api( 'jetpack_fonts[selected_fonts]' );
		if ( val && val.get() ) {
			clearInterval( interval );
			liveUpdateFontsInPreview( val.get() );
		}
	}, 100 );
}

module.exports = {
	liveUpdateFontsInPreview: liveUpdateFontsInPreview
};

init();
