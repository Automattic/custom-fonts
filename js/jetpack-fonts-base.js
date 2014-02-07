(function($){
	'use strict';
	var api = window.wp.customize,
		settings = window._JetpackFonts,
		JetpackFonts, Dropdown = {};

	JetpackFonts = {
		View: {},
		Collection: {},
		Model: {}
	};

	JetpackFonts.init = function() {
		this.fontData = new this.Collection.FontData( settings.fonts );
	};

	JetpackFonts.View.Master = Backbone.View.extend({
		render: function() {
			this.collection.each( function( model ){
				var type = _.findWhere( settings.types, { id: model.get( 'type' ) } );
				this.$el.append( '<h3>' + type.name +  '</h3>' );
				this.$el.append( new JetpackFonts.View.Font({
					model: model,
					fontData: JetpackFonts.fontData
				}).render().el );
			}, this );
			return this;
		}
	});

	JetpackFonts.View.Font = Backbone.View.extend({
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
		tagName: 'select'
	});

	Dropdown.Item = Backbone.View.extend({
		tagName: 'option',
		active: false,
		initialize: function( opts ) {
			this.font = opts.font;
			this.listenTo( this.model, 'change:id', 'render' );
		},
		render: function() {
			this.$el.html( this.font.get( 'name' ) );
			this.checkActive();
			return this;
		},
		checkActive: function() {
			if ( this.active ) {
				this.$el.prop( 'selected', false );
				this.active = false;
			}
			if ( this.model.id === this.font.id ) {
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
					model: this.model,
					font: font
				}).render().el );
			}, this );
			return this;
		}
	});

	JetpackFonts.Model.FontData = Backbone.Model.extend({});

	JetpackFonts.Model.Font = Backbone.Model.extend({});

	JetpackFonts.Collection.FontData = Backbone.Collection.extend({
		model: JetpackFonts.Model.FontData
	});

	JetpackFonts.Collection.Fonts = Backbone.Collection.extend({
		model: JetpackFonts.Model.Font
	});

	// do init
	JetpackFonts.init();

	// Customizer
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

	// expose
	window.wp.JetpackFonts = JetpackFonts;



})(jQuery);