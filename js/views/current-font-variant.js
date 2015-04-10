var DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

module.exports = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font-variant',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call(this, opts);
		this.currentFontVariant = opts.currentFontVariant;
	},

	render: function() {
		this.$el.html( this.currentFontVariant );
		return this;
	}

} );
