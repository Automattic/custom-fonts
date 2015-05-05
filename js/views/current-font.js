var debug = require( 'debug' )( 'jetpack-fonts' );

var getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

var CurrentFontView = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font',

	events: {
		'mouseenter': 'dispatchHover',
		'mouseleave': 'dispatchHover',
		'click': 'toggleDropdown'
	},

	dispatchHover: function( event ) {
		if ( ! ( event.type === 'mouseenter' || event.type === 'mouseleave' ) ) {
			return;
		}
		this.providerView && this.providerView[ event.type ]( event );
	},

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call( this, opts );
		this.currentFont = opts.currentFont;
		this.active = opts.active;
		this.listenTo( this.currentFont, 'change', this.render );
		this.listenTo( this.menuStatus, 'change', this.render );
	},

	render: function() {
		if ( this.active ) {
			this.$el.addClass( 'active' );
		} else {
			this.$el.removeClass( 'active' );
		}
		if ( this.menuStatus.get( 'isOpen' ) ) {
			this.$el.addClass( 'jetpack-fonts__current-font--open' );
		} else {
			this.$el.removeClass( 'jetpack-fonts__current-font--open' );
		}
		debug( 'currentFont', this.currentFont.toJSON() );
		if ( ! this.currentFont.get( 'id' ) ) {
			this.$el.addClass( 'jetpack-fonts__current-font--default' );
		} else {
			this.$el.removeClass( 'jetpack-fonts__current-font--default' );
		}
		if ( this.providerView ) {
			this.providerView.remove();
		}
		this.$el.text( '' );
		var ProviderView = getViewForProvider( this.currentFont.get( 'provider' ) );
		if ( ! ProviderView ) {
			debug( 'rendering currentFont with no providerView for', this.currentFont.toJSON() );
			this.$el.html( this.currentFont.get( 'displayName' ) );
			return this;
		}
		debug( 'rendering currentFont providerView for', this.currentFont.toJSON() );
		this.providerView = new ProviderView( {
			model: this.currentFont,
			type: this.type
		} );
		this.$el.append( this.providerView.render().el );
		return this;
	}

} );

module.exports = CurrentFontView;
