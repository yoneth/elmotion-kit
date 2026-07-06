<?php

namespace EMK;

use Elementor\Plugin as ElementorPlugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly

/**
 * Class Plugin
 *
 * Main Plugin class.
 *
 * This file is derived from Animation Addons for Elementor (free, GPL v2)
 * and Animation Addons Pro (commercial) by Wealcoder / Amelia Rose.
 * Portions that originally came from the commercial Pro product have been
 * removed or rewritten from scratch against the public Elementor 4 and
 * GSAP 3 APIs. No proprietary code from the commercial product is
 * distributed with El MotionKit.
 *
 * Original Animation Addons copyright (c) 2024, Wealcoder / Amelia Rose.
 * Modifications (c) 2025, deTheme.
 *
 * @since 1.2.0
 * @modified by deTheme for El MotionKit
 */
class Plugin {
	/**
	 * Plugin version.
	 *
	 * Holds the current plugin version.
	 *
	 * @access public
	 * @static
	 *
	 * @var string Plugin version.
	 */
	use \EMK\EMK_Extension_Widgets_Trait;
	


	/**
	 * Instance
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @var Plugin The single instance of the class.
	 */
	private static $instance = null;

	/**
	 * Instance
	 *
	 * Ensures only one instance of the class is loaded or can be loaded.
	 *
	 * @return Plugin An instance of the class.
	 * @since 1.2.0
	 * @access public
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Function lib_scripts
	 *
	 * Load required plugin core files.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public static function get_library_scripts() {

		// if ( ! get_option( 'emk_save_extensions' ) ) {
		// 	return [];
		// }

		$scripts = [
			'gsap'                 => [
				'handler' => 'gsap',
				'src'     => 'gsap.min.js',
				'dep'     => [],
				'version' => false,
				'arg'     => true,
			],
			// 'scroll-smoother'      => [
			// 	'handler' => 'ScrollSmoother',
			// 	'src'     => 'ScrollSmoother.min.js',
			// 	'dep'     => ['gsap', 'elementor-frontend', 'elementor-frontend-modules'],
			// 	'version' => false,
			// 	'arg'     => true,
			// ],
			'scroll-to'            => [
				'handler' => 'ScrollToPlugin',
				'src'     => 'ScrollToPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'Draggable'            => [
				'handler' => 'Draggable',
				'src'     => 'Draggable.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'scroll-trigger'       => [
				'handler' => 'ScrollTrigger',
				'src'     => 'ScrollTrigger.min.js',
				'dep'     => ['gsap','emk--addons-ex', 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => 3.13,
				'arg'     => true,
			],
			'split-text'           => [
				'handler' => 'SplitText',
				'src'     => 'SplitText.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'lottie'               => [
				'handler' => 'lottie',
				'src'     => 'lottie-player.js',
				'dep'     => [],
				'version' => false,
				'arg'     => true,
			],
			'lottie-interactivity' => [
				'handler' => 'lottie-interactivity',
				'src'     => 'lottie-interactivity.min.js',
				'dep'     => [],
				'version' => false,
				'arg'     => true,
			],
			// 'effect-panorama'      => [
			// 	'handler' => 'effect--panorama',
			// 	'src'     => 'effect-panorama.min.js',
			// 	'dep'     => [],
			// 	'version' => false,
			// 	'arg'     => true,
			// ],


			'EaselPlugin'      => [
				'handler' => 'EaselPlugin',
				'src'     => 'EaselPlugin.min.js',
				'dep'     => ['gsap', 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'MotionPathPlugin'      => [
				'handler' => 'MotionPathPlugin',
				'src'     => 'MotionPathPlugin.min.js',
				'dep'     => ['gsap', 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'Observer'      => [
				'handler' => 'Observer',
				'src'     => 'Observer.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'PixiPlugin'      => [
				'handler' => 'PixiPlugin',
				'src'     => 'PixiPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'TextPlugin'      => [
				'handler' => 'TextPlugin',
				'src'     => 'TextPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'DrawSVGPlugin'      => [
				'handler' => 'DrawSVGPlugin',
				'src'     => 'DrawSVGPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'Physics2DPlugin'      => [
				'handler' => 'Physics2DPlugin',
				'src'     => 'Physics2DPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'PhysicsPropsPlugin'      => [
				'handler' => 'PhysicsPropsPlugin',
				'src'     => 'PhysicsPropsPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'ScrambleTextPlugin'      => [
				'handler' => 'ScrambleTextPlugin',
				'src'     => 'ScrambleTextPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'GSDevTools'      => [
				'handler' => 'GSDevTools',
				'src'     => 'GSDevTools.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'InertiaPlugin'      => [
				'handler' => 'InertiaPlugin',
				'src'     => 'InertiaPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'MorphSVGPlugin'      => [
				'handler' => 'MorphSVGPlugin',
				'src'     => 'MorphSVGPlugin.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],
			'MotionPathHelper'      => [
				'handler' => 'MotionPathHelper',
				'src'     => 'MotionPathHelper.min.js',
				'dep'     => ['gsap' , 'elementor-frontend', 'elementor-frontend-modules'],
				'version' => false,
				'arg'     => true,
			],

		];


		// if ( ! defined( 'EMK_DASHBOARD_V2' ) ) {

		// 	if ( ! emk_get_settings( 'emk_save_extensions', 'emk-gsap' ) ) {
		// 		unset( $scripts['gsap'] );
		// 	}

		// 	if ( ! emk_get_settings( 'emk_save_extensions', 'emk-smooth-scroller' ) ) {
		// 		unset( $scripts['scroll-smoother'] );
		// 	}
		// }

		return $scripts;
	}

	/**
	 * Widget_scripts
	 *
	 * Load required plugin core files.
	 *
	 * @since 1.2.0
	 * @access public
	 */
	public function widget_scripts() {
		
		$scripts = [
			'emk-addons-core' => [
				'handler' => 'emk--addons',
				'src'     => 'emk-addons.min.js',
				'dep'     => [ 'jquery' ],
				'version' => false,
				'arg'     => true,
			],
		];

		foreach ( $scripts as $key => $script ) {
			wp_register_script( $script['handler'], plugins_url( '/assets/js/' . $script['src'], __FILE__ ), $script['dep'], $script['version'], $script['arg'] );
		}

		$data = apply_filters( 'emk/js/data', [
			'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
			'_wpnonce'       => wp_create_nonce( 'emk-frontend' ),
			'post_id'        => get_the_ID(),
			'i18n'           => [
				'okay'    => esc_html__( 'Okay', 'el-motionkit' ),
				'cancel'  => esc_html__( 'Cancel', 'el-motionkit' ),
				'submit'  => esc_html__( 'Submit', 'el-motionkit' ),
				'success' => esc_html__( 'Success', 'el-motionkit' ),
				'warning' => esc_html__( 'Warning', 'el-motionkit' ),
			],
			'smoothScroller' => json_decode( get_option( 'emk_smooth_scroller' ) ),
			'mode'			 => \Elementor\Plugin::$instance->editor->is_edit_mode(),
		] );
	
		wp_localize_script( 'emk--addons', 'EMK_ADDONS_JS', $data );

		wp_enqueue_script( 'emk--addons' );
		foreach ( self::get_library_scripts() as $key => $script ) {
			wp_register_script( $script['handler'], plugins_url( '/assets/lib/' . $script['src'], __FILE__ ), $script['dep'], $script['version'], $script['arg'] );
			wp_enqueue_script( $script['handler'] );

		}

		foreach ( self::get_widget_scripts() as $key => $script ) {
			$src_path  = EMK_PATH . 'assets/js/' . $script['src'];
			$file_ver  = file_exists( $src_path ) ? filemtime( $src_path ) : EMK_VERSION;
			wp_register_script( $script['handler'], plugins_url( '/assets/js/' . $script['src'], __FILE__ ), $script['dep'], $file_ver, $script['arg'] );
			wp_enqueue_script( $script['handler'] );
		}

		wp_enqueue_script(
			'emk-text-animation-shared',
			plugins_url( '/assets/js/emk-text-animation-shared.js', __FILE__ ),
			[ 'jquery', 'gsap', 'SplitText' ],
			file_exists( EMK_PATH . 'assets/js/emk-text-animation-shared.js' ) ? filemtime( EMK_PATH . 'assets/js/emk-text-animation-shared.js' ) : EMK_VERSION,
			true
		);
		wp_enqueue_script( 'emk--addons-ex' );
		$motion_src = EMK_PATH . 'assets/js/emk-motion.js';
		$motion_ver = file_exists( $motion_src ) ? filemtime( $motion_src ) : EMK_VERSION;
		wp_enqueue_script( 'emk--motion', plugins_url( '/assets/js/emk-motion.js', __FILE__ ), [ 'jquery', 'elementor-frontend', 'elementor-frontend-modules', 'gsap' ], $motion_ver, true );

		// EMK Shaders — enqueue small loader; heavy assets (paper-shaders + presets + runtime) fetched on-demand
		$loader_src  = EMK_PATH . 'assets/js/emk-shader-loader.js';
		$loader_ver  = file_exists( $loader_src ) ? filemtime( $loader_src ) : EMK_VERSION;
		wp_enqueue_script( 'emk-shader-loader', plugins_url( '/assets/js/emk-shader-loader.js', __FILE__ ), [ 'jquery', 'elementor-frontend', 'elementor-frontend-modules' ], $loader_ver, true );

		// EMK Motion FX (image + text animation handler)
		$fx_src  = EMK_PATH . 'assets/js/emk-motion-fx.js';
		$fx_ver  = file_exists( $fx_src ) ? filemtime( $fx_src ) : EMK_VERSION;
		wp_enqueue_script(
			'emk--motion-fx',
			plugins_url( '/assets/js/emk-motion-fx.js', __FILE__ ),
			[ 'jquery', 'gsap', 'ScrollTrigger', 'SplitText', 'elementor-frontend' ],
			$fx_ver,
			true
		);
		// Expose Elementor global colors as a JS map so the motion handler
		// can resolve `globals/colors?id=XXX` references at runtime
		// (Elementor 4.x strips __globals__ from data-settings before sending
		// to the frontend, but leaves a global ID we can look up).
		$emk_globals = $this->collect_elementor_global_colors();
		wp_add_inline_script( 'emk--motion', 'window.EMK_GLOBALS = ' . wp_json_encode( $emk_globals ) . ';', 'before' );
	}

