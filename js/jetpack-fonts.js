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
		// TODO: remove or update child views rather than overwrite them
		if ( this.currentFontView ) {
			this.currentFontView.remove();
		}
		if ( this.dropDownView ) {
			this.dropDownView.remove();
		}
		this.currentFontView = new CurrentFontVariant( {
			type: this.type,
			menu: this.menu,
			currentFontVariant: this.getCurrentFontVariant()
		});
		this.dropDownView = new FontVariantDropdown( {
			type: this.type,
			menu: this.menu,
			selectedAvailableFont: this.getSelectedAvailableFont(),
			currentFontVariant: this.getCurrentFontVariant()
		});
		this.$el.append( this.currentFontView.render().el );
		this.$el.append( this.dropDownView.render().el );
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMuanMiLCJqcy9jb2xsZWN0aW9ucy9zZWxlY3RlZC1mb250cy5qcyIsImpzL2hlbHBlcnMvYXBpLmpzIiwianMvaGVscGVycy9hdmFpbGFibGUtZm9udHMuanMiLCJqcy9oZWxwZXJzL2F2YWlsYWJsZS10eXBlcy5qcyIsImpzL2hlbHBlcnMvYmFja2JvbmUuanMiLCJqcy9oZWxwZXJzL2Jvb3RzdHJhcC5qcyIsImpzL2hlbHBlcnMvZW1pdHRlci5qcyIsImpzL2hlbHBlcnMvcHJvdmlkZXItdmlld3MuanMiLCJqcy9oZWxwZXJzL3VuZGVyc2NvcmUuanMiLCJqcy9oZWxwZXJzL3dpbmRvdy1tZWFzdXJlcy5qcyIsImpzL2luZGV4LmpzIiwianMvbW9kZWxzL2F2YWlsYWJsZS1mb250LmpzIiwianMvbW9kZWxzL2RlZmF1bHQtZm9udC5qcyIsImpzL21vZGVscy9zZWxlY3RlZC1mb250LmpzIiwianMvcHJvdmlkZXJzL2dvb2dsZS5qcyIsImpzL3ZpZXdzL2N1cnJlbnQtZm9udC1zaXplLmpzIiwianMvdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQuanMiLCJqcy92aWV3cy9jdXJyZW50LWZvbnQuanMiLCJqcy92aWV3cy9kZWZhdWx0LWZvbnQtYnV0dG9uLmpzIiwianMvdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZS5qcyIsImpzL3ZpZXdzL2Ryb3Bkb3duLWl0ZW0uanMiLCJqcy92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZS5qcyIsImpzL3ZpZXdzL2ZvbnQtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtZHJvcGRvd24uanMiLCJqcy92aWV3cy9mb250LXNpemUtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtc2l6ZS1kcm9wZG93bi5qcyIsImpzL3ZpZXdzL2ZvbnQtc2l6ZS1vcHRpb24uanMiLCJqcy92aWV3cy9mb250LXR5cGUuanMiLCJqcy92aWV3cy9mb250LXZhcmlhbnQtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtdmFyaWFudC1kcm9wZG93bi5qcyIsImpzL3ZpZXdzL2ZvbnQtdmFyaWFudC1vcHRpb24uanMiLCJqcy92aWV3cy9tYXN0ZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBBdmFpbGFibGVGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9hdmFpbGFibGUtZm9udCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG5cdG1vZGVsOiBBdmFpbGFibGVGb250XG59KTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgU2VsZWN0ZWRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9zZWxlY3RlZC1mb250JyApO1xuXG4vLyBBIENvbGxlY3Rpb24gb2YgdGhlIGN1cnJlbnQgZm9udCBzZXR0aW5ncyBmb3IgdGhpcyB0aGVtZVxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG5cblx0bW9kZWw6IFNlbGVjdGVkRm9udCxcblxuXHR0b0pTT046IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHNraXAgYW55IGZvbnRzIHNldCB0byB0aGUgZGVmYXVsdFxuXHRcdHJldHVybiB0aGlzLnJlZHVjZSggZnVuY3Rpb24oIHByZXZpb3VzLCBtb2RlbCApIHtcblx0XHRcdGlmICggbW9kZWwuZ2V0KCAnaWQnICkgJiYgbW9kZWwuZ2V0KCAnaWQnICkgIT09ICdqZXRwYWNrLWRlZmF1bHQtdGhlbWUtZm9udCcgKSB7XG5cdFx0XHRcdHByZXZpb3VzLnB1c2goIG1vZGVsLnRvSlNPTigpICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcHJldmlvdXM7XG5cdFx0fSwgW10gKTtcblx0fVxufSk7XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gd2luZG93LndwLmN1c3RvbWl6ZTtcbiIsInZhciBzZXR0aW5ncyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2Jvb3RzdHJhcCcgKTtcblxudmFyIGZvbnRzID0gW107XG5pZiAoIHNldHRpbmdzICYmIHNldHRpbmdzLmZvbnRzICkge1xuXHRmb250cyA9IHNldHRpbmdzLmZvbnRzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZvbnRzO1xuXG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAnLi4vaGVscGVycy9ib290c3RyYXAnICk7XG52YXIgXyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICk7XG5cbnZhciB0eXBlcyA9IFtdO1xuaWYgKCBzZXR0aW5ncyAmJiBzZXR0aW5ncy50eXBlcyApIHtcblx0dHlwZXMgPSBzZXR0aW5ncy50eXBlcztcblx0dmFyIGlkeDtcblx0Xy5maW5kKCB0eXBlcywgZnVuY3Rpb24oIHR5cGUsIGkgKXtcblx0XHRpZiAoIHR5cGUuaWQgPT09ICdoZWFkaW5ncycgKSB7XG5cdFx0XHRpZHggPSBpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9ICkgO1xuXHR0eXBlcy5zcGxpY2UoMCwgMCwgdHlwZXMuc3BsaWNlKGlkeCwgMSlbMF0gKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0eXBlcztcbiIsIi8qIGdsb2JhbHMgQmFja2JvbmUgKi9cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmU7XG4iLCJ2YXIgc2V0dGluZ3MgPSB3aW5kb3cuX0pldHBhY2tGb250cztcblxubW9kdWxlLmV4cG9ydHMgPSBzZXR0aW5ncztcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApLFxuXHRfID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdW5kZXJzY29yZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBfLmV4dGVuZCggQmFja2JvbmUuRXZlbnRzICk7XG5cbiIsIi8qKlxuICogVGhpcyBoZWxwZXIgc2V0cyB1cCBWaWV3cyB0byByZW5kZXIgZWFjaCBmb250IGZvciBzcGVjaWZpYyBwcm92aWRlcnMuIEVhY2hcbiAqIFZpZXcgc2hvdWxkIGJlIGFuIGluc3RhbmNlIG9mIGB3cC5jdXN0b21pemUuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlld2AgKHdoaWNoXG4gKiBpcyBhIGBCYWNrYm9uZS5WaWV3YCkgdGhhdCB3aWxsIHJlbmRlciBpdHMgZm9udCBvcHRpb24gdG8gdGhlIGZvbnQgbGlzdC5cbiAqIEFkZGl0aW9uYWwgcHJvdmlkZXIgVmlld3MgY2FuIGJlIGFkZGVkIGJ5IGFkZGluZyB0byB0aGVcbiAqIGB3cC5jdXN0b21pemUuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3NgIG9iamVjdCB1c2luZyB0aGUgcHJvdmlkZXIgaWQgYXMgdGhlXG4gKiBrZXkuIFRoZSBvbmx5IHRoaW5nIHRoYXQgbmVlZHMgdG8gYmUgYWRkZWQgZm9yIGVhY2ggUHJvdmlkZXJWaWV3IGlzIHRoZVxuICogYHJlbmRlcmAgbWV0aG9kLiBFYWNoIFByb3ZpZGVyVmlldyBoYXMgYXMgaXRzIGBtb2RlbGAgb2JqZWN0IHRoZSBmb250IG9iamVjdFxuICogaXQgbmVlZHMgdG8gZGlzcGxheSwgaW5jbHVkaW5nIHRoZSBgbmFtZWAgYW5kIGBpZGAgYXR0cmlidXRlcy5cbiAqL1xuXG52YXIgYXBpID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXBpJyApLFxuXHRkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHMnICk7XG5cbnZhciBEcm9wZG93bkl0ZW0gPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24taXRlbScgKTtcbmlmICggISBhcGkuSmV0cGFja0ZvbnRzICkge1xuXHRhcGkuSmV0cGFja0ZvbnRzID0ge307XG59XG5pZiAoICEgYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkge1xuXHRhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgPSB7fTtcbn1cbmFwaS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3ID0gRHJvcGRvd25JdGVtO1xuXG52YXIgcHJvdmlkZXJWaWV3cyA9IHt9O1xuXG5mdW5jdGlvbiBpbXBvcnRQcm92aWRlclZpZXdzKCkge1xuXHRkZWJ1ZyggJ2ltcG9ydGluZyBwcm92aWRlciB2aWV3cyBmcm9tJywgYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICk7XG5cdGlmICggYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkge1xuXHRcdE9iamVjdC5rZXlzKCBhcGkuSmV0cGFja0ZvbnRzLnByb3ZpZGVyVmlld3MgKS5mb3JFYWNoKCBmdW5jdGlvbiggcHJvdmlkZXJLZXkgKSB7XG5cdFx0XHRwcm92aWRlclZpZXdzWyBwcm92aWRlcktleSBdID0gYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzWyBwcm92aWRlcktleSBdO1xuXHRcdH0gKTtcblx0fVxufVxuXG5mdW5jdGlvbiBnZXRWaWV3Rm9yUHJvdmlkZXIoIHByb3ZpZGVyICkge1xuXHRpbXBvcnRQcm92aWRlclZpZXdzKCk7XG5cdGlmICggcHJvdmlkZXJWaWV3c1sgcHJvdmlkZXIgXSApIHtcblx0XHRkZWJ1ZyggJ2ZvdW5kIHZpZXcgZm9yIHByb3ZpZGVyJywgcHJvdmlkZXIsICc6JywgcHJvdmlkZXJWaWV3c1sgcHJvdmlkZXIgXSApO1xuXHRcdHJldHVybiBwcm92aWRlclZpZXdzWyBwcm92aWRlciBdO1xuXHR9XG5cdGRlYnVnKCAnbm8gdmlldyBmb3VuZCBmb3IgcHJvdmlkZXInLCBwcm92aWRlciApO1xuXHRyZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdldFZpZXdGb3JQcm92aWRlcjogZ2V0Vmlld0ZvclByb3ZpZGVyXG59O1xuIiwiLyogZ2xvYmFscyBfICovXG5tb2R1bGUuZXhwb3J0cyA9IF87XG4iLCJmdW5jdGlvbiBnZXRXaWRvd0hlaWdodCgpIHtcblx0cmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGdldFdpZG93SGVpZ2h0OiBnZXRXaWRvd0hlaWdodFxufTtcbiIsIi8qIGdsb2JhbHMgXyAqL1xuXG52YXIgYXBpID0gcmVxdWlyZSggJy4vaGVscGVycy9hcGknICk7XG5cbnZhciBNYXN0ZXIgPSByZXF1aXJlKCAnLi92aWV3cy9tYXN0ZXInICk7XG5cbnZhciBTZWxlY3RlZEZvbnRzID0gcmVxdWlyZSggJy4vY29sbGVjdGlvbnMvc2VsZWN0ZWQtZm9udHMnICk7XG5cbi8vIEN1c3RvbWl6ZXIgQ29udHJvbFxuYXBpLmNvbnRyb2xDb25zdHJ1Y3Rvci5qZXRwYWNrRm9udHMgPSBhcGkuQ29udHJvbC5leHRlbmQoe1xuXHRyZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb2xsZWN0aW9uID0gbmV3IFNlbGVjdGVkRm9udHMoIHRoaXMuc2V0dGluZygpICk7XG5cblx0XHR0aGlzLmNvbGxlY3Rpb24ub24oICdjaGFuZ2UnLCBfLmJpbmQoIGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLnNldHRpbmcoIHRoaXMuY29sbGVjdGlvbi50b0pTT04oKSApO1xuXHRcdH0sIHRoaXMgKSApO1xuXG5cdFx0dGhpcy52aWV3ID0gbmV3IE1hc3Rlcih7XG5cdFx0XHRjb2xsZWN0aW9uOiB0aGlzLmNvbGxlY3Rpb24sXG5cdFx0XHRlbDogdGhpcy5jb250YWluZXJcblx0XHR9KS5yZW5kZXIoKTtcblx0fVxufSk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcbl8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApO1xuXG52YXIgc2l6ZU9wdGlvbnMgPSBbIHsgaWQ6IC0xMCwgbmFtZTogJ1RpbnknIH0sIHsgaWQ6IC01LCBuYW1lOiAnU21hbGwnIH0sIHsgaWQ6IDAsIG5hbWU6ICdOb3JtYWwnIH0sIHsgaWQ6IDUsIG5hbWU6ICdMYXJnZScgfSwgeyBpZDogMTAsIG5hbWU6ICdIdWdlJyB9IF07XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcblx0Z2V0Rm9udFZhcmlhbnRPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuZ2V0KCAnZnZkcycgKSApIHtcblx0XHRcdHJldHVybiB0aGlzLmdldCggJ2Z2ZHMnICk7XG5cdFx0fVxuXHR9LFxuXG5cdGdldEZvbnRWYXJpYW50TmFtZUZyb21JZDogZnVuY3Rpb24oIGlkICkge1xuXHRcdGlmICggdGhpcy5nZXQoICdmdmRzJyApICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0KCAnZnZkcycgKVtpZF07XG5cdFx0fVxuXHR9LFxuXG5cdGdldEZvbnRTaXplT3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHNpemVPcHRpb25zO1xuXHR9LFxuXG5cdGdldEZvbnRTaXplTmFtZUZyb21JZDogZnVuY3Rpb24oIGlkICkge1xuXHRcdHZhciBvcHRpb24gPSBfLmZpbmRXaGVyZSggc2l6ZU9wdGlvbnMsIHsgaWQ6IGlkIH0gKTtcblx0XHRpZiAoIG9wdGlvbiApIHtcblx0XHRcdHJldHVybiBvcHRpb24ubmFtZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxufSk7XG4iLCJ2YXIgU2VsZWN0ZWRGb250ID0gcmVxdWlyZSggJy4uL21vZGVscy9zZWxlY3RlZC1mb250JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdGVkRm9udC5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvLyBUT0RPOiB0cmFuc2xhdGUgdGhpcyBzdHJpbmdcblx0XHR0aGlzLnNldCh7IGlkOiAnamV0cGFjay1kZWZhdWx0LXRoZW1lLWZvbnQnLCBuYW1lOiAnRGVmYXVsdCBUaGVtZSBmb250JywgcHJvdmlkZXI6ICcnIH0pO1xuXHR9XG59KTtcblxuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbi8vIEEgTW9kZWwgZm9yIGEgY3VycmVudGx5IHNldCBmb250IHNldHRpbmcgZm9yIHRoaXMgdGhlbWVcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHt9KTtcbiIsIi8qIGdsb2JhbHMgV2ViRm9udCAqL1xudmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKTtcblxudmFyIGxvYWRlZEZvbnRJZHMgPSBbXTtcblxuZnVuY3Rpb24gYWRkRm9udFRvUGFnZSggZm9udCwgdGV4dCApIHtcblx0aWYgKCB+IGxvYWRlZEZvbnRJZHMuaW5kZXhPZiggZm9udC5pZCApICkge1xuXHRcdHJldHVybjtcblx0fVxuXHRsb2FkZWRGb250SWRzLnB1c2goIGZvbnQuaWQgKTtcblx0V2ViRm9udC5sb2FkKCB7IGdvb2dsZTogeyBmYW1pbGllczogWyBmb250LmlkIF0sIHRleHQ6IHRleHQgfSB9ICk7XG59XG5cbnZhciBHb29nbGVQcm92aWRlclZpZXcgPSBhcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlldy5leHRlbmQoe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubW9kZWwuZ2V0KCAnbmFtZScgKSApO1xuXHRcdHRoaXMuJGVsLmNzcyggJ2ZvbnQtZmFtaWx5JywgJ1wiJyArIHRoaXMubW9kZWwuZ2V0KCAnbmFtZScgKSArICdcIicgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgJiYgdGhpcy5jdXJyZW50Rm9udC5nZXQoICduYW1lJyApID09PSB0aGlzLm1vZGVsLmdldCggJ25hbWUnICkgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2FjdGl2ZScgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0fVxuXHRcdGFkZEZvbnRUb1BhZ2UoIHRoaXMubW9kZWwudG9KU09OKCksIHRoaXMubW9kZWwuZ2V0KCAnaWQnICkgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSk7XG5cbkdvb2dsZVByb3ZpZGVyVmlldy5hZGRGb250VG9QYWdlID0gYWRkRm9udFRvUGFnZTtcblxuYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzLmdvb2dsZSA9IEdvb2dsZVByb3ZpZGVyVmlldztcblxubW9kdWxlLmV4cG9ydHMgPSBHb29nbGVQcm92aWRlclZpZXc7XG4iLCJ2YXIgRHJvcGRvd25DdXJyZW50VGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fY3VycmVudC1mb250LXNpemUgZm9udC1wcm9wZXJ0eS1jb250cm9sLWN1cnJlbnQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgb3B0cyk7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFNpemUgPSBvcHRzLmN1cnJlbnRGb250U2l6ZTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMuY3VycmVudEZvbnRTaXplICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuIiwidmFyIERyb3Bkb3duQ3VycmVudFRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLWN1cnJlbnQtdGVtcGxhdGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udC12YXJpYW50IGZvbnQtcHJvcGVydHktY29udHJvbC1jdXJyZW50JyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIG9wdHMpO1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLmN1cnJlbnRGb250VmFyaWFudCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBkZWJ1ZyA9IHJlcXVpcmUoICdkZWJ1ZycgKSggJ2pldHBhY2stZm9udHMnICk7XG5cbnZhciBnZXRWaWV3Rm9yUHJvdmlkZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9wcm92aWRlci12aWV3cycgKS5nZXRWaWV3Rm9yUHJvdmlkZXIsXG5cdERyb3Bkb3duQ3VycmVudFRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLWN1cnJlbnQtdGVtcGxhdGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2N1cnJlbnRfZm9udCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBvcHRzKTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICggdGhpcy5wcm92aWRlclZpZXcgKSB7XG5cdFx0XHR0aGlzLnByb3ZpZGVyVmlldy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0dGhpcy4kZWwudGV4dCggJycgKTtcblx0XHR2YXIgUHJvdmlkZXJWaWV3ID0gZ2V0Vmlld0ZvclByb3ZpZGVyKCB0aGlzLmN1cnJlbnRGb250LmdldCggJ3Byb3ZpZGVyJyApICk7XG5cdFx0aWYgKCAhIFByb3ZpZGVyVmlldyApIHtcblx0XHRcdGRlYnVnKCAncmVuZGVyaW5nIGN1cnJlbnRGb250IHdpdGggbm8gcHJvdmlkZXJWaWV3IGZvcicsIHRoaXMuY3VycmVudEZvbnQudG9KU09OKCkgKTtcblx0XHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnbmFtZScgKSApO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHRcdGRlYnVnKCAncmVuZGVyaW5nIHByb3ZpZGVyVmlldyBmb3InLCB0aGlzLmN1cnJlbnRGb250LnRvSlNPTigpICk7XG5cdFx0dGhpcy5wcm92aWRlclZpZXcgPSBuZXcgUHJvdmlkZXJWaWV3KHtcblx0XHRcdG1vZGVsOiB0aGlzLmN1cnJlbnRGb250LFxuXHRcdFx0dHlwZTogdGhpcy50eXBlXG5cdFx0fSk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCB0aGlzLnByb3ZpZGVyVmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbnZhciBEZWZhdWx0Rm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvZGVmYXVsdC1mb250JyApO1xuXG4vLyAneCcgYnV0dG9uIHRoYXQgcmVzZXRzIGZvbnQgdG8gZGVmYXVsdFxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2RlZmF1bHRfYnV0dG9uJyxcblx0dGFnTmFtZTogJ3NwYW4nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICdyZXNldFRvRGVmYXVsdCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAneCcgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQuaWQgJiYgdGhpcy5jdXJyZW50Rm9udC5pZCAhPT0gJ2pldHBhY2stZGVmYXVsdC10aGVtZS1mb250JyApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnYWN0aXZlLWJ1dHRvbicgKTtcblx0XHRcdHRoaXMuJGVsLnNob3coKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy4kZWwucmVtb3ZlQ2xhc3MoICdhY3RpdmUtYnV0dG9uJyApO1xuXHRcdFx0dGhpcy4kZWwuaGlkZSgpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRyZXNldFRvRGVmYXVsdDogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2hhbmdlLWZvbnQnLCB7IGZvbnQ6IG5ldyBEZWZhdWx0Rm9udCgpLCB0eXBlOiB0aGlzLnR5cGUgfSApO1xuXHR9XG59KTtcblxuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cdGV2ZW50czoge1xuXHRcdCdjbGljayc6ICd0b2dnbGVEcm9wZG93bidcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5tZW51ID0gb3B0cy5tZW51O1xuXHR9LFxuXG5cdHRvZ2dsZURyb3Bkb3duOiBmdW5jdGlvbiggZSApIHtcblx0XHRpZiAoIGUgKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH1cblx0XHRFbWl0dGVyLnRyaWdnZXIoICd0b2dnbGUtZHJvcGRvd24nLCB7IHR5cGU6IHRoaXMudHlwZSwgbWVudTogdGhpcy5tZW51IH0gKTtcblx0fVxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxuLy8gQW4gaW5kaXZpZHVhbCBmb250IGluIHRoZSBkcm9wZG93biBsaXN0LCBleHBvcnRlZCBhc1xuLy8gYGFwaS5KZXRwYWNrRm9udHMuUHJvdmlkZXJWaWV3YC4gRXh0ZW5kIHRoaXMgb2JqZWN0IGZvciBlYWNoIHByb3ZpZGVyLiBUaGVcbi8vIGV4dGVuZGVkIG9iamVjdHMgbmVlZCB0byBkZWZpbmUgYSBgcmVuZGVyYCBtZXRob2QgdG8gcmVuZGVyIHRoZWlyIHByb3ZpZGVyJ3Ncbi8vIGZvbnQgbmFtZSwgYXMgd2VsbCBhcyBhbiBgYWRkRm9udFRvUGFnZWAgbWV0aG9kIG9uIHRoZSBvYmplY3QgaXRzZWxmLlxudmFyIFByb3ZpZGVyVmlldyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fb3B0aW9uJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snIDogJ2ZvbnRDaGFuZ2VkJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnQgKSB7XG5cdFx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gV2FybmluZzogdGhpcyBzaG91bGQgYmUgb3ZlcnJpZGVuIGluIHRoZSBwcm92aWRlclxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubW9kZWwuZ2V0KCAnbmFtZScgKSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdGZvbnRDaGFuZ2VkOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjaGFuZ2UtZm9udCcsIHsgZm9udDogdGhpcy5tb2RlbCwgdHlwZTogdGhpcy50eXBlIH0gKTtcblx0fVxufSk7XG5cblByb3ZpZGVyVmlldy5hZGRGb250VG9QYWdlID0gZnVuY3Rpb24oKSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm92aWRlclZpZXc7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMubWVudSA9IG9wdHMubWVudTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnY2xvc2Utb3Blbi1tZW51cycsIHRoaXMuY2xvc2UgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAndG9nZ2xlLWRyb3Bkb3duJywgdGhpcy50b2dnbGUgKTtcblx0fSxcblxuXHR0b2dnbGU6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGlmICggZGF0YS50eXBlICE9PSB0aGlzLnR5cGUgfHwgZGF0YS5tZW51ICE9PSB0aGlzLm1lbnUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmICggdGhpcy5pc09wZW4gKSB7XG5cdFx0XHR0aGlzLmNsb3NlKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMub3BlbigpO1xuXHRcdH1cblx0fSxcblxuXHRvcGVuOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnb3BlbicgKTtcblx0XHR0aGlzLmlzT3BlbiA9IHRydWU7XG5cdH0sXG5cblx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnb3BlbicgKTtcblx0XHR0aGlzLmlzT3BlbiA9IGZhbHNlO1xuXHR9XG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEZvbnREcm9wZG93biA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LWRyb3Bkb3duJyApLFxuXHRDdXJyZW50Rm9udCA9IHJlcXVpcmUoICcuLi92aWV3cy9jdXJyZW50LWZvbnQnICksXG5cdERlZmF1bHRGb250QnV0dG9uID0gcmVxdWlyZSggJy4uL3ZpZXdzL2RlZmF1bHQtZm9udC1idXR0b24nICksXG5cdEZvbnRWYXJpYW50Q29udHJvbCA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXZhcmlhbnQtY29udHJvbCcgKSxcblx0Rm9udFNpemVDb250cm9sID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtc2l6ZS1jb250cm9sJyApO1xuXG4vLyBDb250YWluZXIgZm9yIHRoZSBsaXN0IG9mIGF2YWlsYWJsZSBmb250cyBhbmQgJ3gnIGJ1dHRvblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX21lbnVfY29udGFpbmVyJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5tZW51ID0gJ2ZvbnRGYW1pbHknO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgQ3VycmVudEZvbnQoe1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWxcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnREcm9wZG93bih7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbCxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBEZWZhdWx0Rm9udEJ1dHRvbih7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbFxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFNpemVDb250cm9sKHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsLFxuXHRcdFx0Zm9udERhdGE6IHRoaXMuZm9udERhdGFcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRWYXJpYW50Q29udHJvbCh7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbCxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSk7XG4iLCJ2YXIgZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzJyApO1xuXG52YXIgZ2V0V2lkb3dIZWlnaHQgPSByZXF1aXJlKCAnLi4vaGVscGVycy93aW5kb3ctbWVhc3VyZXMnICkuZ2V0V2lkb3dIZWlnaHQsXG5cdGdldFZpZXdGb3JQcm92aWRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3Byb3ZpZGVyLXZpZXdzJyApLmdldFZpZXdGb3JQcm92aWRlcixcblx0RHJvcGRvd25UZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZScgKTtcblxuXG4vLyBEcm9wZG93biBvZiBhdmFpbGFibGUgZm9udHNcbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25UZW1wbGF0ZS5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19tZW51Jyxcblx0aWQ6ICdmb250LXNlbGVjdCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmZvbnREYXRhLmVhY2goIGZ1bmN0aW9uKCBmb250ICkge1xuXHRcdFx0dmFyIFByb3ZpZGVyVmlldyA9IGdldFZpZXdGb3JQcm92aWRlciggZm9udC5nZXQoICdwcm92aWRlcicgKSApO1xuXHRcdFx0aWYgKCAhIFByb3ZpZGVyVmlldyApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0ZGVidWcoICdyZW5kZXJpbmcgcHJvdmlkZXJWaWV3IGluIGZvbnQgbGlzdCBmb3InLCBmb250LnRvSlNPTigpICk7XG5cdFx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBQcm92aWRlclZpZXcoe1xuXHRcdFx0XHRtb2RlbDogZm9udCxcblx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRjdXJyZW50Rm9udDogdGhpcy5jdXJyZW50Rm9udFxuXHRcdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHR9LCB0aGlzICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRvcGVuOiBmdW5jdGlvbigpIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5vcGVuLmNhbGwodGhpcyk7XG5cdFx0dGhpcy5zY3JlZW5GaXQoKTtcblx0fSxcblxuXHRzY3JlZW5GaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYWRkaW5nLCBjb250cm9sc0hlaWdodCwgb2Zmc2V0LCBzY3JvbGxIZWlnaHQsIGFsbG93YWJsZUhlaWdodCwgdG9wT2Zmc2V0O1xuXHRcdC8vIHJlc2V0IGhlaWdodC90b3AgaW4gY2FzZSBpdCdzIGJlZW4gc2V0IHByZXZpb3VzbHkgYW5kIHRoZSB2aWV3cG9ydCBoYXMgY2hhbmdlZFxuXHRcdC8vIHdlJ3JlIG5vdCBnb2luZyB0byBhc3NpZ24gYSB3aW5kb3cucmVzaXplIGxpc3RlbmVyIGJlY2F1c2UgaXQncyBhbiBlZGdlIGNhc2UgYW5kXG5cdFx0Ly8gcmVzaXplIGhhbmRsZXJzIHNob3VsZCBiZSBhdm9pZGVkIHdoZXJlIHBvc3NpYmxlXG5cdFx0dGhpcy4kZWwuY3NzKHsgaGVpZ2h0OiAnJywgdG9wOiAnJyB9KTtcblxuXHRcdHBhZGRpbmcgPSAyMDtcblx0XHRjb250cm9sc0hlaWdodCA9IGdldFdpZG93SGVpZ2h0KCk7XG5cdFx0b2Zmc2V0ID0gdGhpcy4kZWwub2Zmc2V0KCk7XG5cdFx0c2Nyb2xsSGVpZ2h0ID0gdGhpcy4kZWwuaGVpZ2h0KCk7XG5cdFx0aWYgKCBwYWRkaW5nICsgb2Zmc2V0LnRvcCArIHNjcm9sbEhlaWdodCA8PSBjb250cm9sc0hlaWdodCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0YWxsb3dhYmxlSGVpZ2h0ID0gY29udHJvbHNIZWlnaHQgLSAoIHBhZGRpbmcgKiAyICk7XG5cdFx0Ly8gXHQvLyBsZXQncyBzZWUgaWYgd2UgY2FuIGp1c3Qgc2hpZnQgaXQgdXAgYSBiaXRcblx0XHRpZiAoIHNjcm9sbEhlaWdodCA8PSBhbGxvd2FibGVIZWlnaHQgKSB7XG5cdFx0XHR0b3BPZmZzZXQgPSBhbGxvd2FibGVIZWlnaHQgLSBzY3JvbGxIZWlnaHQgLSBvZmZzZXQudG9wO1xuXHRcdFx0dGhpcy4kZWwuY3NzKCAndG9wJywgdG9wT2Zmc2V0ICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdC8vIGl0J3MgdG9vIGJpZ1xuXHRcdHRvcE9mZnNldCA9IHBhZGRpbmcgLSBvZmZzZXQudG9wO1xuXHRcdHRoaXMuJGVsLmNzcyh7XG5cdFx0XHR0b3A6IHRvcE9mZnNldCArIDExMCwgLy8gMTEwID09IG9mZnNldCBmcm9tIHRvcCBvZiBjdXN0b21pemVyIGVsZW1lbnRzLlxuXHRcdFx0aGVpZ2h0OiBhbGxvd2FibGVIZWlnaHQgLSAxNDUgLy8gMTQ1ID09IGFib3ZlIG9mZnNldCBwbHVzIHRoZSBjb2xsYXBzZSBlbGVtZW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBGb250U2l6ZURyb3Bkb3duID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtc2l6ZS1kcm9wZG93bicgKSxcbkN1cnJlbnRGb250U2l6ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9jdXJyZW50LWZvbnQtc2l6ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtY29udHJvbCBmb250LXByb3BlcnR5LWNvbnRyb2wnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMubWVudSA9ICdmb250U2l6ZSc7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHR9LFxuXG5cdGdldFNlbGVjdGVkQXZhaWxhYmxlRm9udDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZm9udERhdGEuZmluZFdoZXJlKCB7IG5hbWU6IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnbmFtZScgKSB9ICk7XG5cdFx0aWYgKCAhc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHR9LFxuXG5cdGdldEN1cnJlbnRGb250U2l6ZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCk7XG5cdFx0aWYgKCBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHR2YXIgc2l6ZSA9IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnc2l6ZScgKTtcblx0XHRcdGlmICggc2l6ZSAmJiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFNpemVOYW1lRnJvbUlkKCBzaXplICkgKSB7XG5cdFx0XHRcdHJldHVybiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFNpemVOYW1lRnJvbUlkKCBzaXplICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gJ05vcm1hbCBTaXplJztcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEN1cnJlbnRGb250U2l6ZSgge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmdldEN1cnJlbnRGb250U2l6ZSgpXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250U2l6ZURyb3Bkb3duKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRzZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCksXG5cdFx0XHRjdXJyZW50Rm9udFNpemU6IHRoaXMuZ2V0Q3VycmVudEZvbnRTaXplKClcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBGb250U2l6ZU9wdGlvbiA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtb3B0aW9uJyApLFxuRHJvcGRvd25UZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtZHJvcGRvd24gZm9udC1wcm9wZXJ0eS1jb250cm9sLWRyb3Bkb3duJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IG9wdHMuc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gb3B0cy5jdXJyZW50Rm9udFNpemU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdGlmICggdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHR2YXIgc2l6ZU9wdGlvbnMgPSB0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udC5nZXRGb250U2l6ZU9wdGlvbnMoKTtcblx0XHRcdHNpemVPcHRpb25zLmZvckVhY2goIGZ1bmN0aW9uKCBvcHRpb24gKSB7XG5cdFx0XHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRTaXplT3B0aW9uKCB7XG5cdFx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRcdGlkOiBvcHRpb24uaWQsXG5cdFx0XHRcdFx0bmFtZTogb3B0aW9uLm5hbWUsXG5cdFx0XHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmN1cnJlbnRGb250U2l6ZVxuXHRcdFx0XHR9ICkucmVuZGVyKCkuZWwgKTtcblx0XHRcdH0uYmluZCh0aGlzKSApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtc2l6ZS1vcHRpb24gamV0cGFjay1mb250c19fZm9udC1wcm9wZXJ0eS1vcHRpb24nLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljaycgOiAnc2V0U2l6ZU9wdGlvbidcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5pZCA9IG9wdHMuaWQ7XG5cdFx0dGhpcy5uYW1lID0gb3B0cy5uYW1lO1xuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gb3B0cy5jdXJyZW50Rm9udFNpemU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm5hbWUgKTtcblx0XHR0aGlzLiRlbC5hdHRyKCAnZGF0YS1uYW1lJywgdGhpcy5uYW1lICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250U2l6ZSA9PT0gdGhpcy5uYW1lICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdjdXJyZW50JyApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRzZXRTaXplT3B0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdzZXQtc2l6ZScsIHsgc2l6ZTogdGhpcy5pZCwgdHlwZTogdGhpcy50eXBlIH0gKTtcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG52YXIgRm9udENvbnRyb2wgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1jb250cm9sJyApO1xuXG4vLyBBIGZvbnQgY29udHJvbCBWaWV3IGZvciBhIHBhcnRpY3VsYXIgc2V0dGluZyB0eXBlXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fdHlwZScsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJyA6ICdjbG9zZU1lbnVzJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggJzxkaXYgY2xhc3M9XCJqZXRwYWNrLWZvbnRzX190eXBlXCIgZGF0YS1mb250LXR5cGU9XCInICsgdGhpcy50eXBlLmlkICsgJ1wiPjxoMyBjbGFzcz1cImpldHBhY2stZm9udHNfX3R5cGUtaGVhZGVyXCI+JyArIHRoaXMudHlwZS5uYW1lICsgICc8L2gzPjwvZGl2PicgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250Q29udHJvbCh7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtb2RlbDogdGhpcy5jdXJyZW50Rm9udCxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRjbG9zZU1lbnVzOiBmdW5jdGlvbigpIHtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHR9XG59KTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRm9udFZhcmlhbnREcm9wZG93biA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXZhcmlhbnQtZHJvcGRvd24nICksXG5DdXJyZW50Rm9udFZhcmlhbnQgPSByZXF1aXJlKCAnLi4vdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC12YXJpYW50LWNvbnRyb2wgZm9udC1wcm9wZXJ0eS1jb250cm9sJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLm1lbnUgPSAnZm9udFZhcmlhbnQnO1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHRnZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmZvbnREYXRhLmZpbmRXaGVyZSggeyBuYW1lOiB0aGlzLmN1cnJlbnRGb250LmdldCggJ25hbWUnICkgfSApO1xuXHRcdGlmICggIXNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0fSxcblxuXHRnZXRDdXJyZW50Rm9udFZhcmlhbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpO1xuXHRcdGlmICggc2VsZWN0ZWRBdmFpbGFibGVGb250ICYmIHRoaXMudHlwZS5mdmRBZGp1c3QgKSB7XG5cdFx0XHR2YXIgZnZkcyA9IHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnZnZkcycgKTtcblx0XHRcdGlmICggZnZkcyAmJiBPYmplY3Qua2V5cyhmdmRzKS5sZW5ndGggPT09IDEgKSB7XG5cdFx0XHRcdHJldHVybiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFZhcmlhbnROYW1lRnJvbUlkKCBmdmRzWzBdICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gJ1JlZ3VsYXInO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIFRPRE86IHJlbW92ZSBvciB1cGRhdGUgY2hpbGQgdmlld3MgcmF0aGVyIHRoYW4gb3ZlcndyaXRlIHRoZW1cblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRWaWV3ICkge1xuXHRcdFx0dGhpcy5jdXJyZW50Rm9udFZpZXcucmVtb3ZlKCk7XG5cdFx0fVxuXHRcdGlmICggdGhpcy5kcm9wRG93blZpZXcgKSB7XG5cdFx0XHR0aGlzLmRyb3BEb3duVmlldy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZpZXcgPSBuZXcgQ3VycmVudEZvbnRWYXJpYW50KCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRjdXJyZW50Rm9udFZhcmlhbnQ6IHRoaXMuZ2V0Q3VycmVudEZvbnRWYXJpYW50KClcblx0XHR9KTtcblx0XHR0aGlzLmRyb3BEb3duVmlldyA9IG5ldyBGb250VmFyaWFudERyb3Bkb3duKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRzZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCksXG5cdFx0XHRjdXJyZW50Rm9udFZhcmlhbnQ6IHRoaXMuZ2V0Q3VycmVudEZvbnRWYXJpYW50KClcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIHRoaXMuY3VycmVudEZvbnRWaWV3LnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCB0aGlzLmRyb3BEb3duVmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBGb250VmFyaWFudE9wdGlvbiA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXZhcmlhbnQtb3B0aW9uJyApLFxuRHJvcGRvd25UZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXZhcmlhbnQtZHJvcGRvd24gZm9udC1wcm9wZXJ0eS1jb250cm9sLWRyb3Bkb3duJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IG9wdHMuc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdGlmICggdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgJiYgdGhpcy50eXBlLmZ2ZEFkanVzdCApIHtcblx0XHRcdHZhciB2YXJpYW50T3B0aW9ucyA9IHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRWYXJpYW50T3B0aW9ucygpO1xuXHRcdFx0Zm9yICggdmFyIGsgaW4gdmFyaWFudE9wdGlvbnMgKSB7XG5cdFx0XHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRWYXJpYW50T3B0aW9uKCB7XG5cdFx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRcdGlkOiBrLFxuXHRcdFx0XHRcdG5hbWU6IHZhcmlhbnRPcHRpb25zW2tdLFxuXHRcdFx0XHRcdGN1cnJlbnRGb250VmFyaWFudDogdGhpcy5jdXJyZW50Rm9udFZhcmlhbnRcblx0XHRcdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC12YXJpYW50LW9wdGlvbiBqZXRwYWNrLWZvbnRzX19mb250LXByb3BlcnR5LW9wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJyA6ICdzZXRWYXJpYW50T3B0aW9uJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmlkID0gb3B0cy5pZDtcblx0XHR0aGlzLm5hbWUgPSBvcHRzLm5hbWU7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgPSBvcHRzLmN1cnJlbnRGb250VmFyaWFudDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubmFtZSApO1xuXHRcdHRoaXMuJGVsLmRhdGEoICdpZCcsIHRoaXMuaWQgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID09PSB0aGlzLm5hbWUgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2N1cnJlbnQnICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHNldFZhcmlhbnRPcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ3NldC12YXJpYW50JywgeyB2YXJpYW50OiB0aGlzLmlkLCB0eXBlOiB0aGlzLnR5cGUgfSApO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250cycgKSxcblx0YXZhaWxhYmxlRm9udHMgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hdmFpbGFibGUtZm9udHMnICksXG5cdGF2YWlsYWJsZVR5cGVzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXZhaWxhYmxlLXR5cGVzJyApO1xuXG52YXIgRm9udFR5cGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC10eXBlJyApLFxuXHRBdmFpbGFibGVGb250cyA9IHJlcXVpcmUoICcuLi9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMnICk7XG5cbi8vIEluaXRpYWxpemUgdGhlIGRlZmF1bHQgUHJvdmlkZXIgVmlld3NcbnJlcXVpcmUoICcuLi9wcm92aWRlcnMvZ29vZ2xlJyApO1xuXG4vLyBUaGUgbWFpbiBmb250IGNvbnRyb2wgVmlldywgY29udGFpbmluZyBzZWN0aW9ucyBmb3IgZWFjaCBzZXR0aW5nIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRkZWJ1ZyggJ2luaXQgd2l0aCBjdXJyZW50bHkgc2VsZWN0ZWQgZm9udHM6JywgdGhpcy5jb2xsZWN0aW9uLnRvSlNPTigpICk7XG5cdFx0dGhpcy5oZWFkaW5nRm9udHMgPSBuZXcgQXZhaWxhYmxlRm9udHMoIGF2YWlsYWJsZUZvbnRzICk7XG5cdFx0dGhpcy5ib2R5Rm9udHMgPSBuZXcgQXZhaWxhYmxlRm9udHMoIHRoaXMuaGVhZGluZ0ZvbnRzLndoZXJlKCB7IGJvZHlUZXh0OiB0cnVlIH0gKSApO1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdjaGFuZ2UtZm9udCcsIHRoaXMudXBkYXRlQ3VycmVudEZvbnQgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnc2V0LXZhcmlhbnQnLCB0aGlzLnNldEZvbnRWYXJpYW50ICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ3NldC1zaXplJywgdGhpcy5zZXRGb250U2l6ZSApO1xuXHR9LFxuXG5cdHNldEZvbnRWYXJpYW50OiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHR2YXIgbW9kZWwgPSB0aGlzLmZpbmRNb2RlbFdpdGhUeXBlKCBkYXRhLnR5cGUgKTtcblx0XHRtb2RlbC5zZXQoICdmdmRzJywgW2RhdGEudmFyaWFudF0gKTtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHR9LFxuXG5cdHNldEZvbnRTaXplOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHR2YXIgbW9kZWwgPSB0aGlzLmZpbmRNb2RlbFdpdGhUeXBlKCBkYXRhLnR5cGUgKTtcblx0XHRtb2RlbC5zZXQoICdzaXplJywgZGF0YS5zaXplICk7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHR1cGRhdGVDdXJyZW50Rm9udDogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5maW5kTW9kZWxXaXRoVHlwZSggZGF0YS50eXBlICk7XG5cdFx0bW9kZWwuc2V0KCBkYXRhLmZvbnQuYXR0cmlidXRlcyApO1xuXHRcdG1vZGVsLnVuc2V0KCAnc2l6ZScgKTtcblx0XHRkZWJ1ZyggJ3VwZGF0ZUN1cnJlbnRGb250IHdpdGgnLCBkYXRhLmZvbnQudG9KU09OKCksICd0bycsIG1vZGVsLnRvSlNPTigpICk7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnRleHQoICcnICk7IC8vIFRPRE86IGJldHRlciB0byB1cGRhdGUgZWFjaCBWaWV3IHRoYW4gb3ZlcndyaXRlXG5cdFx0ZGVidWcoICdyZW5kZXJpbmcgY29udHJvbHMgZm9yIGZvbnQgdHlwZXMnLCBhdmFpbGFibGVUeXBlcyApO1xuXHRcdGF2YWlsYWJsZVR5cGVzLmZvckVhY2goIHRoaXMucmVuZGVyVHlwZUNvbnRyb2wuYmluZCggdGhpcyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVuZGVyVHlwZUNvbnRyb2w6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdHZhciBmb250cztcblx0XHRpZiAoIHR5cGUuYm9keVRleHQgPT09IHRydWUgKSB7XG5cdFx0XHRmb250cyA9IHRoaXMuYm9keUZvbnRzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb250cyA9IHRoaXMuaGVhZGluZ0ZvbnRzO1xuXHRcdH1cblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250VHlwZSh7XG5cdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuZmluZE1vZGVsV2l0aFR5cGUoIHR5cGUgKSxcblx0XHRcdGZvbnREYXRhOiBmb250c1xuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdH0sXG5cblx0ZmluZE1vZGVsV2l0aFR5cGU6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdHZhciBtb2RlbCA9IHRoaXMuY29sbGVjdGlvbi5maW5kKCBmdW5jdGlvbiggbW9kZWwgKSB7XG5cdFx0XHRyZXR1cm4gKCBtb2RlbC5nZXQoICd0eXBlJyApID09PSB0eXBlLmlkICk7XG5cdFx0fSApO1xuXHRcdGlmICggISBtb2RlbCApIHtcblx0XHRcdG1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmFkZCgge1xuXHRcdFx0XHR0eXBlOiB0eXBlLmlkLFxuXHRcdFx0XHRuYW1lOiAnRGVmYXVsdCBUaGVtZSBmb250J1xuXHRcdFx0fSApO1xuXHRcdH1cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH1cbn0pO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICdsaWdodHNlYWdyZWVuJyxcbiAgJ2ZvcmVzdGdyZWVuJyxcbiAgJ2dvbGRlbnJvZCcsXG4gICdkb2RnZXJibHVlJyxcbiAgJ2RhcmtvcmNoaWQnLFxuICAnY3JpbXNvbidcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICByZXR1cm4gKCdXZWJraXRBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh3aW5kb3cuY29uc29sZSAmJiAoY29uc29sZS5maXJlYnVnIHx8IChjb25zb2xlLmV4Y2VwdGlvbiAmJiBjb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuIGFyZ3M7XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzID0gW2FyZ3NbMF0sIGMsICdjb2xvcjogaW5oZXJpdCddLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSk7XG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EteiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgsXG4gIC8vIHdoZXJlIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PSB0eXBlb2YgY29uc29sZVxuICAgICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBsb2NhbFN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbcHJldkNvbG9yKysgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICAvLyBkZWZpbmUgdGhlIGBkaXNhYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcbiAgfVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZW5hYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBlbmFibGVkKCkge1xuXG4gICAgdmFyIHNlbGYgPSBlbmFibGVkO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyBhZGQgdGhlIGBjb2xvcmAgaWYgbm90IHNldFxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gICAgaWYgKG51bGwgPT0gc2VsZi5jb2xvciAmJiBzZWxmLnVzZUNvbG9ycykgc2VsZi5jb2xvciA9IHNlbGVjdENvbG9yKCk7XG5cbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlb1xuICAgICAgYXJncyA9IFsnJW8nXS5jb25jYXQoYXJncyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EteiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5mb3JtYXRBcmdzKSB7XG4gICAgICBhcmdzID0gZXhwb3J0cy5mb3JtYXRBcmdzLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIH1cbiAgICB2YXIgbG9nRm4gPSBlbmFibGVkLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG4gIGVuYWJsZWQuZW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XG5cbiAgZm4ubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHkgPSBkICogMzY1LjI1O1xuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKXtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgdmFsKSByZXR1cm4gcGFyc2UodmFsKTtcbiAgcmV0dXJuIG9wdGlvbnMubG9uZ1xuICAgID8gbG9uZyh2YWwpXG4gICAgOiBzaG9ydCh2YWwpO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1zfHNlY29uZHM/fHN8bWludXRlcz98bXxob3Vycz98aHxkYXlzP3xkfHllYXJzP3x5KT8kL2kuZXhlYyhzdHIpO1xuICBpZiAoIW1hdGNoKSByZXR1cm47XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtO1xuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG47XG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzaG9ydChtcykge1xuICBpZiAobXMgPj0gZCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgaWYgKG1zID49IGgpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIGlmIChtcyA+PSBtKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICBpZiAobXMgPj0gcykgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpXG4gICAgfHwgcGx1cmFsKG1zLCBoLCAnaG91cicpXG4gICAgfHwgcGx1cmFsKG1zLCBtLCAnbWludXRlJylcbiAgICB8fCBwbHVyYWwobXMsIHMsICdzZWNvbmQnKVxuICAgIHx8IG1zICsgJyBtcyc7XG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XG4gIGlmIChtcyA8IG4pIHJldHVybjtcbiAgaWYgKG1zIDwgbiAqIDEuNSkgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncyc7XG59XG4iXX0=
