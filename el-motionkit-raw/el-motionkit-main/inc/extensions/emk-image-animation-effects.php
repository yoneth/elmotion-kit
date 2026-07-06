<?php
/**
 * El MotionKit — Image Animation Effects extension.
 *
 * Registers Elementor controls for image scroll-triggered effects
 * (wipe, zoom, elastic) on supported widgets.
 *
 * This is an independent implementation built against the public
 * Elementor 4 controls API. No control IDs or structure are borrowed
 * from any other plugin.
 *
 * @package ElMotionKit
 */

namespace EMK\Extensions;

use Elementor\Controls_Manager;

defined( 'ABSPATH' ) || exit;

final class EmkImageAnimation {

	const SECTION_LABEL = 'EMK Image FX';
	const SECTION_ID    = 'emk_section_img_fx';

	/** @var array<int, array{name:string,section:string}> */
	private static $targets = [];


	public static function bootstrap(): void {
		self::$targets = [
			[ 'name' => 'image', 'section' => 'section_image' ],
		];

		foreach ( self::$targets as $t ) {
			add_action(
				'elementor/element/' . $t['name'] . '/' . $t['section'] . '/after_section_end',
				[ __CLASS__, 'register_controls' ],
				10,
				2
			);
		}

	}

	/**
	 * Full controls: all 3 effects (wipe, zoom, elastic).
	 */
	public static function register_controls( $element ): void {
		$effects = [
			'none'    => esc_html__( 'None', 'el-motionkit' ),
			'wipe'    => esc_html__( 'Wipe', 'el-motionkit' ),
			'zoom'    => esc_html__( 'Zoom', 'el-motionkit' ),
			'elastic' => esc_html__( 'Elastic', 'el-motionkit' ),
		];

		$element->start_controls_section(
			self::SECTION_ID,
			[
				'label' => sprintf( '<i class="emk-mark"></i> %s', esc_html__( self::SECTION_LABEL, 'el-motionkit' ) ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$element->add_control(
			'emk_img_fx_enable',
			[
				'label'              => esc_html__( 'Enable animation', 'el-motionkit' ),
				'type'               => Controls_Manager::SWITCHER,
				'label_on'           => esc_html__( 'Yes', 'el-motionkit' ),
				'label_off'          => esc_html__( 'No', 'el-motionkit' ),
				'return_value'       => 'yes',
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_img_fx_type',
			[
				'label'              => esc_html__( 'Effect', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'none',
				'options'            => $effects,
				'frontend_available' => true,
				'render_type'        => 'none',
				'condition'          => [ 'emk_img_fx_enable' => 'yes' ],
			]
		);

		// --- direction (wipe only) ---
		$element->add_control(
			'emk_img_fx_dir',
			[
				'label'              => esc_html__( 'Direction', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'left',
				'options'            => [
					'left'   => esc_html__( 'From left', 'el-motionkit' ),
					'right'  => esc_html__( 'From right', 'el-motionkit' ),
					'top'    => esc_html__( 'From top', 'el-motionkit' ),
					'bottom' => esc_html__( 'From bottom', 'el-motionkit' ),
				],
				'frontend_available' => true,
				'render_type'        => 'none',
				'condition'          => [
					'emk_img_fx_enable' => 'yes',
					'emk_img_fx_type'   => 'wipe',
				],
			]
		);

		// --- timing ---
		$element->add_control(
			'emk_img_fx_duration',
			[
				'label'              => esc_html__( 'Duration (s)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'min'                => 0.1,
				'max'                => 10,
				'step'               => 0.1,
				'default'            => 1,
				'frontend_available' => true,
				'render_type'        => 'none',
				'condition'          => [
					'emk_img_fx_enable' => 'yes',
					'emk_img_fx_type!'  => 'none',
				],
			]
		);

		$element->add_control(
			'emk_img_fx_delay',
			[
				'label'              => esc_html__( 'Delay (s)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'min'                => 0,
				'max'                => 10,
				'step'               => 0.1,
				'default'            => 0,
				'frontend_available' => true,
				'render_type'        => 'none',
				'condition'          => [
					'emk_img_fx_enable' => 'yes',
					'emk_img_fx_type!'  => 'none',
				],
			]
		);

		// --- easing ---
		$element->add_control(
			'emk_img_fx_ease',
			[
				'label'              => esc_html__( 'Easing', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'power2.out',
				'options'            => [
					'power1.out' => 'power1.out',
					'power2.out' => 'power2.out',
					'power3.out' => 'power3.out',
					'power4.out' => 'power4.out',
					'back.out'   => 'back.out',
					'elastic.out' => 'elastic.out',
					'sine.out'   => 'sine.out',
					'expo.out'   => 'expo.out',
					'none'       => esc_html__( 'Linear', 'el-motionkit' ),
				],
				'frontend_available' => true,
				'render_type'        => 'none',
				'condition'          => [
					'emk_img_fx_enable' => 'yes',
					'emk_img_fx_type!'  => 'none',
				],
			]
		);

		// --- scroll trigger ---
		$element->add_control(
			'emk_img_fx_start',
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
				'frontend_available' => true,
				'render_type'        => 'none',
				'condition'          => [
					'emk_img_fx_enable' => 'yes',
					'emk_img_fx_type!'  => 'none',
				],
			]
		);

		$element->add_control(
			'emk_img_fx_scrub',
			[
				'label'              => esc_html__( 'Scrub to scroll', 'el-motionkit' ),
				'description'        => esc_html__( 'Link animation progress to scroll position.', 'el-motionkit' ),
				'type'               => Controls_Manager::SWITCHER,
				'label_on'           => esc_html__( 'Yes', 'el-motionkit' ),
				'label_off'          => esc_html__( 'No', 'el-motionkit' ),
				'return_value'       => 'yes',
				'frontend_available' => true,
				'render_type'        => 'none',
				'condition'          => [
					'emk_img_fx_enable' => 'yes',
					'emk_img_fx_type!'  => 'none',
				],
			]
		);

		// --- editor preview ---
		$element->add_control(
			'emk_img_fx_preview_btn',
			[
				'label'       => esc_html__( 'Replay in editor', 'el-motionkit' ),
				'type'        => Controls_Manager::BUTTON,
				'button_type' => 'success',
				'text'        => esc_html__( 'Play', 'el-motionkit' ),
				'event'       => 'emk/fx/preview',
				'condition'   => [
					'emk_img_fx_enable' => 'yes',
					'emk_img_fx_type!'  => 'none',
				],
			]
		);

		$element->end_controls_section();
	}

}

EmkImageAnimation::bootstrap();
