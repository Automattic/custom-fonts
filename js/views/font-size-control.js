var Backbone = require( '../helpers/backbone' );

var FontSizeDropdown = require( '../views/font-size-dropdown' ),
CurrentFontSize = require( '../views/current-font-size' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-size-control font-property-control',

	initialize: function( opts ) {
		this.menu = 'fontSize';
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
	},

	getSelectedAvailableFont: function() {
		var selectedAvailableFont = this.fontData.findWhere( { name: this.currentFont.get( 'name' ) } );
		if ( !selectedAvailableFont ) {
			return false;
		}
		return selectedAvailableFont;
	},

	getCurrentFontSize: function() {
		var selectedAvailableFont = this.getSelectedAvailableFont();
		if ( selectedAvailableFont ) {
			var size = this.currentFont.get( 'size' );
			if ( size && selectedAvailableFont.getFontSizeNameFromId( size ) ) {
				return selectedAvailableFont.getFontSizeNameFromId( size );
			} else {
				return 'Normal';
			}
		}
	},

	render: function() {
		this.$el.html( '' );
		this.$el.append( new CurrentFontSize( {
			type: this.type,
			menu: this.menu,
			currentFontSize: this.getCurrentFontSize()
		}).render().el );
		this.$el.append( new FontSizeDropdown( {
			type: this.type,
			menu: this.menu,
			selectedAvailableFont: this.getSelectedAvailableFont(),
			currentFontSize: this.getCurrentFontSize()
		}).render().el );
		return this;
	}

} );
