(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var AvailableFont = require( '../models/available-font' );

module.exports = Backbone.Collection.extend({
	model: AvailableFont
});

},{"../helpers/backbone":6,"../models/available-font":13}],2:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var SelectedFont = require( '../models/selected-font' );

// A Collection of the current font settings for this theme
module.exports = Backbone.Collection.extend({

	model: SelectedFont,

	toJSON: function() {
		// skip any fonts set to the default
		return this.reduce( function( previous, model ) {
			if ( model.get( 'id' ) && model.get( 'id' ) !== 'jetpack-default-theme-font' ) {
				previous.push( model.toJSON() );
			}
			return previous;
		}, [] );
	}
});


},{"../helpers/backbone":6,"../models/selected-font":15}],3:[function(require,module,exports){
module.exports = window.wp.customize;

},{}],4:[function(require,module,exports){
var settings = require( '../helpers/bootstrap' );

var fonts = [];
if ( settings && settings.fonts ) {
	fonts = settings.fonts;
}

module.exports = fonts;


},{"../helpers/bootstrap":7}],5:[function(require,module,exports){
var settings = require( '../helpers/bootstrap' );
var _ = require( '../helpers/underscore' );

var types = [];
if ( settings && settings.types ) {
	types = settings.types;
	var idx;
	_.find( types, function( type, i ){
		if ( type.id === 'headings' ) {
			idx = i;
			return true;
		}
	} ) ;
	types.splice(0, 0, types.splice(idx, 1)[0] );
}

module.exports = types;

},{"../helpers/bootstrap":7,"../helpers/underscore":10}],6:[function(require,module,exports){
/* globals Backbone */
module.exports = Backbone;

},{}],7:[function(require,module,exports){
var settings = window._JetpackFonts;

module.exports = settings;

},{}],8:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
	_ = require( '../helpers/underscore' );

module.exports = _.extend( Backbone.Events );


},{"../helpers/backbone":6,"../helpers/underscore":10}],9:[function(require,module,exports){
/**
 * This helper sets up Views to render each font for specific providers. Each
 * View should be an instance of `wp.customize.JetpackFonts.ProviderView` (which
 * is a `Backbone.View`) that will render its font option to the font list.
 * Additional provider Views can be added by adding to the
 * `wp.customize.JetpackFonts.providerViews` object using the provider id as the
 * key. The only thing that needs to be added for each ProviderView is the
 * `render` method. Each ProviderView has as its `model` object the font object
 * it needs to display, including the `name` and `id` attributes.
 */

var api = require( '../helpers/api' ),
	debug = require( 'debug' )( 'jetpack-fonts' );

var DropdownItem = require( '../views/dropdown-item' );
if ( ! api.JetpackFonts ) {
	api.JetpackFonts = {};
}
if ( ! api.JetpackFonts.providerViews ) {
	api.JetpackFonts.providerViews = {};
}
api.JetpackFonts.ProviderView = DropdownItem;

var providerViews = {};

function importProviderViews() {
	debug( 'importing provider views from', api.JetpackFonts.providerViews );
	if ( api.JetpackFonts.providerViews ) {
		Object.keys( api.JetpackFonts.providerViews ).forEach( function( providerKey ) {
			providerViews[ providerKey ] = api.JetpackFonts.providerViews[ providerKey ];
		} );
	}
}

function getViewForProvider( provider ) {
	importProviderViews();
	if ( providerViews[ provider ] ) {
		debug( 'found view for provider', provider, ':', providerViews[ provider ] );
		return providerViews[ provider ];
	}
	debug( 'no view found for provider', provider );
	return null;
}

module.exports = {
	getViewForProvider: getViewForProvider
};

},{"../helpers/api":3,"../views/dropdown-item":22,"debug":34}],10:[function(require,module,exports){
/* globals _ */
module.exports = _;

},{}],11:[function(require,module,exports){
function getWidowHeight() {
	return window.innerHeight;
}

module.exports = {
	getWidowHeight: getWidowHeight
};

},{}],12:[function(require,module,exports){
/* globals _ */

var api = require( './helpers/api' );

var Master = require( './views/master' );

var SelectedFonts = require( './collections/selected-fonts' );

// Customizer Control
api.controlConstructor.jetpackFonts = api.Control.extend({
	ready: function() {
		this.collection = new SelectedFonts( this.setting() );

		this.collection.on( 'change', _.bind( function(){
			this.setting( this.collection.toJSON() );
		}, this ) );

		this.view = new Master({
			collection: this.collection,
			el: this.container
		}).render();
	}
});

},{"./collections/selected-fonts":2,"./helpers/api":3,"./views/master":33}],13:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' ),
_ = require( '../helpers/underscore' );

var sizeOptions = [ { id: -10, name: 'Tiny' }, { id: -5, name: 'Small' }, { id: 0, name: 'Normal' }, { id: 5, name: 'Large' }, { id: 10, name: 'Huge' } ];

module.exports = Backbone.Model.extend({
	getFontVariantOptions: function() {
		if ( this.get( 'fvds' ) ) {
			return this.get( 'fvds' );
		}
	},

	getFontVariantNameFromId: function( id ) {
		if ( this.get( 'fvds' ) ) {
			return this.get( 'fvds' )[id];
		}
	},

	getFontSizeOptions: function() {
		return sizeOptions;
	},

	getFontSizeNameFromId: function( id ) {
		var option = _.findWhere( sizeOptions, { id: id } );
		if ( option ) {
			return option.name;
		} else {
			return false;
		}
	}
});

},{"../helpers/backbone":6,"../helpers/underscore":10}],14:[function(require,module,exports){
var SelectedFont = require( '../models/selected-font' );

module.exports = SelectedFont.extend({
	initialize: function() {
		// TODO: translate this string
		this.set({ id: 'jetpack-default-theme-font', name: 'Default Theme font', provider: '' });
	}
});


},{"../models/selected-font":15}],15:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

// A Model for a currently set font setting for this theme
module.exports = Backbone.Model.extend({});

},{"../helpers/backbone":6}],16:[function(require,module,exports){
/* globals WebFont */
var api = require( '../helpers/api' );

var loadedFontIds = [];

function addFontToPage( font, text ) {
	if ( ~ loadedFontIds.indexOf( font.id ) ) {
		return;
	}
	loadedFontIds.push( font.id );
	WebFont.load( { google: { families: [ font.id ], text: text } } );
}

var GoogleProviderView = api.JetpackFonts.ProviderView.extend({
	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		this.$el.css( 'font-family', '"' + this.model.get( 'name' ) + '"' );
		if ( this.currentFont && this.currentFont.get( 'name' ) === this.model.get( 'name' ) ) {
			this.$el.addClass( 'active' );
		} else {
			this.$el.removeClass( 'active' );
		}
		addFontToPage( this.model.toJSON(), this.model.get( 'id' ) );
		return this;
	}
});

GoogleProviderView.addFontToPage = addFontToPage;

api.JetpackFonts.providerViews.google = GoogleProviderView;

module.exports = GoogleProviderView;

},{"../helpers/api":3}],17:[function(require,module,exports){
var DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

module.exports = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font-size font-property-control-current',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call(this, opts);
		this.currentFontSize = opts.currentFontSize;
	},

	render: function() {
		this.$el.html( this.currentFontSize );
		return this;
	}

} );

},{"../views/dropdown-current-template":21}],18:[function(require,module,exports){
var DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

module.exports = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current-font-variant font-property-control-current',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call(this, opts);
		this.currentFontVariant = opts.currentFontVariant;
	},

	render: function() {
		this.$el.html( this.currentFontVariant );
		return this;
	}

} );

},{"../views/dropdown-current-template":21}],19:[function(require,module,exports){
var debug = require( 'debug' )( 'jetpack-fonts' );

var getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownCurrentTemplate = require( '../views/dropdown-current-template' );

module.exports = DropdownCurrentTemplate.extend( {
	className: 'jetpack-fonts__current_font',

	initialize: function( opts ) {
		DropdownCurrentTemplate.prototype.initialize.call(this, opts);
		this.currentFont = opts.currentFont;
		this.listenTo( this.currentFont, 'change', this.render );
	},

	render: function() {
		if ( this.providerView ) {
			this.providerView.remove();
		}
		this.$el.text( '' );
		var ProviderView = getViewForProvider( this.currentFont.get( 'provider' ) );
		if ( ! ProviderView ) {
			debug( 'rendering currentFont with no providerView for', this.currentFont.toJSON() );
			this.$el.html( this.currentFont.get( 'name' ) );
			return this;
		}
		debug( 'rendering providerView for', this.currentFont.toJSON() );
		this.providerView = new ProviderView({
			model: this.currentFont,
			type: this.type
		});
		this.$el.append( this.providerView.render().el );
		return this;
	}

} );

},{"../helpers/provider-views":9,"../views/dropdown-current-template":21,"debug":34}],20:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

