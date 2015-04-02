/* globals Backbone */

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__current_font',

	events: {
		'click': 'toggleDropdown'
	},

	initialize: function( opts ) {
		this.currentFont = opts.currentFont;
		this.type = opts.type;
		this.listenTo( this.currentFont, 'change', this.render );
	},

	render: function() {
		this.$el.html( this.currentFont.get( 'name' ) );
		return this;
	},

	toggleDropdown: function() {
		Emitter.trigger( 'toggle-dropdown', this.type );
	}
} );