	/**
	 * Collect Elementor global color and typography values so the
	 * frontend can resolve `globals/colors?id=XXXX` references.
	 * Reads the kit's settings option (Elementor Pro 4.x stores
		$emk_globals = $this->collect_elementor_global_colors();
		wp_add_inline_script( 'emk--motion', 'window.EMK_GLOBALS = ' . wp_json_encode( $emk_globals ) . ';', 'before' );
	}

	/**
	 * Read all Elementor global colors (system + custom) and expose
	 * them to the frontend as a flat ID -> hex map.
	 *
	 * Elementor 4.x stores global colors in the active kit's
	 * `_elementor_page_settings` option (as `system_colors` and
	 * `custom_colors` arrays, each entry has `_id`, `title`, `color`).
	 * We also include typography globals for completeness.
	 */
	private function collect_elementor_global_colors() {
		$out = [ 'colors' => [], 'typography' => [] ];
		$kit_id = (int) get_option( 'elementor_active_kit' );
		if ( ! $kit_id ) {
			return $out;
		}
		$kit_settings = get_post_meta( $kit_id, '_elementor_page_settings', true );
		if ( ! is_array( $kit_settings ) ) {
			return $out;
		}
		foreach ( [ 'system_colors', 'custom_colors' ] as $bucket ) {
			if ( ! empty( $kit_settings[ $bucket ] ) && is_array( $kit_settings[ $bucket ] ) ) {
				foreach ( $kit_settings[ $bucket ] as $color ) {
					if ( ! empty( $color['_id'] ) && ! empty( $color['color'] ) ) {
						$out['colors'][ $color['_id'] ] = $color['color'];
					}
				}
			}
		}
		// Also expose Elementor's "system_colors_default" snapshot so the JS
		// can use those even if the user hasn't customized them.
		$system_default = get_option( 'elementor_scheme_color-system' );
		if ( is_array( $system_default ) ) {
			foreach ( $system_default as $name => $color ) {
				if ( ! empty( $color['_id'] ) && ! empty( $color['color'] ) ) {
					// Don't overwrite a more specific value
					if ( empty( $out['colors'][ $color['_id'] ] ) ) {
						$out['colors'][ $color['_id'] ] = $color['color'];
					}
				}
			}
		}
		return $out;
	}
	/**
	 * Function widget_styles
	 *
	 * Load required plugin core files.
	 *
	 * @since 1.2.0
	 * @access public
	 */
	public static function widget_styles() {
		$styles = [
			'emk-addons-core' => [
				'handler' => 'emk--addons',
				'src'     => 'emk-addons.min.css',
				'dep'     => [],
				'version' => false,
				'media'   => 'all',
			],
		];

		foreach ( $styles as $key => $style ) {
			wp_register_style( $style['handler'], plugins_url( '/assets/css/' . $style['src'], __FILE__ ), $style['dep'], $style['version'], $style['media'] );
		}

		wp_enqueue_style( 'emk--addons' );


		// Elementor 4.1 only enqueues Font Awesome CSS in the editor
		// (elementor/editor/after_enqueue_styles), not on the frontend.
		// The Marquee widget's default separator icon is `far fa-star`,
		// which renders as an empty box if FA CSS isn't loaded. Enqueue
		// FA 5 on the frontend so the separator (and any future FA
		// icons used by EMK widgets) actually displays. We piggyback
		// on Elementor's own asset path so we don't duplicate the font.
		if ( ! wp_style_is( 'font-awesome-5-all' ) && ! wp_style_is( 'font-awesome' ) ) {
			wp_enqueue_style(
				'emk-font-awesome',
				ELEMENTOR_ASSETS_URL . 'lib/font-awesome/css/all.min.css',
				[],
				EMK_VERSION
			);
		}

		// Elementor 4.x also skips its own eicons stylesheet on the
		// frontend (only the editor enqueues `elementor-icons.min.css`).
		// If the Marquee separator icon is changed to an eicons-based
		// icon (e.g. `eicon-star`), the glyph won't render without this
		// stylesheet. We piggyback on Elementor's own asset path.
		if ( ! wp_style_is( 'elementor-icons' ) ) {
			wp_enqueue_style(
				'emk-elementor-icons',
				ELEMENTOR_ASSETS_URL . 'lib/eicons/css/elementor-icons.min.css',
				[],
				EMK_VERSION
			);
		}

		//widget style
		foreach ( self::get_widget_style() as $key => $style ) {
			wp_register_style( $style['handler'], plugins_url( '/assets/css/' . $style['src'], __FILE__ ), $style['dep'], $style['version'], $style['media'] );
		}

		// EMK Shaders CSS
		$shaders_css = EMK_PATH . 'assets/css/emk-shaders.min.css';
		if ( file_exists( $shaders_css ) ) {
			wp_register_style( 'emk--shaders', plugins_url( '/assets/css/emk-shaders.min.css', __FILE__ ), [], filemtime( $shaders_css ), 'all' );
			wp_enqueue_style( 'emk--shaders' );
		}

	}

