var styleOptions = {
	'n4': 'Regular',
	'n8': 'Bold'
};

module.exports = {
	getFontVariantNameFromId: function( id ) {
		return styleOptions[ id ];
	}
};
