var Backbone = require( '../helpers/backbone' );

var FontWeightDropdown = require( '../views/font-weight-dropdown' ),
CurrentFontWeight = require( '../views/current-font-weight' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-weight-control',

	initialize: function( opts ) {
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

	render: function() {
		this.$el.html( '' );
		this.$el.append( new CurrentFontWeight({
			type: this.type,
			currentFont: this.currentFont,
			fontData: this.fontData,
			selectedAvailableFont: this.getSelectedAvailableFont()
		}).render().el );
		this.$el.append( new FontWeightDropdown({
			type: this.type,
			currentFont: this.currentFont,
			fontData: this.fontData,
			selectedAvailableFont: this.getSelectedAvailableFont()
		}).render().el );
		return this;
	}

} );
