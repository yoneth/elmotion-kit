<?php
/**
 * Plugin Name: El MotionKit
 * Description: El Motion Kit brings a collection of beautifully crafted Elementor widgets and site enhancements to elevate your website’s visual appeal and interactivity. Designed for creativity and smooth animations, this plugin helps you build engaging user experiences with ease.
 * Version:     2.5.2
 * Author:      deTheme
 * Author URI:  https://darrelwilson.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Original Plugin:         Animation Addons for Elementor (Free) and
 *                         Animation Addons Pro (commercial) by Wealcoder / Amelia Rose
 * Original Free URI:       https://animation-addons.com/
 * Original Pro:            commercial license, https://animation-addons.com/
 *
 * El MotionKit is a fork / from-scratch modification of the GPL-licensed
 * Animation Addons for Elementor codebase. Portions that originally derived
 * from the commercial Animation Addons Pro have been removed or rewritten
 * from scratch against the public Elementor 4 controls API and the GSAP 3
 * documentation; no proprietary code from the commercial product ships
 * with this distribution.
 *
 * Original copyright (c) 2024, Wealcoder / Amelia Rose
 * Modifications (c) 2025, deTheme
 * Text Domain: el-motionkit
 * Domain Path: /languages
 * Requires Plugins: elementor
 * Elementor tested up to: 3.30.0
 * Elementor Pro tested up to: 3.30.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly

if ( ! defined( 'EMK_DASHBOARD_V2' ) ) {
	define( 'EMK_DASHBOARD_V2', true);
}

if ( ! defined( 'EMK_VERSION' ) ) {
	/**
	 * Plugin Version.
	 */
	define( 'EMK_VERSION', '2.5.2' );
}
if ( ! defined( 'EMK_FILE' ) ) {
	/**
	 * Plugin File Ref.
	 */
	define( 'EMK_FILE', __FILE__ );
}
if ( ! defined( 'EMK_BASE' ) ) {
	/**
	 * Plugin Base Name.
	 */
	define( 'EMK_BASE', plugin_basename( EMK_FILE ) );
}
if ( ! defined( 'EMK_PATH' ) ) {
	/**
	 * Plugin Dir Ref.
	 */
	define( 'EMK_PATH', plugin_dir_path( EMK_FILE ) );
}
if ( ! defined( 'EMK_URL' ) ) {
	/**
	 * Plugin URL.
	 */
	define( 'EMK_URL', plugin_dir_url( EMK_FILE ) );
}
if ( ! defined( 'EMK_WIDGETS_PATH' ) ) {
	/**
	 * Widgets Dir Ref.
	 */
	define( 'EMK_WIDGETS_PATH', EMK_PATH . 'widgets/' );
}

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
	require __DIR__ . '/vendor/autoload.php';
}

/**
 * Main EMK Plugin Class
 *
 * The init class that runs the Hello World plugin.
 * Intended To make sure that the plugin's minimum requirements are met.
 *
 * You should only modify the constants to match your plugin's needs.
 *
 * Any custom code should go inside Plugin Class in the plugin.php file.
 *
 * @since 1.2.0
 */
final class EMK_Plugin_Pro {

	/**
	 * Plugin Version
	 *
	 * @since 1.0.0
	 * @var string The plugin version.
	 */
	const VERSION = '2.4.0';

	/**
	 * Minimum Elementor Version
	 *
	 * @since 1.0.0
	 * @var string Minimum Elementor version required to run the plugin.
	 */
	const MINIMUM_ELEMENTOR_VERSION = '3.27.0';

	/**
	 * Minimum PHP Version
	 *
	 * @since 1.2.0
	 * @var string Minimum PHP version required to run the plugin.
	 */
	const MINIMUM_PHP_VERSION = '7.4';

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function __construct() {

		register_activation_hook( EMK_BASE, [ __CLASS__, 'plugin_activation_hook' ] );
		register_activation_hook( EMK_BASE, [ __CLASS__, 'default_widgets_activation' ] );
		register_uninstall_hook( EMK_BASE, [ __CLASS__, 'plugin_deactivation_hook' ] );
		add_action('admin_enqueue_scripts', [$this,'enqueue_elementor_install_script']);
		add_action('wp_ajax_emk_install_elementor_plugin', [$this,'install_elementor_plugin_handler']);
		// Init Plugin
		add_action( 'plugins_loaded', array( $this, 'init' ) );		
		add_action( 'admin_notices', array( $this, 'admin_notice_missing_main_plugin' ) );
	}

