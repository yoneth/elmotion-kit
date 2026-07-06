<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly

use Elementor\Plugin;

if(function_exists('emk_set_postview')){
	add_action( 'wp_head', 'emk_set_postview' );
}


function emk_handle_post_shares_count() {
    if(!isset($_POST['nonce'])){
        exit( 'No naughty business please . Provide Security Code' );  
    }
    $nonce =  sanitize_text_field( wp_unslash($_POST['nonce']));
	if ( ! wp_verify_nonce( $nonce , 'emk-frontend' ) ) {
		exit( 'No naughty business please' );
	}
	
    if ( isset( $_POST['post_id'] ) && isset($_POST['social'])) {
        $post_id = intval( sanitize_text_field( wp_unslash($_POST['post_id'])) );
        $social = sanitize_text_field( wp_unslash($_POST['social']) );
        
        // Retrieve current share count, increment it, or set it if it doesn't exist
        $current_shares = get_post_meta( $post_id, 'emk_post_shares', true );
        if ( ! is_array( $current_shares ) ) {
            $current_shares = [];
        }
        if ( isset( $current_shares[ $social ] ) ) {
            $current_shares[ $social ]++;
        } else {
            $current_shares[ $social ] = 1;
        }
        
        $shares_count = array_sum( array_values($current_shares) );
	
    	foreach($current_shares as $k=> $single){
    		update_post_meta( $post_id, 'emk_post_shares_'.$k, $single );
    	}
	
        update_post_meta( $post_id, 'emk_post_shares_count', $shares_count );
        update_post_meta( $post_id, 'emk_post_shares', $current_shares );      

        // Return updated share count as a response
        wp_send_json_success( array(
            'share_count' => $shares_count,
            'post_shares' => $current_shares
        ) );
    } else {
        wp_send_json_error( 'Invalid post ID' );
    }
}
add_action( 'wp_ajax_emk_post_shares', 'emk_handle_post_shares_count' ); // For logged-in users
add_action( 'wp_ajax_nopriv_emk_post_shares', 'emk_handle_post_shares_count' ); // For non-logged-in users

function emk_disable_comments_for_custom_post_type() {
    remove_post_type_support( 'emk-template', 'comments' );
}
add_action( 'init', 'emk_disable_comments_for_custom_post_type' , 100);

function emk_custom_hide_admin_notices_for_specific_page() {   
    $screen = get_current_screen();   
    // ist of admin pages where you want to disable notices
    $pages_to_hide_notices = array(
        'emk-custom-fonts', 
        'emk-custom-icons', 
        'edit-emk-addons-template',
        'animation-addon_page_emk_dashboard_settings',
        'animation-addon_page_emk_dashboard_setup_page'
    );

    // Check if current screen ID matches any in the list
    if (in_array($screen->id, $pages_to_hide_notices)) {
        // Remove core and plugin notices
        remove_all_actions('admin_notices');
        remove_all_actions('all_admin_notices');
    }
}
add_action('admin_head', 'emk_custom_hide_admin_notices_for_specific_page');

