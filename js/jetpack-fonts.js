!function i(o,s,r){function a(t,e){if(!s[t]){if(!o[t]){var n="function"==typeof require&&require;if(!e&&n)return n(t,!0);if(c)return c(t,!0);throw(e=new Error("Cannot find module '"+t+"'")).code="MODULE_NOT_FOUND",e}n=s[t]={exports:{}},o[t][0].call(n.exports,function(e){return a(o[t][1][e]||e)},n,n.exports,i,o,s,r)}return s[t].exports}for(var c="function"==typeof require&&require,e=0;e<r.length;e++)a(r[e]);return a}({1:[function(n,o,i){!function(t){!function(){i.formatArgs=function(e){if(e[0]=(this.useColors?"%c":"")+this.namespace+(this.useColors?" %c":" ")+e[0]+(this.useColors?"%c ":" ")+"+"+o.exports.humanize(this.diff),this.useColors){var i="color: "+this.color;e.splice(1,0,i,"color: inherit");let t=0,n=0;e[0].replace(/%[a-zA-Z%]/g,e=>{"%%"!==e&&(t++,"%c"===e&&(n=t))}),e.splice(n,0,i)}},i.save=function(e){try{e?i.storage.setItem("debug",e):i.storage.removeItem("debug")}catch(e){}},i.load=function(){let e;try{e=i.storage.getItem("debug")}catch(e){}!e&&void 0!==t&&"env"in t&&(e=t.env.DEBUG);return e},i.useColors=function(){if("undefined"!=typeof window&&window.process&&("renderer"===window.process.type||window.process.__nwjs))return!0;if("undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))return!1;return"undefined"!=typeof document&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||"undefined"!=typeof window&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&31<=parseInt(RegExp.$1,10)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/)},i.storage=function(){try{return localStorage}catch(e){}}(),i.destroy=(()=>{let e=!1;return()=>{e||(e=!0,console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."))}})(),i.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"],i.log=console.debug||console.log||(()=>{}),o.exports=n("./common")(i);const e=o.exports["formatters"];e.j=function(e){try{return JSON.stringify(e)}catch(e){return"[UnexpectedJSONParseError]: "+e.message}}}.call(this)}.call(this,n("_process"))},{"./common":2,_process:4}],2:[function(e,t,n){t.exports=function(t){function c(e){let r,t=null,n,i;function a(...o){if(a.enabled){const s=a;var e=Number(new Date),t=e-(r||e);s.diff=t,s.prev=r,s.curr=e,r=e,o[0]=c.coerce(o[0]),"string"!=typeof o[0]&&o.unshift("%O");let i=0;o[0]=o[0].replace(/%([a-zA-Z%])/g,(e,t)=>{if("%%"===e)return"%";i++;const n=c.formatters[t];return"function"==typeof n&&(t=o[i],e=n.call(s,t),o.splice(i,1),i--),e}),c.formatArgs.call(s,o);const n=s.log||c.log;n.apply(s,o)}}return a.namespace=e,a.useColors=c.useColors(),a.color=c.selectColor(e),a.extend=o,a.destroy=c.destroy,Object.defineProperty(a,"enabled",{enumerable:!0,configurable:!1,get:()=>null!==t?t:(n!==c.namespaces&&(n=c.namespaces,i=c.enabled(e)),i),set:e=>{t=e}}),"function"==typeof c.init&&c.init(a),a}function o(e,t){const n=c(this.namespace+(void 0===t?":":t)+e);return n.log=this.log,n}function n(e){return e.toString().substring(2,e.toString().length-2).replace(/\.\*\?$/,"*")}return((c.debug=c).default=c).coerce=function(e){if(e instanceof Error)return e.stack||e.message;return e},c.disable=function(){var e=[...c.names.map(n),...c.skips.map(n).map(e=>"-"+e)].join(",");return c.enable(""),e},c.enable=function(e){c.save(e),c.namespaces=e,c.names=[],c.skips=[];let t;const n=("string"==typeof e?e:"").split(/[\s,]+/),i=n.length;for(t=0;t<i;t++)n[t]&&("-"===(e=n[t].replace(/\*/g,".*?"))[0]?c.skips.push(new RegExp("^"+e.slice(1)+"$")):c.names.push(new RegExp("^"+e+"$")))},c.enabled=function(e){if("*"===e[e.length-1])return!0;let t,n;for(t=0,n=c.skips.length;t<n;t++)if(c.skips[t].test(e))return!1;for(t=0,n=c.names.length;t<n;t++)if(c.names[t].test(e))return!0;return!1},c.humanize=e("ms"),c.destroy=function(){console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")},Object.keys(t).forEach(e=>{c[e]=t[e]}),c.names=[],c.skips=[],c.formatters={},c.selectColor=function(t){let n=0;for(let e=0;e<t.length;e++)n=(n<<5)-n+t.charCodeAt(e),n|=0;return c.colors[Math.abs(n)%c.colors.length]},c.enable(c.load()),c}},{ms:3}],3:[function(e,t,n){var o=36e5,s=864e5;function r(e,t,n,i){t=1.5*n<=t;return Math.round(e/n)+" "+i+(t?"s":"")}t.exports=function(e,t){t=t||{};var n=typeof e;if(!("string"==n&&0<e.length)){if("number"==n&&isFinite(e))return(t.long?function(e){var t=Math.abs(e);if(s<=t)return r(e,t,s,"day");if(o<=t)return r(e,t,o,"hour");if(6e4<=t)return r(e,t,6e4,"minute");if(1e3<=t)return r(e,t,1e3,"second");return e+" ms"}:function(e){var t=Math.abs(e);if(s<=t)return Math.round(e/s)+"d";if(o<=t)return Math.round(e/o)+"h";if(6e4<=t)return Math.round(e/6e4)+"m";if(1e3<=t)return Math.round(e/1e3)+"s";return e+"ms"})(e);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))}n=e;if(!(100<(n=String(n)).length)){n=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(n);if(n){var i=parseFloat(n[1]);switch((n[2]||"ms").toLowerCase()){case"years":case"year":case"yrs":case"yr":case"y":return 315576e5*i;case"weeks":case"week":case"w":return 6048e5*i;case"days":case"day":case"d":return i*s;case"hours":case"hour":case"hrs":case"hr":case"h":return i*o;case"minutes":case"minute":case"mins":case"min":case"m":return 6e4*i;case"seconds":case"second":case"secs":case"sec":case"s":return 1e3*i;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return i;default:return}}}}},{}],4:[function(e,t,n){var i,o,t=t.exports={};function s(){throw new Error("setTimeout has not been defined")}function r(){throw new Error("clearTimeout has not been defined")}try{i="function"==typeof setTimeout?setTimeout:s}catch(e){i=s}try{o="function"==typeof clearTimeout?clearTimeout:r}catch(e){o=r}function a(t){if(i===setTimeout)return setTimeout(t,0);if((i===s||!i)&&setTimeout)return(i=setTimeout)(t,0);try{return i(t,0)}catch(e){try{return i.call(null,t,0)}catch(e){return i.call(this,t,0)}}}var c,l=[],u=!1,h=-1;function d(){u&&c&&(u=!1,c.length?l=c.concat(l):h=-1,l.length&&p())}function p(){if(!u){for(var e=a(d),t=(u=!0,l.length);t;){for(c=l,l=[];++h<t;)c&&c[h].run();h=-1,t=l.length}c=null,u=!1,!function(t){if(o===clearTimeout)return clearTimeout(t);if((o===r||!o)&&clearTimeout)return(o=clearTimeout)(t);try{o(t)}catch(e){try{return o.call(null,t)}catch(e){return o.call(this,t)}}}(e)}}function f(e,t){this.fun=e,this.array=t}function m(){}t.nextTick=function(e){var t=new Array(arguments.length-1);if(1<arguments.length)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];l.push(new f(e,t)),1!==l.length||u||a(p)},f.prototype.run=function(){this.fun.apply(null,this.array)},t.title="browser",t.browser=!0,t.env={},t.argv=[],t.version="",t.versions={},t.on=m,t.addListener=m,t.once=m,t.off=m,t.removeListener=m,t.removeAllListeners=m,t.emit=m,t.prependListener=m,t.prependOnceListener=m,t.listeners=function(e){return[]},t.binding=function(e){throw new Error("process.binding is not supported")},t.cwd=function(){return"/"},t.chdir=function(e){throw new Error("process.chdir is not supported")},t.umask=function(){return 0}},{}],5:[function(e,t,n){var i=e("../helpers/backbone"),e=e("../models/available-font");t.exports=i.Collection.extend({model:e})},{"../helpers/backbone":9,"../models/available-font":19}],6:[function(e,t,n){t.exports=window.wp.customize},{}],7:[function(e,t,n){var e=e("../helpers/bootstrap"),i=[];e&&e.fonts&&(i=e.fonts),t.exports=i},{"../helpers/bootstrap":10}],8:[function(e,t,n){e=e("../helpers/bootstrap");var i=[];e&&e.types&&(i=(i=e.types.sort(function(e,t){return"headings"===e.id?-1:"headings"===t.id?1:0})).reduce(function(e,t){return"site-title"!==t.id&&e.push(t),e},[])),t.exports=i},{"../helpers/bootstrap":10}],9:[function(e,t,n){t.exports=Backbone},{}],10:[function(e,t,n){var i=window._JetpackFonts;t.exports=i},{}],11:[function(e,t,n){var i=e("../helpers/backbone"),e=e("../helpers/underscore");t.exports=e.extend(i.Events)},{"../helpers/backbone":9,"../helpers/underscore":15}],12:[function(e,t,n){var i="undefined"!=typeof window?window._JetpackFonts.fvdMap:{n1:"Thin",i1:"Thin Italic",o1:"Thin Oblique",n2:"Extra Light",i2:"Extra Light Italic",o2:"Extra Light Oblique",n3:"Light",i3:"Light Italic",o3:"Light Oblique",n4:"Regular",i4:"Italic",o4:"Oblique",n5:"Medium",i5:"Medium Italic",o5:"Medium Oblique",n6:"Semibold",i6:"Semibold Italic",o6:"Semibold Oblique",n7:"Bold",i7:"Bold Italic",o7:"Bold Oblique",n8:"Extra Bold",i8:"Extra Bold Italic",o8:"Extra Bold Oblique",n9:"Ultra Bold",i9:"Ultra Bold Italic",o9:"Ultra Bold Oblique"};t.exports={getFontVariantNameFromId:function(e){e=i[e];return e||"Regular"}}},{}],13:[function(e,t,n){var i=e("../helpers/api"),o=e("debug")("jetpack-fonts:provider-views"),e=e("../views/dropdown-item"),s=(i.JetpackFonts||(i.JetpackFonts={}),i.JetpackFonts.providerViews||(i.JetpackFonts.providerViews={}),i.JetpackFonts.ProviderView=e.extend({mouseenter:function(){},mouseleave:function(){}}),{});t.exports={getViewForProvider:function(e){return o("importing provider views from",i.JetpackFonts.providerViews),i.JetpackFonts.providerViews&&Object.keys(i.JetpackFonts.providerViews).forEach(function(e){s[e]=i.JetpackFonts.providerViews[e]}),s[e]?(o("found view for provider",e),s[e]):(o("no view found for provider",e),null)}}},{"../helpers/api":6,"../views/dropdown-item":29,debug:1}],14:[function(e,t,n){var i="undefined"!=typeof window?window._JetpackFonts.i18n:{};t.exports=function(e){return i[e]||e}},{}],15:[function(e,t,n){t.exports=_},{}],16:[function(e,t,n){t.exports=WebFont},{}],17:[function(e,t,n){var i=e("./helpers/api"),o=e("./views/master"),s=e("./models/selected-fonts");i.controlConstructor.jetpackFonts=i.Control.extend({ready:function(){this.selectedFonts=new s(this.setting()),this.selectedFonts.on("change",function(){this.setting(this.selectedFonts.toJSON())}.bind(this)),this.view=new o({selectedFonts:this.selectedFonts,el:this.container}).render(),i.section(this.section()).container.one("expanded",function(){setTimeout(this.view.loadFonts,200)}.bind(this)),i.section(this.section()).container.on("collapsed",function(){this.view.closeAllMenus()}.bind(this))}})},{"./helpers/api":6,"./models/selected-fonts":22,"./views/master":40}],18:[function(e,t,n){var i=e("../helpers/backbone"),o=e("debug")("jetpack-fonts:menu-view"),s=e("../helpers/emitter");function r(e){if((e=e.type&&e.type.id&&e.menu?e.type.id+":"+e.menu:e)!==this.menuKey)return this.closeMenu();this.openMenu()}function a(){o("opening menu",this.menuKey),this.menuStatus.set({isOpen:!0})}function c(){o("closing menu",this.menuKey),this.menuStatus.set({isOpen:!1})}t.exports=function(e){if(!e.listenTo)throw"menuViewMixin requires a Backbone View with the `listenTo` method";if(e.menuKey)return e.menuStatus||(e.menuStatus=new i.Model({isOpen:!1})),e.maybeOpenMenu=r,e.openMenu=a,e.closeMenu=c,e.listenTo(s,"open-menu",e.maybeOpenMenu),e.listenTo(s,"close-open-menus",e.closeMenu),o("added menu capability to the View",e.menuKey),e.menuStatus;throw"menuViewMixin requires a View with a `menuKey` string property to identify the menu"}},{"../helpers/backbone":9,"../helpers/emitter":11,debug:1}],19:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../helpers/underscore"),e=e("../helpers/translate"),s=[{id:-10,name:e("Tiny")},{id:-5,name:e("Small")},{id:0,name:e("Normal")},{id:5,name:e("Large")},{id:10,name:e("Huge")}];t.exports=i.Model.extend({getFontVariantOptions:function(){return this.get("fvds")?this.get("fvds"):[]},getFontSizeOptions:function(){return s},getFontSizeNameFromId:function(e){e=o.findWhere(s,{id:e});return!!e&&e.name}})},{"../helpers/backbone":9,"../helpers/translate":14,"../helpers/underscore":15}],20:[function(e,t,n){var i=e("../models/selected-font"),o=e("../helpers/translate");t.exports=i.extend({initialize:function(){this.set({id:"",displayName:o("Default Theme Font"),provider:""})}})},{"../helpers/translate":14,"../models/selected-font":21}],21:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../helpers/translate"),s=e("../helpers/available-types"),r=e("../helpers/underscore"),a=e("debug")("jetpack_fonts:selected-font");t.exports=i.Model.extend({initialize:function(){this.maybeSetCurrentFvd()},defaults:{displayName:o("Default Theme Font")},set:function(){i.Model.prototype.set.apply(this,arguments),this.maybeSetCurrentFvd()},maybeSetCurrentFvd:function(){var e;this.get("currentFvd")?a("Font already has an fvd",this.get("currentFvd")):this.get("id")&&(e=r.findWhere(s,{id:this.get("type")}))&&e.fvdAdjust&&this.get("fvds")&&(this.set("currentFvd",this.pickFvd()),a("Fvd now set to: ",this.get("currentFvd")))},pickFvd:function(){var e=this.get("fvds"),t=4;if(this.hasVariation("n"+t,e))return"n"+t;if(this.hasVariation("n"+(t=5),e))return"n"+t;for(t=3;1<=t;t--)if(this.hasVariation("n"+t,e))return"n"+t;for(t=6;t<=9;t++)if(this.hasVariation("n"+t,e))return"n"+t;return"n4"},hasVariation:function(e,t){return r.contains(t,e)}})},{"../helpers/available-types":8,"../helpers/backbone":9,"../helpers/translate":14,"../helpers/underscore":15,debug:1}],22:[function(e,t,n){var i=e("../helpers/backbone"),o=e("debug")("jetpack-fonts:selected-fonts"),s=e("../helpers/translate"),r=e("../models/selected-font");t.exports=i.Model.extend({initialize:function(e){e=(e=Array.isArray(e)?e:[]).map(function(e){return new r(e)});this.set("fonts",e)},getFontByType:function(n){var e=this.get("fonts").reduce(function(e,t){return t.get("type")===n?t:e},null);return e||(e=new r({type:n,displayName:s("Default Theme Font")}),this.get("fonts").push(e)),e},size:function(){return this.get("fonts").length},setSelectedFont:function(e){var t;o("setting selected font to",e),e.type?((t=this.getFontByType(e.type)).clear({silent:!0}),t?t.set(e):this.get("fonts").push(new r(e)),this.trigger("change")):o("Cannot set selected font because it has no type",e)},toJSON:function(){return this.get("fonts").reduce(function(e,t){return t.get("id")&&e.push(t.toJSON()),e},[])}})},{"../helpers/backbone":9,"../helpers/translate":14,"../models/selected-font":21,debug:1}],23:[function(e,t,n){var i=e("../helpers/api"),o=e("../helpers/bootstrap"),s=e("../helpers/webfont"),r=[];e=i.JetpackFonts.ProviderView.extend({render:function(){var e,t;return this.$el.html(this.model.get("displayName")),this.$el.css("font-family",'"'+this.model.get("cssName")+'"'),this.currentFont&&this.currentFont.get("id")===this.model.get("id")?this.$el.addClass("active"):this.$el.removeClass("active"),this.disableFocus||this.$el.attr("tabindex","0"),e=this.model.toJSON(),t=this.model.get("id"),~r.indexOf(e.id)||(r.push(e.id),s.load({google:{families:[e.id],text:t},classes:!1,events:!1})),this}});e.addFontToPreview=function(e){var t;~r.indexOf(e.id)||(r.push(e.id),e=e.id+":100,200,300,400,500,600,700,800,900,100italic,200italic,300italic,400italic,500italic,600italic,700italic,800italic,900italic",o.providerData&&o.providerData.googleSubsetString&&((t=o.providerData.googleSubsetString)&&0<t.length&&(e+=":"+t)),s.load({google:{families:[e]}}))},i.JetpackFonts.providerViews.google=e,t.exports=e},{"../helpers/api":6,"../helpers/bootstrap":10,"../helpers/webfont":16}],24:[function(e,t,n){var i=e("../views/dropdown-current-template");t.exports=i.extend({className:"jetpack-fonts__current-font-size font-property-control-current",initialize:function(e){i.prototype.initialize.call(this,e),this.currentFontSize=e.currentFontSize},render:function(){return this.$el.html(this.currentFontSize),this.$el.attr("tabindex","0"),this}})},{"../views/dropdown-current-template":28}],25:[function(e,t,n){var i=e("../views/dropdown-current-template"),o=e("../helpers/fvd-to-readable").getFontVariantNameFromId,e=i.extend({className:"jetpack-fonts__current-font-variant font-property-control-current",initialize:function(e){i.prototype.initialize.call(this,e),this.currentFontVariant=e.currentFontVariant,this.multiOptions=e.multiOptions},render:function(){return this.$el.html(o(this.currentFontVariant)),!1===this.multiOptions?this.$el.addClass("inactive"):this.$el.removeClass("inactive"),this.$el.attr("tabindex","0"),this}});t.exports=e},{"../helpers/fvd-to-readable":12,"../views/dropdown-current-template":28}],26:[function(e,t,n){var i=e("debug")("jetpack-fonts:CurrentFontView"),o=e("../helpers/provider-views").getViewForProvider,s=e("../views/dropdown-current-template"),e=s.extend({className:"jetpack-fonts__current-font",events:{mouseenter:"dispatchHover",mouseleave:"dispatchHover",click:"toggleDropdown",keydown:"checkKeyboardToggle"},dispatchHover:function(e){"mouseenter"!==e.type&&"mouseleave"!==e.type||this.providerView&&this.providerView[e.type](e)},checkKeyboardToggle:function(e){"Enter"===e.key&&this.toggleDropdown()},initialize:function(e){s.prototype.initialize.call(this,e),this.currentFont=e.currentFont,this.active=e.active,this.listenTo(this.currentFont,"change",this.render),this.listenTo(this.menuStatus,"change",this.render)},render:function(){this.active?this.$el.addClass("active"):this.$el.removeClass("active"),this.menuStatus.get("isOpen")?this.$el.addClass("jetpack-fonts__current-font--open"):this.$el.removeClass("jetpack-fonts__current-font--open"),i("rendering currentFont:",this.currentFont.toJSON()),this.currentFont.get("id")?this.$el.removeClass("jetpack-fonts__current-font--default"):this.$el.addClass("jetpack-fonts__current-font--default"),this.providerView&&this.providerView.remove(),this.$el.text(""),this.$el.attr("tabindex","0");var e=o(this.currentFont.get("provider"));return e?(i("rendering currentFont providerView for",this.currentFont.toJSON()),this.providerView=new e({model:this.currentFont,type:this.type,disableFocus:!0}),this.$el.append(this.providerView.render().el)):(i("rendering currentFont with no providerView for",this.currentFont.toJSON()),this.currentFont.get("displayName")?this.$el.html(this.currentFont.get("displayName")):(i("error rendering currentFont because it has no displayName!",this.currentFont.toJSON()),this.$el.html("Unknown"))),this}});t.exports=e},{"../helpers/provider-views":13,"../views/dropdown-current-template":28,debug:1}],27:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../helpers/emitter"),s=e("../models/default-font"),e=i.View.extend({className:"jetpack-fonts__default-button",tagName:"span",events:{click:"resetToDefault",keydown:"checkKeyboardReset"},initialize:function(e){if(this.currentFont=e.currentFont,this.type=e.type,!this.type)throw"Error: cannot create DefaultFontButton without a type";this.menuStatus=e.menuStatus,this.listenTo(this.currentFont,"change",this.render),this.listenTo(this.menuStatus,"change",this.render)},render:function(){return this.$el.html(""),this.currentFont.id&&!this.menuStatus.get("isOpen")?(this.$el.addClass("active-button"),this.$el.show()):(this.$el.removeClass("active-button"),this.$el.hide()),this.$el.attr("tabindex","0"),this},resetToDefault:function(){o.trigger("change-font",{font:new s,type:this.type.id})},checkKeyboardReset:function(e){"Enter"===e.key&&this.resetToDefault()}});t.exports=e},{"../helpers/backbone":9,"../helpers/emitter":11,"../models/default-font":20}],28:[function(e,t,n){var i=e("../helpers/backbone"),o=e("debug")("jetpack-fonts:DropdownCurrentTemplate"),s=e("../helpers/emitter"),e=i.View.extend({events:{click:"toggleDropdown",keydown:"checkKeyboardToggle"},initialize:function(e){this.type=e.type,this.menu=e.menu,this.menuStatus=e.menuStatus,this.active=!0},toggleDropdown:function(e){e&&e.stopPropagation(),this.active?this.menuStatus.get("isOpen")?(o("menu is open; closing menus",this.menu,this.type),s.trigger("close-open-menus")):(o("menu is closed; opening menu",this.menu,this.type),s.trigger("open-menu",{type:this.type,menu:this.menu})):o("menu is inactive; ignoring click",this.menu,this.type)},checkKeyboardToggle:function(e){"Enter"===e.key&&this.$el.click()}});t.exports=e},{"../helpers/backbone":9,"../helpers/emitter":11,debug:1}],29:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../helpers/emitter"),e=i.View.extend({className:"jetpack-fonts__option",events:{click:"fontChanged",keydown:"checkKeyboardSelect"},initialize:function(e){this.type=e.type,this.currentFont=e.currentFont,this.disableFocus=Boolean(e.disableFocus),this.currentFont&&this.listenTo(this.currentFont,"change",this.render)},checkKeyboardSelect:function(e){"Enter"===e.key&&this.$el.click()},render:function(){return this.$el.html(this.model.get("displayName")),this},fontChanged:function(){this.currentFont&&this.currentFont!==this.model&&o.trigger("change-font",{font:this.model,type:this.type.id})}});e.addFontToControls=function(){},t.exports=e},{"../helpers/backbone":9,"../helpers/emitter":11}],30:[function(e,t,n){e=e("../helpers/backbone").View.extend({initialize:function(e){this.type=e.type,this.menu=e.menu,this.menuStatus=e.menuStatus,this.listenTo(this.menuStatus,"change",this.updateStatus)},updateStatus:function(){this.menuStatus.get("isOpen")?this.open():this.close()},open:function(){this.$el.addClass("open"),this.isOpen=!0},close:function(){this.$el.removeClass("open"),this.isOpen=!1}});t.exports=e},{"../helpers/backbone":9}],31:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../mixins/menu-view-mixin"),s=e("../views/font-dropdown"),r=e("../views/current-font"),a=e("../views/default-font-button"),e=i.View.extend({className:"jetpack-fonts__menu-container",initialize:function(e){this.fontData=e.fontData,this.type=e.type,this.menu="fontFamily",this.menuKey=this.type.id+":"+this.menu,this.menuStatus=o(this)},render:function(){var e=new r({type:this.type,menu:this.menu,menuStatus:this.menuStatus,currentFont:this.model,active:0<this.fontData.length});return this.$el.append(e.render().el),this.$el.append(new s({type:this.type,menu:this.menu,menuStatus:this.menuStatus,currentFont:this.model,currentFontView:e,fontData:this.fontData}).render().el),this.$el.append(new a({type:this.type,menuStatus:this.menuStatus,currentFont:this.model}).render().el),this}});t.exports=e},{"../helpers/backbone":9,"../mixins/menu-view-mixin":18,"../views/current-font":26,"../views/default-font-button":27,"../views/font-dropdown":32}],32:[function(e,t,n){var o=e("debug")("jetpack-fonts:FontDropdown"),i=e("../helpers/emitter"),s=e("../helpers/provider-views").getViewForProvider,r=e("../views/dropdown-template"),a=e("../helpers/backbone").$,e=r.extend({className:"jetpack-fonts__menu",id:"font-select",events:{"mouseenter > .jetpack-fonts__option":"dispatchHover","mouseleave > .jetpack-fonts__option":"dispatchHover"},initialize:function(e){r.prototype.initialize.call(this,e),this.fontData=e.fontData,this.availableFonts=[],this.subViews={},this.currentFont=e.currentFont,this.currentFontView=e.currentFontView,this.listenTo(i,"load-menu-fonts",this.loadFonts)},loadFonts:function(){0<this.availableFonts.length||(this.availableFonts=this.fontData,this.render())},dispatchHover:function(e){var t;"mouseenter"!==e.type&&"mouseleave"!==e.type||(t=e.currentTarget).cid&&this.subViews[t.cid]&&this.subViews[t.cid][e.type](e)},render:function(){return Object.keys(this.subViews).forEach(function(e){this.subViews[e].remove()}.bind(this)),o("rendering",this.availableFonts.length,"availableFonts for",this.type),this.availableFonts.forEach(function(e){var t=s(e.get("provider"));t&&(o("rendering providerView in",this.type,"font list for",e.toJSON()),(t=new t({model:e,type:this.type,currentFont:this.currentFont}).render()).el.cid=t.cid,this.subViews[t.cid]=t,this.$el.append(t.el))},this),this},open:function(){r.prototype.open.call(this),this.adjustPosition()},adjustPosition:function(){var e=this.currentFontView.$el.offset(),t=this.currentFontView.$el.height(),n=a(".wp-full-overlay-sidebar-content").height(),i=n/2;o("adjusting position of menu; offset.top",e.top,"middle",i,"calc",e.top-t/2),e.top-t/2>=i?(o("menu: closer to bottom"),this.$el.removeClass("open-down").css({height:e.top-t-10})):(o("menu: closer to top"),o("offset.top",e.top,"availableHeight",n,"myHeight",t),this.$el.addClass("open-down").css({height:n-e.top-10}))}});t.exports=e},{"../helpers/backbone":9,"../helpers/emitter":11,"../helpers/provider-views":13,"../views/dropdown-template":30,debug:1}],33:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../mixins/menu-view-mixin"),s=e("../views/font-size-dropdown"),r=e("../views/current-font-size"),a=e("../helpers/translate"),e=i.View.extend({className:"jetpack-fonts__font-size-control font-property-control",initialize:function(e){this.menu="fontSize",this.type=e.type,this.fontData=e.fontData,this.currentFont=e.currentFont,this.listenTo(this.currentFont,"change",this.render),this.menuKey=this.type.id+":"+this.menu,this.menuStatus=o(this)},getSelectedAvailableFont:function(){var e=this.fontData.findWhere({id:this.currentFont.get("id")});return e||!1},getCurrentFontSize:function(){var e,t=this.getSelectedAvailableFont();if(t)return(e=this.currentFont.get("size"))&&t.getFontSizeNameFromId(e)?t.getFontSizeNameFromId(e):a("Normal Size")},isDefaultFont:function(){return!(this.currentFont.has("id")&&0<this.currentFont.get("id").length)},render:function(){return this.$el.html(""),this.isDefaultFont()?this.$el.addClass("jetpack-fonts__font-property-control--inactive"):this.$el.removeClass("jetpack-fonts__font-property-control--inactive"),this.$el.append(new r({type:this.type,menu:this.menu,menuStatus:this.menuStatus,currentFontSize:this.getCurrentFontSize()}).render().el),this.$el.append(new s({type:this.type,menu:this.menu,menuStatus:this.menuStatus,selectedAvailableFont:this.getSelectedAvailableFont(),currentFontSize:this.getCurrentFontSize()}).render().el),this}});t.exports=e},{"../helpers/backbone":9,"../helpers/translate":14,"../mixins/menu-view-mixin":18,"../views/current-font-size":24,"../views/font-size-dropdown":34}],34:[function(e,t,n){var i=e("../views/font-size-option"),o=e("../views/dropdown-template"),e=o.extend({className:"jetpack-fonts__font-size-dropdown font-property-control-dropdown",initialize:function(e){o.prototype.initialize.call(this,e),this.selectedAvailableFont=e.selectedAvailableFont,this.currentFontSize=e.currentFontSize},render:function(){return this.$el.html(""),this.selectedAvailableFont&&this.selectedAvailableFont.getFontSizeOptions().forEach(function(e){this.$el.append(new i({type:this.type,id:e.id,name:e.name,currentFontSize:this.currentFontSize}).render().el)}.bind(this)),this}});t.exports=e},{"../views/dropdown-template":30,"../views/font-size-option":35}],35:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../helpers/emitter");t.exports=i.View.extend({className:"jetpack-fonts__font-size-option jetpack-fonts__font-property-option",events:{click:"setSizeOption",keydown:"checkKeyboardSelect"},initialize:function(e){this.type=e.type,this.id=e.id,this.name=e.name,this.currentFontSize=e.currentFontSize},checkKeyboardSelect:function(e){"Enter"===e.key&&this.$el.click()},render:function(){return this.$el.html(this.name),this.$el.attr("data-name",this.name),this.currentFontSize===this.name&&this.$el.addClass("current"),this.$el.attr("tabindex","0"),this},setSizeOption:function(){o.trigger("set-size",{size:this.id,type:this.type.id})}})},{"../helpers/backbone":9,"../helpers/emitter":11}],36:[function(e,t,n){var i=e("../helpers/backbone"),o=e("debug")("jetpack-fonts:FontTypeView"),s=e("../helpers/emitter"),r=e("../views/font-control"),a=e("../views/font-variant-control"),c=e("../views/font-size-control"),e=i.View.extend({className:"jetpack-fonts__type",events:{click:"closeMenus"},initialize:function(e){this.type=e.type,this.fontData=e.fontData,this.currentFont=e.currentFont},render:function(){this.$el.append('<div class="jetpack-fonts__type" data-font-type="'+this.type.id+'"><h3 class="jetpack-fonts__type-header">'+this.type.name+"</h3></div>"),this.$el.append(new r({type:this.type,model:this.currentFont,fontData:this.fontData}).render().el);var e=i.$('<div class="jetpack-fonts__type-options"></div>');return e.append(new a({type:this.type,currentFont:this.currentFont,fontData:this.fontData}).render().el),e.append(new c({type:this.type,currentFont:this.currentFont,fontData:this.fontData}).render().el),this.$el.append(e),this},closeMenus:function(){o("type clicked; closing menus",this.type),s.trigger("close-open-menus")}});t.exports=e},{"../helpers/backbone":9,"../helpers/emitter":11,"../views/font-control":31,"../views/font-size-control":33,"../views/font-variant-control":37,debug:1}],37:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../mixins/menu-view-mixin"),s=e("../views/font-variant-dropdown"),r=e("../views/current-font-variant"),e=i.View.extend({className:"jetpack-fonts__font-variant-control font-property-control",initialize:function(e){this.menu="fontVariant",this.type=e.type,this.fontData=e.fontData,this.currentFont=e.currentFont,this.listenTo(this.currentFont,"change",this.render),this.menuKey=this.type.id+":"+this.menu,this.menuStatus=o(this)},getSelectedAvailableFont:function(){var e=this.fontData.findWhere({id:this.currentFont.get("id")});return e||!1},getCurrentFontVariant:function(){if(this.getSelectedAvailableFont()&&this.type.fvdAdjust)return this.currentFont.get("currentFvd")},render:function(){var e=this.getSelectedAvailableFont(),e=!!(e&&1<e.getFontVariantOptions().length);return this.currentFontView&&this.currentFontView.remove(),this.dropDownView&&this.dropDownView.remove(),e&&this.type.fvdAdjust&&(this.currentFontView=new r({type:this.type,menu:this.menu,menuStatus:this.menuStatus,currentFontVariant:this.getCurrentFontVariant(),multiOptions:e}),this.$el.append(this.currentFontView.render().el),this.dropDownView=new s({type:this.type,menu:this.menu,menuStatus:this.menuStatus,selectedAvailableFont:this.getSelectedAvailableFont(),currentFontVariant:this.getCurrentFontVariant()}),this.$el.append(this.dropDownView.render().el)),this}});t.exports=e},{"../helpers/backbone":9,"../mixins/menu-view-mixin":18,"../views/current-font-variant":25,"../views/font-variant-dropdown":38}],38:[function(e,t,n){var i=e("../views/font-variant-option"),o=e("../views/dropdown-template");t.exports=o.extend({className:"jetpack-fonts__font-variant-dropdown font-property-control-dropdown",initialize:function(e){o.prototype.initialize.call(this,e),this.selectedAvailableFont=e.selectedAvailableFont,this.currentFontVariant=e.currentFontVariant},render:function(){return this.$el.html(""),this.selectedAvailableFont&&this.type.fvdAdjust&&this.selectedAvailableFont.getFontVariantOptions().forEach(function(e){this.$el.append(new i({type:this.type,id:e,currentFontVariant:this.currentFontVariant}).render().el)}.bind(this)),this}})},{"../views/dropdown-template":30,"../views/font-variant-option":39}],39:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../helpers/emitter"),s=e("../helpers/fvd-to-readable").getFontVariantNameFromId;t.exports=i.View.extend({className:"jetpack-fonts__font-variant-option jetpack-fonts__font-property-option",events:{click:"setVariantOption",keydown:"checkKeyboardSelect"},initialize:function(e){this.type=e.type,this.id=e.id,this.currentFontVariant=e.currentFontVariant},checkKeyboardSelect:function(e){"Enter"===e.key&&this.$el.click()},render:function(){return this.$el.html(s(this.id)),this.$el.data("id",this.id),this.currentFontVariant===this.id&&this.$el.addClass("current"),this.$el.attr("tabindex","0"),this},setVariantOption:function(){o.trigger("set-variant",{variant:this.id,type:this.type.id})}})},{"../helpers/backbone":9,"../helpers/emitter":11,"../helpers/fvd-to-readable":12}],40:[function(e,t,n){var i=e("../helpers/backbone"),o=e("../helpers/emitter"),s=e("debug")("jetpack-fonts:MasterView"),r=e("../helpers/available-fonts"),a=e("../helpers/available-types"),c=e("../views/font-type"),l=e("../collections/available-fonts"),u=e("../models/default-font");e("../providers/google"),t.exports=i.View.extend({initialize:function(e){this.selectedFonts=e.selectedFonts,s("init with currently selected fonts:",this.selectedFonts.toJSON()),this.typeViews=[],this.headingFonts=new l(r),this.bodyFonts=new l(this.headingFonts.where({bodyText:!0})),this.listenTo(o,"change-font",this.updateCurrentFont),this.listenTo(o,"set-variant",this.setFontVariant),this.listenTo(o,"set-size",this.setFontSize)},closeAllMenus:function(){o.trigger("close-open-menus")},setFontVariant:function(e){s("font variant changed",e);var t=this.selectedFonts.getFontByType(e.type);t.set("currentFvd",e.variant),this.selectedFonts.setSelectedFont(t.toJSON()),o.trigger("close-open-menus")},setFontSize:function(e){s("font size changed",e);var t=this.selectedFonts.getFontByType(e.type);t.set("size",e.size),this.selectedFonts.setSelectedFont(t.toJSON()),o.trigger("close-open-menus")},updateCurrentFont:function(e){e.font.set({type:e.type}),this.selectedFonts.setSelectedFont(e.font.toJSON()),s("updateCurrentFont with",e.font.toJSON(),"to",this.selectedFonts.getFontByType(e.type).toJSON()),"headings"===e.type&&this.updateCurrentFont({font:new u,type:"site-title"}),o.trigger("close-open-menus")},render:function(){return this.typeViews.forEach(function(e){e.remove()}),this.$el.text(""),s("rendering controls for font types",a),this.typeViews=a.map(this.renderTypeControl.bind(this)),this},renderTypeControl:function(e){var t=!0===e.bodyText?this.bodyFonts:this.headingFonts,e=new c({type:e,currentFont:this.selectedFonts.getFontByType(e.id),fontData:t});return this.$el.append(e.render().el),e},loadFonts:function(){o.trigger("load-menu-fonts")}})},{"../collections/available-fonts":5,"../helpers/available-fonts":7,"../helpers/available-types":8,"../helpers/backbone":9,"../helpers/emitter":11,"../models/default-font":20,"../providers/google":23,"../views/font-type":36,debug:1}]},{},[17]);