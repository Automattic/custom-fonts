var api = require( '../helpers/api' );

var DropdownItem = require( '../views/dropdown-item' );

// The default provider Views. Each value should be a Backbone View that will
// render its font option to the font list. Additional provider Views can be
// added by adding to the `wp.customize.JetpackFonts.providerViews` object.
var providerViews = {
	google: DropdownItem.extend({})
};

function importProviderViews() {
	if ( api.JetpackFonts && api.JetpackFonts.providerViews ) {
		Object.keys( api.JetpackFonts.providerViews ).forEach( function( providerKey ) {
			providerViews[ providerKey ] = api.JetpackFonts.providerViews[ providerKey ];
		} );
	}
}

function getViewForProvider( provider ) {
	importProviderViews();
	return providerViews[ provider ];
}

module.exports = {
	getViewForProvider: getViewForProvider
};
