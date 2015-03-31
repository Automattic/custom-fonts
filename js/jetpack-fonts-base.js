(function($){
	'use strict';
	var api = window.wp.customize,
		settings = window._JetpackFonts,
		JetpackFonts, Dropdown = {};

	JetpackFonts = window.wp.JetpackFonts = {
		View: {},
		Collection: {},
		Model: {}
	};

	JetpackFonts.init = function() {
		this.fontData = new this.Collection.FontData( settings.fonts );
	};

	// The main font control View, containing sections for each setting type
	JetpackFonts.View.Master = Backbone.View.extend({
		initialize: function() {
			// TODO: use a local scoped event bus instead of `Backbone`
			this.listenTo( Backbone, 'change-font', this.updateCurrentFont );
			this.listenTo( this.collection, 'reset', this.render );
			this.listenTo( this.collection, 'change', this.render );
		},

		updateCurrentFont: function( data ) {
			console.log('changing font to', data.font.attributes, 'for', data.type);
			var model = this.findModelWithType( data.type );
			model.set( data.font.attributes );
		},

		render: function() {
			this.$el.text( '' ); // TODO: better to update each View than overwrite
			settings.types.forEach( this.renderTypeControl.bind( this ) );
			return this;
		},

		renderTypeControl: function( type ) {
			this.$el.append( new JetpackFonts.View.FontType({
				type: type,
				currentFont: this.findModelWithType( type ),
				fontData: JetpackFonts.fontData
			}).render().el );
		},

		findModelWithType: function( type ) {
			var model = this.collection.find( function( model ) {
				return ( model.get( 'type' ) === type.id );
			} );
			if ( ! model ) {
				model = this.collection.add( {
					type: type.id
				} );
			}
			return model;
		}
	});

	// A font control View for a particular setting type
	JetpackFonts.View.FontType = Backbone.View.extend({
		className: 'jetpack-fonts__type',
		initialize: function( opts ) {
			this.type = opts.type;
			this.fontData = opts.fontData;
			this.currentFont = opts.currentFont;
		},
		render: function() {
			this.$el.append( '<div class="jetpack-fonts__type" data-font-type="' + this.type.id + '"><h3 class="jetpack-fonts__type-header">' + this.type.name +  '</h3></div>' );
			this.$el.append( new JetpackFonts.View.Font({
				type: this.type,
				model: this.currentFont,
				fontData: this.fontData
			}).render().el );
			return this;
		}
	});

	// A list of fonts in a menu
	JetpackFonts.View.Font = Backbone.View.extend({
		className: 'jetpack-fonts__menu_container',
		initialize: function( opts ) {
			this.fontData = opts.fontData;
			this.type = opts.type;
		},
		render: function() {
			this.$el.append( new JetpackFonts.View.FontDropdown({
				type: this.type,
				model: this.model,
				fontData: this.fontData
			}).render().el );
			this.$el.append( new JetpackFonts.View.DefaultFontButton({
				type: this.type,
				currentFont: this.model
			}).render().el );
			return this;
		}
	});

	JetpackFonts.View.Base = Backbone.View.extend({});

	Dropdown.Parent = Backbone.View.extend({});

	Dropdown.Item = Backbone.View.extend({
		className: 'jetpack-fonts__option',
		tagName: 'option',
		active: false,
		initialize: function( opts ) {
			this.currentFont = opts.currentFont;
			this.font = opts.font;
		},
		render: function() {
			this.$el[0].dataset.fontId = this.font.id;
			this.$el.html( this.font.get( 'name' ) );
			this.checkActive();
			return this;
		},
		checkActive: function() {
			if ( this.active ) {
				this.$el.prop( 'selected', false );
				this.active = false;
			}
			if ( this.currentFont.id === this.font.id ) {
				this.active = true;
				this.$el.prop( 'selected', true );
			}
		}
	});

	// TEMP
	JetpackFonts.View.google = Dropdown.Item.extend({});

	JetpackFonts.View.DefaultFont = Dropdown.Item.extend({
		initialize: function( opts ) {
			this.currentFont = opts.currentFont;
			// TODO: translate this string
			this.font = new JetpackFonts.Model.Font({ id: 'jetpack-default-theme-font', name: 'Default Theme font' });
		}
	});

	JetpackFonts.View.DefaultFontButton = Backbone.View.extend({
		className: 'jetpack-fonts__default_button',
		tagName: 'span',
		events: {
			'click': 'resetToDefault'
		},
		initialize: function( opts ) {
			this.currentFont = opts.currentFont;
			this.type = opts.type;
		},
		render: function() {
			this.$el.html( 'x' );
			if ( this.currentFont.id && this.currentFont.id !== 'jetpack-default-theme-font' ) {
				this.$el.addClass( 'active-button' );
				this.$el.show();
			} else {
				this.$el.removeClass( 'active-button' );
				this.$el.hide();
			}
			return this;
		},
		resetToDefault: function() {
			Backbone.trigger( 'change-font', { font: '', type: this.type } );
		}
	});

	JetpackFonts.View.FontDropdown = Dropdown.Parent.extend({
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
			return JetpackFonts.fontData.find( function( font ) {
				return ( font.get( 'id' ) === selectedFontId );
			} );
		},

		fontChanged: function() {
			var selectedFont = this.getSelectedFontModel();
			console.log( 'selected font changed to', selectedFont.get( 'name' ) );
			Backbone.trigger( 'change-font', { font: selectedFont, type: this.type } );
		},

		render: function() {
			this.$el.append( new JetpackFonts.View.DefaultFont({
				currentFont: this.model
			}).render().el );
			this.fontData.each(function( font ){
				if ( ! JetpackFonts.View[ font.get( 'provider' ) ] ) {
					return;
				}
				this.$el.append( new JetpackFonts.View[ font.get( 'provider' ) ]({
					currentFont: this.model,
					font: font
				}).render().el );
			}, this );
			return this;
		}
	});

	JetpackFonts.Model.FontData = Backbone.Model.extend({});

	// A Model for a currently set font setting for this theme
	JetpackFonts.Model.Font = Backbone.Model.extend({});

	JetpackFonts.Collection.FontData = Backbone.Collection.extend({
		model: JetpackFonts.Model.FontData
	});

	// A Collection of the current font settings for this theme
	JetpackFonts.Collection.Fonts = Backbone.Collection.extend({
		model: JetpackFonts.Model.Font
	});

	// do init
	JetpackFonts.init();

	// Customizer Control
	api.controlConstructor.jetpackFonts = api.Control.extend({
		ready: function() {
			this.collection = new JetpackFonts.Collection.Fonts( this.setting() );

			this.collection.on( 'change', _.bind( function(){
				this.setting( this.collection.toJSON() );
			}, this ) );

			this.view = new JetpackFonts.View.Master({
				collection: this.collection,
				el: this.container
			}).render();

			// TEMP: open our section
			setTimeout( function(){
				this.container.parent().prev().click();
				$('#customize-header-actions > .back').blur();
				window.cf = this;
				window.foo = _.clone( this.setting() );
			}.bind(this), 500 );
		}
	});


})(jQuery);
