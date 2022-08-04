var DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

module.exports = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font-size font-property-control-current',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call( this, opts );
		this.currentFontSize = opts.currentFontSize;
	},

	render: function() {
		this.$el.html( this.currentFontSize );
		this.$el.attr( 'tabindex', '0' );
		return this;
	}

} );
