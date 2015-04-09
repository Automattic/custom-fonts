var Backbone = require( '../helpers/backbone' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-weight-option',

	initialize: function( opts ) {
		this.id = opts.id;
		this.name = opts.name;
	},

	render: function() {
		this.$el.html( '<div>' + this.name.toString() + '</div>' );
		this.$el.data( 'id', this.id );
		return this;
	}

} );
