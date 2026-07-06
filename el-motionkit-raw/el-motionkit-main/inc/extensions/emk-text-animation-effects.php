<?php
/**
 * El MotionKit — Text Animation Effects extension.
 *
 * Registers Elementor controls for animated text effects
 * (fade-up, tilt3d, mask-up, pop) using GSAP SplitText + ScrollTrigger
 * on supported heading/text widgets.
 *
 * This is an independent implementation built against the public
 * Elementor 4 controls API and GSAP 3.x docs. No control IDs or
 * structure are borrowed from any other plugin.
 *
 * @package ElMotionKit
 */

namespace EMK\Extensions;

use Elementor\Controls_Manager;
use Elementor\Plugin;

defined( 'ABSPATH' ) || exit;

final class EmkTextAnimation {

	const SECTION_ID  = 'emk_section_txt_fx';
	const PREFIX_CLASS = 'emk-fx--';

	/** @var array<int, array{name:string,section:string}> */
	private static $targets = [];

	public static function bootstrap(): void {
		self::$targets = [
			[ 'name' => 'heading',    'section' => 'section_title' ],
			[ 'name' => 'text-editor', 'section' => 'section_editor' ],
			[ 'name' => 'emk--title', 'section' => 'section_content' ],
			[ 'name' => 'emk--text',  'section' => 'section_content' ],
		];

		foreach ( self::$targets as $t ) {
			add_action(
				'elementor/element/' . $t['name'] . '/' . $t['section'] . '/after_section_end',
				[ __CLASS__, 'register_controls' ],
				10,
				2
			);
		}

		// Elementor 4 optimised-markup strips the wrapper div that
		// ScrollTrigger needs as the animation target. Restore it for
		// animated widgets.
		add_filter( 'elementor/widget/render_content', [ __CLASS__, 'restore_wrapper' ], 10, 2 );
	}

	/** @return array<int, string> */
	private static function target_names(): array {
		return array_column( self::$targets, 'name' );
	}

	public static function restore_wrapper( string $content, $element ): string {
		if ( 'widget' !== $element->get_type() ) {
			return $content;
		}
		if ( ! in_array( $element->get_name(), self::target_names(), true ) ) {
			return $content;
		}
		if ( ! Plugin::$instance->experiments->is_feature_active( 'e_optimized_markup' ) ) {
			return $content;
		}
		return '<div class="elementor-widget-container">' . $content . '</div>';
	}

