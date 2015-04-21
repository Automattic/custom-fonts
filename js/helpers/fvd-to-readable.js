var styleOptions = {
	'n1': 'Thin',
	'i1': 'Thin Italic',
	'n2': 'Extra Light',
	'i2': 'Extra Light Italic',
	'n3': 'Light',
	'i3': 'Light Italic',
	'n4': 'Regular',
	'i4': 'Italic',
	'n5': 'Medium',
	'i5': 'Medium Italic',
	'n6': 'Semibold',
	'i6': 'Semibold Italic',
	'n7': 'Bold',
	'i7': 'Bold Italic',
	'n8': 'Extra Bold',
	'i8': 'Extra Bold Italic',
	'n9': 'Black',
	'i9': 'Black Italic'
};

module.exports = {
	getFontVariantNameFromId: function( id ) {
		return styleOptions[ id ];
	}
};