	/**
	 * Editor scripts
	 *
	 * Enqueue plugin javascripts integrations for Elementor editor.
	 *
	 * @since 1.2.1
	 * @access public
	 */
	public function editor_scripts() {
		$editor_version = file_exists( EMK_PATH . 'assets/js/editor.min.js' ) ? filemtime( EMK_PATH . 'assets/js/editor.min.js' ) : EMK_VERSION;
		wp_enqueue_script(
			'emk-text-animation-shared',
			plugins_url( '/assets/js/emk-text-animation-shared.js', __FILE__ ),
			[ 'jquery', 'gsap', 'SplitText', 'elementor-editor' ],
			file_exists( EMK_PATH . 'assets/js/emk-text-animation-shared.js' ) ? filemtime( EMK_PATH . 'assets/js/emk-text-animation-shared.js' ) : EMK_VERSION,
			true
		);

		// EMK Motion FX for editor preview
		$fx_src  = EMK_PATH . 'assets/js/emk-motion-fx.js';
		$fx_ver  = file_exists( $fx_src ) ? filemtime( $fx_src ) : EMK_VERSION;
		wp_enqueue_script(
			'emk--motion-fx',
			plugins_url( '/assets/js/emk-motion-fx.js', __FILE__ ),
			[ 'jquery', 'gsap', 'SplitText', 'elementor-editor' ],
			$fx_ver,
			true
		);

		// EMK Shaders — enqueued via elementor/preview/enqueue_scripts hook for iframe context

		wp_enqueue_script( 'emk-editor', plugins_url( '/assets/js/editor.min.js', __FILE__ ), [
			'elementor-editor',
			'emk--motion-fx',
			'emk-text-animation-shared',
		], $editor_version, true );


		$data = apply_filters( 'emk/addons-editor/js/data', [
			'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
			'_wpnonce' => wp_create_nonce( 'emk-editor' ),			
		] );

		wp_localize_script( 'emk-editor', 'EMK_Editor', $data );

		// EMK Shader Editor Bridge — relays setting changes from parent to preview iframe
		$bridge_src  = EMK_PATH . 'assets/js/emk-shader-editor-bridge.js';
		$bridge_ver  = file_exists( $bridge_src ) ? filemtime( $bridge_src ) : EMK_VERSION;
		wp_enqueue_script( 'emk-shader-editor-bridge', plugins_url( '/assets/js/emk-shader-editor-bridge.js', __FILE__ ), [ 'jquery', 'elementor-editor' ], $bridge_ver, true );
		


	}

