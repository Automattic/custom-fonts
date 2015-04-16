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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMuanMiLCJqcy9jb2xsZWN0aW9ucy9zZWxlY3RlZC1mb250cy5qcyIsImpzL2hlbHBlcnMvYXBpLmpzIiwianMvaGVscGVycy9hdmFpbGFibGUtZm9udHMuanMiLCJqcy9oZWxwZXJzL2F2YWlsYWJsZS10eXBlcy5qcyIsImpzL2hlbHBlcnMvYmFja2JvbmUuanMiLCJqcy9oZWxwZXJzL2Jvb3RzdHJhcC5qcyIsImpzL2hlbHBlcnMvZW1pdHRlci5qcyIsImpzL2hlbHBlcnMvcHJvdmlkZXItdmlld3MuanMiLCJqcy9oZWxwZXJzL3VuZGVyc2NvcmUuanMiLCJqcy9oZWxwZXJzL3dpbmRvdy1tZWFzdXJlcy5qcyIsImpzL2luZGV4LmpzIiwianMvbW9kZWxzL2F2YWlsYWJsZS1mb250LmpzIiwianMvbW9kZWxzL2RlZmF1bHQtZm9udC5qcyIsImpzL21vZGVscy9zZWxlY3RlZC1mb250LmpzIiwianMvcHJvdmlkZXJzL2dvb2dsZS5qcyIsImpzL3ZpZXdzL2N1cnJlbnQtZm9udC1zaXplLmpzIiwianMvdmlld3MvY3VycmVudC1mb250LXZhcmlhbnQuanMiLCJqcy92aWV3cy9jdXJyZW50LWZvbnQuanMiLCJqcy92aWV3cy9kZWZhdWx0LWZvbnQtYnV0dG9uLmpzIiwianMvdmlld3MvZHJvcGRvd24tY3VycmVudC10ZW1wbGF0ZS5qcyIsImpzL3ZpZXdzL2Ryb3Bkb3duLWl0ZW0uanMiLCJqcy92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZS5qcyIsImpzL3ZpZXdzL2ZvbnQtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtZHJvcGRvd24uanMiLCJqcy92aWV3cy9mb250LXNpemUtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtc2l6ZS1kcm9wZG93bi5qcyIsImpzL3ZpZXdzL2ZvbnQtc2l6ZS1vcHRpb24uanMiLCJqcy92aWV3cy9mb250LXR5cGUuanMiLCJqcy92aWV3cy9mb250LXZhcmlhbnQtY29udHJvbC5qcyIsImpzL3ZpZXdzL2ZvbnQtdmFyaWFudC1kcm9wZG93bi5qcyIsImpzL3ZpZXdzL2ZvbnQtdmFyaWFudC1vcHRpb24uanMiLCJqcy92aWV3cy9tYXN0ZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgQXZhaWxhYmxlRm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvYXZhaWxhYmxlLWZvbnQnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuXHRtb2RlbDogQXZhaWxhYmxlRm9udFxufSk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIFNlbGVjdGVkRm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvc2VsZWN0ZWQtZm9udCcgKTtcblxuLy8gQSBDb2xsZWN0aW9uIG9mIHRoZSBjdXJyZW50IGZvbnQgc2V0dGluZ3MgZm9yIHRoaXMgdGhlbWVcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuXG5cdG1vZGVsOiBTZWxlY3RlZEZvbnQsXG5cblx0dG9KU09OOiBmdW5jdGlvbigpIHtcblx0XHQvLyBza2lwIGFueSBmb250cyBzZXQgdG8gdGhlIGRlZmF1bHRcblx0XHRyZXR1cm4gdGhpcy5yZWR1Y2UoIGZ1bmN0aW9uKCBwcmV2aW91cywgbW9kZWwgKSB7XG5cdFx0XHRpZiAoIG1vZGVsLmdldCggJ2lkJyApICYmIG1vZGVsLmdldCggJ2lkJyApICE9PSAnamV0cGFjay1kZWZhdWx0LXRoZW1lLWZvbnQnICkge1xuXHRcdFx0XHRwcmV2aW91cy5wdXNoKCBtb2RlbC50b0pTT04oKSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHByZXZpb3VzO1xuXHRcdH0sIFtdICk7XG5cdH1cbn0pO1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy53cC5jdXN0b21pemU7XG4iLCJ2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCAnLi4vaGVscGVycy9ib290c3RyYXAnICk7XG5cbnZhciBmb250cyA9IFtdO1xuaWYgKCBzZXR0aW5ncyAmJiBzZXR0aW5ncy5mb250cyApIHtcblx0Zm9udHMgPSBzZXR0aW5ncy5mb250cztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmb250cztcblxuIiwidmFyIHNldHRpbmdzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYm9vdHN0cmFwJyApO1xudmFyIF8gPSByZXF1aXJlKCAnLi4vaGVscGVycy91bmRlcnNjb3JlJyApO1xuXG52YXIgdHlwZXMgPSBbXTtcbmlmICggc2V0dGluZ3MgJiYgc2V0dGluZ3MudHlwZXMgKSB7XG5cdHR5cGVzID0gc2V0dGluZ3MudHlwZXM7XG5cdHZhciBpZHg7XG5cdF8uZmluZCggdHlwZXMsIGZ1bmN0aW9uKCB0eXBlLCBpICl7XG5cdFx0aWYgKCB0eXBlLmlkID09PSAnaGVhZGluZ3MnICkge1xuXHRcdFx0aWR4ID0gaTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fSApIDtcblx0dHlwZXMuc3BsaWNlKDAsIDAsIHR5cGVzLnNwbGljZShpZHgsIDEpWzBdICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdHlwZXM7XG4iLCIvKiBnbG9iYWxzIEJhY2tib25lICovXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lO1xuIiwidmFyIHNldHRpbmdzID0gd2luZG93Ll9KZXRwYWNrRm9udHM7XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3M7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKSxcblx0XyA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gXy5leHRlbmQoIEJhY2tib25lLkV2ZW50cyApO1xuXG4iLCIvKipcbiAqIFRoaXMgaGVscGVyIHNldHMgdXAgVmlld3MgdG8gcmVuZGVyIGVhY2ggZm9udCBmb3Igc3BlY2lmaWMgcHJvdmlkZXJzLiBFYWNoXG4gKiBWaWV3IHNob3VsZCBiZSBhbiBpbnN0YW5jZSBvZiBgd3AuY3VzdG9taXplLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXdgICh3aGljaFxuICogaXMgYSBgQmFja2JvbmUuVmlld2ApIHRoYXQgd2lsbCByZW5kZXIgaXRzIGZvbnQgb3B0aW9uIHRvIHRoZSBmb250IGxpc3QuXG4gKiBBZGRpdGlvbmFsIHByb3ZpZGVyIFZpZXdzIGNhbiBiZSBhZGRlZCBieSBhZGRpbmcgdG8gdGhlXG4gKiBgd3AuY3VzdG9taXplLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzYCBvYmplY3QgdXNpbmcgdGhlIHByb3ZpZGVyIGlkIGFzIHRoZVxuICoga2V5LiBUaGUgb25seSB0aGluZyB0aGF0IG5lZWRzIHRvIGJlIGFkZGVkIGZvciBlYWNoIFByb3ZpZGVyVmlldyBpcyB0aGVcbiAqIGByZW5kZXJgIG1ldGhvZC4gRWFjaCBQcm92aWRlclZpZXcgaGFzIGFzIGl0cyBgbW9kZWxgIG9iamVjdCB0aGUgZm9udCBvYmplY3RcbiAqIGl0IG5lZWRzIHRvIGRpc3BsYXksIGluY2x1ZGluZyB0aGUgYG5hbWVgIGFuZCBgaWRgIGF0dHJpYnV0ZXMuXG4gKi9cblxudmFyIGFwaSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2FwaScgKSxcblx0ZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzJyApO1xuXG52YXIgRHJvcGRvd25JdGVtID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLWl0ZW0nICk7XG5pZiAoICEgYXBpLkpldHBhY2tGb250cyApIHtcblx0YXBpLkpldHBhY2tGb250cyA9IHt9O1xufVxuaWYgKCAhIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApIHtcblx0YXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzID0ge307XG59XG5hcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlldyA9IERyb3Bkb3duSXRlbTtcblxudmFyIHByb3ZpZGVyVmlld3MgPSB7fTtcblxuZnVuY3Rpb24gaW1wb3J0UHJvdmlkZXJWaWV3cygpIHtcblx0ZGVidWcoICdpbXBvcnRpbmcgcHJvdmlkZXIgdmlld3MgZnJvbScsIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApO1xuXHRpZiAoIGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cyApIHtcblx0XHRPYmplY3Qua2V5cyggYXBpLkpldHBhY2tGb250cy5wcm92aWRlclZpZXdzICkuZm9yRWFjaCggZnVuY3Rpb24oIHByb3ZpZGVyS2V5ICkge1xuXHRcdFx0cHJvdmlkZXJWaWV3c1sgcHJvdmlkZXJLZXkgXSA9IGFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3c1sgcHJvdmlkZXJLZXkgXTtcblx0XHR9ICk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0Vmlld0ZvclByb3ZpZGVyKCBwcm92aWRlciApIHtcblx0aW1wb3J0UHJvdmlkZXJWaWV3cygpO1xuXHRpZiAoIHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyIF0gKSB7XG5cdFx0ZGVidWcoICdmb3VuZCB2aWV3IGZvciBwcm92aWRlcicsIHByb3ZpZGVyLCAnOicsIHByb3ZpZGVyVmlld3NbIHByb3ZpZGVyIF0gKTtcblx0XHRyZXR1cm4gcHJvdmlkZXJWaWV3c1sgcHJvdmlkZXIgXTtcblx0fVxuXHRkZWJ1ZyggJ25vIHZpZXcgZm91bmQgZm9yIHByb3ZpZGVyJywgcHJvdmlkZXIgKTtcblx0cmV0dXJuIG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRWaWV3Rm9yUHJvdmlkZXI6IGdldFZpZXdGb3JQcm92aWRlclxufTtcbiIsIi8qIGdsb2JhbHMgXyAqL1xubW9kdWxlLmV4cG9ydHMgPSBfO1xuIiwiZnVuY3Rpb24gZ2V0V2lkb3dIZWlnaHQoKSB7XG5cdHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRnZXRXaWRvd0hlaWdodDogZ2V0V2lkb3dIZWlnaHRcbn07XG4iLCIvKiBnbG9iYWxzIF8gKi9cblxudmFyIGFwaSA9IHJlcXVpcmUoICcuL2hlbHBlcnMvYXBpJyApO1xuXG52YXIgTWFzdGVyID0gcmVxdWlyZSggJy4vdmlld3MvbWFzdGVyJyApO1xuXG52YXIgU2VsZWN0ZWRGb250cyA9IHJlcXVpcmUoICcuL2NvbGxlY3Rpb25zL3NlbGVjdGVkLWZvbnRzJyApO1xuXG4vLyBDdXN0b21pemVyIENvbnRyb2xcbmFwaS5jb250cm9sQ29uc3RydWN0b3IuamV0cGFja0ZvbnRzID0gYXBpLkNvbnRyb2wuZXh0ZW5kKHtcblx0cmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY29sbGVjdGlvbiA9IG5ldyBTZWxlY3RlZEZvbnRzKCB0aGlzLnNldHRpbmcoKSApO1xuXG5cdFx0dGhpcy5jb2xsZWN0aW9uLm9uKCAnY2hhbmdlJywgXy5iaW5kKCBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5zZXR0aW5nKCB0aGlzLmNvbGxlY3Rpb24udG9KU09OKCkgKTtcblx0XHR9LCB0aGlzICkgKTtcblxuXHRcdHRoaXMudmlldyA9IG5ldyBNYXN0ZXIoe1xuXHRcdFx0Y29sbGVjdGlvbjogdGhpcy5jb2xsZWN0aW9uLFxuXHRcdFx0ZWw6IHRoaXMuY29udGFpbmVyXG5cdFx0fSkucmVuZGVyKCk7XG5cdH1cbn0pO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICksXG5fID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvdW5kZXJzY29yZScgKTtcblxudmFyIHNpemVPcHRpb25zID0gWyB7IGlkOiAtMTAsIG5hbWU6ICdUaW55JyB9LCB7IGlkOiAtNSwgbmFtZTogJ1NtYWxsJyB9LCB7IGlkOiAwLCBuYW1lOiAnTm9ybWFsJyB9LCB7IGlkOiA1LCBuYW1lOiAnTGFyZ2UnIH0sIHsgaWQ6IDEwLCBuYW1lOiAnSHVnZScgfSBdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG5cdGdldEZvbnRWYXJpYW50T3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCB0aGlzLmdldCggJ2Z2ZHMnICkgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXQoICdmdmRzJyApO1xuXHRcdH1cblx0fSxcblxuXHRnZXRGb250VmFyaWFudE5hbWVGcm9tSWQ6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHRpZiAoIHRoaXMuZ2V0KCAnZnZkcycgKSApIHtcblx0XHRcdHJldHVybiB0aGlzLmdldCggJ2Z2ZHMnIClbaWRdO1xuXHRcdH1cblx0fSxcblxuXHRnZXRGb250U2l6ZU9wdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBzaXplT3B0aW9ucztcblx0fSxcblxuXHRnZXRGb250U2l6ZU5hbWVGcm9tSWQ6IGZ1bmN0aW9uKCBpZCApIHtcblx0XHR2YXIgb3B0aW9uID0gXy5maW5kV2hlcmUoIHNpemVPcHRpb25zLCB7IGlkOiBpZCB9ICk7XG5cdFx0aWYgKCBvcHRpb24gKSB7XG5cdFx0XHRyZXR1cm4gb3B0aW9uLm5hbWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn0pO1xuIiwidmFyIFNlbGVjdGVkRm9udCA9IHJlcXVpcmUoICcuLi9tb2RlbHMvc2VsZWN0ZWQtZm9udCcgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RlZEZvbnQuZXh0ZW5kKHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gVE9ETzogdHJhbnNsYXRlIHRoaXMgc3RyaW5nXG5cdFx0dGhpcy5zZXQoeyBpZDogJ2pldHBhY2stZGVmYXVsdC10aGVtZS1mb250JywgbmFtZTogJ0RlZmF1bHQgVGhlbWUgZm9udCcsIHByb3ZpZGVyOiAnJyB9KTtcblx0fVxufSk7XG5cbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG4vLyBBIE1vZGVsIGZvciBhIGN1cnJlbnRseSBzZXQgZm9udCBzZXR0aW5nIGZvciB0aGlzIHRoZW1lXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7fSk7XG4iLCIvKiBnbG9iYWxzIFdlYkZvbnQgKi9cbnZhciBhcGkgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hcGknICk7XG5cbnZhciBsb2FkZWRGb250SWRzID0gW107XG5cbmZ1bmN0aW9uIGFkZEZvbnRUb1BhZ2UoIGZvbnQsIHRleHQgKSB7XG5cdGlmICggfiBsb2FkZWRGb250SWRzLmluZGV4T2YoIGZvbnQuaWQgKSApIHtcblx0XHRyZXR1cm47XG5cdH1cblx0bG9hZGVkRm9udElkcy5wdXNoKCBmb250LmlkICk7XG5cdFdlYkZvbnQubG9hZCggeyBnb29nbGU6IHsgZmFtaWxpZXM6IFsgZm9udC5pZCBdLCB0ZXh0OiB0ZXh0IH0gfSApO1xufVxuXG52YXIgR29vZ2xlUHJvdmlkZXJWaWV3ID0gYXBpLkpldHBhY2tGb250cy5Qcm92aWRlclZpZXcuZXh0ZW5kKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm1vZGVsLmdldCggJ25hbWUnICkgKTtcblx0XHR0aGlzLiRlbC5jc3MoICdmb250LWZhbWlseScsICdcIicgKyB0aGlzLm1vZGVsLmdldCggJ25hbWUnICkgKyAnXCInICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250ICYmIHRoaXMuY3VycmVudEZvbnQuZ2V0KCAnbmFtZScgKSA9PT0gdGhpcy5tb2RlbC5nZXQoICduYW1lJyApICkge1xuXHRcdFx0dGhpcy4kZWwuYWRkQ2xhc3MoICdhY3RpdmUnICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnYWN0aXZlJyApO1xuXHRcdH1cblx0XHRhZGRGb250VG9QYWdlKCB0aGlzLm1vZGVsLnRvSlNPTigpLCB0aGlzLm1vZGVsLmdldCggJ2lkJyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pO1xuXG5Hb29nbGVQcm92aWRlclZpZXcuYWRkRm9udFRvUGFnZSA9IGFkZEZvbnRUb1BhZ2U7XG5cbmFwaS5KZXRwYWNrRm9udHMucHJvdmlkZXJWaWV3cy5nb29nbGUgPSBHb29nbGVQcm92aWRlclZpZXc7XG5cbm1vZHVsZS5leHBvcnRzID0gR29vZ2xlUHJvdmlkZXJWaWV3O1xuIiwidmFyIERyb3Bkb3duQ3VycmVudFRlbXBsYXRlID0gcmVxdWlyZSggJy4uL3ZpZXdzL2Ryb3Bkb3duLWN1cnJlbnQtdGVtcGxhdGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25DdXJyZW50VGVtcGxhdGUuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2N1cnJlbnQtZm9udC1zaXplIGZvbnQtcHJvcGVydHktY29udHJvbC1jdXJyZW50JyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIG9wdHMpO1xuXHRcdHRoaXMuY3VycmVudEZvbnRTaXplID0gb3B0cy5jdXJyZW50Rm9udFNpemU7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLmN1cnJlbnRGb250U2l6ZSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBEcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19jdXJyZW50LWZvbnQtdmFyaWFudCBmb250LXByb3BlcnR5LWNvbnRyb2wtY3VycmVudCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25DdXJyZW50VGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBvcHRzKTtcblx0XHR0aGlzLmN1cnJlbnRGb250VmFyaWFudCA9IG9wdHMuY3VycmVudEZvbnRWYXJpYW50O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgZGVidWcgPSByZXF1aXJlKCAnZGVidWcnICkoICdqZXRwYWNrLWZvbnRzJyApO1xuXG52YXIgZ2V0Vmlld0ZvclByb3ZpZGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvcHJvdmlkZXItdmlld3MnICkuZ2V0Vmlld0ZvclByb3ZpZGVyLFxuXHREcm9wZG93bkN1cnJlbnRUZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi1jdXJyZW50LXRlbXBsYXRlJyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19jdXJyZW50X2ZvbnQnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duQ3VycmVudFRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgb3B0cyk7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMucHJvdmlkZXJWaWV3ICkge1xuXHRcdFx0dGhpcy5wcm92aWRlclZpZXcucmVtb3ZlKCk7XG5cdFx0fVxuXHRcdHRoaXMuJGVsLnRleHQoICcnICk7XG5cdFx0dmFyIFByb3ZpZGVyVmlldyA9IGdldFZpZXdGb3JQcm92aWRlciggdGhpcy5jdXJyZW50Rm9udC5nZXQoICdwcm92aWRlcicgKSApO1xuXHRcdGlmICggISBQcm92aWRlclZpZXcgKSB7XG5cdFx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBjdXJyZW50Rm9udCB3aXRoIG5vIHByb3ZpZGVyVmlldyBmb3InLCB0aGlzLmN1cnJlbnRGb250LnRvSlNPTigpICk7XG5cdFx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLmN1cnJlbnRGb250LmdldCggJ25hbWUnICkgKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0XHRkZWJ1ZyggJ3JlbmRlcmluZyBwcm92aWRlclZpZXcgZm9yJywgdGhpcy5jdXJyZW50Rm9udC50b0pTT04oKSApO1xuXHRcdHRoaXMucHJvdmlkZXJWaWV3ID0gbmV3IFByb3ZpZGVyVmlldyh7XG5cdFx0XHRtb2RlbDogdGhpcy5jdXJyZW50Rm9udCxcblx0XHRcdHR5cGU6IHRoaXMudHlwZVxuXHRcdH0pO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggdGhpcy5wcm92aWRlclZpZXcucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEVtaXR0ZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9lbWl0dGVyJyApO1xuXG52YXIgRGVmYXVsdEZvbnQgPSByZXF1aXJlKCAnLi4vbW9kZWxzL2RlZmF1bHQtZm9udCcgKTtcblxuLy8gJ3gnIGJ1dHRvbiB0aGF0IHJlc2V0cyBmb250IHRvIGRlZmF1bHRcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19kZWZhdWx0X2J1dHRvbicsXG5cdHRhZ05hbWU6ICdzcGFuJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAncmVzZXRUb0RlZmF1bHQnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMuY3VycmVudEZvbnQsICdjaGFuZ2UnLCB0aGlzLnJlbmRlciApO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJ3gnICk7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250LmlkICYmIHRoaXMuY3VycmVudEZvbnQuaWQgIT09ICdqZXRwYWNrLWRlZmF1bHQtdGhlbWUtZm9udCcgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2FjdGl2ZS1idXR0b24nICk7XG5cdFx0XHR0aGlzLiRlbC5zaG93KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuJGVsLnJlbW92ZUNsYXNzKCAnYWN0aXZlLWJ1dHRvbicgKTtcblx0XHRcdHRoaXMuJGVsLmhpZGUoKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVzZXRUb0RlZmF1bHQ6IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ2NoYW5nZS1mb250JywgeyBmb250OiBuZXcgRGVmYXVsdEZvbnQoKSwgdHlwZTogdGhpcy50eXBlIH0gKTtcblx0fVxufSk7XG5cbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRldmVudHM6IHtcblx0XHQnY2xpY2snOiAndG9nZ2xlRHJvcGRvd24nXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMubWVudSA9IG9wdHMubWVudTtcblx0fSxcblxuXHR0b2dnbGVEcm9wZG93bjogZnVuY3Rpb24oIGUgKSB7XG5cdFx0aWYgKCBlICkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAndG9nZ2xlLWRyb3Bkb3duJywgeyB0eXBlOiB0aGlzLnR5cGUsIG1lbnU6IHRoaXMubWVudSB9ICk7XG5cdH1cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbi8vIEFuIGluZGl2aWR1YWwgZm9udCBpbiB0aGUgZHJvcGRvd24gbGlzdCwgZXhwb3J0ZWQgYXNcbi8vIGBhcGkuSmV0cGFja0ZvbnRzLlByb3ZpZGVyVmlld2AuIEV4dGVuZCB0aGlzIG9iamVjdCBmb3IgZWFjaCBwcm92aWRlci4gVGhlXG4vLyBleHRlbmRlZCBvYmplY3RzIG5lZWQgdG8gZGVmaW5lIGEgYHJlbmRlcmAgbWV0aG9kIHRvIHJlbmRlciB0aGVpciBwcm92aWRlcidzXG4vLyBmb250IG5hbWUsIGFzIHdlbGwgYXMgYW4gYGFkZEZvbnRUb1BhZ2VgIG1ldGhvZCBvbiB0aGUgb2JqZWN0IGl0c2VsZi5cbnZhciBQcm92aWRlclZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX29wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJyA6ICdmb250Q2hhbmdlZCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0aWYgKCB0aGlzLmN1cnJlbnRGb250ICkge1xuXHRcdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIFdhcm5pbmc6IHRoaXMgc2hvdWxkIGJlIG92ZXJyaWRlbiBpbiB0aGUgcHJvdmlkZXJcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLm1vZGVsLmdldCggJ25hbWUnICkgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRmb250Q2hhbmdlZDogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2hhbmdlLWZvbnQnLCB7IGZvbnQ6IHRoaXMubW9kZWwsIHR5cGU6IHRoaXMudHlwZSB9ICk7XG5cdH1cbn0pO1xuXG5Qcm92aWRlclZpZXcuYWRkRm9udFRvUGFnZSA9IGZ1bmN0aW9uKCkge307XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvdmlkZXJWaWV3O1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLm1lbnUgPSBvcHRzLm1lbnU7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ2Nsb3NlLW9wZW4tbWVudXMnLCB0aGlzLmNsb3NlICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ3RvZ2dsZS1kcm9wZG93bicsIHRoaXMudG9nZ2xlICk7XG5cdH0sXG5cblx0dG9nZ2xlOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRpZiAoIGRhdGEudHlwZSAhPT0gdGhpcy50eXBlIHx8IGRhdGEubWVudSAhPT0gdGhpcy5tZW51ICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAoIHRoaXMuaXNPcGVuICkge1xuXHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLm9wZW4oKTtcblx0XHR9XG5cdH0sXG5cblx0b3BlbjogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ29wZW4nICk7XG5cdFx0dGhpcy5pc09wZW4gPSB0cnVlO1xuXHR9LFxuXG5cdGNsb3NlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5yZW1vdmVDbGFzcyggJ29wZW4nICk7XG5cdFx0dGhpcy5pc09wZW4gPSBmYWxzZTtcblx0fVxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBGb250RHJvcGRvd24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1kcm9wZG93bicgKSxcblx0Q3VycmVudEZvbnQgPSByZXF1aXJlKCAnLi4vdmlld3MvY3VycmVudC1mb250JyApLFxuXHREZWZhdWx0Rm9udEJ1dHRvbiA9IHJlcXVpcmUoICcuLi92aWV3cy9kZWZhdWx0LWZvbnQtYnV0dG9uJyApLFxuXHRGb250VmFyaWFudENvbnRyb2wgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC12YXJpYW50LWNvbnRyb2wnICksXG5cdEZvbnRTaXplQ29udHJvbCA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtY29udHJvbCcgKTtcblxuLy8gQ29udGFpbmVyIGZvciB0aGUgbGlzdCBvZiBhdmFpbGFibGUgZm9udHMgYW5kICd4JyBidXR0b25cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19tZW51X2NvbnRhaW5lcicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMubWVudSA9ICdmb250RmFtaWx5Jztcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEN1cnJlbnRGb250KHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdGN1cnJlbnRGb250OiB0aGlzLm1vZGVsXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250RHJvcGRvd24oe1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWwsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRGVmYXVsdEZvbnRCdXR0b24oe1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWxcblx0XHR9KS5yZW5kZXIoKS5lbCApO1xuXHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRTaXplQ29udHJvbCh7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRjdXJyZW50Rm9udDogdGhpcy5tb2RlbCxcblx0XHRcdGZvbnREYXRhOiB0aGlzLmZvbnREYXRhXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250VmFyaWFudENvbnRyb2woe1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMubW9kZWwsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pO1xuIiwidmFyIGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250cycgKTtcblxudmFyIGdldFdpZG93SGVpZ2h0ID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvd2luZG93LW1lYXN1cmVzJyApLmdldFdpZG93SGVpZ2h0LFxuXHRnZXRWaWV3Rm9yUHJvdmlkZXIgPSByZXF1aXJlKCAnLi4vaGVscGVycy9wcm92aWRlci12aWV3cycgKS5nZXRWaWV3Rm9yUHJvdmlkZXIsXG5cdERyb3Bkb3duVGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tdGVtcGxhdGUnICk7XG5cblxuLy8gRHJvcGRvd24gb2YgYXZhaWxhYmxlIGZvbnRzXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duVGVtcGxhdGUuZXh0ZW5kKHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fbWVudScsXG5cdGlkOiAnZm9udC1zZWxlY3QnLFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdERyb3Bkb3duVGVtcGxhdGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCggdGhpcywgb3B0cyApO1xuXHRcdHRoaXMuZm9udERhdGEgPSBvcHRzLmZvbnREYXRhO1xuXHRcdHRoaXMuY3VycmVudEZvbnQgPSBvcHRzLmN1cnJlbnRGb250O1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5mb250RGF0YS5lYWNoKCBmdW5jdGlvbiggZm9udCApIHtcblx0XHRcdHZhciBQcm92aWRlclZpZXcgPSBnZXRWaWV3Rm9yUHJvdmlkZXIoIGZvbnQuZ2V0KCAncHJvdmlkZXInICkgKTtcblx0XHRcdGlmICggISBQcm92aWRlclZpZXcgKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGRlYnVnKCAncmVuZGVyaW5nIHByb3ZpZGVyVmlldyBpbiBmb250IGxpc3QgZm9yJywgZm9udC50b0pTT04oKSApO1xuXHRcdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgUHJvdmlkZXJWaWV3KHtcblx0XHRcdFx0bW9kZWw6IGZvbnQsXG5cdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuY3VycmVudEZvbnRcblx0XHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0fSwgdGhpcyApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0b3BlbjogZnVuY3Rpb24oKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUub3Blbi5jYWxsKHRoaXMpO1xuXHRcdHRoaXMuc2NyZWVuRml0KCk7XG5cdH0sXG5cblx0c2NyZWVuRml0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgcGFkZGluZywgY29udHJvbHNIZWlnaHQsIG9mZnNldCwgc2Nyb2xsSGVpZ2h0LCBhbGxvd2FibGVIZWlnaHQsIHRvcE9mZnNldDtcblx0XHQvLyByZXNldCBoZWlnaHQvdG9wIGluIGNhc2UgaXQncyBiZWVuIHNldCBwcmV2aW91c2x5IGFuZCB0aGUgdmlld3BvcnQgaGFzIGNoYW5nZWRcblx0XHQvLyB3ZSdyZSBub3QgZ29pbmcgdG8gYXNzaWduIGEgd2luZG93LnJlc2l6ZSBsaXN0ZW5lciBiZWNhdXNlIGl0J3MgYW4gZWRnZSBjYXNlIGFuZFxuXHRcdC8vIHJlc2l6ZSBoYW5kbGVycyBzaG91bGQgYmUgYXZvaWRlZCB3aGVyZSBwb3NzaWJsZVxuXHRcdHRoaXMuJGVsLmNzcyh7IGhlaWdodDogJycsIHRvcDogJycgfSk7XG5cblx0XHRwYWRkaW5nID0gMjA7XG5cdFx0Y29udHJvbHNIZWlnaHQgPSBnZXRXaWRvd0hlaWdodCgpO1xuXHRcdG9mZnNldCA9IHRoaXMuJGVsLm9mZnNldCgpO1xuXHRcdHNjcm9sbEhlaWdodCA9IHRoaXMuJGVsLmhlaWdodCgpO1xuXHRcdGlmICggcGFkZGluZyArIG9mZnNldC50b3AgKyBzY3JvbGxIZWlnaHQgPD0gY29udHJvbHNIZWlnaHQgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGFsbG93YWJsZUhlaWdodCA9IGNvbnRyb2xzSGVpZ2h0IC0gKCBwYWRkaW5nICogMiApO1xuXHRcdC8vIFx0Ly8gbGV0J3Mgc2VlIGlmIHdlIGNhbiBqdXN0IHNoaWZ0IGl0IHVwIGEgYml0XG5cdFx0aWYgKCBzY3JvbGxIZWlnaHQgPD0gYWxsb3dhYmxlSGVpZ2h0ICkge1xuXHRcdFx0dG9wT2Zmc2V0ID0gYWxsb3dhYmxlSGVpZ2h0IC0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0LnRvcDtcblx0XHRcdHRoaXMuJGVsLmNzcyggJ3RvcCcsIHRvcE9mZnNldCApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHQvLyBpdCdzIHRvbyBiaWdcblx0XHR0b3BPZmZzZXQgPSBwYWRkaW5nIC0gb2Zmc2V0LnRvcDtcblx0XHR0aGlzLiRlbC5jc3Moe1xuXHRcdFx0dG9wOiB0b3BPZmZzZXQgKyAxMTAsIC8vIDExMCA9PSBvZmZzZXQgZnJvbSB0b3Agb2YgY3VzdG9taXplciBlbGVtZW50cy5cblx0XHRcdGhlaWdodDogYWxsb3dhYmxlSGVpZ2h0IC0gMTQ1IC8vIDE0NSA9PSBhYm92ZSBvZmZzZXQgcGx1cyB0aGUgY29sbGFwc2UgZWxlbWVudFxuXHRcdH0pO1xuXHR9XG59KTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRm9udFNpemVEcm9wZG93biA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXNpemUtZHJvcGRvd24nICksXG5DdXJyZW50Rm9udFNpemUgPSByZXF1aXJlKCAnLi4vdmlld3MvY3VycmVudC1mb250LXNpemUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC1zaXplLWNvbnRyb2wgZm9udC1wcm9wZXJ0eS1jb250cm9sJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLm1lbnUgPSAnZm9udFNpemUnO1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmZvbnREYXRhID0gb3B0cy5mb250RGF0YTtcblx0XHR0aGlzLmN1cnJlbnRGb250ID0gb3B0cy5jdXJyZW50Rm9udDtcblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLmN1cnJlbnRGb250LCAnY2hhbmdlJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHRnZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmZvbnREYXRhLmZpbmRXaGVyZSggeyBuYW1lOiB0aGlzLmN1cnJlbnRGb250LmdldCggJ25hbWUnICkgfSApO1xuXHRcdGlmICggIXNlbGVjdGVkQXZhaWxhYmxlRm9udCApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0fSxcblxuXHRnZXRDdXJyZW50Rm9udFNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpO1xuXHRcdGlmICggc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0dmFyIHNpemUgPSB0aGlzLmN1cnJlbnRGb250LmdldCggJ3NpemUnICk7XG5cdFx0XHRpZiAoIHNpemUgJiYgc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRTaXplTmFtZUZyb21JZCggc2l6ZSApICkge1xuXHRcdFx0XHRyZXR1cm4gc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRTaXplTmFtZUZyb21JZCggc2l6ZSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuICdOb3JtYWwgU2l6ZSc7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJycgKTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBDdXJyZW50Rm9udFNpemUoIHtcblx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdG1lbnU6IHRoaXMubWVudSxcblx0XHRcdGN1cnJlbnRGb250U2l6ZTogdGhpcy5nZXRDdXJyZW50Rm9udFNpemUoKVxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udFNpemVEcm9wZG93bigge1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bWVudTogdGhpcy5tZW51LFxuXHRcdFx0c2VsZWN0ZWRBdmFpbGFibGVGb250OiB0aGlzLmdldFNlbGVjdGVkQXZhaWxhYmxlRm9udCgpLFxuXHRcdFx0Y3VycmVudEZvbnRTaXplOiB0aGlzLmdldEN1cnJlbnRGb250U2l6ZSgpXG5cdFx0fSkucmVuZGVyKCkuZWwgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59ICk7XG4iLCJ2YXIgRm9udFNpemVPcHRpb24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC1zaXplLW9wdGlvbicgKSxcbkRyb3Bkb3duVGVtcGxhdGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZHJvcGRvd24tdGVtcGxhdGUnICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25UZW1wbGF0ZS5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC1zaXplLWRyb3Bkb3duIGZvbnQtcHJvcGVydHktY29udHJvbC1kcm9wZG93bicsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0RHJvcGRvd25UZW1wbGF0ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKCB0aGlzLCBvcHRzICk7XG5cdFx0dGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgPSBvcHRzLnNlbGVjdGVkQXZhaWxhYmxlRm9udDtcblx0XHR0aGlzLmN1cnJlbnRGb250U2l6ZSA9IG9wdHMuY3VycmVudEZvbnRTaXplO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggJycgKTtcblx0XHRpZiAoIHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250ICkge1xuXHRcdFx0dmFyIHNpemVPcHRpb25zID0gdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQuZ2V0Rm9udFNpemVPcHRpb25zKCk7XG5cdFx0XHRzaXplT3B0aW9ucy5mb3JFYWNoKCBmdW5jdGlvbiggb3B0aW9uICkge1xuXHRcdFx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250U2l6ZU9wdGlvbigge1xuXHRcdFx0XHRcdHR5cGU6IHRoaXMudHlwZSxcblx0XHRcdFx0XHRpZDogb3B0aW9uLmlkLFxuXHRcdFx0XHRcdG5hbWU6IG9wdGlvbi5uYW1lLFxuXHRcdFx0XHRcdGN1cnJlbnRGb250U2l6ZTogdGhpcy5jdXJyZW50Rm9udFNpemVcblx0XHRcdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0XHR9LmJpbmQodGhpcykgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXNpemUtb3B0aW9uIGpldHBhY2stZm9udHNfX2ZvbnQtcHJvcGVydHktb3B0aW9uJyxcblxuXHRldmVudHM6IHtcblx0XHQnY2xpY2snIDogJ3NldFNpemVPcHRpb24nXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy50eXBlID0gb3B0cy50eXBlO1xuXHRcdHRoaXMuaWQgPSBvcHRzLmlkO1xuXHRcdHRoaXMubmFtZSA9IG9wdHMubmFtZTtcblx0XHR0aGlzLmN1cnJlbnRGb250U2l6ZSA9IG9wdHMuY3VycmVudEZvbnRTaXplO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy5uYW1lICk7XG5cdFx0dGhpcy4kZWwuYXR0ciggJ2RhdGEtbmFtZScsIHRoaXMubmFtZSApO1xuXHRcdGlmICggdGhpcy5jdXJyZW50Rm9udFNpemUgPT09IHRoaXMubmFtZSApIHtcblx0XHRcdHRoaXMuJGVsLmFkZENsYXNzKCAnY3VycmVudCcgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0c2V0U2l6ZU9wdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnc2V0LXNpemUnLCB7IHNpemU6IHRoaXMuaWQsIHR5cGU6IHRoaXMudHlwZSB9ICk7XG5cdH1cblxufSApO1xuIiwidmFyIEJhY2tib25lID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYmFja2JvbmUnICk7XG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvZW1pdHRlcicgKTtcblxudmFyIEZvbnRDb250cm9sID0gcmVxdWlyZSggJy4uL3ZpZXdzL2ZvbnQtY29udHJvbCcgKTtcblxuLy8gQSBmb250IGNvbnRyb2wgVmlldyBmb3IgYSBwYXJ0aWN1bGFyIHNldHRpbmcgdHlwZVxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX3R5cGUnLFxuXG5cdGV2ZW50czoge1xuXHRcdCdjbGljaycgOiAnY2xvc2VNZW51cydcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5hcHBlbmQoICc8ZGl2IGNsYXNzPVwiamV0cGFjay1mb250c19fdHlwZVwiIGRhdGEtZm9udC10eXBlPVwiJyArIHRoaXMudHlwZS5pZCArICdcIj48aDMgY2xhc3M9XCJqZXRwYWNrLWZvbnRzX190eXBlLWhlYWRlclwiPicgKyB0aGlzLnR5cGUubmFtZSArICAnPC9oMz48L2Rpdj4nICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCBuZXcgRm9udENvbnRyb2woe1xuXHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0bW9kZWw6IHRoaXMuY3VycmVudEZvbnQsXG5cdFx0XHRmb250RGF0YTogdGhpcy5mb250RGF0YVxuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0Y2xvc2VNZW51czogZnVuY3Rpb24oKSB7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fVxufSk7XG4iLCJ2YXIgQmFja2JvbmUgPSByZXF1aXJlKCAnLi4vaGVscGVycy9iYWNrYm9uZScgKTtcblxudmFyIEZvbnRWYXJpYW50RHJvcGRvd24gPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC12YXJpYW50LWRyb3Bkb3duJyApLFxuQ3VycmVudEZvbnRWYXJpYW50ID0gcmVxdWlyZSggJy4uL3ZpZXdzL2N1cnJlbnQtZm9udC12YXJpYW50JyApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKCB7XG5cdGNsYXNzTmFtZTogJ2pldHBhY2stZm9udHNfX2ZvbnQtdmFyaWFudC1jb250cm9sIGZvbnQtcHJvcGVydHktY29udHJvbCcsXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oIG9wdHMgKSB7XG5cdFx0dGhpcy5tZW51ID0gJ2ZvbnRWYXJpYW50Jztcblx0XHR0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG5cdFx0dGhpcy5mb250RGF0YSA9IG9wdHMuZm9udERhdGE7XG5cdFx0dGhpcy5jdXJyZW50Rm9udCA9IG9wdHMuY3VycmVudEZvbnQ7XG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5jdXJyZW50Rm9udCwgJ2NoYW5nZScsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cblx0Z2V0U2VsZWN0ZWRBdmFpbGFibGVGb250OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5mb250RGF0YS5maW5kV2hlcmUoIHsgbmFtZTogdGhpcy5jdXJyZW50Rm9udC5nZXQoICduYW1lJyApIH0gKTtcblx0XHRpZiAoICFzZWxlY3RlZEF2YWlsYWJsZUZvbnQgKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiBzZWxlY3RlZEF2YWlsYWJsZUZvbnQ7XG5cdH0sXG5cblx0Z2V0Q3VycmVudEZvbnRWYXJpYW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZWN0ZWRBdmFpbGFibGVGb250ID0gdGhpcy5nZXRTZWxlY3RlZEF2YWlsYWJsZUZvbnQoKTtcblx0XHRpZiAoIHNlbGVjdGVkQXZhaWxhYmxlRm9udCAmJiB0aGlzLnR5cGUuZnZkQWRqdXN0ICkge1xuXHRcdFx0dmFyIGZ2ZHMgPSB0aGlzLmN1cnJlbnRGb250LmdldCggJ2Z2ZHMnICk7XG5cdFx0XHRpZiAoIGZ2ZHMgJiYgT2JqZWN0LmtleXMoZnZkcykubGVuZ3RoID09PSAxICkge1xuXHRcdFx0XHRyZXR1cm4gc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRWYXJpYW50TmFtZUZyb21JZCggZnZkc1swXSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuICdSZWd1bGFyJztcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRWaWV3ICkge1xuXHRcdFx0dGhpcy5jdXJyZW50Rm9udFZpZXcucmVtb3ZlKCk7XG5cdFx0fVxuXHRcdGlmICggdGhpcy5kcm9wRG93blZpZXcgKSB7XG5cdFx0XHR0aGlzLmRyb3BEb3duVmlldy5yZW1vdmUoKTtcblx0XHR9XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZpZXcgPSBuZXcgQ3VycmVudEZvbnRWYXJpYW50KCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRjdXJyZW50Rm9udFZhcmlhbnQ6IHRoaXMuZ2V0Q3VycmVudEZvbnRWYXJpYW50KClcblx0XHR9KTtcblx0XHR0aGlzLmRyb3BEb3duVmlldyA9IG5ldyBGb250VmFyaWFudERyb3Bkb3duKCB7XG5cdFx0XHR0eXBlOiB0aGlzLnR5cGUsXG5cdFx0XHRtZW51OiB0aGlzLm1lbnUsXG5cdFx0XHRzZWxlY3RlZEF2YWlsYWJsZUZvbnQ6IHRoaXMuZ2V0U2VsZWN0ZWRBdmFpbGFibGVGb250KCksXG5cdFx0XHRjdXJyZW50Rm9udFZhcmlhbnQ6IHRoaXMuZ2V0Q3VycmVudEZvbnRWYXJpYW50KClcblx0XHR9KTtcblx0XHR0aGlzLiRlbC5hcHBlbmQoIHRoaXMuY3VycmVudEZvbnRWaWV3LnJlbmRlcigpLmVsICk7XG5cdFx0dGhpcy4kZWwuYXBwZW5kKCB0aGlzLmRyb3BEb3duVmlldy5yZW5kZXIoKS5lbCApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBGb250VmFyaWFudE9wdGlvbiA9IHJlcXVpcmUoICcuLi92aWV3cy9mb250LXZhcmlhbnQtb3B0aW9uJyApLFxuRHJvcGRvd25UZW1wbGF0ZSA9IHJlcXVpcmUoICcuLi92aWV3cy9kcm9wZG93bi10ZW1wbGF0ZScgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93blRlbXBsYXRlLmV4dGVuZCgge1xuXHRjbGFzc05hbWU6ICdqZXRwYWNrLWZvbnRzX19mb250LXZhcmlhbnQtZHJvcGRvd24gZm9udC1wcm9wZXJ0eS1jb250cm9sLWRyb3Bkb3duJyxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiggb3B0cyApIHtcblx0XHREcm9wZG93blRlbXBsYXRlLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwoIHRoaXMsIG9wdHMgKTtcblx0XHR0aGlzLnNlbGVjdGVkQXZhaWxhYmxlRm9udCA9IG9wdHMuc2VsZWN0ZWRBdmFpbGFibGVGb250O1xuXHRcdHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID0gb3B0cy5jdXJyZW50Rm9udFZhcmlhbnQ7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRlbC5odG1sKCAnJyApO1xuXHRcdGlmICggdGhpcy5zZWxlY3RlZEF2YWlsYWJsZUZvbnQgJiYgdGhpcy50eXBlLmZ2ZEFkanVzdCApIHtcblx0XHRcdHZhciB2YXJpYW50T3B0aW9ucyA9IHRoaXMuc2VsZWN0ZWRBdmFpbGFibGVGb250LmdldEZvbnRWYXJpYW50T3B0aW9ucygpO1xuXHRcdFx0Zm9yICggdmFyIGsgaW4gdmFyaWFudE9wdGlvbnMgKSB7XG5cdFx0XHRcdHRoaXMuJGVsLmFwcGVuZCggbmV3IEZvbnRWYXJpYW50T3B0aW9uKCB7XG5cdFx0XHRcdFx0dHlwZTogdGhpcy50eXBlLFxuXHRcdFx0XHRcdGlkOiBrLFxuXHRcdFx0XHRcdG5hbWU6IHZhcmlhbnRPcHRpb25zW2tdLFxuXHRcdFx0XHRcdGN1cnJlbnRGb250VmFyaWFudDogdGhpcy5jdXJyZW50Rm9udFZhcmlhbnRcblx0XHRcdFx0fSApLnJlbmRlcigpLmVsICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoIHtcblx0Y2xhc3NOYW1lOiAnamV0cGFjay1mb250c19fZm9udC12YXJpYW50LW9wdGlvbiBqZXRwYWNrLWZvbnRzX19mb250LXByb3BlcnR5LW9wdGlvbicsXG5cblx0ZXZlbnRzOiB7XG5cdFx0J2NsaWNrJyA6ICdzZXRWYXJpYW50T3B0aW9uJ1xuXHR9LFxuXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCBvcHRzICkge1xuXHRcdHRoaXMudHlwZSA9IG9wdHMudHlwZTtcblx0XHR0aGlzLmlkID0gb3B0cy5pZDtcblx0XHR0aGlzLm5hbWUgPSBvcHRzLm5hbWU7XG5cdFx0dGhpcy5jdXJyZW50Rm9udFZhcmlhbnQgPSBvcHRzLmN1cnJlbnRGb250VmFyaWFudDtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMubmFtZSApO1xuXHRcdHRoaXMuJGVsLmRhdGEoICdpZCcsIHRoaXMuaWQgKTtcblx0XHRpZiAoIHRoaXMuY3VycmVudEZvbnRWYXJpYW50ID09PSB0aGlzLm5hbWUgKSB7XG5cdFx0XHR0aGlzLiRlbC5hZGRDbGFzcyggJ2N1cnJlbnQnICk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHNldFZhcmlhbnRPcHRpb246IGZ1bmN0aW9uKCkge1xuXHRcdEVtaXR0ZXIudHJpZ2dlciggJ3NldC12YXJpYW50JywgeyB2YXJpYW50OiB0aGlzLmlkLCB0eXBlOiB0aGlzLnR5cGUgfSApO1xuXHR9XG5cbn0gKTtcbiIsInZhciBCYWNrYm9uZSA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2JhY2tib25lJyApO1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoICcuLi9oZWxwZXJzL2VtaXR0ZXInICksXG5cdGRlYnVnID0gcmVxdWlyZSggJ2RlYnVnJyApKCAnamV0cGFjay1mb250cycgKSxcblx0YXZhaWxhYmxlRm9udHMgPSByZXF1aXJlKCAnLi4vaGVscGVycy9hdmFpbGFibGUtZm9udHMnICksXG5cdGF2YWlsYWJsZVR5cGVzID0gcmVxdWlyZSggJy4uL2hlbHBlcnMvYXZhaWxhYmxlLXR5cGVzJyApO1xuXG52YXIgRm9udFR5cGUgPSByZXF1aXJlKCAnLi4vdmlld3MvZm9udC10eXBlJyApLFxuXHRBdmFpbGFibGVGb250cyA9IHJlcXVpcmUoICcuLi9jb2xsZWN0aW9ucy9hdmFpbGFibGUtZm9udHMnICk7XG5cbi8vIEluaXRpYWxpemUgdGhlIGRlZmF1bHQgUHJvdmlkZXIgVmlld3NcbnJlcXVpcmUoICcuLi9wcm92aWRlcnMvZ29vZ2xlJyApO1xuXG4vLyBUaGUgbWFpbiBmb250IGNvbnRyb2wgVmlldywgY29udGFpbmluZyBzZWN0aW9ucyBmb3IgZWFjaCBzZXR0aW5nIHR5cGVcbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRkZWJ1ZyggJ2luaXQgd2l0aCBjdXJyZW50bHkgc2VsZWN0ZWQgZm9udHM6JywgdGhpcy5jb2xsZWN0aW9uLnRvSlNPTigpICk7XG5cdFx0dGhpcy5oZWFkaW5nRm9udHMgPSBuZXcgQXZhaWxhYmxlRm9udHMoIGF2YWlsYWJsZUZvbnRzICk7XG5cdFx0dGhpcy5ib2R5Rm9udHMgPSBuZXcgQXZhaWxhYmxlRm9udHMoIHRoaXMuaGVhZGluZ0ZvbnRzLndoZXJlKCB7IGJvZHlUZXh0OiB0cnVlIH0gKSApO1xuXHRcdHRoaXMubGlzdGVuVG8oIEVtaXR0ZXIsICdjaGFuZ2UtZm9udCcsIHRoaXMudXBkYXRlQ3VycmVudEZvbnQgKTtcblx0XHR0aGlzLmxpc3RlblRvKCBFbWl0dGVyLCAnc2V0LXZhcmlhbnQnLCB0aGlzLnNldEZvbnRWYXJpYW50ICk7XG5cdFx0dGhpcy5saXN0ZW5UbyggRW1pdHRlciwgJ3NldC1zaXplJywgdGhpcy5zZXRGb250U2l6ZSApO1xuXHR9LFxuXG5cdHNldEZvbnRWYXJpYW50OiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHR2YXIgbW9kZWwgPSB0aGlzLmZpbmRNb2RlbFdpdGhUeXBlKCBkYXRhLnR5cGUgKTtcblx0XHRtb2RlbC5zZXQoICdmdmRzJywgW2RhdGEudmFyaWFudF0gKTtcblx0XHRFbWl0dGVyLnRyaWdnZXIoICdjbG9zZS1vcGVuLW1lbnVzJyApO1xuXHR9LFxuXG5cdHNldEZvbnRTaXplOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHR2YXIgbW9kZWwgPSB0aGlzLmZpbmRNb2RlbFdpdGhUeXBlKCBkYXRhLnR5cGUgKTtcblx0XHRtb2RlbC5zZXQoICdzaXplJywgZGF0YS5zaXplICk7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHR1cGRhdGVDdXJyZW50Rm9udDogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0dmFyIG1vZGVsID0gdGhpcy5maW5kTW9kZWxXaXRoVHlwZSggZGF0YS50eXBlICk7XG5cdFx0bW9kZWwuc2V0KCBkYXRhLmZvbnQuYXR0cmlidXRlcyApO1xuXHRcdG1vZGVsLnVuc2V0KCAnc2l6ZScgKTtcblx0XHRkZWJ1ZyggJ3VwZGF0ZUN1cnJlbnRGb250IHdpdGgnLCBkYXRhLmZvbnQudG9KU09OKCksICd0bycsIG1vZGVsLnRvSlNPTigpICk7XG5cdFx0RW1pdHRlci50cmlnZ2VyKCAnY2xvc2Utb3Blbi1tZW51cycgKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGVsLnRleHQoICcnICk7IC8vIFRPRE86IGJldHRlciB0byB1cGRhdGUgZWFjaCBWaWV3IHRoYW4gb3ZlcndyaXRlXG5cdFx0ZGVidWcoICdyZW5kZXJpbmcgY29udHJvbHMgZm9yIGZvbnQgdHlwZXMnLCBhdmFpbGFibGVUeXBlcyApO1xuXHRcdGF2YWlsYWJsZVR5cGVzLmZvckVhY2goIHRoaXMucmVuZGVyVHlwZUNvbnRyb2wuYmluZCggdGhpcyApICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0cmVuZGVyVHlwZUNvbnRyb2w6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdHZhciBmb250cztcblx0XHRpZiAoIHR5cGUuYm9keVRleHQgPT09IHRydWUgKSB7XG5cdFx0XHRmb250cyA9IHRoaXMuYm9keUZvbnRzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb250cyA9IHRoaXMuaGVhZGluZ0ZvbnRzO1xuXHRcdH1cblx0XHR0aGlzLiRlbC5hcHBlbmQoIG5ldyBGb250VHlwZSh7XG5cdFx0XHR0eXBlOiB0eXBlLFxuXHRcdFx0Y3VycmVudEZvbnQ6IHRoaXMuZmluZE1vZGVsV2l0aFR5cGUoIHR5cGUgKSxcblx0XHRcdGZvbnREYXRhOiBmb250c1xuXHRcdH0pLnJlbmRlcigpLmVsICk7XG5cdH0sXG5cblx0ZmluZE1vZGVsV2l0aFR5cGU6IGZ1bmN0aW9uKCB0eXBlICkge1xuXHRcdHZhciBtb2RlbCA9IHRoaXMuY29sbGVjdGlvbi5maW5kKCBmdW5jdGlvbiggbW9kZWwgKSB7XG5cdFx0XHRyZXR1cm4gKCBtb2RlbC5nZXQoICd0eXBlJyApID09PSB0eXBlLmlkICk7XG5cdFx0fSApO1xuXHRcdGlmICggISBtb2RlbCApIHtcblx0XHRcdG1vZGVsID0gdGhpcy5jb2xsZWN0aW9uLmFkZCgge1xuXHRcdFx0XHR0eXBlOiB0eXBlLmlkLFxuXHRcdFx0XHRuYW1lOiAnRGVmYXVsdCBUaGVtZSBmb250J1xuXHRcdFx0fSApO1xuXHRcdH1cblx0XHRyZXR1cm4gbW9kZWw7XG5cdH1cbn0pO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICdsaWdodHNlYWdyZWVuJyxcbiAgJ2ZvcmVzdGdyZWVuJyxcbiAgJ2dvbGRlbnJvZCcsXG4gICdkb2RnZXJibHVlJyxcbiAgJ2RhcmtvcmNoaWQnLFxuICAnY3JpbXNvbidcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICByZXR1cm4gKCdXZWJraXRBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh3aW5kb3cuY29uc29sZSAmJiAoY29uc29sZS5maXJlYnVnIHx8IChjb25zb2xlLmV4Y2VwdGlvbiAmJiBjb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuIGFyZ3M7XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzID0gW2FyZ3NbMF0sIGMsICdjb2xvcjogaW5oZXJpdCddLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSk7XG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EteiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgsXG4gIC8vIHdoZXJlIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PSB0eXBlb2YgY29uc29sZVxuICAgICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBsb2NhbFN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbcHJldkNvbG9yKysgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICAvLyBkZWZpbmUgdGhlIGBkaXNhYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcbiAgfVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZW5hYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBlbmFibGVkKCkge1xuXG4gICAgdmFyIHNlbGYgPSBlbmFibGVkO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyBhZGQgdGhlIGBjb2xvcmAgaWYgbm90IHNldFxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gICAgaWYgKG51bGwgPT0gc2VsZi5jb2xvciAmJiBzZWxmLnVzZUNvbG9ycykgc2VsZi5jb2xvciA9IHNlbGVjdENvbG9yKCk7XG5cbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlb1xuICAgICAgYXJncyA9IFsnJW8nXS5jb25jYXQoYXJncyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EteiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5mb3JtYXRBcmdzKSB7XG4gICAgICBhcmdzID0gZXhwb3J0cy5mb3JtYXRBcmdzLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIH1cbiAgICB2YXIgbG9nRm4gPSBlbmFibGVkLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG4gIGVuYWJsZWQuZW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XG5cbiAgZm4ubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHkgPSBkICogMzY1LjI1O1xuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKXtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgdmFsKSByZXR1cm4gcGFyc2UodmFsKTtcbiAgcmV0dXJuIG9wdGlvbnMubG9uZ1xuICAgID8gbG9uZyh2YWwpXG4gICAgOiBzaG9ydCh2YWwpO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1zfHNlY29uZHM/fHN8bWludXRlcz98bXxob3Vycz98aHxkYXlzP3xkfHllYXJzP3x5KT8kL2kuZXhlYyhzdHIpO1xuICBpZiAoIW1hdGNoKSByZXR1cm47XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtO1xuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG47XG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzaG9ydChtcykge1xuICBpZiAobXMgPj0gZCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgaWYgKG1zID49IGgpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIGlmIChtcyA+PSBtKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICBpZiAobXMgPj0gcykgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpXG4gICAgfHwgcGx1cmFsKG1zLCBoLCAnaG91cicpXG4gICAgfHwgcGx1cmFsKG1zLCBtLCAnbWludXRlJylcbiAgICB8fCBwbHVyYWwobXMsIHMsICdzZWNvbmQnKVxuICAgIHx8IG1zICsgJyBtcyc7XG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XG4gIGlmIChtcyA8IG4pIHJldHVybjtcbiAgaWYgKG1zIDwgbiAqIDEuNSkgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncyc7XG59XG4iXX0=
