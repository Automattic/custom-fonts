var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-weight-option',

	events: {
		'click' : 'setWeightOption'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.name = opts.name;
	},

	render: function() {
		this.$el.html( '<div>' + this.name.toString() + '</div>' );
		this.$el.data( 'id', this.id );
		return this;
	},

	setWeightOption: function() {
		Emitter.trigger( 'set-weight', { weight: this.id, type: this.type } );
	}

} );
