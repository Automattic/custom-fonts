var settings = require( '../helpers/bootstrap' );

var fonts = [];
if ( settings && settings.fonts ) {
	fonts = settings.fonts;
}

module.exports = fonts;

