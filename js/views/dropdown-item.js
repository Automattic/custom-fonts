/* globals Backbone */

// An individual font in the dropdown list
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__option',
	tagName: 'option',
	active: false,

	initialize: function( opts ) {
		this.currentFont = opts.currentFont;
		this.font = opts.font;
		this.listenTo( this.currentFont, 'change', this.render );
	},

	render: function() {
		this.$el[0].dataset.fontId = this.font.id;
		this.$el.html( this.font.get( 'name' ) );
		this.checkActive();
		return this;
	},

	checkActive: function() {
		if ( this.active ) {
			this.$el.prop( 'selected', false );
			this.active = false;
		}
		if ( this.currentFont.id === this.font.id ) {
			this.active = true;
			this.$el.prop( 'selected', true );
		}
	}
});

