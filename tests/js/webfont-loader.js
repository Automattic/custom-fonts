var expect = require( 'chai' ).expect,
	fs = require( 'fs' ),
	path = require( 'path' ),
	JSDOM = require( 'jsdom' ).JSDOM;

var source = fs.readFileSync( path.join( __dirname, '../../js/webfont.js' ), 'utf8' );

// The stylesheet URL the bundled loader requests for an endpoint. Mirrors
// Jetpack_Google_Font_Provider::get_fonts_api_url() in providers/google.php.
function stylesheetUrl( apiUrl, families ) {
	var dom = new JSDOM( '<html><head></head><body></body></html>', { runScripts: 'outside-only' } );
	dom.window.WebFontConfig = { api_url: apiUrl };
	dom.window.eval( source );
	dom.window.WebFont.load( { google: { families: families || [ 'Cabin:r:latin,latin-ext' ] }, classes: false, events: false } );
	var links = dom.window.document.querySelectorAll( 'link[rel="stylesheet"]' );
	var hrefs = Array.prototype.map.call( links, function( link ) {
		return link.getAttribute( 'href' );
	} );
	dom.window.close();
	expect( hrefs ).to.have.length( 1 );
	return hrefs[ 0 ];
}

describe( 'bundled Web Font Loader', function() {
	it( 'appends the families to a plain endpoint', function() {
		expect( stylesheetUrl( 'https://fonts.googleapis.com/css' ) )
			.to.equal( 'https://fonts.googleapis.com/css?family=Cabin:r&subset=latin,latin-ext' );
	} );

	it( 'keeps the query parameters of an endpoint', function() {
		expect( stylesheetUrl( '/proxy?source=custom-fonts' ) )
			.to.equal( '/proxy?source=custom-fonts&family=Cabin:r&subset=latin,latin-ext' );
	} );

	it( 'does not repeat a trailing family parameter', function() {
		expect( stylesheetUrl( '//proxy.example.org/css?family=' ) )
			.to.equal( '//proxy.example.org/css?family=Cabin:r&subset=latin,latin-ext' );
		expect( stylesheetUrl( 'https://example.org/fonts?source=custom-fonts&family=' ) )
			.to.equal( 'https://example.org/fonts?source=custom-fonts&family=Cabin:r&subset=latin,latin-ext' );
	} );

	it( 'joins several families', function() {
		expect( stylesheetUrl( '/proxy?source=custom-fonts', [ 'Cabin:r:latin', 'Lobster Two:bi:latin' ] ) )
			.to.equal( '/proxy?source=custom-fonts&family=Cabin:r%7CLobster+Two:bi&subset=latin,latin' );
	} );
} );
