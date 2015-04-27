var DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

var getFontVariantNameFromId = require( '../helpers/fvd-to-readable' ).getFontVariantNameFromId;

module.exports = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font-variant font-property-control-current',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call(this, opts);
		this.currentFontVariant = opts.currentFontVariant;
		this.multiOptions = opts.multiOptions;
	},

	render: function() {
		this.$el.html( getFontVariantNameFromId( this.currentFontVariant ) );
		if ( this.multiOptions === false ) {
			this.$el.addClass( 'inactive' );
		} else {
			this.$el.removeClass( 'inactive' );
		}
		return this;
	}

} );
