var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-size-option jetpack-fonts__font-property-option',

	events: {
		'click' : 'setSizeOption'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.name = opts.name;
		this.currentFontSize = opts.currentFontSize;
	},

	render: function() {
		this.$el.html( this.name );
		this.$el.attr( 'data-name', this.name );
		if ( this.currentFontSize === this.name ) {
			this.$el.addClass( 'current' );
		}
		return this;
	},

	setSizeOption: function() {
		Emitter.trigger( 'set-size', { size: this.id, type: this.type } );
	}

} );
