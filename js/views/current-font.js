var Backbone = require( '../helpers/backbone' );

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

	// TODO: render using the current font's ProviderView
	render: function() {
		this.$el.html( this.currentFont.get( 'name' ) );
		return this;
	},

	toggleDropdown: function() {
		Emitter.trigger( 'toggle-dropdown', this.type );
	}
} );