var DefaultFont = require( '../models/default-font' );

// 'x' button that resets font to default
module.exports = Backbone.View.extend({
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
		Emitter.trigger( 'change-font', { font: new DefaultFont(), type: this.type } );
	}
});


},{"../helpers/backbone":6,"../helpers/emitter":8,"../models/default-font":14}],21:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend({
	events: {
		'click': 'toggleDropdown'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
	},

	toggleDropdown: function( e ) {
		if ( e ) {
			e.stopPropagation();
		}
		Emitter.trigger( 'toggle-dropdown', { type: this.type, menu: this.menu } );
	}
} );

},{"../helpers/backbone":6,"../helpers/emitter":8}],22:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

// An individual font in the dropdown list, exported as
// `api.JetpackFonts.ProviderView`. Extend this object for each provider. The
// extended objects need to define a `render` method to render their provider's
// font name, as well as an `addFontToPage` method on the object itself.
var ProviderView = Backbone.View.extend({
	className: 'jetpack-fonts__option',

	events: {
		'click' : 'fontChanged'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.currentFont = opts.currentFont;
		if ( this.currentFont ) {
			this.listenTo( this.currentFont, 'change', this.render );
		}
	},

	// Warning: this should be overriden in the provider
	render: function() {
		this.$el.html( this.model.get( 'name' ) );
		return this;
	},

	fontChanged: function() {
		Emitter.trigger( 'change-font', { font: this.model, type: this.type } );
	}
});

ProviderView.addFontToPage = function() {};

module.exports = ProviderView;

},{"../helpers/backbone":6,"../helpers/emitter":8}],23:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend({
	initialize: function( opts ) {
		this.type = opts.type;
		this.menu = opts.menu;
		this.listenTo( Emitter, 'close-open-menus', this.close );
		this.listenTo( Emitter, 'toggle-dropdown', this.toggle );
	},

	toggle: function( data ) {
		if ( data.type !== this.type || data.menu !== this.menu ) {
			return;
		}
		if ( this.isOpen ) {
			this.close();
		} else {
			this.open();
		}
	},

	open: function() {
		Emitter.trigger( 'close-open-menus' );
		this.$el.addClass( 'open' );
		this.isOpen = true;
	},

	close: function() {
		this.$el.removeClass( 'open' );
		this.isOpen = false;
	}
} );

},{"../helpers/backbone":6,"../helpers/emitter":8}],24:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var FontDropdown = require( '../views/font-dropdown' ),
	CurrentFont = require( '../views/current-font' ),
	DefaultFontButton = require( '../views/default-font-button' ),
	FontVariantControl = require( '../views/font-variant-control' ),
	FontSizeControl = require( '../views/font-size-control' );

// Container for the list of available fonts and 'x' button
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__menu_container',

	initialize: function( opts ) {
		this.fontData = opts.fontData;
		this.type = opts.type;
		this.menu = 'fontFamily';
	},

	render: function() {
		this.$el.append( new CurrentFont({
			type: this.type,
			menu: this.menu,
			currentFont: this.model
		}).render().el );
		this.$el.append( new FontDropdown({
			type: this.type,
			menu: this.menu,
			currentFont: this.model,
			fontData: this.fontData
		}).render().el );
		this.$el.append( new DefaultFontButton({
			type: this.type,
			currentFont: this.model
		}).render().el );
		this.$el.append( new FontSizeControl({
			type: this.type,
			currentFont: this.model,
			fontData: this.fontData
		}).render().el );
		this.$el.append( new FontVariantControl({
			type: this.type,
			currentFont: this.model,
			fontData: this.fontData
		}).render().el );
		return this;
	}
});

},{"../helpers/backbone":6,"../views/current-font":19,"../views/default-font-button":20,"../views/font-dropdown":25,"../views/font-size-control":26,"../views/font-variant-control":30}],25:[function(require,module,exports){
var debug = require( 'debug' )( 'jetpack-fonts' );

var getWidowHeight = require( '../helpers/window-measures' ).getWidowHeight,
	getViewForProvider = require( '../helpers/provider-views' ).getViewForProvider,
	DropdownTemplate = require( '../views/dropdown-template' );


// Dropdown of available fonts
module.exports = DropdownTemplate.extend({
	className: 'jetpack-fonts__menu',
	id: 'font-select',

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call( this, opts );
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
	},

	render: function() {
		this.fontData.each( function( font ) {
			var ProviderView = getViewForProvider( font.get( 'provider' ) );
			if ( ! ProviderView ) {
				return;
			}
			debug( 'rendering providerView in font list for', font.toJSON() );
			this.$el.append( new ProviderView({
				model: font,
				type: this.type,
				currentFont: this.currentFont
			}).render().el );
		}, this );

		return this;
	},

	open: function() {
		DropdownTemplate.prototype.open.call(this);
		this.screenFit();
	},

	screenFit: function() {
		var padding, controlsHeight, offset, scrollHeight, allowableHeight, topOffset;
		// reset height/top in case it's been set previously and the viewport has changed
		// we're not going to assign a window.resize listener because it's an edge case and
		// resize handlers should be avoided where possible
		this.$el.css({ height: '', top: '' });

		padding = 20;
		controlsHeight = getWidowHeight();
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

},{"../helpers/provider-views":9,"../helpers/window-measures":11,"../views/dropdown-template":23,"debug":34}],26:[function(require,module,exports){
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
				return 'Normal Size';
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

},{"../helpers/backbone":6,"../views/current-font-size":17,"../views/font-size-dropdown":27}],27:[function(require,module,exports){
var FontSizeOption = require( '../views/font-size-option' ),
DropdownTemplate = require( '../views/dropdown-template' );

module.exports = DropdownTemplate.extend( {
	className: 'jetpack-fonts__font-size-dropdown font-property-control-dropdown',

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call( this, opts );
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.currentFontSize = opts.currentFontSize;
	},

	render: function() {
		this.$el.html( '' );
		if ( this.selectedAvailableFont ) {
			var sizeOptions = this.selectedAvailableFont.getFontSizeOptions();
			sizeOptions.forEach( function( option ) {
				this.$el.append( new FontSizeOption( {
					type: this.type,
					id: option.id,
					name: option.name,
					currentFontSize: this.currentFontSize
				} ).render().el );
			}.bind(this) );
		}
		return this;
	}

} );

},{"../views/dropdown-template":23,"../views/font-size-option":28}],28:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-size-option jetpack-fonts__font-property-option',

	events: {
		'click' : 'setSizeOption'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.name = opts.name;
		this.currentFontSize = opts.currentFontSize;
	},

	render: function() {
		this.$el.html( this.name );
		this.$el.attr( 'data-name', this.name );
		if ( this.currentFontSize === this.name ) {
			this.$el.addClass( 'current' );
		}
		return this;
	},

	setSizeOption: function() {
		Emitter.trigger( 'set-size', { size: this.id, type: this.type } );
	}

} );

},{"../helpers/backbone":6,"../helpers/emitter":8}],29:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

var FontControl = require( '../views/font-control' );

