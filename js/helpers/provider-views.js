var DropdownItem = require( '../views/dropdown-item' );

var providerViews = {
	google: DropdownItem.extend({})
};

function getViewForProvider( provider ) {
	return providerViews[ provider ];
}

module.exports = {
	getViewForProvider: getViewForProvider
};
