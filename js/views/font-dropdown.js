var debug = require( 'debug' )( 'jetpack-fonts' );

var Emitter = require( '../helpers/emitter' );

var getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownTemplate = require( '../views/dropdown-template' ),
	$ = require( '../helpers/backbone').$;

// Dropdown of available fonts
module.exports = DropdownTemplate.extend({
	className: 'jetpack-fonts__menu',
	id: 'font-select',

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call( this, opts );
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.currentFontView = opts.currentFontView;
		this.listenTo( Emitter, 'toggle-dropdown', this.adjustPosition );
	},

	render: function() {
		this.fontData.each( function( font ) {
			var ProviderView = getViewForProvider( font.get( 'provider' ) );
			if ( ! ProviderView ) {
				return;
			}
			debug( 'rendering providerView in font list for', font.toJSON() );
			this.$el.append( new ProviderView({
				model: font,
				type: this.type,
				currentFont: this.currentFont
			}).render().el );
		}, this );

		return this;
	},

	open: function() {
		DropdownTemplate.prototype.open.call(this);
		this.adjustPosition();
	},

	adjustPosition: function() {
		var offset = this.currentFontView.$el.offset();
		var myHeight = this.currentFontView.$el.height();
		var middle = $( '.wp-full-overlay-sidebar-content' ).height() / 2;
		// offset measures from bottom of element
		offset.top = offset.top - ( myHeight / 2 );

		debug( 'adjusting position of menu; offset.top', offset.top, 'middle', middle );
		if ( offset.top <= middle ) {
			debug( 'adjusting menu: closer to bottom' );
			this.$el.addClass( 'open-down' );
		} else {
			debug( 'adjusting menu: closer to top' );
			this.$el.removeClass( 'open-down' );
		}
	}
});
