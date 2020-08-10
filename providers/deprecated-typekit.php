<?php
/**
 * This isn't an actual font provider, but helper scripts to handle the mapping of sunsetted typekit fonts
 * Google font equivalents.
 */

class Jetpack_Fonts_Typekit_Font_Mapper {

	private static $mappings = array(
		'gmsj' => array(
			'id'            => 'Roboto+Slab',
			'cssName'       => 'Roboto Slab',
			'provider'      => 'google',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n1', 'n3', 'n4', 'n7' ),
		),
		'gjst' => array(
			'id'            => 'Lora',
			'cssName'       => 'Lora',
			'provider'      => 'google',
			'genericFamily' => 'serif',
			'fvds'          => array( 'n4', 'i4', 'n7', 'i7' ),
		),
	);

	public static function get_mapped_google_font( $font ) {
		if ( array_key_exists( $font['id'], self::$mappings ) ) {
			$mapped_font = self::$mappings[ $font['id'] ];
			if ( isset( $font['currentFvd'] ) ) {
				$mapped_font['currentFvd'] = self::valid_or_closest_fvd_for_font( $font['currentFvd'], $mapped_font['fvds'] );
			}
			unset( $mapped_font['fvds'] );
			if ( isset( $font['size'] ) ) {
				$mapped_font['size'] = $font['size'];
			}
			$mapped_font['type'] = $font['type'];
			return $mapped_font;
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