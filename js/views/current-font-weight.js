var Backbone = require( '../helpers/backbone' );
var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__current-font-weight',

	events: {
		'click' : 'toggleWeightDropdown'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.selectedAvailableFont = opts.selectedAvailableFont;
	},

	getCurrentFontWeight: function() {
		if ( this.selectedAvailableFont ) {
			var fvds = this.currentFont.get( 'fvds' );
			if ( fvds && Object.keys(fvds).length === 1 ) {
				return this.selectedAvailableFont.getFontWeightNameFromId( fvds[0] );
			} else {
				return 'Regular';
			}
		}
	},

	render: function() {
		this.$el.html( this.getCurrentFontWeight() );
		return this;
	},

	toggleWeightDropdown: function() {
		Emitter.trigger( 'toggle-font-weight', this.type );
	}

} );
