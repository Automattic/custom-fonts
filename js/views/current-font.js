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
		this.listenTo( this.currentFont, 'change', this.render );
	},

	render: function() {
		if ( this.providerView ) {
			this.providerView.remove();
		}
		this.$el.text( '' );
		var ProviderView = getViewForProvider( this.currentFont.get( 'provider' ) );
		if ( ! ProviderView ) {
			this.$el.html( this.currentFont.get( 'name' ) );
			return this;
		}
		this.providerView = new ProviderView({
			model: this.currentFont,
			type: this.type,
			currentFont: this.currentFont
		});
		this.$el.append( this.providerView.render().el );
		return this;
	},

	toggleDropdown: function() {
		Emitter.trigger( 'toggle-dropdown', this.type );
	}
} );
