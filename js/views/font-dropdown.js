var debug = require( 'debug' )( 'jetpack-fonts' );

var Emitter = require( '../helpers/emitter' ),
	getWidowHeight = require( '../helpers/window-measures' ).getWidowHeight,
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownTemplate = require( '../views/dropdown-template' );


// Dropdown of available fonts
module.exports = DropdownTemplate.extend({
	className: 'jetpack-fonts__menu',
	id: 'font-select',

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call(this);
		this.listenTo( Emitter, 'toggle-dropdown', this.toggle );
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.type = opts.type;
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
		this.screenFit();
	},

	screenFit: function() {
		var padding, controlsHeight, offset, scrollHeight, allowableHeight, topOffset;
		// reset height/top in case it's been set previously and the viewport has changed
		// we're not going to assign a window.resize listener because it's an edge case and
		// resize handlers should be avoided where possible
		this.$el.css({ height: '', top: '' });

		padding = 20;
		controlsHeight = getWidowHeight();
		offset = this.$el.offset();
		scrollHeight = this.$el.height();
		if ( padding + offset.top + scrollHeight <= controlsHeight ) {
			return;
		}
		allowableHeight = controlsHeight - ( padding * 2 );
		// 	// let's see if we can just shift it up a bit
		if ( scrollHeight <= allowableHeight ) {
			topOffset = allowableHeight - scrollHeight - offset.top;
			this.$el.css( 'top', topOffset );
			return;
		}
		// it's too big
		topOffset = padding - offset.top;
		this.$el.css({
			top: topOffset + 110, // 110 == offset from top of customizer elements.
			height: allowableHeight - 145 // 145 == above offset plus the collapse element
		});
	}
});
