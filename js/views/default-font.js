var DropdownItem = require( '../views/dropdown-item' );

var DefaultFont = require( '../models/default-font' );

module.exports = DropdownItem.extend({
	initialize: function( opts ) {
		this.currentFont = opts.currentFont;
		this.font = new DefaultFont();
	}
});


