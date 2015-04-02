(function($){
	'use strict';
	var api = window.wp.customize,
		settings = window._JetpackFonts,
		JetpackFonts, Dropdown = {};

	JetpackFonts = window.wp.JetpackFonts = {
		Emitter: _.extend( Backbone.Events ),
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
			this.listenTo( JetpackFonts.Emitter, 'change-font', this.updateCurrentFont );
		},

		updateCurrentFont: function( data ) {
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
					type: type.id,
					name: 'Default Theme font'
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

	// Container for the list of available fonts and 'x' button
	JetpackFonts.View.Font = Backbone.View.extend({
		className: 'jetpack-fonts__menu_container',

		initialize: function( opts ) {
			this.fontData = opts.fontData;
			this.type = opts.type;
		},
		render: function() {
			this.$el.append( new JetpackFonts.View.CurrentFont({
				type: this.type,
				currentFont: this.model,
				fontData: this.fontData
			}).render().el );
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


	JetpackFonts.View.CurrentFont = Backbone.View.extend( {
		className: 'jetpack-fonts__current_font',

		events: {
			'click': 'toggleDropdown'
		},

		initialize: function( opts ) {
			this.currentFont = opts.currentFont;
			this.type = opts.type;
			this.listenTo( this.currentFont, 'change', this.render );
		},

		render: function() {
			this.$el.html( this.currentFont.get( 'name' ) );
			return this;
		},

		toggleDropdown: function() {
			JetpackFonts.Emitter.trigger( 'toggle-dropdown', this.type );
		}
	} );

	Dropdown.Parent = Backbone.View.extend({});

	// An individual font in the dropdown list
	Dropdown.Item = Backbone.View.extend({
		className: 'jetpack-fonts__option',
		active: false,

		events: {
			'click' : 'fontChanged'
		},

		initialize: function( opts ) {
			this.currentFont = opts.currentFont;
			this.font = opts.font;
			this.type = opts.type;
			this.listenTo( this.currentFont, 'change', this.render );
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
		},

		fontChanged: function() {
			JetpackFonts.Emitter.trigger( 'change-font', { font: this.font, type: this.type } );
		}
	});

	// TEMP
	JetpackFonts.View.google = Dropdown.Item.extend({});

	// 'x' button that resets font to default
	JetpackFonts.View.DefaultFontButton = Backbone.View.extend({
		className: 'jetpack-fonts__default_button',
		tagName: 'span',
		events: {
			'click': 'resetToDefault'
		},
		initialize: function( opts ) {
			this.currentFont = opts.currentFont;
			this.type = opts.type;
			this.listenTo( this.currentFont, 'change', this.render );
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
			JetpackFonts.Emitter.trigger( 'change-font', { font: new JetpackFonts.Model.DefaultFont(), type: this.type } );
		}
	});

	// Dropdown of available fonts
	JetpackFonts.View.FontDropdown = Dropdown.Parent.extend({
		className: 'jetpack-fonts__menu',
		id: 'font-select',
		isOpen: false,

		initialize: function( opts ) {
			this.listenTo( JetpackFonts.Emitter, 'toggle-dropdown', this.toggle );
			this.listenTo( JetpackFonts.Emitter, 'change-font', this.close );
			this.fontData = opts.fontData;
			this.type = opts.type;
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
			this.screenFit();
			this.isOpen = true;
		},

		close: function() {
			this.$el.removeClass( 'open' );
			this.isOpen = false;
		},

		render: function() {
			this.fontData.each(function( font ){
				if ( ! JetpackFonts.View[ font.get( 'provider' ) ] ) {
					return;
				}
				this.$el.append( new JetpackFonts.View[ font.get( 'provider' ) ]({
					currentFont: this.model,
					font: font,
					type: this.type
				}).render().el );
			}, this );
			return this;
		},

		screenFit: function() {
			var padding, controlsHeight, offset, scrollHeight, allowableHeight, topOffset;
			// reset height/top in case it's been set previously and the viewport has changed
			// we're not going to assign a window.resize listener because it's an edge case and
			// resize handlers should be avoided where possible
			this.$el.css({ height: '', top: '' });

			padding = 20;
			controlsHeight = $( window ).height();
			offset = this.$el.offset();
			scrollHeight = this.$el.height();
			if ( padding + offset.top + scrollHeight <= controlsHeight ) {
				return;
			}
			allowableHeight = controlsHeight - ( padding * 2 );
		// 	// let's see if we can just shift it up a bit
			if ( scrollHeight <= allowableHeight ) {
				topOffset = allowableHeight - scrollHeight - offset.top;
				this.$el.css( 'top', topOffset );
				return;
			}
		// it's too big
			topOffset = padding - offset.top;
			this.$el.css({
				top: topOffset + 110, // 110 == offset from top of customizer elements.
				height: allowableHeight - 145 // 145 == above offset plus the collapse element
			});
		}
	});

	JetpackFonts.Model.FontData = Backbone.Model.extend({});

	// A Model for a currently set font setting for this theme
	JetpackFonts.Model.Font = Backbone.Model.extend({});

	JetpackFonts.Collection.FontData = Backbone.Collection.extend({
		model: JetpackFonts.Model.FontData
	});

	JetpackFonts.Model.DefaultFont = JetpackFonts.Model.Font.extend({
		initialize: function() {
			// TODO: translate this string
			this.set({ id: 'jetpack-default-theme-font', name: 'Default Theme font' });
		}
	});

	// A Collection of the current font settings for this theme
	JetpackFonts.Collection.Fonts = Backbone.Collection.extend({
		model: JetpackFonts.Model.Font,
		toJSON: function() {
			return this.reduce( function( previous, model ) {
				if ( model.get( 'id' ) && model.get( 'id' ) !== 'jetpack-default-theme-font' ) {
					previous.push( model.toJSON() );
				}
				return previous;
			}, [] );
		}
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
