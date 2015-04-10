var debug = require( 'debug' )( 'jetpack-fonts' );

var getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

module.exports = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current_font',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call(this, opts);
		this.currentFont = opts.currentFont;
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
	}

} );
