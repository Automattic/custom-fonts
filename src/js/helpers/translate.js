var translations = typeof window !== 'undefined'
	? window._JetpackFonts.i18n
	: {};

module.exports = function( string ) {
	if ( translations[ string ] ) {
		return translations[ string ];
	}
	return string;
};