	/**
	 * Enqueue shader scripts for the editor preview iframe.
	 * Runs in the iframe context where elementorFrontend is available.
	 */
	public function preview_scripts() {
		$paper_src  = EMK_PATH . 'assets/js/emk-paper-shaders.min.js';
		$paper_ver  = file_exists( $paper_src ) ? filemtime( $paper_src ) : EMK_VERSION;
		wp_enqueue_script( 'emk-paper-shaders', plugins_url( '/assets/js/emk-paper-shaders.min.js', __FILE__ ), [], $paper_ver, true );

		$presets_src  = EMK_PATH . 'assets/js/emk-shader-presets.min.js';
		$presets_ver  = file_exists( $presets_src ) ? filemtime( $presets_src ) : EMK_VERSION;
		wp_enqueue_script( 'emk-shader-presets', plugins_url( '/assets/js/emk-shader-presets.min.js', __FILE__ ), [ 'emk-paper-shaders' ], $presets_ver, true );

		$shaders_src  = EMK_PATH . 'assets/js/emk-shaders.min.js';
		$shaders_ver  = file_exists( $shaders_src ) ? filemtime( $shaders_src ) : EMK_VERSION;
		wp_enqueue_script( 'emk--shaders', plugins_url( '/assets/js/emk-shaders.min.js', __FILE__ ), [ 'jquery', 'elementor-frontend', 'elementor-frontend-modules', 'emk-paper-shaders', 'emk-shader-presets' ], $shaders_ver, true );
	}

