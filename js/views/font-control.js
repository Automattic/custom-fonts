var Backbone = require( '../helpers/backbone' );

var FontDropdown = require( '../views/font-dropdown' ),
	CurrentFont = require( '../views/current-font' ),
	DefaultFontButton = require( '../views/default-font-button' );

// Container for the list of available fonts and 'x' button
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__menu_container',

	initialize: function( opts ) {
		this.fontData = opts.fontData;
		this.type = opts.type;
	},

	render: function() {
		this.$el.append( new CurrentFont({
			type: this.type,
			currentFont: this.model,
			fontData: this.fontData
		}).render().el );
		this.$el.append( new FontDropdown({
			type: this.type,
			currentFont: this.model,
			fontData: this.fontData
		}).render().el );
		this.$el.append( new DefaultFontButton({
			type: this.type,
			currentFont: this.model
		}).render().el );
		return this;
	}
});
