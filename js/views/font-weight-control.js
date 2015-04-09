var Backbone = require( '../helpers/backbone' );

var FontWeightOption = require( '../views/font-weight-option' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-weight-control',

	initialize: function( opts ) {
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
	},

	getWeightOptions: function() {
		var selectedAvailableFont = this.fontData.findWhere( { name: this.currentFont.get( 'name' ) } );
		if ( !selectedAvailableFont ) {
			return false;
		}
		return selectedAvailableFont.getFontWeightOptions();
	},

	render: function() {
		this.$el.html( '' );
		var weightOptions = this.getWeightOptions();
		if ( weightOptions ) {
			for ( var k in weightOptions ) {
				this.$el.append( new FontWeightOption( {
					id: k,
					name: weightOptions[k]
				} ).render().el );
			}
		}
		return this;
	}

} );
