var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

var DefaultFont = require( '../models/default-font' );

// 'x' button that resets font to default
var DefaultFontButton = Backbone.View.extend( {
	className: 'jetpack-fonts__default-button',
	tagName: 'span',

	events: {
		'click': 'resetToDefault',
		'keydown': 'checkKeyboardReset'
	},

	initialize: function( opts ) {
		this.currentFont = opts.currentFont;
		this.type = opts.type;
		if ( ! this.type ) {
			throw 'Error: cannot create DefaultFontButton without a type';
		}
		this.menuStatus = opts.menuStatus;
		this.listenTo( this.currentFont, 'change', this.render );
		this.listenTo( this.menuStatus, 'change', this.render );
	},

	render: function() {
		this.$el.html( '' );
		if ( this.currentFont.id && ! this.menuStatus.get( 'isOpen' ) ) {
			this.$el.addClass( 'active-button' );
			this.$el.show();
		} else {
			this.$el.removeClass( 'active-button' );
			this.$el.hide();
		}
		this.$el.attr( 'tabindex', '0' );
		return this;
	},

	resetToDefault: function() {
		Emitter.trigger( 'change-font', { font: new DefaultFont(), type: this.type.id } );
	},

	checkKeyboardReset: function(event) {
		if (event.key === 'Enter') {
			this.resetToDefault();
		}
	}
} );

module.exports = DefaultFontButton;