	public function print_emk_editor_scripts() {
		// Only run on the Elementor editor page; bail otherwise.
		if ( empty( $_GET['action'] ) || 'elementor' !== $_GET['action'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		if ( ! wp_script_is( 'emk-text-animation-shared', 'enqueued' ) && ! wp_script_is( 'emk-text-animation-shared', 'registered' ) ) {
			return;
		}
		// Elementor 4.1+ buffers wp_print_scripts output, so echo script tags directly.
		$base   = plugins_url( '/assets/js/', EMK_FILE );
		$fx     = EMK_PATH . 'assets/js/emk-motion-fx.js';
		$shared = EMK_PATH . 'assets/js/emk-text-animation-shared.js';
		$editor = EMK_PATH . 'assets/js/editor.min.js';
		$fx_ver     = file_exists( $fx )     ? filemtime( $fx )     : EMK_VERSION;
		$shared_ver = file_exists( $shared ) ? filemtime( $shared ) : EMK_VERSION;
		$editor_ver = file_exists( $editor ) ? filemtime( $editor ) : EMK_VERSION;
		$nonce  = wp_create_nonce( 'emk-editor' );
		$ajax   = admin_url( 'admin-ajax.php' );
		echo '<script id="emk-motion-fx-js" src="' . esc_url( $base . 'emk-motion-fx.js' ) . '?ver=' . esc_attr( $fx_ver ) . '"></script>' . "\n";
		echo '<script id="emk-text-animation-shared-js" src="' . esc_url( $base . 'emk-text-animation-shared.js' ) . '?ver=' . esc_attr( $shared_ver ) . '"></script>' . "\n";
		$bridge_src_ver = file_exists( EMK_PATH . 'assets/js/emk-shader-editor-bridge.js' ) ? filemtime( EMK_PATH . 'assets/js/emk-shader-editor-bridge.js' ) : EMK_VERSION;
		echo '<script id="emk-shader-editor-bridge-js" src="' . esc_url( $base . 'emk-shader-editor-bridge.js' ) . '?ver=' . esc_attr( $bridge_src_ver ) . '"></script>' . "\n";
		echo '<script id="emk-editor-js" src="' . esc_url( $base . 'editor.min.js' ) . '?ver=' . esc_attr( $editor_ver ) . '"></script>' . "\n";
		echo '<script>window.EMK_Editor = ' . wp_json_encode( [
			'ajaxUrl'  => $ajax,
			'_wpnonce' => $nonce,
		] ) . ';</script>' . "\n";
	}
	/**
	 * Editor style
	 *
	 * Enqueue plugin css integrations for Elementor editor.
	 *
	 * @since 1.2.1
	 * @access public
	 */
	public function editor_styles() {
		wp_enqueue_style( 'emk--editor', plugins_url( '/assets/css/editor.min.css', __FILE__ ), [], EMK_VERSION, 'all' );
	}

	/**
	 * Function widget_scripts
	 *
	 * Load required plugin core files.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public static function get_widget_scripts() {
		return apply_filters('emk/lite/widgets/scripts',[
		'marquee'           => [
			'handler' => 'emk--marquee',
			'src'     => 'widgets/marquee.min.js',
			'dep'     => [ 'jquery', 'gsap' ],
			'version' => false,
			'arg'     => true,
		],
			'text-hover-image' => [
				'handler' => 'emk--text-hover-image',
				'src'     => 'widgets/text-hover-image.min.js',
				'dep'     => [ 'jquery' ],
				'version' => false,
				'arg'     => true,
			],
			'emk-addons-ex'       => [
				'handler' => 'emk--addons-ex',
				'src'     => 'emk-addons-ex.js',
				'dep'     => [ 'jquery', 'elementor-frontend-modules' ],
				'version' => false,
				'arg'     => true,
			],
		]);
	}

	/**
	 * Function widget_style
	 *
	 * Load required plugin core files.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public static function get_widget_style() {
		return [
			'marquee'           => [
				'handler' => 'emk--marquee',
				'src'     => 'widgets/marquee.min.css',
				'dep'     => [],
				'version' => false,
				'media'   => 'all',
			],
			'text-hover-image' => [
				'handler' => 'emk--text-hover-image',
				'src'     => 'widgets/text-hover-image.min.css',
				'dep'     => [],
				'version' => false,
				'media'   => 'all',
			],
		];
	}

	/**
	 * Include Plugin files
	 *
	 * @access private
	 */
	private function include_files() {

		require_once EMK_PATH . 'config.php';

		require_once EMK_PATH . 'inc/helper.php';
		require_once EMK_PATH . 'inc/hook.php';
		include_once EMK_PATH . 'inc/trait-emk-slider.php';
		include_once EMK_PATH . 'inc/extensions/emk-text-animation-effects.php';
		include_once EMK_PATH . 'inc/extensions/emk-image-animation-effects.php';
		include_once EMK_PATH . 'inc/extensions/emk-glassmorphism.php';
		include_once EMK_PATH . 'inc/extensions/emk-shaders.php';
		include_once EMK_PATH . 'inc/extensions/emk-clean-motion-controls.php';

		//extensions
		$this->register_extensions();
	}

	/**
	 * Register Extensions
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function register_extensions() {
		foreach ( self::get_extensions() as $slug => $data ) {
			if ( $data['is_upcoming'] ) {
				continue;
			}
			include_once EMK_PATH . 'inc/class-emk-' . $slug . '.php';
		}
	}
	

	/**
	 * Register Widgets
	 *
	 * Register new Elementor widgets.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function register_widgets() {
		foreach ( self::get_widgets() as $slug => $data ) {
			if ( $data['is_upcoming'] ) {
				continue;
			}
			if ( $data['is_pro'] ) {
				continue;
			}
			if ( file_exists( __DIR__ . '/widgets/' . $slug . '/' . $slug . '.php' ) || file_exists( __DIR__ . '/widgets/' . $slug . '.php' ) ) {
				if ( ! $data['is_pro'] && ! $data['is_extension'] ) {
					if ( is_dir( __DIR__ . '/widgets/' . $slug ) ) {
						require_once __DIR__ . '/widgets/' . $slug . '/' . $slug . '.php';
					} else {
						require_once __DIR__ . '/widgets/' . $slug . '.php';
					}
					$class = explode( '-', $slug );
					$class = array_map( 'ucfirst', $class );
					$class = implode( '_', $class );
					$class = 'EMK\\Widgets\\' . $class;
					ElementorPlugin::instance()->widgets_manager->register( new $class() );
				}
			}
		}
	}

	/**
	 * Widget Category
	 *
	 * @param $elements_manager
	 */
	public function widget_categories( $elements_manager ) {
		$categories = [];
		$categories['el-motion-kit'] = [
			'title' => esc_html__( 'El Motion Kit', 'el-motionkit' ),
			'icon'  => 'fa fa-plug',
		];
		$old_categories = $elements_manager->get_categories();
		$categories     = array_merge( $categories, $old_categories );
		$set_categories = function ( $categories ) {
			$this->categories = $categories;
		};
		$set_categories->call( $elements_manager, $categories );
	}
	public function elementor_editor_url( $url ){
		$args = [
			'numberposts' => 1,
			'post_type'   => 'post',
			'orderby'     => 'menu_order',
			'order'       => 'ASC',
		]; 
		$latest_posts = get_posts($args);      
		if (!is_wp_error( $latest_posts ) && !empty($latest_posts) && isset($latest_posts[0])) {  
			return add_query_arg( 'aaeid', $latest_posts[0]->ID ,  $url ); 
		}
		return add_query_arg( 'aaeid', 1 , $url ); 
	}


	/**
	 * Inject widget CSS rules into Elementor's stylesheet during post CSS generation.
	 *
	 * Elementor 4.x CSS handler periodically drops selectors from custom widgets
	 * registered via elementor/widgets/register. This hook captures the parsed
	 * stylesheet and manually appends widget-specific CSS using get_controls()
	 * and get_settings() directly, bypassing Elementor's internal pipeline.
	 *
	 * @since 2.5.1
	 * @param \Elementor\Core\Files\CSS\Post $css_file
	 * @param \Elementor\Element_Base        $element
	 */
	public function ensure_controls_initialized( $css_file, $element ) {
		// Keep controls initialized before Elementor CSS generation.
		// In Elementor 4.x, group controls (typography, text-stroke, etc.)
		// are not initialized unless explicitly forced.
		$element->get_controls();
	}
	
	


	/**
	 * Initialize the elementor plugin
	 *
	 * Validates that Elementor is already loaded.
	 * Checks for basic plugin requirements, if one check fail don't continue,
	 *
	 * Fired by `plugins_loaded` action hook.
	 *
	 * @since 1.2.0
	 * @access public
	 */
	public function elementor_init() {

		// $this->include_skins_files();
	}

	public function register_setting_tabs( $base ) {
		return;
	}

	/**
	 *  Plugin class constructor
	 *
	 * Register plugin action hooks and filters
	 *
	 * @since 1.2.0
	 * @access public
	 */
	public function __construct() {
		
		add_action( 'elementor/elements/categories_registered', [ $this, 'widget_categories' ] );

		// Register widget scripts
		add_action( 'wp_enqueue_scripts', [ $this, 'widget_scripts' ],29 );

		// Register widget style
		add_action( 'wp_enqueue_scripts', [ $this, 'widget_styles' ] );

		// Register widgets
		add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );	

		// Register editor scripts
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'editor_scripts' ] );

