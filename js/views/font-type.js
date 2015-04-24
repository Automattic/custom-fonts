var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

var FontControl = require( '../views/font-control' ),
	FontVariantControl = require( '../views/font-variant-control' ),
	FontSizeControl = require( '../views/font-size-control' );

// A font control View for a particular setting type
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__type',

	events: {
		'click' : 'closeMenus'
	},

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
		var subMenusContainer = Backbone.$( '<div class="jetpack-fonts__type-options"></div>' );
		subMenusContainer.append( new FontVariantControl({
			type: this.type,
			currentFont: this.currentFont,
			fontData: this.fontData
		}).render().el );
		subMenusContainer.append( new FontSizeControl({
			type: this.type,
			currentFont: this.currentFont,
			fontData: this.fontData
		}).render().el );
		this.$el.append( subMenusContainer );
		return this;
	},

	closeMenus: function() {
		Emitter.trigger( 'close-open-menus' );
	}
});