// A font control View for a particular setting type
module.exports = Backbone.View.extend({
	className: 'jetpack-fonts__type',

	events: {
		'click' : 'closeMenus'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.fontData = opts.fontData;
		this.currentFont = opts.currentFont;
	},

	render: function() {
		this.$el.append( '<div class="jetpack-fonts__type" data-font-type="' + this.type.id + '"><h3 class="jetpack-fonts__type-header">' + this.type.name +  '</h3></div>' );
		this.$el.append( new FontControl({
			type: this.type,
			model: this.currentFont,
			fontData: this.fontData
		}).render().el );
		return this;
	},

	closeMenus: function() {
		Emitter.trigger( 'close-open-menus' );
	}
});

},{"../helpers/backbone":6,"../helpers/emitter":8,"../views/font-control":24}],30:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var FontVariantDropdown = require( '../views/font-variant-dropdown' ),
CurrentFontVariant = require( '../views/current-font-variant' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-control font-property-control',

	initialize: function( opts ) {
		this.menu = 'fontVariant';
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

	getCurrentFontVariant: function() {
		var selectedAvailableFont = this.getSelectedAvailableFont();
		if ( selectedAvailableFont && this.type.fvdAdjust ) {
			var fvds = this.currentFont.get( 'fvds' );
			if ( fvds && Object.keys(fvds).length === 1 ) {
				return selectedAvailableFont.getFontVariantNameFromId( fvds[0] );
			} else {
				return 'Regular';
			}
		}
	},

	render: function() {
		this.$el.html( '' );
		this.$el.append( new CurrentFontVariant( {
			type: this.type,
			menu: this.menu,
			currentFontVariant: this.getCurrentFontVariant()
		}).render().el );
		this.$el.append( new FontVariantDropdown( {
			type: this.type,
			menu: this.menu,
			selectedAvailableFont: this.getSelectedAvailableFont(),
			currentFontVariant: this.getCurrentFontVariant()
		}).render().el );
		return this;
	}

} );

},{"../helpers/backbone":6,"../views/current-font-variant":18,"../views/font-variant-dropdown":31}],31:[function(require,module,exports){
var FontVariantOption = require( '../views/font-variant-option' ),
DropdownTemplate = require( '../views/dropdown-template' );

module.exports = DropdownTemplate.extend( {
	className: 'jetpack-fonts__font-variant-dropdown font-property-control-dropdown',

	initialize: function( opts ) {
		DropdownTemplate.prototype.initialize.call( this, opts );
		this.selectedAvailableFont = opts.selectedAvailableFont;
		this.currentFontVariant = opts.currentFontVariant;
	},

	render: function() {
		this.$el.html( '' );
		if ( this.selectedAvailableFont && this.type.fvdAdjust ) {
			var variantOptions = this.selectedAvailableFont.getFontVariantOptions();
			for ( var k in variantOptions ) {
				this.$el.append( new FontVariantOption( {
					type: this.type,
					id: k,
					name: variantOptions[k],
					currentFontVariant: this.currentFontVariant
				} ).render().el );
			}
		}
		return this;
	}

} );

},{"../views/dropdown-template":23,"../views/font-variant-option":32}],32:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' );