		// Elementor 4.1+ resets $wp_scripts after enqueue, so scripts registered via
		// elementor/editor/after_enqueue_scripts are not printed by default. Force-print
		// them via admin_print_footer_scripts on Elementor editor pages only.
		add_action( 'admin_print_footer_scripts', [ $this, 'print_emk_editor_scripts' ] );

		// Enqueue shader assets in preview iframe (elementorFrontend context)
		add_action( 'elementor/preview/enqueue_scripts', [ $this, 'preview_scripts' ] );

		// Register editor style
		add_action( 'elementor/editor/after_enqueue_styles', [ $this, 'editor_styles' ] );
		add_filter( 'elementor/document/urls/preview' , [ $this, 'elementor_editor_url' ] , 4 );
		add_filter( 'elementor/document/urls/wp_preview' , [ $this, 'elementor_editor_url' ] , 4 );
	
		// elementor loaded

		// Ensure Elementor CSS generation processes all custom widget controls.
		// Group controls (typography, text-stroke, etc.) are not initialized
		// during post CSS generation in Elementor 4.x unless explicitly forced.
		add_action( 'elementor/element/before_parse_css', [ $this, 'ensure_controls_initialized' ], 1, 2 );
		add_action( 'elementor/init', [ $this, 'elementor_init' ], 0 );
		
		$this->include_files();
		
	}
	
	
}

// Instantiate Plugin Class
Plugin::instance();
