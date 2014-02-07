(function($){
	var api = window.wp.customize,
		JetpackFonts = {};

	JetpackFonts.MasterView = Backbone.View.extend({
		render: function() {
			this.$el.html( 'Howdy' );
			return this;
		}
	});

	JetpackFonts.BaseView = Backbone.View.extend({});

	JetpackFonts.Model = Backbone.Model.extend({});

	JetpackFonts.Collection = Backbone.Collection.extend({
		model: JetpackFonts.Model
	});

	api.controlConstructor.jetpackFonts = api.Control.extend({
		ready: function() {
			this.collection = new JetpackFonts.Collection( this.setting() );

			this.collection.on( 'change', _.bind( function(){
				this.setting( this.collection.toJSON() );
			}, this ) );

			this.view = new JetpackFonts.MasterView({
				collection: this.collection,
				el: this.container
			}).render();
		}
	});

	// expose
	window.wp.JetpackFonts = JetpackFonts;



})(jQuery);