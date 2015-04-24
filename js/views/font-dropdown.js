var debug = require( 'debug' )( 'jetpack-fonts' );

var Emitter = require( '../helpers/emitter' );

var getWidowHeight = require( '../helpers/window-measures' ).getWidowHeight,
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownTemplate = require( '../views/dropdown-template' );


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
		this.adjustPosition();

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
	},

	adjustPosition: function() {
		var offset = this.currentFontView.$el.offset();
		var distanceToTop = offset ? offset.top : 0,
			distanceToBottom = 300;

		debug( 'adjusting position of menu; distanceToTop', distanceToTop, 'distanceToBottom', distanceToBottom );
		if ( distanceToTop > distanceToBottom ) {
			debug( 'adjusting menu: closer to bottom' );
			this.$el.css( { 'top': '-300px' } );
		} else {
			debug( 'adjusting menu: closer to top' );
			this.$el.css( { 'top': 'inherit' } );
		}
	}
});