module.exports = Backbone.View.extend( {
	className: 'jetpack-fonts__font-variant-option jetpack-fonts__font-property-option',

	events: {
		'click' : 'setVariantOption'
	},

	initialize: function( opts ) {
		this.type = opts.type;
		this.id = opts.id;
		this.name = opts.name;
		this.currentFontVariant = opts.currentFontVariant;
	},

	render: function() {
		this.$el.html( this.name );
		this.$el.data( 'id', this.id );
		if ( this.currentFontVariant === this.name ) {
			this.$el.addClass( 'current' );
		}
		return this;
	},

	setVariantOption: function() {
		Emitter.trigger( 'set-variant', { variant: this.id, type: this.type } );
	}

} );

},{"../helpers/backbone":6,"../helpers/emitter":8}],33:[function(require,module,exports){
var Backbone = require( '../helpers/backbone' );

var Emitter = require( '../helpers/emitter' ),
	debug = require( 'debug' )( 'jetpack-fonts' ),
	availableFonts = require( '../helpers/available-fonts' ),
	availableTypes = require( '../helpers/available-types' );

var FontType = require( '../views/font-type' ),
	AvailableFonts = require( '../collections/available-fonts' );

// Initialize the default Provider Views
require( '../providers/google' );

// The main font control View, containing sections for each setting type
module.exports = Backbone.View.extend({
	initialize: function() {
		debug( 'init with currently selected fonts:', this.collection.toJSON() );
		this.headingFonts = new AvailableFonts( availableFonts );
		this.bodyFonts = new AvailableFonts( this.headingFonts.where( { bodyText: true } ) );
		this.listenTo( Emitter, 'change-font', this.updateCurrentFont );
		this.listenTo( Emitter, 'set-variant', this.setFontVariant );
		this.listenTo( Emitter, 'set-size', this.setFontSize );
	},

	setFontVariant: function( data ) {
		var model = this.findModelWithType( data.type );
		model.set( 'fvds', [data.variant] );
		Emitter.trigger( 'close-open-menus' );
	},

	setFontSize: function( data ) {
		var model = this.findModelWithType( data.type );
		model.set( 'size', data.size );
		Emitter.trigger( 'close-open-menus' );
	},

	updateCurrentFont: function( data ) {
		var model = this.findModelWithType( data.type );
		model.set( data.font.attributes );
		model.unset( 'size' );
		debug( 'updateCurrentFont with', data.font.toJSON(), 'to', model.toJSON() );
		Emitter.trigger( 'close-open-menus' );
	},

	render: function() {
		this.$el.text( '' ); // TODO: better to update each View than overwrite
		debug( 'rendering controls for font types', availableTypes );
		availableTypes.forEach( this.renderTypeControl.bind( this ) );
		return this;
	},

	renderTypeControl: function( type ) {
		var fonts;
		if ( type.bodyText === true ) {
			fonts = this.bodyFonts;
		} else {
			fonts = this.headingFonts;
		}
		this.$el.append( new FontType({
			type: type,
			currentFont: this.findModelWithType( type ),
			fontData: fonts
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

},{"../collections/available-fonts":1,"../helpers/available-fonts":4,"../helpers/available-types":5,"../helpers/backbone":6,"../helpers/emitter":8,"../providers/google":16,"../views/font-type":29,"debug":34}],34:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":35}],35:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":36}],36:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}]},{},[12])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMuanMiLCJqcy9jb2xsZWN0aW9ucy9zZWxlY3RlZC1mb250cy5qcyIsImpzL2hlbHBlcnMvYXBpLmpzIiwianMvaGVscGVycy9hdmFpbGFibGUtZm9udHMuanMiLCJqcy9oZWxwZXJzL2F2YWlsYWJsZS10eXBlcy5qcyIsImpzL2hlbHBlcnMvYmFja2JvbmUuanMiLCJqcy9oZWxwZXJzL2Jvb3RzdHJhcC5qcyIsImpzL2hlbHBlcnMvZW1pdHRlci5qcyIsImpzL2hlbHBlcnMvcHJvdmlkZXItdmlld3MuanMiLCJqcy9oZWxwZXJzL3VuZGVyc2NvcmUuanMiLCJqcy9oZWxwZXJzL3dpbmRvdy1tZWFzdXJlcy5qcyIsImpzL2luZGV4LmpzIiwianMvbW9kZWxzL2F2YWlsYWJsZS1mb250LmpzIiwianMvbW9kZWxzL2RlZmF1bHQtZm9udC5qcyIsImpzL21vZGVscy9zZWxlY3RlZC1mb250LmpzIiwianMvcHJvdmlkZXJzL2dvb2dsZS5qcyIsImpzL3ZpZXdzL2N1cnJlbnQtZm9udC1zaXplLmpzIiwianMvdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQuanMiLCJqcy92aWV3cy9jdXJyZW50LWZvbnQuanMiLCJqcy92aWV3cy9kZWZhdWx0LWZvbnQtYnV0dG9uLmpzIiwianMvdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZS5qcyIsImpzL3ZpZXdzL2Ryb3Bkb3duLWl0ZW0uanMiLCJqcy92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZS5qcyIsImpzL3ZpZXdzL2ZvbnQtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtZHJvcGRvd24uanMiLCJqcy92aWV3cy9mb250LXNpemUtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtc2l6ZS1kcm9wZG93bi5qcyIsImpzL3ZpZXdzL2ZvbnQtc2l6ZS1vcHRpb24uanMiLCJqcy92aWV3cy9mb250LXR5cGUuanMiLCJqcy92aWV3cy9mb250LXZhcmlhbnQtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtdmFyaWFudC1kcm9wZG93bi5qcyIsImpzL3ZpZXdzL2ZvbnQtdmFyaWFudC1vcHRpb24uanMiLCJqcy92aWV3cy9tYXN0ZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEF2YWlsYWJsZUZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL2F2YWlsYWJsZS1mb250JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcblx0bW9kZWw6IEF2YWlsYWJsZUZvbnRcbn0pO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBTZWxlY3RlZEZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL3NlbGVjdGVkLWZvbnQnICk7XG5cbi8vIEEgQ29sbGVjdGlvbiBvZiB0aGUgY3VycmVudCBmb250IHNldHRpbmdzIGZvciB0aGlzIHRoZW1lXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcblxuXHRtb2RlbDogU2VsZWN0ZWRGb250LFxuXG5cdHRvSlNPTjogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gc2tpcCBhbnkgZm9udHMgc2V0IHRvIHRoZSBkZWZhdWx0XG5cdFx0cmV0dXJuIHRoaXMucmVkdWNlKCBmdW5jdGlvbiggcHJldmlvdXMsIG1vZGVsICkge1xuXHRcdFx0aWYgKCBtb2RlbC5nZXQoICdpZCcgKSAmJiBtb2RlbC5nZXQoICdpZCcgKSAhPT0gJ2pldHBhY2stZGVmYXVsdC10aGVtZS1mb250JyApIHtcblx0XHRcdFx0cHJldmlvdXMucHVzaCggbW9kZWwudG9KU09OKCkgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwcmV2aW91cztcblx0XHR9LCBbXSApO1xuXHR9XG59KTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSB3aW5kb3cud3AuY3VzdG9taXplO1xuIiwidmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYm9vdHN0cmFwJyApO1xuXG52YXIgZm9udHMgPSBbXTtcbmlmICggc2V0dGluZ3MgJiYgc2V0dGluZ3MuZm9udHMgKSB7XG5cdGZvbnRzID0gc2V0dGluZ3MuZm9udHM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZm9udHM7XG5cbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Jvb3RzdHJhcCcgKTtcbnZhciBfID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdW5kZXJzY29yZScgKTtcblxudmFyIHR5cGVzID0gW107XG5pZiAoIHNldHRpbmdzICYmIHNldHRpbmdzLnR5cGVzICkge1xuXHR0eXBlcyA9IHNldHRpbmdzLnR5cGVzO1xuXHR2YXIgaWR4O1xuXHRfLmZpbmQoIHR5cGVzLCBmdW5jdGlvbiggdHlwZSwgaSApe1xuXHRcdGlmICggdHlwZS5pZCA9PT0gJ2hlYWRpbmdzJyApIHtcblx0XHRcdGlkeCA9IGk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH0gKSA7XG5cdHR5cGVzLnNwbGljZSgwLCAwLCB0eXBlcy5zcGxpY2UoaWR4LCAxKVswXSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR5cGVzO1xuIiwiLyogZ2xvYmFscyBCYWNrYm9uZSAqL1xubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZTtcbiIsInZhciBzZXR0aW5ncyA9IHdpbmRvdy5fSmV0cGFja0ZvbnRzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHRpbmdzO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5cdF8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IF8uZXh0ZW5kKCBCYWNrYm9uZS5FdmVudHMgKTtcblxuIiwiLyoqXG4gKiBUaGlzIGhlbHBlciBzZXRzIHVwIFZpZXdzIHRvIHJlbmRlciBlYWNoIGZvbnQgZm9yIHNwZWNpZmljIHByb3ZpZGVycy4gRWFjaFxuICogVmlldyBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YgYHdwLmN1c3RvbWl6ZS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3YCAod2hpY2hcbiAqIGlzIGEgYEJhY2tib25lLlZpZXdgKSB0aGF0IHdpbGwgcmVuZGVyIGl0cyBmb250IG9wdGlvbiB0byB0aGUgZm9udCBsaXN0LlxuICogQWRkaXRpb25hbCBwcm92aWRlciBWaWV3cyBjYW4gYmUgYWRkZWQgYnkgYWRkaW5nIHRvIHRoZVxuICogYHdwLmN1c3RvbWl6ZS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3c2Agb2JqZWN0IHVzaW5nIHRoZSBwcm92aWRlciBpZCBhcyB0aGVcbiAqIGtleS4gVGhlIG9ubHkgdGhpbmcgdGhhdCBuZWVkcyB0byBiZSBhZGRlZCBmb3IgZWFjaCBQcm92aWRlclZpZXcgaXMgdGhlXG4gKiBgcmVuZGVyYCBtZXRob2QuIEVhY2ggUHJvdmlkZXJWaWV3IGhhcyBhcyBpdHMgYG1vZGVsYCBvYmplY3QgdGhlIGZvbnQgb2JqZWN0XG4gKiBpdCBuZWVkcyB0byBkaXNwbGF5LCBpbmNsdWRpbmcgdGhlIGBuYW1lYCBhbmQgYGlkYCBhdHRyaWJ1dGVzLlxuICovXG5cbnZhciBhcGkgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hcGknICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250cycgKTtcblxudmFyIERyb3Bkb3duSXRlbSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1pdGVtJyApO1xuaWYgKCAhIGFwaS5KZXRwYWNrRm9udHMgKSB7XG5cdGFwaS5KZXRwYWNrRm9udHMgPSB7fTtcbn1cbmlmICggISBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKSB7XG5cdGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyA9IHt9O1xufVxuYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXcgPSBEcm9wZG93bkl0ZW07XG5cbnZhciBwcm92aWRlclZpZXdzID0ge307XG5cbmZ1bmN0aW9uIGltcG9ydFByb3ZpZGVyVmlld3MoKSB7XG5cdGRlYnVnKCAnaW1wb3J0aW5nIHByb3ZpZGVyIHZpZXdzIGZyb20nLCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKTtcblx0aWYgKCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKSB7XG5cdFx0T2JqZWN0LmtleXMoIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApLmZvckVhY2goIGZ1bmN0aW9uKCBwcm92aWRlcktleSApIHtcblx0XHRcdHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyS2V5IF0gPSBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3NbIHByb3ZpZGVyS2V5IF07XG5cdFx0fSApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFZpZXdGb3JQcm92aWRlciggcHJvdmlkZXIgKSB7XG5cdGltcG9ydFByb3ZpZGVyVmlld3MoKTtcblx0aWYgKCBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdICkge1xuXHRcdGRlYnVnKCAnZm91bmQgdmlldyBmb3IgcHJvdmlkZXInLCBwcm92aWRlciwgJzonLCBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdICk7XG5cdFx0cmV0dXJuIHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyIF07XG5cdH1cblx0ZGVidWcoICdubyB2aWV3IGZvdW5kIGZvciBwcm92aWRlcicsIHByb3ZpZGVyICk7XG5cdHJldHVybiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0Vmlld0ZvclByb3ZpZGVyOiBnZXRWaWV3Rm9yUHJvdmlkZXJcbn07XG4iLCIvKiBnbG9iYWxzIF8gKi9cbm1vZHVsZS5leHBvcnRzID0gXztcbiIsImZ1bmN0aW9uIGdldFdpZG93SGVpZ2h0KCkge1xuXHRyZXR1cm4gd2luZG93LmlubmVySGVpZ2h0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Z2V0V2lkb3dIZWlnaHQ6IGdldFdpZG93SGVpZ2h0XG59O1xuIiwiLyogZ2xvYmFscyBfICovXG5cbnZhciBhcGkgPSByZXF1aXJlKCAnLi9oZWxwZXJzL2FwaScgKTtcblxudmFyIE1hc3RlciA9IHJlcXVpcmUoICcuL3ZpZXdzL21hc3RlcicgKTtcblxudmFyIFNlbGVjdGVkRm9udHMgPSByZXF1aXJlKCAnLi9jb2xsZWN0aW9ucy9zZWxlY3RlZC1mb250cycgKTtcblxuLy8gQ3VzdG9taXplciBDb250cm9sXG5hcGkuY29udHJvbENvbnN0cnVjdG9yLmpldHBhY2tGb250cyA9IGFwaS5Db250cm9sLmV4dGVuZCh7XG5cdHJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNvbGxlY3Rpb24gPSBuZXcgU2VsZWN0ZWRGb250cyggdGhpcy5zZXR0aW5nKCkgKTtcblxuXHRcdHRoaXMuY29sbGVjdGlvbi5vbiggJ2NoYW5nZScsIF8uYmluZCggZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuc2V0dGluZyggdGhpcy5jb2xsZWN0aW9uLnRvSlNPTigpICk7XG5cdFx0fSwgdGhpcyApICk7XG5cblx0XHR0aGlzLnZpZXcgPSBuZXcgTWFzdGVyKHtcblx0XHRcdGNvbGxlY3Rpb246IHRoaXMuY29sbGVjdGlvbixcblx0XHRcdGVsOiB0aGlzLmNvbnRhaW5lclxuXHRcdH0pLnJlbmRlcigpO1xuXHR9XG59KTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICk7XG5cbnZhciBzaXplT3B0aW9ucyA9IFsgeyBpZDogLTEwLCBuYW1lOiAnVGlueScgfSwgeyBpZDogLTUsIG5hbWU6ICdTbWFsbCcgfSwgeyBpZDogMCwgbmFtZTogJ05vcm1hbCcgfSwgeyBpZDogNSwgbmFtZTogJ0xhcmdlJyB9LCB7IGlkOiAxMCwgbmFtZTogJ0h1Z2UnIH0gXTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuXHRnZXRGb250VmFyaWFudE9wdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5nZXQoICdmdmRzJyApICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0KCAnZnZkcycgKTtcblx0XHR9XG5cdH0sXG5cblx0Z2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkOiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0aWYgKCB0aGlzLmdldCggJ2Z2ZHMnICkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXQoICdmdmRzJyApW2lkXTtcblx0XHR9XG5cdH0sXG5cblx0Z2V0Rm9udFNpemVPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc2l6ZU9wdGlvbnM7XG5cdH0sXG5cblx0Z2V0Rm9udFNpemVOYW1lRnJvbUlkOiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0dmFyIG9wdGlvbiA9IF8uZmluZFdoZXJlKCBzaXplT3B0aW9ucywgeyBpZDogaWQgfSApO1xuXHRcdGlmICggb3B0aW9uICkge1xuXHRcdFx0cmV0dXJuIG9wdGlvbi5uYW1lO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59KTtcbiIsInZhciBTZWxlY3RlZEZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL3NlbGVjdGVkLWZvbnQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0ZWRGb250LmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIFRPRE86IHRyYW5zbGF0ZSB0aGlzIHN0cmluZ1xuXHRcdHRoaXMuc2V0KHsgaWQ6ICdqZXRwYWNrLWRlZmF1bHQtdGhlbWUtZm9udCcsIG5hbWU6ICdEZWZhdWx0IFRoZW1lIGZvbnQnLCBwcm92aWRlcjogJycgfSk7XG5cdH1cbn0pO1xuXG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxuLy8gQSBNb2RlbCBmb3IgYSBjdXJyZW50bHkgc2V0IGZvbnQgc2V0dGluZyBmb3IgdGhpcyB0aGVtZVxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe30pO1xuIiwiLyogZ2xvYmFscyBXZWJGb250ICovXG52YXIgYXBpID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXBpJyApO1xuXG52YXIgbG9hZGVkRm9udElkcyA9IFtdO1xuXG5mdW5jdGlvbiBhZGRGb250VG9QYWdlKCBmb250LCB0ZXh0ICkge1xuXHRpZiAoIH4gbG9hZGVkRm9udElkcy5pbmRleE9mKCBmb250LmlkICkgKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxvYWRlZEZvbnRJZHMucHVzaCggZm9udC5pZCApO1xuXHRXZWJGb250LmxvYWQoIHsgZ29vZ2xlOiB7IGZhbWlsaWVzOiBbIGZvbnQuaWQgXSwgdGV4dDogdGV4dCB9IH0gKTtcbn1cblxudmFyIEdvb2dsZVByb3ZpZGVyVmlldyA9IGFwaS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3LmV4dGVuZCh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5tb2RlbC5nZXQoICduYW1lJyApICk7XG5cdFx0dGhpcy4kZWwuY3NzKCAnZm9udC1mYW1pbHknLCAnXCInICsgdGhpcy5tb2RlbC5nZXQoICduYW1lJyApICsgJ1wiJyApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udCAmJiB0aGlzLmN1cnJlbnRGb250LmdldCggJ25hbWUnICkgPT09IHRoaXMubW9kZWwuZ2V0KCAnbmFtZScgKSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9XG5cdFx0YWRkRm9udFRvUGFnZSggdGhpcy5tb2RlbC50b0pTT04oKSwgdGhpcy5tb2RlbC5nZXQoICdpZCcgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcblxuR29vZ2xlUHJvdmlkZXJWaWV3LmFkZEZvbnRUb1BhZ2UgPSBhZGRGb250VG9QYWdlO1xuXG5hcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MuZ29vZ2xlID0gR29vZ2xlUHJvdmlkZXJWaWV3O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdvb2dsZVByb3ZpZGVyVmlldztcbiIsInZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtc2l6ZSBmb250LXByb3BlcnR5LWNvbnRyb2wtY3VycmVudCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBvcHRzKTtcblx0XHR0aGlzLmN1cnJlbnRGb250U2l6ZSA9IG9wdHMuY3VycmVudEZvbnRTaXplO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5jdXJyZW50Rm9udFNpemUgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgRHJvcGRvd25DdXJyZW50VGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LXZhcmlhbnQgZm9udC1wcm9wZXJ0eS1jb250cm9sLWN1cnJlbnQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgb3B0cyk7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgPSBvcHRzLmN1cnJlbnRGb250VmFyaWFudDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMuY3VycmVudEZvbnRWYXJpYW50ICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuIiwidmFyIGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250cycgKTtcblxudmFyIGdldFZpZXdGb3JQcm92aWRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3Byb3ZpZGVyLXZpZXdzJyApLmdldFZpZXdGb3JQcm92aWRlcixcblx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fY3VycmVudF9mb250JyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIG9wdHMpO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLnByb3ZpZGVyVmlldyApIHtcblx0XHRcdHRoaXMucHJvdmlkZXJWaWV3LnJlbW92ZSgpO1xuXHRcdH1cblx0XHR0aGlzLiRlbC50ZXh0KCAnJyApO1xuXHRcdHZhciBQcm92aWRlclZpZXcgPSBnZXRWaWV3Rm9yUHJvdmlkZXIoIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAncHJvdmlkZXInICkgKTtcblx0XHRpZiAoICEgUHJvdmlkZXJWaWV3ICkge1xuXHRcdFx0ZGVidWcoICdyZW5kZXJpbmcgY3VycmVudEZvbnQgd2l0aCBubyBwcm92aWRlclZpZXcgZm9yJywgdGhpcy5jdXJyZW50Rm9udC50b0pTT04oKSApO1xuXHRcdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5jdXJyZW50Rm9udC5nZXQoICduYW1lJyApICk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdFx0ZGVidWcoICdyZW5kZXJpbmcgcHJvdmlkZXJWaWV3IGZvcicsIHRoaXMuY3VycmVudEZvbnQudG9KU09OKCkgKTtcblx0XHR0aGlzLnByb3ZpZGVyVmlldyA9IG5ldyBQcm92aWRlclZpZXcoe1xuXHRcdFx0bW9kZWw6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHR0eXBlOiB0aGlzLnR5cGVcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIHRoaXMucHJvdmlkZXJWaWV3LnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxudmFyIERlZmF1bHRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9kZWZhdWx0LWZvbnQnICk7XG5cbi8vICd4JyBidXR0b24gdGhhdCByZXNldHMgZm9udCB0byBkZWZhdWx0XG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZGVmYXVsdF9idXR0b24nLFxuXHR0YWdOYW1lOiAnc3BhbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ3Jlc2V0VG9EZWZhdWx0J1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICd4JyApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udC5pZCAmJiB0aGlzLmN1cnJlbnRGb250LmlkICE9PSAnamV0cGFjay1kZWZhdWx0LXRoZW1lLWZvbnQnICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdhY3RpdmUtYnV0dG9uJyApO1xuXHRcdFx0dGhpcy4kZWwuc2hvdygpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ2FjdGl2ZS1idXR0b24nICk7XG5cdFx0XHR0aGlzLiRlbC5oaWRlKCk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHJlc2V0VG9EZWZhdWx0OiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjaGFuZ2UtZm9udCcsIHsgZm9udDogbmV3IERlZmF1bHRGb250KCksIHR5cGU6IHRoaXMudHlwZSB9ICk7XG5cdH1cbn0pO1xuXG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJzogJ3RvZ2dsZURyb3Bkb3duJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLm1lbnUgPSBvcHRzLm1lbnU7XG5cdH0sXG5cblx0dG9nZ2xlRHJvcGRvd246IGZ1bmN0aW9uKCBlICkge1xuXHRcdGlmICggZSApIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ3RvZ2dsZS1kcm9wZG93bicsIHsgdHlwZTogdGhpcy50eXBlLCBtZW51OiB0aGlzLm1lbnUgfSApO1xuXHR9XG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG4vLyBBbiBpbmRpdmlkdWFsIGZvbnQgaW4gdGhlIGRyb3Bkb3duIGxpc3QsIGV4cG9ydGVkIGFzXG4vLyBgYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXdgLiBFeHRlbmQgdGhpcyBvYmplY3QgZm9yIGVhY2ggcHJvdmlkZXIuIFRoZVxuLy8gZXh0ZW5kZWQgb2JqZWN0cyBuZWVkIHRvIGRlZmluZSBhIGByZW5kZXJgIG1ldGhvZCB0byByZW5kZXIgdGhlaXIgcHJvdmlkZXInc1xuLy8gZm9udCBuYW1lLCBhcyB3ZWxsIGFzIGFuIGBhZGRGb250VG9QYWdlYCBtZXRob2Qgb24gdGhlIG9iamVjdCBpdHNlbGYuXG52YXIgUHJvdmlkZXJWaWV3ID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19vcHRpb24nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljaycgOiAnZm9udENoYW5nZWQnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udCApIHtcblx0XHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHRcdH1cblx0fSxcblxuXHQvLyBXYXJuaW5nOiB0aGlzIHNob3VsZCBiZSBvdmVycmlkZW4gaW4gdGhlIHByb3ZpZGVyXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5tb2RlbC5nZXQoICduYW1lJyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Zm9udENoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2NoYW5nZS1mb250JywgeyBmb250OiB0aGlzLm1vZGVsLCB0eXBlOiB0aGlzLnR5cGUgfSApO1xuXHR9XG59KTtcblxuUHJvdmlkZXJWaWV3LmFkZEZvbnRUb1BhZ2UgPSBmdW5jdGlvbigpIHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyVmlldztcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5tZW51ID0gb3B0cy5tZW51O1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdjbG9zZS1vcGVuLW1lbnVzJywgdGhpcy5jbG9zZSApO1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICd0b2dnbGUtZHJvcGRvd24nLCB0aGlzLnRvZ2dsZSApO1xuXHR9LFxuXG5cdHRvZ2dsZTogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0aWYgKCBkYXRhLnR5cGUgIT09IHRoaXMudHlwZSB8fCBkYXRhLm1lbnUgIT09IHRoaXMubWVudSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKCB0aGlzLmlzT3BlbiApIHtcblx0XHRcdHRoaXMuY2xvc2UoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5vcGVuKCk7XG5cdFx0fVxuXHR9LFxuXG5cdG9wZW46IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdvcGVuJyApO1xuXHRcdHRoaXMuaXNPcGVuID0gdHJ1ZTtcblx0fSxcblxuXHRjbG9zZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdvcGVuJyApO1xuXHRcdHRoaXMuaXNPcGVuID0gZmFsc2U7XG5cdH1cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRm9udERyb3Bkb3duID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtZHJvcGRvd24nICksXG5cdEN1cnJlbnRGb250ID0gcmVxdWlyZSggJy4uL3ZpZXdzL2N1cnJlbnQtZm9udCcgKSxcblx0RGVmYXVsdEZvbnRCdXR0b24gPSByZXF1aXJlKCAnLi4vdmlld3MvZGVmYXVsdC1mb250LWJ1dHRvbicgKSxcblx0Rm9udFZhcmlhbnRDb250cm9sID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdmFyaWFudC1jb250cm9sJyApLFxuXHRGb250U2l6ZUNvbnRyb2wgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1zaXplLWNvbnRyb2wnICk7XG5cbi8vIENvbnRhaW5lciBmb3IgdGhlIGxpc3Qgb2YgYXZhaWxhYmxlIGZvbnRzIGFuZCAneCcgYnV0dG9uXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fbWVudV9jb250YWluZXInLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLm1lbnUgPSAnZm9udEZhbWlseSc7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBDdXJyZW50Rm9udCh7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbFxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udERyb3Bkb3duKHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsLFxuXHRcdFx0Zm9udERhdGE6IHRoaXMuZm9udERhdGFcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IERlZmF1bHRGb250QnV0dG9uKHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250U2l6ZUNvbnRyb2woe1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWwsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFZhcmlhbnRDb250cm9sKHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsLFxuXHRcdFx0Zm9udERhdGE6IHRoaXMuZm9udERhdGFcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG59KTtcbiIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHMnICk7XG5cbnZhciBnZXRXaWRvd0hlaWdodCA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3dpbmRvdy1tZWFzdXJlcycgKS5nZXRXaWRvd0hlaWdodCxcblx0Z2V0Vmlld0ZvclByb3ZpZGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJvdmlkZXItdmlld3MnICkuZ2V0Vmlld0ZvclByb3ZpZGVyLFxuXHREcm9wZG93blRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlJyApO1xuXG5cbi8vIERyb3Bkb3duIG9mIGF2YWlsYWJsZSBmb250c1xubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX21lbnUnLFxuXHRpZDogJ2ZvbnQtc2VsZWN0JyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZm9udERhdGEuZWFjaCggZnVuY3Rpb24oIGZvbnQgKSB7XG5cdFx0XHR2YXIgUHJvdmlkZXJWaWV3ID0gZ2V0Vmlld0ZvclByb3ZpZGVyKCBmb250LmdldCggJ3Byb3ZpZGVyJyApICk7XG5cdFx0XHRpZiAoICEgUHJvdmlkZXJWaWV3ICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBwcm92aWRlclZpZXcgaW4gZm9udCBsaXN0IGZvcicsIGZvbnQudG9KU09OKCkgKTtcblx0XHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IFByb3ZpZGVyVmlldyh7XG5cdFx0XHRcdG1vZGVsOiBmb250LFxuXHRcdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRcdGN1cnJlbnRGb250OiB0aGlzLmN1cnJlbnRGb250XG5cdFx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdH0sIHRoaXMgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdG9wZW46IGZ1bmN0aW9uKCkge1xuXHRcdERyb3Bkb3duVGVtcGxhdGUucHJvdG90eXBlLm9wZW4uY2FsbCh0aGlzKTtcblx0XHR0aGlzLnNjcmVlbkZpdCgpO1xuXHR9LFxuXG5cdHNjcmVlbkZpdDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHBhZGRpbmcsIGNvbnRyb2xzSGVpZ2h0LCBvZmZzZXQsIHNjcm9sbEhlaWdodCwgYWxsb3dhYmxlSGVpZ2h0LCB0b3BPZmZzZXQ7XG5cdFx0Ly8gcmVzZXQgaGVpZ2h0L3RvcCBpbiBjYXNlIGl0J3MgYmVlbiBzZXQgcHJldmlvdXNseSBhbmQgdGhlIHZpZXdwb3J0IGhhcyBjaGFuZ2VkXG5cdFx0Ly8gd2UncmUgbm90IGdvaW5nIHRvIGFzc2lnbiBhIHdpbmRvdy5yZXNpemUgbGlzdGVuZXIgYmVjYXVzZSBpdCdzIGFuIGVkZ2UgY2FzZSBhbmRcblx0XHQvLyByZXNpemUgaGFuZGxlcnMgc2hvdWxkIGJlIGF2b2lkZWQgd2hlcmUgcG9zc2libGVcblx0XHR0aGlzLiRlbC5jc3MoeyBoZWlnaHQ6ICcnLCB0b3A6ICcnIH0pO1xuXG5cdFx0cGFkZGluZyA9IDIwO1xuXHRcdGNvbnRyb2xzSGVpZ2h0ID0gZ2V0V2lkb3dIZWlnaHQoKTtcblx0XHRvZmZzZXQgPSB0aGlzLiRlbC5vZmZzZXQoKTtcblx0XHRzY3JvbGxIZWlnaHQgPSB0aGlzLiRlbC5oZWlnaHQoKTtcblx0XHRpZiAoIHBhZGRpbmcgKyBvZmZzZXQudG9wICsgc2Nyb2xsSGVpZ2h0IDw9IGNvbnRyb2xzSGVpZ2h0ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRhbGxvd2FibGVIZWlnaHQgPSBjb250cm9sc0hlaWdodCAtICggcGFkZGluZyAqIDIgKTtcblx0XHQvLyBcdC8vIGxldCdzIHNlZSBpZiB3ZSBjYW4ganVzdCBzaGlmdCBpdCB1cCBhIGJpdFxuXHRcdGlmICggc2Nyb2xsSGVpZ2h0IDw9IGFsbG93YWJsZUhlaWdodCApIHtcblx0XHRcdHRvcE9mZnNldCA9IGFsbG93YWJsZUhlaWdodCAtIHNjcm9sbEhlaWdodCAtIG9mZnNldC50b3A7XG5cdFx0XHR0aGlzLiRlbC5jc3MoICd0b3AnLCB0b3BPZmZzZXQgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly8gaXQncyB0b28gYmlnXG5cdFx0dG9wT2Zmc2V0ID0gcGFkZGluZyAtIG9mZnNldC50b3A7XG5cdFx0dGhpcy4kZWwuY3NzKHtcblx0XHRcdHRvcDogdG9wT2Zmc2V0ICsgMTEwLCAvLyAxMTAgPT0gb2Zmc2V0IGZyb20gdG9wIG9mIGN1c3RvbWl6ZXIgZWxlbWVudHMuXG5cdFx0XHRoZWlnaHQ6IGFsbG93YWJsZUhlaWdodCAtIDE0NSAvLyAxNDUgPT0gYWJvdmUgb2Zmc2V0IHBsdXMgdGhlIGNvbGxhcHNlIGVsZW1lbnRcblx0XHR9KTtcblx0fVxufSk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEZvbnRTaXplRHJvcGRvd24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1zaXplLWRyb3Bkb3duJyApLFxuQ3VycmVudEZvbnRTaXplID0gcmVxdWlyZSggJy4uL3ZpZXdzL2N1cnJlbnQtZm9udC1zaXplJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtc2l6ZS1jb250cm9sIGZvbnQtcHJvcGVydHktY29udHJvbCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5tZW51ID0gJ2ZvbnRTaXplJztcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRBdmFpbGFibGVGb250OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5mb250RGF0YS5maW5kV2hlcmUoIHsgbmFtZTogdGhpcy5jdXJyZW50Rm9udC5nZXQoICduYW1lJyApIH0gKTtcblx0XHRpZiAoICFzZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQ7XG5cdH0sXG5cblx0Z2V0Q3VycmVudEZvbnRTaXplOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5nZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQoKTtcblx0XHRpZiAoIHNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHZhciBzaXplID0gdGhpcy5jdXJyZW50Rm9udC5nZXQoICdzaXplJyApO1xuXHRcdFx0aWYgKCBzaXplICYmIHNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250U2l6ZU5hbWVGcm9tSWQoIHNpemUgKSApIHtcblx0XHRcdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250U2l6ZU5hbWVGcm9tSWQoIHNpemUgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiAnTm9ybWFsIFNpemUnO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgQ3VycmVudEZvbnRTaXplKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRjdXJyZW50Rm9udFNpemU6IHRoaXMuZ2V0Q3VycmVudEZvbnRTaXplKClcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRTaXplRHJvcGRvd24oIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdHNlbGVjdGVkQXZhaWxhYmxlRm9udDogdGhpcy5nZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQoKSxcblx0XHRcdGN1cnJlbnRGb250U2l6ZTogdGhpcy5nZXRDdXJyZW50Rm9udFNpemUoKVxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuIiwidmFyIEZvbnRTaXplT3B0aW9uID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtc2l6ZS1vcHRpb24nICksXG5Ecm9wZG93blRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLXRlbXBsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duVGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtc2l6ZS1kcm9wZG93biBmb250LXByb3BlcnR5LWNvbnRyb2wtZHJvcGRvd24nLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duVGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gb3B0cy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQ7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFNpemUgPSBvcHRzLmN1cnJlbnRGb250U2l6ZTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoICcnICk7XG5cdFx0aWYgKCB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHZhciBzaXplT3B0aW9ucyA9IHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRTaXplT3B0aW9ucygpO1xuXHRcdFx0c2l6ZU9wdGlvbnMuZm9yRWFjaCggZnVuY3Rpb24oIG9wdGlvbiApIHtcblx0XHRcdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFNpemVPcHRpb24oIHtcblx0XHRcdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRcdFx0aWQ6IG9wdGlvbi5pZCxcblx0XHRcdFx0XHRuYW1lOiBvcHRpb24ubmFtZSxcblx0XHRcdFx0XHRjdXJyZW50Rm9udFNpemU6IHRoaXMuY3VycmVudEZvbnRTaXplXG5cdFx0XHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdFx0fS5iaW5kKHRoaXMpICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC1zaXplLW9wdGlvbiBqZXRwYWNrLWZvbnRzX19mb250LXByb3BlcnR5LW9wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJyA6ICdzZXRTaXplT3B0aW9uJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmlkID0gb3B0cy5pZDtcblx0XHR0aGlzLm5hbWUgPSBvcHRzLm5hbWU7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFNpemUgPSBvcHRzLmN1cnJlbnRGb250U2l6ZTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubmFtZSApO1xuXHRcdHRoaXMuJGVsLmF0dHIoICdkYXRhLW5hbWUnLCB0aGlzLm5hbWUgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRTaXplID09PSB0aGlzLm5hbWUgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2N1cnJlbnQnICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHNldFNpemVPcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ3NldC1zaXplJywgeyBzaXplOiB0aGlzLmlkLCB0eXBlOiB0aGlzLnR5cGUgfSApO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBGb250Q29udHJvbCA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LWNvbnRyb2wnICk7XG5cbi8vIEEgZm9udCBjb250cm9sIFZpZXcgZm9yIGEgcGFydGljdWxhciBzZXR0aW5nIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX190eXBlJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snIDogJ2Nsb3NlTWVudXMnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCAnPGRpdiBjbGFzcz1cImpldHBhY2stZm9udHNfX3R5cGVcIiBkYXRhLWZvbnQtdHlwZT1cIicgKyB0aGlzLnR5cGUuaWQgKyAnXCI+PGgzIGNsYXNzPVwiamV0cGFjay1mb250c19fdHlwZS1oZWFkZXJcIj4nICsgdGhpcy50eXBlLm5hbWUgKyAgJzwvaDM+PC9kaXY+JyApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRDb250cm9sKHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1vZGVsOiB0aGlzLmN1cnJlbnRGb250LFxuXHRcdFx0Zm9udERhdGE6IHRoaXMuZm9udERhdGFcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGNsb3NlTWVudXM6IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH1cbn0pO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBGb250VmFyaWFudERyb3Bkb3duID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdmFyaWFudC1kcm9wZG93bicgKSxcbkN1cnJlbnRGb250VmFyaWFudCA9IHJlcXVpcmUoICcuLi92aWV3cy9jdXJyZW50LWZvbnQtdmFyaWFudCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXZhcmlhbnQtY29udHJvbCBmb250LXByb3BlcnR5LWNvbnRyb2wnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMubWVudSA9ICdmb250VmFyaWFudCc7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkQXZhaWxhYmxlRm9udDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZm9udERhdGEuZmluZFdoZXJlKCB7IG5hbWU6IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnbmFtZScgKSB9ICk7XG5cdFx0aWYgKCAhc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHR9LFxuXG5cdGdldEN1cnJlbnRGb250VmFyaWFudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCk7XG5cdFx0aWYgKCBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgJiYgdGhpcy50eXBlLmZ2ZEFkanVzdCApIHtcblx0XHRcdHZhciBmdmRzID0gdGhpcy5jdXJyZW50Rm9udC5nZXQoICdmdmRzJyApO1xuXHRcdFx0aWYgKCBmdmRzICYmIE9iamVjdC5rZXlzKGZ2ZHMpLmxlbmd0aCA9PT0gMSApIHtcblx0XHRcdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250VmFyaWFudE5hbWVGcm9tSWQoIGZ2ZHNbMF0gKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiAnUmVndWxhcic7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJycgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBDdXJyZW50Rm9udFZhcmlhbnQoIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdGN1cnJlbnRGb250VmFyaWFudDogdGhpcy5nZXRDdXJyZW50Rm9udFZhcmlhbnQoKVxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFZhcmlhbnREcm9wZG93bigge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0c2VsZWN0ZWRBdmFpbGFibGVGb250OiB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpLFxuXHRcdFx0Y3VycmVudEZvbnRWYXJpYW50OiB0aGlzLmdldEN1cnJlbnRGb250VmFyaWFudCgpXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgRm9udFZhcmlhbnRPcHRpb24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC12YXJpYW50LW9wdGlvbicgKSxcbkRyb3Bkb3duVGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tdGVtcGxhdGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25UZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC12YXJpYW50LWRyb3Bkb3duIGZvbnQtcHJvcGVydHktY29udHJvbC1kcm9wZG93bicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSBvcHRzLnNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0XHR0aGlzLmN1cnJlbnRGb250VmFyaWFudCA9IG9wdHMuY3VycmVudEZvbnRWYXJpYW50O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJycgKTtcblx0XHRpZiAoIHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250ICYmIHRoaXMudHlwZS5mdmRBZGp1c3QgKSB7XG5cdFx0XHR2YXIgdmFyaWFudE9wdGlvbnMgPSB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250VmFyaWFudE9wdGlvbnMoKTtcblx0XHRcdGZvciAoIHZhciBrIGluIHZhcmlhbnRPcHRpb25zICkge1xuXHRcdFx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250VmFyaWFudE9wdGlvbigge1xuXHRcdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0XHRpZDogayxcblx0XHRcdFx0XHRuYW1lOiB2YXJpYW50T3B0aW9uc1trXSxcblx0XHRcdFx0XHRjdXJyZW50Rm9udFZhcmlhbnQ6IHRoaXMuY3VycmVudEZvbnRWYXJpYW50XG5cdFx0XHRcdH0gKS5yZW5kZXIoKS5lbCApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtdmFyaWFudC1vcHRpb24gamV0cGFjay1mb250c19fZm9udC1wcm9wZXJ0eS1vcHRpb24nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljaycgOiAnc2V0VmFyaWFudE9wdGlvbidcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5pZCA9IG9wdHMuaWQ7XG5cdFx0dGhpcy5uYW1lID0gb3B0cy5uYW1lO1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm5hbWUgKTtcblx0XHR0aGlzLiRlbC5kYXRhKCAnaWQnLCB0aGlzLmlkICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250VmFyaWFudCA9PT0gdGhpcy5uYW1lICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdjdXJyZW50JyApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRzZXRWYXJpYW50T3B0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdzZXQtdmFyaWFudCcsIHsgdmFyaWFudDogdGhpcy5pZCwgdHlwZTogdGhpcy50eXBlIH0gKTtcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHMnICksXG5cdGF2YWlsYWJsZUZvbnRzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXZhaWxhYmxlLWZvbnRzJyApLFxuXHRhdmFpbGFibGVUeXBlcyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2F2YWlsYWJsZS10eXBlcycgKTtcblxudmFyIEZvbnRUeXBlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtdHlwZScgKSxcblx0QXZhaWxhYmxlRm9udHMgPSByZXF1aXJlKCAnLi4vY29sbGVjdGlvbnMvYXZhaWxhYmxlLWZvbnRzJyApO1xuXG4vLyBJbml0aWFsaXplIHRoZSBkZWZhdWx0IFByb3ZpZGVyIFZpZXdzXG5yZXF1aXJlKCAnLi4vcHJvdmlkZXJzL2dvb2dsZScgKTtcblxuLy8gVGhlIG1haW4gZm9udCBjb250cm9sIFZpZXcsIGNvbnRhaW5pbmcgc2VjdGlvbnMgZm9yIGVhY2ggc2V0dGluZyB0eXBlXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0ZGVidWcoICdpbml0IHdpdGggY3VycmVudGx5IHNlbGVjdGVkIGZvbnRzOicsIHRoaXMuY29sbGVjdGlvbi50b0pTT04oKSApO1xuXHRcdHRoaXMuaGVhZGluZ0ZvbnRzID0gbmV3IEF2YWlsYWJsZUZvbnRzKCBhdmFpbGFibGVGb250cyApO1xuXHRcdHRoaXMuYm9keUZvbnRzID0gbmV3IEF2YWlsYWJsZUZvbnRzKCB0aGlzLmhlYWRpbmdGb250cy53aGVyZSggeyBib2R5VGV4dDogdHJ1ZSB9ICkgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnY2hhbmdlLWZvbnQnLCB0aGlzLnVwZGF0ZUN1cnJlbnRGb250ICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ3NldC12YXJpYW50JywgdGhpcy5zZXRGb250VmFyaWFudCApO1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdzZXQtc2l6ZScsIHRoaXMuc2V0Rm9udFNpemUgKTtcblx0fSxcblxuXHRzZXRGb250VmFyaWFudDogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5maW5kTW9kZWxXaXRoVHlwZSggZGF0YS50eXBlICk7XG5cdFx0bW9kZWwuc2V0KCAnZnZkcycsIFtkYXRhLnZhcmlhbnRdICk7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHRzZXRGb250U2l6ZTogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5maW5kTW9kZWxXaXRoVHlwZSggZGF0YS50eXBlICk7XG5cdFx0bW9kZWwuc2V0KCAnc2l6ZScsIGRhdGEuc2l6ZSApO1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0dXBkYXRlQ3VycmVudEZvbnQ6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdHZhciBtb2RlbCA9IHRoaXMuZmluZE1vZGVsV2l0aFR5cGUoIGRhdGEudHlwZSApO1xuXHRcdG1vZGVsLnNldCggZGF0YS5mb250LmF0dHJpYnV0ZXMgKTtcblx0XHRtb2RlbC51bnNldCggJ3NpemUnICk7XG5cdFx0ZGVidWcoICd1cGRhdGVDdXJyZW50Rm9udCB3aXRoJywgZGF0YS5mb250LnRvSlNPTigpLCAndG8nLCBtb2RlbC50b0pTT04oKSApO1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2Nsb3NlLW9wZW4tbWVudXMnICk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC50ZXh0KCAnJyApOyAvLyBUT0RPOiBiZXR0ZXIgdG8gdXBkYXRlIGVhY2ggVmlldyB0aGFuIG92ZXJ3cml0ZVxuXHRcdGRlYnVnKCAncmVuZGVyaW5nIGNvbnRyb2xzIGZvciBmb250IHR5cGVzJywgYXZhaWxhYmxlVHlwZXMgKTtcblx0XHRhdmFpbGFibGVUeXBlcy5mb3JFYWNoKCB0aGlzLnJlbmRlclR5cGVDb250cm9sLmJpbmQoIHRoaXMgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHJlbmRlclR5cGVDb250cm9sOiBmdW5jdGlvbiggdHlwZSApIHtcblx0XHR2YXIgZm9udHM7XG5cdFx0aWYgKCB0eXBlLmJvZHlUZXh0ID09PSB0cnVlICkge1xuXHRcdFx0Zm9udHMgPSB0aGlzLmJvZHlGb250cztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9udHMgPSB0aGlzLmhlYWRpbmdGb250cztcblx0XHR9XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFR5cGUoe1xuXHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLmZpbmRNb2RlbFdpdGhUeXBlKCB0eXBlICksXG5cdFx0XHRmb250RGF0YTogZm9udHNcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHR9LFxuXG5cdGZpbmRNb2RlbFdpdGhUeXBlOiBmdW5jdGlvbiggdHlwZSApIHtcblx0XHR2YXIgbW9kZWwgPSB0aGlzLmNvbGxlY3Rpb24uZmluZCggZnVuY3Rpb24oIG1vZGVsICkge1xuXHRcdFx0cmV0dXJuICggbW9kZWwuZ2V0KCAndHlwZScgKSA9PT0gdHlwZS5pZCApO1xuXHRcdH0gKTtcblx0XHRpZiAoICEgbW9kZWwgKSB7XG5cdFx0XHRtb2RlbCA9IHRoaXMuY29sbGVjdGlvbi5hZGQoIHtcblx0XHRcdFx0dHlwZTogdHlwZS5pZCxcblx0XHRcdFx0bmFtZTogJ0RlZmF1bHQgVGhlbWUgZm9udCdcblx0XHRcdH0gKTtcblx0XHR9XG5cdFx0cmV0dXJuIG1vZGVsO1xuXHR9XG59KTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgcmV0dXJuICgnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LFxuICAvLyB3aGVyZSB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gbG9jYWxTdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXJjYXNlZCBsZXR0ZXIsIGkuZS4gXCJuXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcigpIHtcbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW3ByZXZDb2xvcisrICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZXNwYWNlKSB7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZGlzYWJsZWQoKSB7XG4gIH1cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIC8vIGRlZmluZSB0aGUgYGVuYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcblxuICAgIHZhciBzZWxmID0gZW5hYmxlZDtcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcbiAgICBpZiAobnVsbCA9PSBzZWxmLnVzZUNvbG9ycykgc2VsZi51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICAgIGlmIChudWxsID09IHNlbGYuY29sb3IgJiYgc2VsZi51c2VDb2xvcnMpIHNlbGYuY29sb3IgPSBzZWxlY3RDb2xvcigpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuZm9ybWF0QXJncykge1xuICAgICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICB9XG4gICAgdmFyIGxvZ0ZuID0gZW5hYmxlZC5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBlbmFibGVkLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHZhciBmbiA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpID8gZW5hYmxlZCA6IGRpc2FibGVkO1xuXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICByZXR1cm4gZm47XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWVzcGFjZXMgfHwgJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucyl7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZhbCkgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIHJldHVybiBvcHRpb25zLmxvbmdcbiAgICA/IGxvbmcodmFsKVxuICAgIDogc2hvcnQodmFsKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtc3xzZWNvbmRzP3xzfG1pbnV0ZXM/fG18aG91cnM/fGh8ZGF5cz98ZHx5ZWFycz98eSk/JC9pLmV4ZWMoc3RyKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuO1xuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgaWYgKG1zID49IHMpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKVxuICAgIHx8IHBsdXJhbChtcywgaCwgJ2hvdXInKVxuICAgIHx8IHBsdXJhbChtcywgbSwgJ21pbnV0ZScpXG4gICAgfHwgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJylcbiAgICB8fCBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSByZXR1cm47XG4gIGlmIChtcyA8IG4gKiAxLjUpIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIl19