	/**
	 * Plugin activation hook
	 *
	 * @since 1.0.0
	 */
	public static function plugin_activation_hook() {
		//set setup wizard
		if ( !get_option( 'emk_addons_version' ) && !get_option( 'emk_addons_setup_wizard' ) ) {
			update_option( 'emk_addons_setup_wizard', 'redirect' );
		}

		flush_rewrite_rules();
	}

	/**
	 * Default Widgets Activation hook
	 *
	 * @since 1.0.0
	 */
	public static function default_widgets_activation() {
		$option_name = 'emk_save_widgets';
		
		$default_value = array(
			'text-hover-image' => true,
			'marquee' => true,
			'animated-title' => true,
			'animated-text' => true,
		);
		
		$current_value = get_option($option_name);
		
		if (false === $current_value || !is_array($current_value)) {
			update_option($option_name, $default_value);
			error_log('El MotionKit Widgets Option initialized with default values');
		}
	}

	/**
	 * Plugin deactivation hook
	 *
	 * @since 1.0.0
	 */
	public static function plugin_deactivation_hook() {

	}

	/**
	 * Initialize the plugin
	 *
	 * Validates that Elementor is already loaded.
	 * Checks for basic plugin requirements, if one check fail don't continue,
	 * if all check have passed include the plugin class.
	 *
	 * Fired by `plugins_loaded` action hook.
	 *
	 * @since 1.2.0
	 * @access public
	 */
	public function init() {

		// Check if Elementor installed and activated
		if ( ! did_action( 'elementor/loaded' ) ) {			
			return;
		}

		// Check for required Elementor version
		if ( ! version_compare( ELEMENTOR_VERSION, self::MINIMUM_ELEMENTOR_VERSION, '>=' ) ) {
			add_action( 'admin_notices', array( $this, 'admin_notice_minimum_elementor_version' ) );

			return;
		}

		// Check for required PHP version
		if ( version_compare( PHP_VERSION, self::MINIMUM_PHP_VERSION, '<' ) ) {
			add_action( 'admin_notices', array( $this, 'admin_notice_minimum_php_version' ) );

			return;
		}

		add_action( 'wp_loaded', function () {
			// Set current version to DB
			if ( get_option( 'emk_addons_version' ) !== EMK_VERSION ) {
				// Update plugin version
				update_option( 'emk_addons_version', EMK_VERSION );
			}
		
			// Sanitize and check the 'page' parameter
			
		} );
		
		add_action( 'current_screen', function ( $screen ) {
			// Check if user has required capabilities
			
			if ( current_user_can( 'manage_options' ) && $screen->id === 'emk_dashboard_page_page_emk_dashboard_settings' ) {
				// Redirect if setup is incomplete
				if ( 'complete' !== get_option( 'emk_addons_setup_wizard' ) ) {
					wp_safe_redirect( admin_url( 'admin.php?page=emk_dashboard_setup_page' ) );
					exit; // Always exit after redirection
				}
			}
		});
		
		// Preload the trait so `use \EMK\EMK_Extension_Widgets_Trait;` inside
		// class-plugin.php resolves at parse time. Without this, fresh
		// installs hit "Trait not found" because no autoloader registers
		// the EMK namespace. Dev sites mask this because opcache caches
		// the file after the first successful request — but the first
		// request still fails.
		require_once __DIR__ . '/inc/EMK_Extension_Widgets_Trait.php';
		require_once 'class-plugin.php';

		// EMK plugins loaded
		do_action( 'emk_plugins_loaded' );
	}

