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
			this.listenTo( this.collection, 'reset', this.render );
			this.listenTo( this.collection, 'change', this.render );
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
		},
		render: function() {
			this.$el.append( new JetpackFonts.View.FontDropdown({
				model: this.model,
				fontData: this.fontData
			}).render().el );
			return this;
		}
	});

	JetpackFonts.View.Base = Backbone.View.extend({});

	Dropdown.Parent = Backbone.View.extend({
		className: 'jetpack-fonts__menu',
		tagName: 'select',
		id: 'font-select',
		events: {
			'change': 'testStatus'
		},
		getSelectedFont: function() {
			return this.$el[0].options[ this.$el[0].selectedIndex ].text;
		},
		testStatus: function() {
			console.log( 'selected font changed to', this.getSelectedFont() );
		}
	});

	Dropdown.Item = Backbone.View.extend({
		className: 'jetpack-fonts__option',
		tagName: 'option',
		active: false,
		initialize: function( opts ) {
			this.currentFont = opts.currentFont;
			this.font = opts.font;
			this.listenTo( this.currentFont, 'change:id', 'render' );
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

	JetpackFonts.View.FontDropdown = Dropdown.Parent.extend({
		initialize: function( opts ) {
			this.fontData = opts.fontData;
		},
		render: function() {
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
