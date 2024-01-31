<?php

class TypekitTheme {

	const CSS_INHERIT_FONT_VALUE_RX = '/inherit/i';
	const CSS_NAMED_FONT_VALUE_RX = '/caption|icon|menu|message-box|small-caption|status-bar/i';
	const CSS_FONT_VALUE_RX = '/^\s*(((?P<style>normal|italic|oblique)|(?P<variant>normal|small-caps|inherit)|(?P<weight>normal|bold|\d{3}))\s+)*(?P<size>[^\/\s]+)(?P<lineheight>\s*\/\s*[^\s]+)?\s+(?P<family>.+)$/si';

	public static $rules_dependency;
	public static $allowed_categories = array();

	public static function add_font_category_rule( $category_rules, $category_id, $selector, $declarations = array(), $media_queries = array() ) {
		$selector = preg_replace( "/[\n\t]+/", ' ', trim( $selector ) );

		if ( empty( $declarations ) || ! in_array( $category_id, self::$allowed_categories ) ) {
			return;
		}

		$declarations = self::maybe_split_font_shorthand( $declarations );

		// We'll wind up with an empty declaration for `font: inherit` rules.
		// Empty rules throw Exceptions.
		if ( empty( $declarations ) ) {
			return;
		}

		$rule = array(
			'type' =>     $category_id,
			'selector' => $selector,
			'rules' =>    $declarations
		);

		if ( ! empty( $media_queries ) ) {
			$rule['media_query'] = $media_queries[0];
		}
		try {
			self::$rules_dependency->add_rule( $rule );
		} catch ( Exception $e ) {
			a8c_irc( 'font-exceptions', 'Exception: ' . $e->getMessage() );
			a8c_irc( 'font-exceptions', 'Rule: ' . json_encode( $rule ) );
		}

	}

	private static function maybe_split_font_shorthand( $declarations ) {
		$split_declations = array();
		foreach ( $declarations as $i => $declaration ) {
			if ( isset( $declaration['property'] ) && 'font' === $declaration['property'] ) {
				$split_declation = self::split_font_shorthand( $declaration['value'] );
				if ( ! empty( $split_declation ) ) {
					$split_declations = array_merge( $split_declations, $split_declation );
				}
				unset( $declarations[ $i ] );
			}
		}

		if ( ! empty( $split_declations ) ) {
			$declarations = array_merge( $declarations, $split_declations );
		}

		return $declarations;
	}

	private static function split_font_shorthand( $value ) {
		$value = trim( $value );
		$parts = array(
			'font-size' => 'medium',
			'font-style' => 'normal',
			'font-weight' => 'normal',
		);

		// Check for inherits value
		if ( preg_match( self::CSS_INHERIT_FONT_VALUE_RX, $value ) ) {
			return array();
		}
		// Check for named shortcuts
		if ( preg_match( self::CSS_NAMED_FONT_VALUE_RX, $value ) ) {
			return $parts;
		}
		// Split the value up into constituent pieces
		$matches = array();
		if ( preg_match( self::CSS_FONT_VALUE_RX, $value, $matches ) ) {
			if ( !empty( $matches['family'] ) )  $parts['font-family']  = $matches['family'];
			if ( !empty( $matches['size'] ) )    $parts['font-size']    = $matches['size'];
			if ( !empty( $matches['style'] ) )   $parts['font-style']   = $matches['style'];
			if ( !empty( $matches['weight'] ) )  $parts['font-weight']  = $matches['weight'];
		}
		$rules = array();
		foreach ( $parts as $property => $value ) {
			array_push( $rules, array( 'property' => $property, 'value' => $value ) );
		}
		return $rules;
	}

}
