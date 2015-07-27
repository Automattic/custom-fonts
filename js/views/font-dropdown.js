var debug = require( 'debug' )( 'jetpack-fonts:FontDropdown' ),
	Emitter = require( '../helpers/emitter' );

var getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownTemplate = require( '../views/dropdown-template' ),
	$ = require( '../helpers/backbone' ).$;

// Dropdown of available fonts
var FontDropdown = DropdownTemplate.extend( {
	className: 'jetpack-fonts__menu',
	id: 'font-select',

	events: {
		'mouseenter > .jetpack-fonts__option': 'dispatchHover',
		'mouseleave > .jetpack-fonts__option': 'dispatchHover',
	},

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call( this, opts );
		this.fontData = opts.fontData;
		this.availableFonts = [];
		this.subViews = {};
		this.currentFont = opts.currentFont;
		this.currentFontView = opts.currentFontView;
		this.listenTo( Emitter, 'load-menu-fonts', this.loadFonts );
	},

	loadFonts: function() {
		if ( this.availableFonts.length > 0 ) {
			return;
		}
		this.availableFonts = this.fontData;
		this.render();
	},

	dispatchHover: function( event ) {
		var el;
		if ( ! ( event.type === 'mouseenter' || event.type === 'mouseleave' ) ) {
			return;
		}
		el = event.currentTarget;
		if ( el.cid && this.subViews[ el.cid ] ) {
			this.subViews[ el.cid ][ event.type ]( event );
		}
	},

	render: function() {
		Object.keys( this.subViews ).forEach( function( cid ) {
			this.subViews[ cid ].remove();
		}.bind( this ) );
		debug( 'rendering', this.availableFonts.length, 'availableFonts for', this.type );
		this.availableFonts.forEach( function( font ) {
			var ProviderView = getViewForProvider( font.get( 'provider' ) );
			if ( ! ProviderView ) {
				return;
			}
			debug( 'rendering providerView in', this.type, 'font list for', font.toJSON() );
			var view = new ProviderView( {
				model: font,
				type: this.type,
				currentFont: this.currentFont
			} ).render();

			view.el.cid = view.cid;
			this.subViews[ view.cid ] = view;
			this.$el.append( view.el );
		}, this );
		return this;
	},

	open: function() {
		DropdownTemplate.prototype.open.call( this );
		this.adjustPosition();
	},

	adjustPosition: function() {
		var offset = this.currentFontView.$el.offset();
		var myHeight = this.currentFontView.$el.height();
		var availableHeight = $( '.wp-full-overlay-sidebar-content' ).height();
		var middle = availableHeight / 2;

		debug( 'adjusting position of menu; offset.top', offset.top, 'middle', middle, 'calc', offset.top - ( myHeight / 2 ) );
		if ( offset.top - ( myHeight / 2 ) >= middle ) {
			debug( 'menu: closer to bottom' );
			this.$el.removeClass( 'open-down' ).css( {
				height: offset.top - myHeight - 10
			} );
		} else {
			debug( 'menu: closer to top' );
			debug( 'offset.top', offset.top, 'availableHeight', availableHeight, 'myHeight', myHeight );
			this.$el.addClass( 'open-down' ).css( {
				height: availableHeight - offset.top - 10
			} );
		}
	}
} );

module.exports = FontDropdown;
