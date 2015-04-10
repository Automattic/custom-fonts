var debug = require( 'debug' )( 'jetpack-fonts' );

var Backbone = require( '../helpers/backbone' ),
	Emitter = require( '../helpers/emitter' ),
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider;

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__current_font',

	events: {
		'click': 'toggleDropdown'
	},

	initialize: function( opts ) {
		this.currentFont = opts.currentFont;
		this.type = opts.type;
		this.menu = opts.menu;
		this.listenTo( this.currentFont, 'change', this.render );
	},

	render: function() {
		if ( this.providerView ) {
			this.providerView.remove();
		}
		this.$el.text( '' );
		var ProviderView = getViewForProvider( this.currentFont.get( 'provider' ) );
		if ( ! ProviderView ) {
			debug( 'rendering currentFont with no providerView for', this.currentFont.toJSON() );
			this.$el.html( this.currentFont.get( 'name' ) );
			return this;
		}
		debug( 'rendering providerView for', this.currentFont.toJSON() );
		this.providerView = new ProviderView({
			model: this.currentFont,
			type: this.type
		});
		this.$el.append( this.providerView.render().el );
		return this;
	},

	toggleDropdown: function() {
		Emitter.trigger( 'toggle-dropdown', { type: this.type, menu: this.menu } );
	}
} );
