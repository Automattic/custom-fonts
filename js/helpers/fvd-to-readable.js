var styleOptions = typeof window !== 'undefined'
	? window._JetpackFonts.fvdMap
	: {
		'n1': 'Thin',
		'i1': 'Thin Italic',
		'o1': 'Thin Oblique',
		'n2': 'Extra Light',
		'i2': 'Extra Light Italic',
		'o2': 'Extra Light Oblique',
		'n3': 'Light',
		'i3': 'Light Italic',
		'o3': 'Light Oblique',
		'n4': 'Regular',
		'i4': 'Italic',
		'o4': 'Oblique',
		'n5': 'Medium',
		'i5': 'Medium Italic',
		'o5': 'Medium Oblique',
		'n6': 'Semibold',
		'i6': 'Semibold Italic',
		'o6': 'Semibold Oblique',
		'n7': 'Bold',
		'i7': 'Bold Italic',
		'o7': 'Bold Oblique',
		'n8': 'Extra Bold',
		'i8': 'Extra Bold Italic',
		'o8': 'Extra Bold Oblique',
		'n9': 'Ultra Bold',
		'i9': 'Ultra Bold Italic',
		'o9': 'Ultra Bold Oblique'
	};

module.exports = {
	getFontVariantNameFromId: function( id ) {
		var match = styleOptions[ id ];
		if ( match ) {
			return match;
		}
		return 'Regular';
	}
};
