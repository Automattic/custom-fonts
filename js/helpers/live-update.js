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
	debug( 'binding live updates for custom-fonts' );
	api( 'jetpack_fonts[selected_fonts]', function( value ) {
		value.bind( function( selectedFonts ) {
			liveUpdateFontsInPreview( selectedFonts );
		} );
	} );
}

module.exports = {
	liveUpdateFontsInPreview: liveUpdateFontsInPreview
};

init();
