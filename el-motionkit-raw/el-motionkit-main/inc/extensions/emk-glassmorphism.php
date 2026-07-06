<?php
/**
 * El MotionKit — Glassmorphism extension.
 *
 * Pure-CSS frosted-glass effect for containers and common widgets.
 * No JavaScript, no GSAP. Uses Elementor selectors for output.
 *
 * Control keys are independently chosen (not copied from any other plugin).
 *
 * @package ElMotionKit
 */

namespace EMK\Extensions;

use Elementor\Controls_Manager;

defined( 'ABSPATH' ) || die();

class EMK_Glassmorphism {

	public static function init() {
		add_action(
			'elementor/element/container/section_layout/after_section_end',
			[ __CLASS__, 'register_controls' ],
			10,
			2
		);
		add_action(
			'elementor/element/common/_section_style/after_section_end',
			[ __CLASS__, 'register_controls' ],
			10,
			2
		);
	}

	public static function register_controls( $element, $args = null ) {
		$element->start_controls_section(
			'emk_section_glass',
			[
				'label' => sprintf(
					'<i class="emk-logo"></i> %s',
					esc_html__( 'EMK Glassmorphism', 'el-motionkit' )
				),
				'tab'   => Controls_Manager::TAB_ADVANCED,
			]
		);

		$element->add_control(
			'emk_glass_enable',
			[
				'label'        => esc_html__( 'Enable Glassmorphism', 'el-motionkit' ),
				'description'  => esc_html__( 'Applies a frosted-glass effect. Needs content behind the element to be visible.', 'el-motionkit' ),
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => esc_html__( 'Yes', 'el-motionkit' ),
				'label_off'    => esc_html__( 'No', 'el-motionkit' ),
				'return_value' => 'yes',
				'selectors'    => [
					'{{WRAPPER}}' => '--emk-glass-blur: 10px; --emk-glass-sat: 100%; --emk-glass-bg: rgba(255,255,255,0.08); backdrop-filter: blur(var(--emk-glass-blur)) saturate(var(--emk-glass-sat)); -webkit-backdrop-filter: blur(var(--emk-glass-blur)) saturate(var(--emk-glass-sat)); background-color: var(--emk-glass-bg);',
				],
			]
		);

		$element->add_control(
			'emk_glass_blur',
			[
				'label'      => esc_html__( 'Blur', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px' ],
				'range'      => [
					'px' => [
						'min'  => 0,
						'max'  => 30,
						'step' => 1,
					],
				],
				'default'    => [
					'unit' => 'px',
					'size' => 10,
				],
				'condition'  => [ 'emk_glass_enable' => 'yes' ],
				'selectors'  => [
					'{{WRAPPER}}' => '--emk-glass-blur: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$element->add_control(
			'emk_glass_saturate',
			[
				'label'      => esc_html__( 'Saturation', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ '%' ],
				'range'      => [
					'%' => [
						'min'  => 100,
						'max'  => 200,
						'step' => 10,
					],
				],
				'default'    => [
					'unit' => '%',
					'size' => 100,
				],
				'condition'  => [ 'emk_glass_enable' => 'yes' ],
				'selectors'  => [
					'{{WRAPPER}}' => '--emk-glass-sat: {{SIZE}}%;',
				],
			]
		);

		$element->add_control(
			'emk_glass_tint',
			[
				'label'     => esc_html__( 'Tint color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => 'rgba(255,255,255,0.08)',
				'condition' => [ 'emk_glass_enable' => 'yes' ],
				'selectors' => [
					'{{WRAPPER}}' => '--emk-glass-bg: {{VALUE}};',
				],
			]
		);


		$element->end_controls_section();
	}
}

EMK_Glassmorphism::init();
