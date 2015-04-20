// TODO: import these from the annotations files for this theme
var annotations = [
	{
		type: 'body-text',
		rules: [
			{ 'property': 'font-size', 'value': '16px' },
			{ 'property': 'font-family', 'value': 'Lato, sans-serif' }
		],
		selector: 'body, button, input, select, textarea'
	},
	{
		type: 'headings',
		rules: [
			{ 'property': 'font-size', 'value': '33px' },
			{ 'property': 'font-family', 'value': 'inherit' }
		],
		selector: '.entry-title'
	},
	{
		type: 'headings',
		rules: [
			{ 'property': 'font-size', 'value': '18px' },
			{ 'property': 'font-family', 'value': 'Lato, sans-serif' }
		],
		selector: '.site-title'
	},
];

module.exports = annotations;
