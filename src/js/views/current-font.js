var debug = require( 'debug' )( 'jetpack-fonts:CurrentFontView' );

var getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

var CurrentFontView = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font',

	events: {
		'mouseenter': 'dispatchHover',
		'mouseleave': 'dispatchHover',
		'click': 'toggleDropdown',
		'keydown': 'checkKeyboardToggle',
	},

	dispatchHover: function( event ) {
		if ( ! ( event.type === 'mouseenter' || event.type === 'mouseleave' ) ) {
			return;
		}
		this.providerView && this.providerView[ event.type ]( event );
	},

	checkKeyboardToggle: function( event ) {
		if ( event.key === 'Enter' ) {
			this.toggleDropdown();
		}
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
		debug( 'rendering currentFont:', this.currentFont.toJSON() );
		if ( ! this.currentFont.get( 'id' ) ) {
			this.$el.addClass( 'jetpack-fonts__current-font--default' );
		} else {
			this.$el.removeClass( 'jetpack-fonts__current-font--default' );
		}
		if ( this.providerView ) {
			this.providerView.remove();
		}
		this.$el.text( '' );
		this.$el.attr( 'tabindex', '0' );
		var ProviderView = getViewForProvider( this.currentFont.get( 'provider' ) );
		if ( ! ProviderView ) {
			debug( 'rendering currentFont with no providerView for', this.currentFont.toJSON() );
			if ( ! this.currentFont.get( 'displayName' ) ) {
				debug( 'error rendering currentFont because it has no displayName!', this.currentFont.toJSON() );
				this.$el.html( 'Unknown' );
			} else {
				this.$el.html( this.currentFont.get( 'displayName' ) );
			}
			return this;
		}
		debug( 'rendering currentFont providerView for', this.currentFont.toJSON() );
		this.providerView = new ProviderView( {
			model: this.currentFont,
			type: this.type,
			disableFocus: true
		} );
		this.$el.append( this.providerView.render().el );
		return this;
	}

} );

module.exports = CurrentFontView;
