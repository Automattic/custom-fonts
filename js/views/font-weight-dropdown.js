var Backbone = require( '../helpers/backbone' );
var Emitter = require( '../helpers/emitter' );

var FontWeightOption = require( '../views/font-weight-option' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-weight-dropdown',

	initialize: function( opts ) {
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.listenTo( Emitter, 'set-weight', this.close );
		this.listenTo( Emitter, 'toggle-font-weight', this.toggle );
	},

	render: function() {
		this.$el.html( '' );
		if ( this.selectedAvailableFont ) {
			var weightOptions = this.selectedAvailableFont.getFontWeightOptions();
			for ( var k in weightOptions ) {
				this.$el.append( new FontWeightOption( {
					type: this.type,
					id: k,
					name: weightOptions[k]
				} ).render().el );
			}
		}
		return this;
	},

	toggle: function( type ) {
		if ( type !== this.type ) {
			return;
		}
		if ( this.isOpen ) {
			this.close();
		} else {
			this.open();
		}
	},

	open: function() {
		this.$el.addClass( 'open' );
		this.isOpen = true;
	},

	close: function() {
		this.$el.removeClass( 'open' );
		this.isOpen = false;
	}

} );