	/**
	 * Admin notice
	 *
	 * Warning when the site doesn't have Elementor installed or activated.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function admin_notice_missing_main_plugin() {
	     
		if ( !is_plugin_active('elementor/elementor.php') ) {
			echo '<div class="notice notice-error" id="elementor-install-notice">';
			echo '<p><strong>El MotionKit</strong> requires Elementor plugin to be installed and activated.</p>';
			echo '<p><button id="emk-install-elementor" class="button button-primary">Install and Activate Elementor</button></p>';
			echo '</div>';
		}
	}
	
	function enqueue_elementor_install_script() {
		wp_enqueue_style( 'aaeaddon-common', EMK_URL . 'assets/css/emk-admin.min.css' );

		// Check if the plugin is not active
		if ( !is_plugin_active('elementor/elementor.php') ) {
			wp_enqueue_script(
				'emk-install-elementor-script',
				plugin_dir_url(__FILE__) . 'assets/js/install-elementor.js', // Replace with your JS file path
				['jquery'], // Dependencies
				'2.1', // Version
				true // Load in footer
			);
	
			// Localize script to pass AJAX data
			wp_localize_script('emk-install-elementor-script', 'emkElementorAjax', [
				'ajax_url'    => admin_url('admin-ajax.php'),
				'nonce'       => wp_create_nonce('emk_install_elementor_nonce'),
			]);
		}
	}
	
	function install_elementor_plugin_handler() {
		// Verify the AJAX nonce for security
		check_ajax_referer('emk_install_elementor_nonce', '_ajax_nonce');

		if (!current_user_can('activate_plugins')) {
			wp_send_json_error(['message' => esc_html__('Plugin Activation Permission Required, Contact Admin', 'el-motionkit')]);
        }
		
		// Include required WordPress files
		if (!class_exists('Plugin_Upgrader')) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		}
		if (!class_exists('WP_Ajax_Upgrader_Skin')) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-ajax-upgrader-skin.php';
		}
		if (!function_exists('plugins_api')) {
			require_once ABSPATH . 'wp-admin/includes/plugin-install.php'; // Include the plugins_api function
		}
	
		$plugin_slug = 'elementor';
		$plugin_file = 'elementor/elementor.php';
	
		// Check if the plugin is already active
		if (is_plugin_active($plugin_file)) {
			wp_send_json_success(['message' => esc_html__('Plugin is already active.', 'el-motionkit')]);
		}
		
		// Fetch plugin information dynamically using the WordPress Plugin API
		$api = plugins_api('plugin_information', [
			'slug'   => $plugin_slug,
			'fields' => [
				'sections' => false,
			],
		]);
	
		if (is_wp_error($api)) {
			wp_send_json_error(['message' => esc_html__('Failed to retrieve plugin information.', 'el-motionkit')]);
		}
	
		// Get the download URL for the plugin
		$download_url = $api->download_link;
	
		if (empty($download_url)) {
			wp_send_json_error(['message' => esc_html__('Failed to retrieve plugin download URL.', 'el-motionkit')]);
		}
	
		// Install the plugin using the retrieved download URL
		$upgrader = new Plugin_Upgrader(new WP_Ajax_Upgrader_Skin());
		$installed = $upgrader->install($download_url);
	
		if (is_wp_error($installed)) {			
			wp_send_json_error(['message' => $installed->get_error_message()]);
		}
	
		// Activate the plugin if installed successfully
		if (file_exists(WP_PLUGIN_DIR . '/' . $plugin_file)) {
			$activated = activate_plugin($plugin_file);
	
			if (is_wp_error($activated)) {			
				wp_send_json_error(['message' => $activated->get_error_message()]);
			}
	
			wp_send_json_success(['message' => esc_html__('Elementor has been successfully installed and activated.', 'el-motionkit')]);
		}
	
		// If the plugin file is not found, send an error
		wp_send_json_error(['message' => esc_html__('Plugin installation failed.', 'el-motionkit')]);
	}
	
	

	/**
	 * Admin notice
	 *
	 * Warning when the site doesn't have a minimum required Elementor version.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function admin_notice_minimum_elementor_version() {
		if (!current_user_can('activate_plugins')) {
            return;
        }

		$message = sprintf(
		/* translators: 1: Plugin name 2: Elementor 3: Required Elementor version */
			esc_html__( '"%1$s" requires "%2$s" version %3$s or greater.', 'el-motionkit' ),
			'<strong>' . esc_html__( 'El MotionKit', 'el-motionkit' ) . '</strong>',
			'<strong>' . esc_html__( 'Elementor', 'el-motionkit' ) . '</strong>',
			self::MINIMUM_ELEMENTOR_VERSION
		);

		printf( '<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', wp_kses_post( $message ) );
	}

	/**
	 * Admin notice
	 *
	 * Warning when the site doesn't have a minimum required PHP version.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function admin_notice_minimum_php_version() {
		if (!current_user_can('activate_plugins')) {
            return;
        }

		$message = sprintf(
		/* translators: 1: Plugin name 2: PHP 3: Required PHP version */
			esc_html__( '"%1$s" requires "%2$s" version %3$s or greater.', 'el-motionkit' ),
			'<strong>' . esc_html__( 'El MotionKit', 'el-motionkit' ) . '</strong>',
			'<strong>' . esc_html__( 'PHP', 'el-motionkit' ) . '</strong>',
			self::MINIMUM_PHP_VERSION
		);

		printf( '<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', wp_kses_post( $message ) );
	}
}

// Instantiate EMK_Plugin_Pro.
new EMK_Plugin_Pro();
