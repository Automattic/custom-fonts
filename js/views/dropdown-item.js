var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

// An individual font in the dropdown list
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__option',
	active: false,

	events: {
		'click' : 'fontChanged'
	},

	initialize: function( opts ) {
		this.type = opts.type;
	},

	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		return this;
	},

	fontChanged: function() {
		Emitter.trigger( 'change-font', { font: this.model, type: this.type } );
	}
});

