var SelectedFont = require( '../models/selected-font' );

module.exports = SelectedFont.extend({
	initialize: function() {
		// TODO: translate this string
		this.set({ id: '', displayName: 'Default Theme font', provider: '' });
	}
});
