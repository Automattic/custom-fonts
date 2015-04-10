var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

// An individual font in the dropdown list
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__option',

	events: {
		'click' : 'fontChanged'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.currentFont = opts.currentFont;
		if ( this.currentFont ) {
			this.listenTo( this.currentFont, 'change', this.render );
		}
	},

	// Warning: this should be overriden by providers/PROVIDER function
	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		return this;
	},

	// Warning: this should be overriden by providers/PROVIDER function
	addFontToPage: function() {},

	fontChanged: function() {
		Emitter.trigger( 'change-font', { font: this.model, type: this.type } );
	}
});
