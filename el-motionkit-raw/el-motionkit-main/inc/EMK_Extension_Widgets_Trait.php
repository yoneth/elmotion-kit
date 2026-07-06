<?php

namespace EMK;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly

trait EMK_Extension_Widgets_Trait {

	/**
	 * Get Widgets List.
	 *
	 * @return array
	 */
	public static function get_widgets() {
	
		$widgets = get_option( 'emk_save_widgets' );		
		$saved_widgets = is_array($widgets) ? array_keys( $widgets ) : []; 
		
		emk_get_search_active_keys($GLOBALS['emk_config']['widgets'], $saved_widgets, $foundKeys, $awidgets);
		
		return is_array($awidgets) ? $awidgets : [];
	}

	/**
	 * Get Extension List.
	 *
	 * @return array
	 */
	public static function get_extensions() {
	
		$extensions = get_option( 'emk_save_extensions' );
		$saved_extensions = is_array($extensions) ? array_keys( $extensions ) : [];
		
        emk_get_search_active_keys($GLOBALS['emk_config']['extensions'], $saved_extensions, $foundKeys, $active);
	   
		return is_array($active) ? $active : [];
	}


}
