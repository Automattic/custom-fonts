<?php
/**
 * This isn't an actual font provider, but helper scripts to handle the mapping of sunsetted typekit fonts
 * to Google font equivalents.
 */

class Jetpack_Fonts_Typekit_Font_Mapper {

	private static $mappings = array(
		'gjst' => array( // Abril Text.
			'id'            => 'Merriweather',
			'cssName'       => 'Merriweather',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'gmsj' => array( // Adelle, AdelleWeb.
			'id'            => 'Arvo',
			'cssName'       => 'Arvo',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'sskw' => array( // Ambroise Std.
			'id'            => 'Playfair+Display',
			'cssName'       => 'Playfair Display',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'tsyb' => array( // Arvo.
			'id'            => 'Arvo',
			'cssName'       => 'Arvo',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'yvxn' => array( // Brandon Grotesque.
			'id'            => 'Nunito',
			'cssName'       => 'Nunito',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n2', 'i2', 'n3', 'i3', 'n4', 'i4', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8', 'n9', 'i9' ),
		),
		'ymzk' => array( // Bree, BreeWeb ??. 
			'id'            => 'Amaranth',
			'cssName'       => 'Amaranth',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'vybr' => array( // Calluna.
			'id'            => 'EB+Garamond',
			'cssName'       => 'EB Garamond',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8' ),
		),
		'wgzc' => array( // Calluna Sans.
			'id'            => 'Lato',
			'cssName'       => 'Lato',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'hrpf' => array( // Chaparral Pro.
			'id'            => 'Merriweather',
			'cssName'       => 'Merriweather',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'klcb' => array( // Chunk ??.
			'id'            => 'Bevan',
			'cssName'       => 'Bevan',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4' ),
		),
		'drjf' => array( // Coquette ??.
			'id'            => 'Redressed',
			'cssName'       => 'Redressed',
			'genericFamily' => 'cursive',
			'fvds'          => array( 'n4' ),
		),
		'snqb' => array( // FF Basic Gothic, FF Basic Gothic Pro, FF Basic Gothic Web Pro.
			'id'            => 'Work+Sans',
			'cssName'       => 'Work Sans',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n8' ),
		),
		'rlxq' => array( // FF Dagny Pro, FF Dagny Web Pro.
			'id'            => 'Roboto',
			'cssName'       => 'Roboto',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n3', 'i3', 'n5', 'i5', 'n7', 'i7', 'n9', 'i9' ),
		),
		'fytf' => array( // FF Market Web.
			'id'            => 'Allan',
			'cssName'       => 'Allan',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'n7' ),
		),
		'rrtc' => array( // FF Meta Serif Web.
			'id'            => 'Merriweather',
			'cssName'       => 'Merriweather',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'brwr' => array( // FF Meta, FF Meta Web Pro.
			'id'            => 'Fira+Sans',
			'cssName'       => 'Fira Sans',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n2', 'i2', 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8', 'n9', 'i9' ),
		),
		'xwmz' => array( // FF Tisa Pro, FF Tisa Web Pro.
			'id'            => 'Merriweather',
			'cssName'       => 'Merriweather',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'pzyv' => array( // Fertigo Pro ??.
			'id'            => 'Overlock',
			'cssName'       => 'Overlock',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'twbx' => array( // Fertigo Script, Fertigo Pro Script ??.
			'id'            => 'Cookie',
			'cssName'       => 'Cookie',
			'genericFamily' => 'cursive',
			'fvds'          => array( 'n4' ),
		),
		'ftnk' => array( // Futura PT.
			'id'            => 'Cabin',
			'cssName'       => 'Cabin',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7' ),
		),
		'gmvz' => array( // Inconsolata.
			'id'            => 'Space+Mono',
			'cssName'       => 'Space Mono',
			'genericFamily' => 'monospace',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'ttyp' => array( // JAF Facit, JAF Facit Web, Facit Web.
			'id'            => 'Rubik',
			'cssName'       => 'Rubik',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n7', 'i7', 'n9', 'i9' ),
		),
		'lmgn' => array( // JAF Herb Condensed, Herb Condensed ??.
			'id'            => 'Almendra',
			'cssName'       => 'Almendra',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'cwfk' => array( // Jubilat ??.
			'id'            => 'Aleo',
			'cssName'       => 'Aleo',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n7', 'i7' ),
		),
		'jgfl' => array( // Kaffeesatz.
			'id'            => 'Oswald',
			'cssName'       => 'Oswald',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n2', 'n3', 'n4', 'n6', 'n7' ),
		),
		'vyvm' => array( // LFT Etica Display, LFT Etica Display Web, Etica Display.
			'id'            => 'Overpass',
			'cssName'       => 'Overpass',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n2', 'i2', 'n3', 'i3', 'n4', 'i4', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8', 'n9', 'i9' ),
		),
		'mrnw' => array( // LTC Bodoni, LTC Bodoni 175 ??.
			'id'            => 'Prata',
			'cssName'       => 'Prata',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4' ),
		),
		'kmpm' => array( // League Gothic ??.
			'id'            => 'Oswald',
			'cssName'       => 'Oswald',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n2', 'n3', 'n4', 'n6', 'n7' ),
		),
		'nljb' => array( // Minion Pro.
			'id'            => 'EB+Garamond',
			'cssName'       => 'EB Garamond',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8' ),
		),
		'htrh' => array( // Museo ??.
			'id'            => 'Averia+Serif+Libre',
			'cssName'       => 'Averia Serif Libre',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n7', 'i7' ),
		),
		'ycvr' => array( // Museo Sans.
			'id'            => 'Raleway',
			'cssName'       => 'Raleway',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n2', 'i2', 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8', 'n9', 'i9' ),
		),
		'llxb' => array( // Museo Slab.
			'id'            => 'Arvo',
			'cssName'       => 'Arvo',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'mpmb' => array( // Omnes Pro ??.
			'id'            => 'Varela+Round',
			'cssName'       => 'Varela Round',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4' ),
		),
		'vcsm' => array( // Proxima Nova.
			'id'            => 'Montserrat',
			'cssName'       => 'Montserrat',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n2', 'i2', 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8', 'n9', 'i9' ),
		),
		'ccqc' => array( // Puritan.
			'id'            => 'Lato',
			'cssName'       => 'Lato',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'nqdy' => array( // Raleway.
			'id'            => 'Raleway',
			'cssName'       => 'Raleway',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n2', 'i2', 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8', 'n9', 'i9' ),
		),
		'wktd' => array( // Skolar Latin ??.
			'id'            => 'Source+Serif+Pro',
			'cssName'       => 'Source Serif Pro',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'n6', 'n7' ),
		),
		'yrwy' => array( // Sorts Mill Goudy.
			'id'            => 'EB+Garamond',
			'cssName'       => 'EB Garamond',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8' ),
		),
		'fkjd' => array( // Tekton Pro ??.
			'id'            => 'Shadows+Into+Light+Two',
			'cssName'       => 'Shadows Into Light Two',
			'genericFamily' => 'cursive',
			'fvds'          => array( 'n4' ),
		),
		'plns' => array( // Tinos ??.
			'id'            => 'Tinos',
			'cssName'       => 'Tinos',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'fbln' => array( // Anonymous Pro.
			'id'            => 'Anonymous+Pro',
			'cssName'       => 'Anonymous Pro',
			'genericFamily' => 'monospace',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'nlwf' => array( // Arimo.
			'id'            => 'Roboto',
			'cssName'       => 'Roboto',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n3', 'i3', 'n5', 'i5', 'n7', 'i7', 'n9', 'i9' ),
		),
		'gkmg' => array( // Droid Sans.
			'id'            => 'Lato',
			'cssName'       => 'Lato',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'vqgt' => array( // Droid Sans Mono.
			'id'            => 'Space+Mono',
			'cssName'       => 'Space Mono',
			'genericFamily' => 'monospace',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'pcpv' => array( // Droid Serif.
			'id'            => 'Merriweather',
			'cssName'       => 'Merriweather',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'gckq' => array( // Eigerdals.
			'id'            => 'Rubik',
			'cssName'       => 'Rubik',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n7', 'i7', 'n9', 'i9' ),
		),
		'vyvm' => array( // LFT Etica.
			'id'            => 'Rubik',
			'cssName'       => 'Rubik',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n7', 'i7', 'n9', 'i9' ),
		),
		'gwsq' => array( // FF Brokenscript, FF Brokenscript BC Web, FF Brokenscript Web Condensed ??.
			'id'            => 'Pirata+One',
			'cssName'       => 'Pirata One',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4' ),
		),
		'dbqg' => array( // FF Dax Pro, FF Dax Web Pro.
			'id'            => 'Fira+Sans',
			'cssName'       => 'Fira Sans',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n2', 'i2', 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8', 'n9', 'i9' ),
		),
		'sbsp' => array( // FF Praterblock Web ??.
			'id'            => 'Ruda',
			'cssName'       => 'Ruda',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'n7', 'n9' ),
		),
		'rgzb' => array( // FF Netto Web ??.
			'id'            => 'Baloo+Tamma',
			'cssName'       => 'Baloo Tamma',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4' ),
		),
		'rvnd' => array( // JAF Lapture, Lapture.
			'id'            => 'Merriweather',
			'cssName'       => 'Merriweather',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'mvgb' => array( // Le Monde Journal, Le Monde Journal Std ??.
			'id'            => 'PT+Serif',
			'cssName'       => 'PT Serif',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'rshz' => array( // Le Monde Sans, Le Monde Sans Std.
			'id'            => 'Roboto',
			'cssName'       => 'Roboto',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n3', 'i3', 'n5', 'i5', 'n7', 'i7', 'n9', 'i9' ),
		),
		'zsyz' => array( // Liberation Sans.
			'id'            => 'Rubik',
			'cssName'       => 'Rubik',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n7', 'i7', 'n9', 'i9' ),
		),
		'lcny' => array( // Liberation Serif ??.
			'id'            => 'Crimson+Text',
			'cssName'       => 'Crimson Text',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n6', 'i6', 'n7', 'i7' ),
		),
		'jtcj' => array( // Open Sans.
			'id'            => 'Open+Sans',
			'cssName'       => 'Open Sans',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8' ),
		),
		'rfss' => array( // Orbitron ??.
			'id'            => 'Orbitron',
			'cssName'       => 'Orbitron',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'n5', 'n7', 'n9' ),
		),
		'xcqq' => array( // PT Serif ??.
			'id'            => 'PT+Serif',
			'cssName'       => 'PT Serif',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'snjm' => array( // Refrigerator Deluxe ??.
			'id'            => 'Aldrich',
			'cssName'       => 'Aldrich',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4' ),
		),
		'rtgb' => array( // Ronnia, Ronnia Web ??.
			'id'            => 'Ubuntu',
			'cssName'       => 'Ubuntu',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n5', 'i5' ),
		),
		'hzlv' => array( // Ronnia condensed, Ronnia web condensed ??.
			'id'            => 'Ubuntu+Condensed',
			'cssName'       => 'Ubuntu Condensed',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4' ),
		),
		'wbmp' => array( // Skolar, Skolar Web ??.
			'id'            => 'Source+Serif+Pro',
			'cssName'       => 'Source Serif Pro',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'n6', 'n7' ),
		),
		'mkrf' => array( // Snicker ??.
			'id'            => 'Amaranth',
			'cssName'       => 'Amaranth',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'qlvb' => array( // Sommet Slab ??.
			'id'            => 'Zilla+Slab',
			'cssName'       => 'Zilla Slab',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n5', 'i5', 'n6', 'i6', 'n7', 'i7' ),
		),
		'bhyf' => array( // Source Sans Pro.
			'id'            => 'Lato',
			'cssName'       => 'Lato',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'jhhw' => array( // Ubuntu.
			'id'            => 'Overpass',
			'cssName'       => 'Overpass',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n2', 'i2', 'n3', 'i3', 'n4', 'i4', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8', 'n9', 'i9' ),
		),
		'fallback' => array( // Fallback if no matching typekit code found.
			'id'            => 'Open+Sans',
			'cssName'       => 'Open Sans',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n3', 'i3', 'n4', 'i4', 'n6', 'i6', 'n7', 'i7', 'n8', 'i8' ),
		),
	);

	public static function get_mapped_google_font( $font ) {
		$mapped_font = array_key_exists( $font['id'], self::$mappings ) ? self::$mappings[ $font['id'] ] : self::$mappings['fallback'];

		$new_font = array(
			'id'            => $mapped_font['id'],
			'provider'      => 'google',
			'cssName'       => $mapped_font['cssName'],
			'genericFamily' => $mapped_font['genericFamily'],
			'type'          => $font['type'],
		);

		if ( isset( $font['currentFvd'] ) ) {
			$new_fvd = self::valid_or_closest_fvd_for_font( $font['currentFvd'], $mapped_font['fvds'] );

			if ( null !== $new_fvd ) {
				$new_font['currentFvd'] = $new_fvd;
			}
		}

		if ( isset( $font['size'] ) ) {
			$new_font['size'] = $font['size'];
		}

		return $new_font;
	}

	/**
	 * Returns the valid desired fvd, or the closest available one, for the selected font.
	 *
	 * @param  string $fvd the fvd.
	 * @param  array  $fvds the font's allowed fvds.
	 * @return string The valid or closest fvd for the font.
	 */
	public static function valid_or_closest_fvd_for_font( $fvd, $fvds ) {
		if ( in_array( $fvd, $fvds ) ) {
			return $fvd;
		}

		$cycle_down       = null;
		$cycle_down_found = null;
		$cycle_up         = null;
		$cycle_up_found   = null;

		// Cycle up.
		$prefix = $fvd[0];
		$value  = (int) $fvd[1];
		$i      = $value;
		while ( $i < 9 ) {
			$i++;
			$cycle_up = $prefix . $i;
			if ( in_array( $cycle_up, $fvds ) ) {
				$cycle_up_found = true;
				break;
			}
		}

		// Cycle down.
		$i = $value;
		while ( $i > 1 ) {
			$i--;
			$cycle_down = $prefix . $i;
			if ( in_array( $cycle_down, $fvds ) ) {
				$cycle_down_found = true;
				break;
			}
		}

		if ( $cycle_up_found && ! $cycle_down_found ) {
			return $cycle_up;
		}

		if ( $cycle_down_found && ! $cycle_up_found ) {
			return $cycle_down;
		}

		if ( $cycle_down_found && $cycle_up_found ) {
			$up_difference   = (int) $cycle_up[1] - $value;
			$down_difference = $value - (int) $cycle_down[1];

			return ( $up_difference <= $down_difference ) ? $cycle_up : $cycle_down;
		}
	}
}
