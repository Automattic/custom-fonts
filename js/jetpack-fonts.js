!function i(s,o,r){function a(t,e){if(!o[t]){if(!s[t]){var n="function"==typeof require&&require;if(!e&&n)return n(t,!0);if(l)return l(t,!0);throw(e=new Error("Cannot find module '"+t+"'")).code="MODULE_NOT_FOUND",e}n=o[t]={exports:{}},s[t][0].call(n.exports,function(e){return a(s[t][1][e]||e)},n,n.exports,i,s,o,r)}return o[t].exports}for(var l="function"==typeof require&&require,e=0;e<r.length;e++)a(r[e]);return a}({1:[function(e,t,s){function n(){var e;try{e=localStorage.debug}catch(e){}return e}(s=t.exports=e("./debug")).log=function(){return"object"==typeof console&&"function"==typeof console.log&&Function.prototype.apply.call(console.log,console,arguments)},s.formatArgs=function(){var t,n,e=arguments,i=this.useColors;return e[0]=(i?"%c":"")+this.namespace+(i?" %c":" ")+e[0]+(i?"%c ":" ")+"+"+s.humanize(this.diff),i&&(i="color: "+this.color,(e=[e[0],i,"color: inherit"].concat(Array.prototype.slice.call(e,1)))[n=t=0].replace(/%[a-z%]/g,function(e){"%%"!==e&&(t++,"%c"===e&&(n=t))}),e.splice(n,0,i)),e},s.save=function(e){try{null==e?localStorage.removeItem("debug"):localStorage.debug=e}catch(e){}},s.load=n,s.useColors=function(){return"WebkitAppearance"in document.documentElement.style||window.console&&(console.firebug||console.exception&&console.table)||navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&31<=parseInt(RegExp.$1,10)},s.colors=["lightseagreen","forestgreen","goldenrod","dodgerblue","darkorchid","crimson"],s.formatters.j=function(e){return JSON.stringify(e)},s.enable(n())},{"./debug":2}],2:[function(e,t,r){(r=t.exports=function(e){function t(){}function n(){var i=n,e=+new Date,t=e-(a||e),s=(i.diff=t,i.prev=a,i.curr=e,a=e,null==i.useColors&&(i.useColors=r.useColors()),null==i.color&&i.useColors&&(i.color=r.colors[l++%r.colors.length]),Array.prototype.slice.call(arguments)),o=(s[0]=r.coerce(s[0]),"string"!=typeof s[0]&&(s=["%o"].concat(s)),0);s[0]=s[0].replace(/%([a-z%])/g,function(e,t){var n;return"%%"!==e&&(o++,"function"==typeof(t=r.formatters[t])&&(n=s[o],e=t.call(i,n),s.splice(o,1),o--)),e}),"function"==typeof r.formatArgs&&(s=r.formatArgs.apply(i,s)),(n.log||r.log||console.log.bind(console)).apply(i,s)}t.enabled=!1,n.enabled=!0;var i=r.enabled(e)?n:t;return i.namespace=e,i}).coerce=function(e){return e instanceof Error?e.stack||e.message:e},r.disable=function(){r.enable("")},r.enable=function(e){r.save(e);for(var t=(e||"").split(/[\s,]+/),n=t.length,i=0;i<n;i++)t[i]&&("-"===(e=t[i].replace(/\*/g,".*?"))[0]?r.skips.push(new RegExp("^"+e.substr(1)+"$")):r.names.push(new RegExp("^"+e+"$")))},r.enabled=function(e){var t,n;for(t=0,n=r.skips.length;t<n;t++)if(r.skips[t].test(e))return!1;for(t=0,n=r.names.length;t<n;t++)if(r.names[t].test(e))return!0;return!1},r.humanize=e("ms"),r.names=[],r.skips=[],r.formatters={};var a,l=0},{ms:3}],3:[function(e,t,n){var s=36e5,o=864e5;function r(e,t,n){if(!(e<t))return e<1.5*t?Math.floor(e/t)+" "+n:Math.ceil(e/t)+" "+n+"s"}t.exports=function(e,t){t=t||{};var n=typeof e;if(!("string"==n&&0<e.length)){if("number"==n&&!1===isNaN(e))if(t.long)return r(n=e,o,"day")||r(n,s,"hour")||r(n,6e4,"minute")||r(n,1e3,"second")||n+" ms";else{t=e;return o<=t?Math.round(t/o)+"d":s<=t?Math.round(t/s)+"h":6e4<=t?Math.round(t/6e4)+"m":1e3<=t?Math.round(t/1e3)+"s":t+"ms"}throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))}n=e;if(!(100<(n=String(n)).length)){n=/^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(n);if(n){var i=parseFloat(n[1]);switch((n[2]||"ms").toLowerCase()){case"years":case"year":case"yrs":case"yr":case"y":return 315576e5*i;case"days":case"day":case"d":return i*o;case"hours":case"hour":case"hrs":case"hr":case"h":return i*s;case"minutes":case"minute":case"mins":case"min":case"m":return 6e4*i;case"seconds":case"second":case"secs":case"sec":case"s":return 1e3*i;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return i;default:return}}}}},{}],4:[function(e,t,n){var i=e("../helpers/backbone"),e=e("../models/available-font");t.exports=i.Collection.extend({model:e})},{"../helpers/backbone":8,"../models/available-font":18}],5:[function(e,t,n){t.exports=window.wp.customize},{}],6:[function(e,t,n){var e=e("../helpers/bootstrap"),i=[];e&&e.fonts&&(i=e.fonts),t.exports=i},{"../helpers/bootstrap":9}],7:[function(e,t,n){e=e("../helpers/bootstrap");var i=[];e&&e.types&&(i=(i=e.types.sort(function(e,t){return"headings"===e.id?-1:"headings"===t.id?1:0})).reduce(function(e,t){return"site-title"!==t.id&&e.push(t),e},[])),t.exports=i},{"../helpers/bootstrap":9}],8:[function(e,t,n){t.exports=Backbone},{}],9:[function(e,t,n){var i=window._JetpackFonts;t.exports=i},{}],10:[function(e,t,n){var i=e("../helpers/backbone"),e=e("../helpers/underscore");t.exports=e.extend(i.Events)},{"../helpers/backbone":8,"../helpers/underscore":14}],11:[function(e,t,n){var i="undefined"!=typeof window?window._JetpackFonts.fvdMap:{n1:"Thin",i1:"Thin Italic",o1:"Thin Oblique",n2:"Extra Light",i2:"Extra Light Italic",o2:"Extra Light Oblique",n3:"Light",i3:"Light Italic",o3:"Light Oblique",n4:"Regular",i4:"Italic",o4:"Oblique",n5:"Medium",i5:"Medium Italic",o5:"Medium Oblique",n6:"Semibold",i6:"Semibold Italic",o6:"Semibold Oblique",n7:"Bold",i7:"Bold Italic",o7:"Bold Oblique",n8:"Extra Bold",i8:"Extra Bold Italic",o8:"Extra Bold Oblique",n9:"Ultra Bold",i9:"Ultra Bold Italic",o9:"Ultra Bold Oblique"};t.exports={getFontVariantNameFromId:function(e){e=i[e];return e||"Regular"}}},{}],12:[function(e,t,n){var i=e("../helpers/api"),s=e("debug")("jetpack-fonts:provider-views"),e=e("../views/dropdown-item"),o=(i.JetpackFonts||(i.JetpackFonts={}),i.JetpackFonts.providerViews||(i.JetpackFonts.providerViews={}),i.JetpackFonts.ProviderView=e.extend({mouseenter:function(){},mouseleave:function(){}}),{});t.exports={getViewForProvider:function(e){return s("importing provider views from",i.JetpackFonts.providerViews),i.JetpackFonts.providerViews&&Object.keys(i.JetpackFonts.providerViews).forEach(function(e){o[e]=i.JetpackFonts.providerViews[e]}),o[e]?(s("found view for provider",e),o[e]):(s("no view found for provider",e),null)}}},{"../helpers/api":5,"../views/dropdown-item":28,debug:1}],13:[function(e,t,n){var i="undefined"!=typeof window?window._JetpackFonts.i18n:{};t.exports=function(e){return i[e]||e}},{}],14:[function(e,t,n){t.exports=_},{}],15:[function(e,t,n){t.exports=WebFont},{}],16:[function(e,t,n){var i=e("./helpers/api"),s=e("./views/master"),o=e("./models/selected-fonts");i.controlConstructor.jetpackFonts=i.Control.extend({ready:function(){this.selectedFonts=new o(this.setting()),this.selectedFonts.on("change",function(){this.setting(this.selectedFonts.toJSON())}.bind(this)),this.view=new s({selectedFonts:this.selectedFonts,el:this.container}).render(),i.section(this.section()).container.one("expanded",function(){setTimeout(this.view.loadFonts,200)}.bind(this)),i.section(this.section()).container.on("collapsed",function(){this.view.closeAllMenus()}.bind(this))}})},{"./helpers/api":5,"./models/selected-fonts":21,"./views/master":39}],17:[function(e,t,n){var i=e("../helpers/backbone"),s=e("debug")("jetpack-fonts:menu-view"),o=e("../helpers/emitter");function r(e){if((e=e.type&&e.type.id&&e.menu?e.type.id+":"+e.menu:e)!==this.menuKey)return this.closeMenu();this.openMenu()}function a(){s("opening menu",this.menuKey),this.menuStatus.set({isOpen:!0})}function l(){s("closing menu",this.menuKey),this.menuStatus.set({isOpen:!1})}t.exports=function(e){if(!e.listenTo)throw"menuViewMixin requires a Backbone View with the `listenTo` method";if(e.menuKey)return e.menuStatus||(e.menuStatus=new i.Model({isOpen:!1})),e.maybeOpenMenu=r,e.openMenu=a,e.closeMenu=l,e.listenTo(o,"open-menu",e.maybeOpenMenu),e.listenTo(o,"close-open-menus",e.closeMenu),s("added menu capability to the View",e.menuKey),e.menuStatus;throw"menuViewMixin requires a View with a `menuKey` string property to identify the menu"}},{"../helpers/backbone":8,"../helpers/emitter":10,debug:1}],18:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../helpers/underscore"),e=e("../helpers/translate"),o=[{id:-10,name:e("Tiny")},{id:-5,name:e("Small")},{id:0,name:e("Normal")},{id:5,name:e("Large")},{id:10,name:e("Huge")}];t.exports=i.Model.extend({getFontVariantOptions:function(){return this.get("fvds")?this.get("fvds"):[]},getFontSizeOptions:function(){return o},getFontSizeNameFromId:function(e){e=s.findWhere(o,{id:e});return!!e&&e.name}})},{"../helpers/backbone":8,"../helpers/translate":13,"../helpers/underscore":14}],19:[function(e,t,n){var i=e("../models/selected-font"),s=e("../helpers/translate");t.exports=i.extend({initialize:function(){this.set({id:"",displayName:s("Default Theme Font"),provider:""})}})},{"../helpers/translate":13,"../models/selected-font":20}],20:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../helpers/translate"),o=e("../helpers/available-types"),r=e("../helpers/underscore"),a=e("debug")("jetpack_fonts:selected-font");t.exports=i.Model.extend({initialize:function(){this.maybeSetCurrentFvd()},defaults:{displayName:s("Default Theme Font")},set:function(){i.Model.prototype.set.apply(this,arguments),this.maybeSetCurrentFvd()},maybeSetCurrentFvd:function(){var e;this.get("currentFvd")?a("Font already has an fvd",this.get("currentFvd")):this.get("id")&&(e=r.findWhere(o,{id:this.get("type")}))&&e.fvdAdjust&&this.get("fvds")&&(this.set("currentFvd",this.pickFvd()),a("Fvd now set to: ",this.get("currentFvd")))},pickFvd:function(){var e=this.get("fvds"),t=4;if(this.hasVariation("n"+t,e))return"n"+t;if(this.hasVariation("n"+(t=5),e))return"n"+t;for(t=3;1<=t;t--)if(this.hasVariation("n"+t,e))return"n"+t;for(t=6;t<=9;t++)if(this.hasVariation("n"+t,e))return"n"+t;return"n4"},hasVariation:function(e,t){return r.contains(t,e)}})},{"../helpers/available-types":7,"../helpers/backbone":8,"../helpers/translate":13,"../helpers/underscore":14,debug:1}],21:[function(e,t,n){var i=e("../helpers/backbone"),s=e("debug")("jetpack-fonts:selected-fonts"),o=e("../helpers/translate"),r=e("../models/selected-font");t.exports=i.Model.extend({initialize:function(e){e=(e=e||[]).map(function(e){return new r(e)});this.set("fonts",e)},getFontByType:function(n){var e=this.get("fonts").reduce(function(e,t){return t.get("type")===n?t:e},null);return e||(e=new r({type:n,displayName:o("Default Theme Font")}),this.get("fonts").push(e)),e},size:function(){return this.get("fonts").length},setSelectedFont:function(e){var t;s("setting selected font to",e),e.type?((t=this.getFontByType(e.type)).clear({silent:!0}),t?t.set(e):this.get("fonts").push(new r(e)),this.trigger("change")):s("Cannot set selected font because it has no type",e)},toJSON:function(){return this.get("fonts").reduce(function(e,t){return t.get("id")&&e.push(t.toJSON()),e},[])}})},{"../helpers/backbone":8,"../helpers/translate":13,"../models/selected-font":20,debug:1}],22:[function(e,t,n){var i=e("../helpers/api"),s=e("../helpers/bootstrap"),o=e("../helpers/webfont"),r=[];e=i.JetpackFonts.ProviderView.extend({render:function(){var e,t;return this.$el.html(this.model.get("displayName")),this.$el.css("font-family",'"'+this.model.get("cssName")+'"'),this.currentFont&&this.currentFont.get("id")===this.model.get("id")?this.$el.addClass("active"):this.$el.removeClass("active"),this.disableFocus||this.$el.attr("tabindex","0"),e=this.model.toJSON(),t=this.model.get("id"),~r.indexOf(e.id)||(r.push(e.id),o.load({google:{families:[e.id],text:t},classes:!1,events:!1})),this}});e.addFontToPreview=function(e){var t;~r.indexOf(e.id)||(r.push(e.id),e=e.id+":100,200,300,400,500,600,700,800,900,100italic,200italic,300italic,400italic,500italic,600italic,700italic,800italic,900italic",s.providerData&&s.providerData.googleSubsetString&&((t=s.providerData.googleSubsetString)&&0<t.length&&(e+=":"+t)),o.load({google:{families:[e]}}))},i.JetpackFonts.providerViews.google=e,t.exports=e},{"../helpers/api":5,"../helpers/bootstrap":9,"../helpers/webfont":15}],23:[function(e,t,n){var i=e("../views/dropdown-current-template");t.exports=i.extend({className:"jetpack-fonts__current-font-size font-property-control-current",initialize:function(e){i.prototype.initialize.call(this,e),this.currentFontSize=e.currentFontSize},render:function(){return this.$el.html(this.currentFontSize),this.$el.attr("tabindex","0"),this}})},{"../views/dropdown-current-template":27}],24:[function(e,t,n){var i=e("../views/dropdown-current-template"),s=e("../helpers/fvd-to-readable").getFontVariantNameFromId,e=i.extend({className:"jetpack-fonts__current-font-variant font-property-control-current",initialize:function(e){i.prototype.initialize.call(this,e),this.currentFontVariant=e.currentFontVariant,this.multiOptions=e.multiOptions},render:function(){return this.$el.html(s(this.currentFontVariant)),!1===this.multiOptions?this.$el.addClass("inactive"):this.$el.removeClass("inactive"),this.$el.attr("tabindex","0"),this}});t.exports=e},{"../helpers/fvd-to-readable":11,"../views/dropdown-current-template":27}],25:[function(e,t,n){var i=e("debug")("jetpack-fonts:CurrentFontView"),s=e("../helpers/provider-views").getViewForProvider,o=e("../views/dropdown-current-template"),e=o.extend({className:"jetpack-fonts__current-font",events:{mouseenter:"dispatchHover",mouseleave:"dispatchHover",click:"toggleDropdown",keydown:"checkKeyboardToggle"},dispatchHover:function(e){"mouseenter"!==e.type&&"mouseleave"!==e.type||this.providerView&&this.providerView[e.type](e)},checkKeyboardToggle:function(e){"Enter"===e.key&&this.toggleDropdown()},initialize:function(e){o.prototype.initialize.call(this,e),this.currentFont=e.currentFont,this.active=e.active,this.listenTo(this.currentFont,"change",this.render),this.listenTo(this.menuStatus,"change",this.render)},render:function(){this.active?this.$el.addClass("active"):this.$el.removeClass("active"),this.menuStatus.get("isOpen")?this.$el.addClass("jetpack-fonts__current-font--open"):this.$el.removeClass("jetpack-fonts__current-font--open"),i("rendering currentFont:",this.currentFont.toJSON()),this.currentFont.get("id")?this.$el.removeClass("jetpack-fonts__current-font--default"):this.$el.addClass("jetpack-fonts__current-font--default"),this.providerView&&this.providerView.remove(),this.$el.text(""),this.$el.attr("tabindex","0");var e=s(this.currentFont.get("provider"));return e?(i("rendering currentFont providerView for",this.currentFont.toJSON()),this.providerView=new e({model:this.currentFont,type:this.type,disableFocus:!0}),this.$el.append(this.providerView.render().el)):(i("rendering currentFont with no providerView for",this.currentFont.toJSON()),this.currentFont.get("displayName")?this.$el.html(this.currentFont.get("displayName")):(i("error rendering currentFont because it has no displayName!",this.currentFont.toJSON()),this.$el.html("Unknown"))),this}});t.exports=e},{"../helpers/provider-views":12,"../views/dropdown-current-template":27,debug:1}],26:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../helpers/emitter"),o=e("../models/default-font"),e=i.View.extend({className:"jetpack-fonts__default-button",tagName:"span",events:{click:"resetToDefault",keydown:"checkKeyboardReset"},initialize:function(e){if(this.currentFont=e.currentFont,this.type=e.type,!this.type)throw"Error: cannot create DefaultFontButton without a type";this.menuStatus=e.menuStatus,this.listenTo(this.currentFont,"change",this.render),this.listenTo(this.menuStatus,"change",this.render)},render:function(){return this.$el.html(""),this.currentFont.id&&!this.menuStatus.get("isOpen")?(this.$el.addClass("active-button"),this.$el.show()):(this.$el.removeClass("active-button"),this.$el.hide()),this.$el.attr("tabindex","0"),this},resetToDefault:function(){s.trigger("change-font",{font:new o,type:this.type.id})},checkKeyboardReset:function(e){"Enter"===e.key&&this.resetToDefault()}});t.exports=e},{"../helpers/backbone":8,"../helpers/emitter":10,"../models/default-font":19}],27:[function(e,t,n){var i=e("../helpers/backbone"),s=e("debug")("jetpack-fonts:DropdownCurrentTemplate"),o=e("../helpers/emitter"),e=i.View.extend({events:{click:"toggleDropdown",keydown:"checkKeyboardToggle"},initialize:function(e){this.type=e.type,this.menu=e.menu,this.menuStatus=e.menuStatus,this.active=!0},toggleDropdown:function(e){e&&e.stopPropagation(),this.active?this.menuStatus.get("isOpen")?(s("menu is open; closing menus",this.menu,this.type),o.trigger("close-open-menus")):(s("menu is closed; opening menu",this.menu,this.type),o.trigger("open-menu",{type:this.type,menu:this.menu})):s("menu is inactive; ignoring click",this.menu,this.type)},checkKeyboardToggle:function(e){"Enter"===e.key&&this.$el.click()}});t.exports=e},{"../helpers/backbone":8,"../helpers/emitter":10,debug:1}],28:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../helpers/emitter"),e=i.View.extend({className:"jetpack-fonts__option",events:{click:"fontChanged",keydown:"checkKeyboardSelect"},initialize:function(e){this.type=e.type,this.currentFont=e.currentFont,this.disableFocus=Boolean(e.disableFocus),this.currentFont&&this.listenTo(this.currentFont,"change",this.render)},checkKeyboardSelect:function(e){"Enter"===e.key&&this.$el.click()},render:function(){return this.$el.html(this.model.get("displayName")),this},fontChanged:function(){this.currentFont&&this.currentFont!==this.model&&s.trigger("change-font",{font:this.model,type:this.type.id})}});e.addFontToControls=function(){},t.exports=e},{"../helpers/backbone":8,"../helpers/emitter":10}],29:[function(e,t,n){e=e("../helpers/backbone").View.extend({initialize:function(e){this.type=e.type,this.menu=e.menu,this.menuStatus=e.menuStatus,this.listenTo(this.menuStatus,"change",this.updateStatus)},updateStatus:function(){this.menuStatus.get("isOpen")?this.open():this.close()},open:function(){this.$el.addClass("open"),this.isOpen=!0},close:function(){this.$el.removeClass("open"),this.isOpen=!1}});t.exports=e},{"../helpers/backbone":8}],30:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../mixins/menu-view-mixin"),o=e("../views/font-dropdown"),r=e("../views/current-font"),a=e("../views/default-font-button"),e=i.View.extend({className:"jetpack-fonts__menu-container",initialize:function(e){this.fontData=e.fontData,this.type=e.type,this.menu="fontFamily",this.menuKey=this.type.id+":"+this.menu,this.menuStatus=s(this)},render:function(){var e=new r({type:this.type,menu:this.menu,menuStatus:this.menuStatus,currentFont:this.model,active:0<this.fontData.length});return this.$el.append(e.render().el),this.$el.append(new o({type:this.type,menu:this.menu,menuStatus:this.menuStatus,currentFont:this.model,currentFontView:e,fontData:this.fontData}).render().el),this.$el.append(new a({type:this.type,menuStatus:this.menuStatus,currentFont:this.model}).render().el),this}});t.exports=e},{"../helpers/backbone":8,"../mixins/menu-view-mixin":17,"../views/current-font":25,"../views/default-font-button":26,"../views/font-dropdown":31}],31:[function(e,t,n){var s=e("debug")("jetpack-fonts:FontDropdown"),i=e("../helpers/emitter"),o=e("../helpers/provider-views").getViewForProvider,r=e("../views/dropdown-template"),a=e("../helpers/backbone").$,e=r.extend({className:"jetpack-fonts__menu",id:"font-select",events:{"mouseenter > .jetpack-fonts__option":"dispatchHover","mouseleave > .jetpack-fonts__option":"dispatchHover"},initialize:function(e){r.prototype.initialize.call(this,e),this.fontData=e.fontData,this.availableFonts=[],this.subViews={},this.currentFont=e.currentFont,this.currentFontView=e.currentFontView,this.listenTo(i,"load-menu-fonts",this.loadFonts)},loadFonts:function(){0<this.availableFonts.length||(this.availableFonts=this.fontData,this.render())},dispatchHover:function(e){var t;"mouseenter"!==e.type&&"mouseleave"!==e.type||(t=e.currentTarget).cid&&this.subViews[t.cid]&&this.subViews[t.cid][e.type](e)},render:function(){return Object.keys(this.subViews).forEach(function(e){this.subViews[e].remove()}.bind(this)),s("rendering",this.availableFonts.length,"availableFonts for",this.type),this.availableFonts.forEach(function(e){var t=o(e.get("provider"));t&&(s("rendering providerView in",this.type,"font list for",e.toJSON()),(t=new t({model:e,type:this.type,currentFont:this.currentFont}).render()).el.cid=t.cid,this.subViews[t.cid]=t,this.$el.append(t.el))},this),this},open:function(){r.prototype.open.call(this),this.adjustPosition()},adjustPosition:function(){var e=this.currentFontView.$el.offset(),t=this.currentFontView.$el.height(),n=a(".wp-full-overlay-sidebar-content").height(),i=n/2;s("adjusting position of menu; offset.top",e.top,"middle",i,"calc",e.top-t/2),e.top-t/2>=i?(s("menu: closer to bottom"),this.$el.removeClass("open-down").css({height:e.top-t-10})):(s("menu: closer to top"),s("offset.top",e.top,"availableHeight",n,"myHeight",t),this.$el.addClass("open-down").css({height:n-e.top-10}))}});t.exports=e},{"../helpers/backbone":8,"../helpers/emitter":10,"../helpers/provider-views":12,"../views/dropdown-template":29,debug:1}],32:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../mixins/menu-view-mixin"),o=e("../views/font-size-dropdown"),r=e("../views/current-font-size"),a=e("../helpers/translate"),e=i.View.extend({className:"jetpack-fonts__font-size-control font-property-control",initialize:function(e){this.menu="fontSize",this.type=e.type,this.fontData=e.fontData,this.currentFont=e.currentFont,this.listenTo(this.currentFont,"change",this.render),this.menuKey=this.type.id+":"+this.menu,this.menuStatus=s(this)},getSelectedAvailableFont:function(){var e=this.fontData.findWhere({id:this.currentFont.get("id")});return e||!1},getCurrentFontSize:function(){var e,t=this.getSelectedAvailableFont();if(t)return(e=this.currentFont.get("size"))&&t.getFontSizeNameFromId(e)?t.getFontSizeNameFromId(e):a("Normal Size")},isDefaultFont:function(){return!(this.currentFont.has("id")&&0<this.currentFont.get("id").length)},render:function(){return this.$el.html(""),this.isDefaultFont()?this.$el.addClass("jetpack-fonts__font-property-control--inactive"):this.$el.removeClass("jetpack-fonts__font-property-control--inactive"),this.$el.append(new r({type:this.type,menu:this.menu,menuStatus:this.menuStatus,currentFontSize:this.getCurrentFontSize()}).render().el),this.$el.append(new o({type:this.type,menu:this.menu,menuStatus:this.menuStatus,selectedAvailableFont:this.getSelectedAvailableFont(),currentFontSize:this.getCurrentFontSize()}).render().el),this}});t.exports=e},{"../helpers/backbone":8,"../helpers/translate":13,"../mixins/menu-view-mixin":17,"../views/current-font-size":23,"../views/font-size-dropdown":33}],33:[function(e,t,n){var i=e("../views/font-size-option"),s=e("../views/dropdown-template"),e=s.extend({className:"jetpack-fonts__font-size-dropdown font-property-control-dropdown",initialize:function(e){s.prototype.initialize.call(this,e),this.selectedAvailableFont=e.selectedAvailableFont,this.currentFontSize=e.currentFontSize},render:function(){return this.$el.html(""),this.selectedAvailableFont&&this.selectedAvailableFont.getFontSizeOptions().forEach(function(e){this.$el.append(new i({type:this.type,id:e.id,name:e.name,currentFontSize:this.currentFontSize}).render().el)}.bind(this)),this}});t.exports=e},{"../views/dropdown-template":29,"../views/font-size-option":34}],34:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../helpers/emitter");t.exports=i.View.extend({className:"jetpack-fonts__font-size-option jetpack-fonts__font-property-option",events:{click:"setSizeOption",keydown:"checkKeyboardSelect"},initialize:function(e){this.type=e.type,this.id=e.id,this.name=e.name,this.currentFontSize=e.currentFontSize},checkKeyboardSelect:function(e){"Enter"===e.key&&this.$el.click()},render:function(){return this.$el.html(this.name),this.$el.attr("data-name",this.name),this.currentFontSize===this.name&&this.$el.addClass("current"),this.$el.attr("tabindex","0"),this},setSizeOption:function(){s.trigger("set-size",{size:this.id,type:this.type.id})}})},{"../helpers/backbone":8,"../helpers/emitter":10}],35:[function(e,t,n){var i=e("../helpers/backbone"),s=e("debug")("jetpack-fonts:FontTypeView"),o=e("../helpers/emitter"),r=e("../views/font-control"),a=e("../views/font-variant-control"),l=e("../views/font-size-control"),e=i.View.extend({className:"jetpack-fonts__type",events:{click:"closeMenus"},initialize:function(e){this.type=e.type,this.fontData=e.fontData,this.currentFont=e.currentFont},render:function(){this.$el.append('<div class="jetpack-fonts__type" data-font-type="'+this.type.id+'"><h3 class="jetpack-fonts__type-header">'+this.type.name+"</h3></div>"),this.$el.append(new r({type:this.type,model:this.currentFont,fontData:this.fontData}).render().el);var e=i.$('<div class="jetpack-fonts__type-options"></div>');return e.append(new a({type:this.type,currentFont:this.currentFont,fontData:this.fontData}).render().el),e.append(new l({type:this.type,currentFont:this.currentFont,fontData:this.fontData}).render().el),this.$el.append(e),this},closeMenus:function(){s("type clicked; closing menus",this.type),o.trigger("close-open-menus")}});t.exports=e},{"../helpers/backbone":8,"../helpers/emitter":10,"../views/font-control":30,"../views/font-size-control":32,"../views/font-variant-control":36,debug:1}],36:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../mixins/menu-view-mixin"),o=e("../views/font-variant-dropdown"),r=e("../views/current-font-variant"),e=i.View.extend({className:"jetpack-fonts__font-variant-control font-property-control",initialize:function(e){this.menu="fontVariant",this.type=e.type,this.fontData=e.fontData,this.currentFont=e.currentFont,this.listenTo(this.currentFont,"change",this.render),this.menuKey=this.type.id+":"+this.menu,this.menuStatus=s(this)},getSelectedAvailableFont:function(){var e=this.fontData.findWhere({id:this.currentFont.get("id")});return e||!1},getCurrentFontVariant:function(){if(this.getSelectedAvailableFont()&&this.type.fvdAdjust)return this.currentFont.get("currentFvd")},render:function(){var e=this.getSelectedAvailableFont(),e=!!(e&&1<e.getFontVariantOptions().length);return this.currentFontView&&this.currentFontView.remove(),this.dropDownView&&this.dropDownView.remove(),e&&this.type.fvdAdjust&&(this.currentFontView=new r({type:this.type,menu:this.menu,menuStatus:this.menuStatus,currentFontVariant:this.getCurrentFontVariant(),multiOptions:e}),this.$el.append(this.currentFontView.render().el),this.dropDownView=new o({type:this.type,menu:this.menu,menuStatus:this.menuStatus,selectedAvailableFont:this.getSelectedAvailableFont(),currentFontVariant:this.getCurrentFontVariant()}),this.$el.append(this.dropDownView.render().el)),this}});t.exports=e},{"../helpers/backbone":8,"../mixins/menu-view-mixin":17,"../views/current-font-variant":24,"../views/font-variant-dropdown":37}],37:[function(e,t,n){var i=e("../views/font-variant-option"),s=e("../views/dropdown-template");t.exports=s.extend({className:"jetpack-fonts__font-variant-dropdown font-property-control-dropdown",initialize:function(e){s.prototype.initialize.call(this,e),this.selectedAvailableFont=e.selectedAvailableFont,this.currentFontVariant=e.currentFontVariant},render:function(){return this.$el.html(""),this.selectedAvailableFont&&this.type.fvdAdjust&&this.selectedAvailableFont.getFontVariantOptions().forEach(function(e){this.$el.append(new i({type:this.type,id:e,currentFontVariant:this.currentFontVariant}).render().el)}.bind(this)),this}})},{"../views/dropdown-template":29,"../views/font-variant-option":38}],38:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../helpers/emitter"),o=e("../helpers/fvd-to-readable").getFontVariantNameFromId;t.exports=i.View.extend({className:"jetpack-fonts__font-variant-option jetpack-fonts__font-property-option",events:{click:"setVariantOption",keydown:"checkKeyboardSelect"},initialize:function(e){this.type=e.type,this.id=e.id,this.currentFontVariant=e.currentFontVariant},checkKeyboardSelect:function(e){"Enter"===e.key&&this.$el.click()},render:function(){return this.$el.html(o(this.id)),this.$el.data("id",this.id),this.currentFontVariant===this.id&&this.$el.addClass("current"),this.$el.attr("tabindex","0"),this},setVariantOption:function(){s.trigger("set-variant",{variant:this.id,type:this.type.id})}})},{"../helpers/backbone":8,"../helpers/emitter":10,"../helpers/fvd-to-readable":11}],39:[function(e,t,n){var i=e("../helpers/backbone"),s=e("../helpers/emitter"),o=e("debug")("jetpack-fonts:MasterView"),r=e("../helpers/available-fonts"),a=e("../helpers/available-types"),l=e("../views/font-type"),c=e("../collections/available-fonts"),u=e("../models/default-font");e("../providers/google"),t.exports=i.View.extend({initialize:function(e){this.selectedFonts=e.selectedFonts,o("init with currently selected fonts:",this.selectedFonts.toJSON()),this.typeViews=[],this.headingFonts=new c(r),this.bodyFonts=new c(this.headingFonts.where({bodyText:!0})),this.listenTo(s,"change-font",this.updateCurrentFont),this.listenTo(s,"set-variant",this.setFontVariant),this.listenTo(s,"set-size",this.setFontSize)},closeAllMenus:function(){s.trigger("close-open-menus")},setFontVariant:function(e){o("font variant changed",e);var t=this.selectedFonts.getFontByType(e.type);t.set("currentFvd",e.variant),this.selectedFonts.setSelectedFont(t.toJSON()),s.trigger("close-open-menus")},setFontSize:function(e){o("font size changed",e);var t=this.selectedFonts.getFontByType(e.type);t.set("size",e.size),this.selectedFonts.setSelectedFont(t.toJSON()),s.trigger("close-open-menus")},updateCurrentFont:function(e){e.font.set({type:e.type}),this.selectedFonts.setSelectedFont(e.font.toJSON()),o("updateCurrentFont with",e.font.toJSON(),"to",this.selectedFonts.getFontByType(e.type).toJSON()),"headings"===e.type&&this.updateCurrentFont({font:new u,type:"site-title"}),s.trigger("close-open-menus")},render:function(){return this.typeViews.forEach(function(e){e.remove()}),this.$el.text(""),o("rendering controls for font types",a),this.typeViews=a.map(this.renderTypeControl.bind(this)),this},renderTypeControl:function(e){var t=!0===e.bodyText?this.bodyFonts:this.headingFonts,e=new l({type:e,currentFont:this.selectedFonts.getFontByType(e.id),fontData:t});return this.$el.append(e.render().el),e},loadFonts:function(){s.trigger("load-menu-fonts")}})},{"../collections/available-fonts":4,"../helpers/available-fonts":6,"../helpers/available-types":7,"../helpers/backbone":8,"../helpers/emitter":10,"../models/default-font":19,"../providers/google":22,"../views/font-type":35,debug:1}]},{},[16]);