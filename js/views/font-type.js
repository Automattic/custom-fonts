var Backbone = require( '../helpers/backbone' );

var FontControl = require( '../views/font-control' );

// A font control View for a particular setting type
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__type',
	initialize: function( opts ) {
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
	},
	render: function() {
		this.$el.append( '<div class="jetpack-fonts__type" data-font-type="' + this.type.id + '"><h3 class="jetpack-fonts__type-header">' + this.type.name +  '</h3></div>' );
		this.$el.append( new FontControl({
			type: this.type,
			model: this.currentFont,
			fontData: this.fontData
		}).render().el );
		return this;
	}
});

