<?php
/**
 * This isn't an actual font provider, but helper scripts to handle the mapping of sunsetted typekit fonts
 * Google font equivalents.
 */

class Jetpack_Fonts_Typekit_Font_Mapper {

	private static $mappings = array(
		'gjst' => array(
			'id'            => 'Lora',
			'cssName'       => 'Lora',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'gmsj' => array(
			'id'            => 'Roboto+Slab',
			'cssName'       => 'Roboto Slab',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n1', 'n3', 'n4', 'n7' ),
		),
		'sskw' => array(
			'id'            => 'Old+Standard+TT',
			'cssName'       => 'Old Standard TT',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7' ),
		),
		'tsyb' => array(
			'id'            => 'Arvo',
			'cssName'       => 'Arvo',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'yvxn' => array(
			'id'            => 'Lato',
			'cssName'       => 'Lato',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n1', 'i1', 'n3', 'i3', 'n4', 'i4', 'n7', 'i7', 'n9', 'i9' ),
		),
		'ymzk' => array(
			'id'            => 'Amaranth',
			'cssName'       => 'Amaranth',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
		'vybr' => array(
			'id'            => 'Crimson+Text',
			'cssName'       => 'Crimson Text',
			'genericFamily' => 'sans-serif',
			'fvds'          => array( 'n4', 'i4', 'n6', 'i6', 'n7', 'i7' ),
		),
	);

	public static function get_mapped_google_font( $font ) {
		if ( array_key_exists( $font['id'], self::$mappings ) ) {
			$mapped_font = self::$mappings[ $font['id'] ];
			$new_font    = array(
				'id'            => $mapped_font['id'],
				'provider'      => 'google',
				'cssName'       => $mapped_font['cssName'],
				'genericFamily' => $mapped_font['genericFamily'],
				'type'          => $font['type'],
			);

			if ( isset( $font['currentFvd'] ) ) {
				$new_font['currentFvd'] = self::valid_or_closest_fvd_for_font( $font['currentFvd'], $mapped_font['fvds'] );
			}

			if ( isset( $font['size'] ) ) {
				$new_font['size'] = $font['size'];
			}

			return $new_font;
		}
	}

	/**
	 * Returns the valid desired fvd, or the closest available one, for the selected font
	 * @param  string $fvd the fvd
	 * @param  string $fvds the font's allowed fvds
	 * @return string The valid or closest fvd for the font
	 */
	private static function valid_or_closest_fvd_for_font( $fvd, $fvds ) {
		if ( in_array( $fvd, $fvds ) ) {
			return $fvd;
		}
		// try n4
		if ( in_array( 'n4', $fvds ) ) {
			return 'n4';
		}
		// cycle up
		$i = '1';
		while ( $i <= 9 ) {
			$try = 'n' . $i;
			$i++;
			if ( in_array( $try, $fvds ) ) {
				return $try;
			}
		}
		// shrug
		return $fvd;
	}
}