/* globals Backbone */

var Emitter = require( '../helpers/emitter' ),
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider;

var DefaultFont = require( '../models/default-font' );

var DefaultFontView = require( '../views/default-font' );

// Dropdown of available fonts
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__menu',
	tagName: 'select',
	id: 'font-select',

	events: {
		'change': 'fontChanged'
	},

	initialize: function( opts ) {
		this.fontData = opts.fontData;
		this.type = opts.type;
	},

	getSelectedFontId: function() {
		return this.$el[0].options[ this.$el[0].selectedIndex ].dataset.fontId;
	},

	getSelectedFontModel: function() {
		var selectedFontId = this.getSelectedFontId();
		var model = this.fontData.find( function( font ) {
			return ( font.get( 'id' ) === selectedFontId );
		} );
		if ( ! model ) {
			model = new DefaultFont();
		}
		return model;
	},

	fontChanged: function() {
		var selectedFont = this.getSelectedFontModel();
		Emitter.trigger( 'change-font', { font: selectedFont, type: this.type } );
	},

	render: function() {
		this.$el.append( new DefaultFontView({
			currentFont: this.model
		}).render().el );

		this.fontData.each( function( font ) {
			var ProviderView = getViewForProvider( font.get( 'provider' ) );
			if ( ! ProviderView ) {
				return;
			}
			this.$el.append( new ProviderView({
				currentFont: this.model,
				font: font
			}).render().el );
		}, this );

		return this;
	}
});