	public static function register_controls( $element ): void {
		$effects     = self::effects();
		$fx_cond     = [
			'emk_txt_fx_enable' => 'yes',
			'emk_txt_fx_type!'  => 'none',
		];
		$scroll_cond = $fx_cond + [ 'emk_txt_fx_trigger' => 'on-scroll' ];

		$element->start_controls_section(
			self::SECTION_ID,
			[
				'label' => sprintf( '<i class="emk-mark"></i> %s', esc_html__( 'EMK Text FX', 'el-motionkit' ) ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		// --- Enable ---
		$element->add_control(
			'emk_txt_fx_enable',
			[
				'label'              => esc_html__( 'Enable text animation', 'el-motionkit' ),
				'type'               => Controls_Manager::SWITCHER,
				'label_on'           => esc_html__( 'Yes', 'el-motionkit' ),
				'label_off'          => esc_html__( 'No', 'el-motionkit' ),
				'return_value'       => 'yes',
				'prefix_class'       => self::PREFIX_CLASS,
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		// --- Effect type ---
		$element->add_control(
			'emk_txt_fx_type',
			[
				'label'              => esc_html__( 'Effect', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'none',
				'options'            => $effects,
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => [ 'emk_txt_fx_enable' => 'yes' ],
			]
		);

		// --- Split type (fade-up / mask-up only; tilt3d forces lines, pop chars) ---
		$element->add_control(
			'emk_txt_fx_split',
			[
				'label'              => esc_html__( 'Split by', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'words',
				'options'            => [
					'chars' => esc_html__( 'Characters', 'el-motionkit' ),
					'words' => esc_html__( 'Words', 'el-motionkit' ),
					'lines' => esc_html__( 'Lines', 'el-motionkit' ),
				],
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => [
					'emk_txt_fx_enable' => 'yes',
					'emk_txt_fx_type'   => [ 'fade-up', 'mask-up' ],
				],
			]
		);

		// --- Timing ---
		$element->add_control(
			'emk_txt_fx_duration',
			[
				'label'              => esc_html__( 'Duration (s)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'min'                => 0.1,
				'max'                => 10,
				'step'               => 0.1,
				'default'            => 0.8,
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => $fx_cond,
			]
		);

		$element->add_control(
			'emk_txt_fx_delay',
			[
				'label'              => esc_html__( 'Delay (s)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'min'                => 0,
				'max'                => 10,
				'step'               => 0.1,
				'default'            => 0,
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => $fx_cond,
			]
		);

		$element->add_control(
			'emk_txt_fx_stagger',
			[
				'label'              => esc_html__( 'Stagger (s)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'min'                => 0,
				'max'                => 2,
				'step'               => 0.01,
				'default'            => 0.05,
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => $fx_cond,
		]
		);
		// --- Transform options (x/y only for fade-up, rotate/origin only for tilt3d) ---
		$element->add_control(
			'emk_txt_fx_x',
			[
				'label'              => esc_html__( 'Start offset X (px)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'default'            => 0,
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => [
					'emk_txt_fx_enable' => 'yes',
					'emk_txt_fx_type'   => 'fade-up',
				],
			]
		);

		$element->add_control(
			'emk_txt_fx_y',
			[
				'label'              => esc_html__( 'Start offset Y (px)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'default'            => 40,
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => [
					'emk_txt_fx_enable' => 'yes',
					'emk_txt_fx_type'   => 'fade-up',
				],
			]
		);

		$element->add_control(
			'emk_txt_fx_rotate',
			[
				'label'              => esc_html__( 'Start rotation (deg)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'default'            => -90,
				'min'                => -360,
				'max'                => 360,
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => [
					'emk_txt_fx_enable' => 'yes',
					'emk_txt_fx_type'   => 'tilt3d',
				],
			]
		);

		$element->add_control(
			'emk_txt_fx_origin',
			[
				'label'              => esc_html__( 'Transform origin', 'el-motionkit' ),
				'type'               => Controls_Manager::TEXT,
				'default'            => '50% 0%',
				'placeholder'        => '50% 0%',
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => [
					'emk_txt_fx_enable' => 'yes',
					'emk_txt_fx_type'   => 'tilt3d',
				],
			]
		);

		// --- Easing ---
		$element->add_control(
			'emk_txt_fx_ease',
			[
				'label'              => esc_html__( 'Easing', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'power3.out',
				'options'            => [
					'power1.out'  => 'power1.out',
					'power2.out'  => 'power2.out',
					'power3.out'  => 'power3.out',
					'power4.out'  => 'power4.out',
					'back.out'    => 'back.out',
					'elastic.out' => 'elastic.out',
					'circ.out'    => 'circ.out',
					'expo.out'    => 'expo.out',
					'sine.out'    => 'sine.out',
					'none'        => esc_html__( 'Linear', 'el-motionkit' ),
				],
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => [
					'emk_txt_fx_enable' => 'yes',
					'emk_txt_fx_type'   => [ 'fade-up', 'tilt3d', 'mask-up' ],
				],
			]
		);

		// --- Trigger mode ---
		$element->add_control(
			'emk_txt_fx_trigger',
			[
				'label'              => esc_html__( 'Trigger', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'on-scroll',
				'options'            => [
					'on-load'  => esc_html__( 'On page load', 'el-motionkit' ),
					'on-scroll' => esc_html__( 'On scroll into view', 'el-motionkit' ),
				],
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => $fx_cond,
			]
		);

		// --- ScrollTrigger start (only when trigger = on-scroll) ---
		$element->add_control(
			'emk_txt_fx_start',
			[
				'label'              => esc_html__( 'ScrollTrigger start', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'top 85%',
				'options'            => [
					'top top'       => 'top top',
					'top center'    => 'top center',
					'top bottom'    => 'top bottom',
					'center top'    => 'center top',
					'center center' => 'center center',
					'center bottom' => 'center bottom',
					'bottom top'    => 'bottom top',
					'bottom center' => 'bottom center',
					'bottom bottom' => 'bottom bottom',
					'top 85%'       => 'top 85%',
					'top 75%'       => 'top 75%',
				],
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => $scroll_cond,
			]
		);

		// --- Scrub ---
		$element->add_control(
			'emk_txt_fx_scrub',
			[
				'label'              => esc_html__( 'Scrub to scroll', 'el-motionkit' ),
				'description'        => esc_html__( 'Link animation progress to scroll position.', 'el-motionkit' ),
				'type'               => Controls_Manager::SWITCHER,
				'label_on'           => esc_html__( 'Yes', 'el-motionkit' ),
				'label_off'          => esc_html__( 'No', 'el-motionkit' ),
				'return_value'       => 'yes',
				'render_type'        => 'none',
				'frontend_available' => true,
				'condition'          => $scroll_cond,
			]
		);

		// --- editor preview ---
		$element->add_control(
			'emk_txt_fx_preview_btn',
			[
				'label'       => esc_html__( 'Replay in editor', 'el-motionkit' ),
				'type'        => Controls_Manager::BUTTON,
				'button_type' => 'success',
				'text'        => esc_html__( 'Play', 'el-motionkit' ),
				'event'       => 'emk/fx/preview',
				'condition'   => [
					'emk_txt_fx_enable' => 'yes',
					'emk_txt_fx_type!'  => 'none',
				],
			]
		);

		$element->end_controls_section();
	}

	/** @return array<string, string> */
	private static function effects(): array {
		return [
			'none'     => esc_html__( 'None', 'el-motionkit' ),
			'fade-up'  => esc_html__( 'Fade Up', 'el-motionkit' ),
			'tilt3d'   => esc_html__( '3D Tilt', 'el-motionkit' ),
			'mask-up'  => esc_html__( 'Mask Up', 'el-motionkit' ),
			'pop'      => esc_html__( 'Pop', 'el-motionkit' ),
		];
	}
}

EmkTextAnimation::bootstrap();
