/* globals Backbone */

var AvailableFont = require( '../models/available-font' );

module.exports = Backbone.Collection.extend({
	model: AvailableFont
});
