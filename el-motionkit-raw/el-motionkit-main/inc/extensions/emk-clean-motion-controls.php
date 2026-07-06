<?php
/**
 * Clean-room motion controls for Elementor Advanced tab.
 * v2.4.3: Friendly UI naming with helper descriptions for non-technical users.
 */

namespace EMK\Extensions;

use Elementor\Controls_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class EMK_Clean_Motion_Controls {
	public static function init() {
		add_action( 'elementor/element/common/_section_style/after_section_end', [ __CLASS__, 'register_mouse_move_controls' ], 3 );
		add_action( 'elementor/element/container/section_layout/after_section_end', [ __CLASS__, 'register_mouse_move_controls' ], 3 );
		add_action( 'elementor/element/common/_section_style/after_section_end', [ __CLASS__, 'register_cursor_hover_controls' ], 4 );
		add_action( 'elementor/element/container/section_layout/after_section_end', [ __CLASS__, 'register_cursor_hover_controls' ], 4 );
		add_action( 'elementor/element/common/_section_style/after_section_end', [ __CLASS__, 'register_hover_image_controls' ], 6 );
		add_action( 'elementor/element/container/section_layout/after_section_end', [ __CLASS__, 'register_hover_image_controls' ], 6 );
		add_action( 'elementor/element/common/_section_style/after_section_end', [ __CLASS__, 'register_parallax_controls' ], 7 );
		add_action( 'elementor/element/container/section_layout/after_section_end', [ __CLASS__, 'register_parallax_controls' ], 7 );
		add_action( 'elementor/element/common/_section_style/after_section_end', [ __CLASS__, 'register_pin_controls' ], 8 );
		add_action( 'elementor/element/container/section_layout/after_section_end', [ __CLASS__, 'register_pin_controls' ], 8 );
		add_action( 'elementor/element/common/_section_style/after_section_end', [ __CLASS__, 'register_horizontal_scroll_controls' ], 5 );
		add_action( 'elementor/element/container/section_layout/after_section_end', [ __CLASS__, 'register_horizontal_scroll_controls' ], 5 );
		add_action( 'elementor/element/after_add_attributes', [ __CLASS__, 'inject_cursor_colors' ], 10, 1 );
	}

	public static function inject_cursor_colors( $element ) {
		$settings = $element->get_settings_for_display();
		if ( empty( $settings['emk_cursor_hover_enable'] ) || 'yes' !== $settings['emk_cursor_hover_enable'] ) {
			return;
		}
		$globals = $element->get_settings( '__globals__' ) ?: [];
		$bg      = $settings['emk_cursor_hover_bg']    ?? '#111111';
		$color   = $settings['emk_cursor_hover_color'] ?? '#ffffff';

		$kit = \Elementor\Plugin::$instance->kits_manager ? \Elementor\Plugin::$instance->kits_manager->get_active_kit() : null;

		foreach ( [ 'emk_cursor_hover_bg' => &$bg, 'emk_cursor_hover_color' => &$color ] as $key => &$val ) {
			$ref = $globals[ $key ] ?? null;
			if ( ! $ref || 0 !== strpos( $ref, 'globals/colors?id=' ) ) {
				continue;
			}
			$manager = \Elementor\Plugin::$instance->data_manager_v2 ?? null;
			if ( $manager ) {
				$resolved = $manager->run( $ref );
				if ( is_array( $resolved ) && isset( $resolved['value'] ) ) {
					$val = $resolved['value'];
					continue;
				}
			}
			if ( $kit ) {
				$id   = substr( $ref, 19 );
				$kv   = $kit->get_settings_for_display();
				foreach ( [ 'system_colors', 'custom_colors' ] as $set ) {
					$colors = $kv[ $set ] ?? [];
					foreach ( $colors as $c ) {
						if ( ( $c['_id'] ?? '' ) === $id && ! empty( $c['color'] ) ) {
							$val = $c['color'];
							break 2;
						}
					}
				}
			}
		}
		unset( $val );

		$element->add_render_attribute( '_wrapper', 'data-emk-cursor-bg', $bg ?: '#111111' );
		$element->add_render_attribute( '_wrapper', 'data-emk-cursor-color', $color ?: '#ffffff' );
	}


	public static function register_mouse_move_controls( $element ) {
		$element->start_controls_section( 'emk_section_mouse_move', [ 'label' => sprintf( '<i class="emk-logo"></i> %s', esc_html__( 'Mouse Move', 'el-motionkit' ) ), 'tab' => Controls_Manager::TAB_ADVANCED ] );
		$element->add_control( 'emk_mouse_move_enable', [ 'label' => esc_html__( 'Enable', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'return_value' => 'yes', 'frontend_available' => true ] );
		$element->add_control( 'emk_mouse_move_heading_scope', [ 'label' => esc_html__( 'Where the mouse is tracked', 'el-motionkit' ), 'type' => Controls_Manager::HEADING, 'condition' => [ 'emk_mouse_move_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_mouse_move_scope', [ 'label' => esc_html__( 'Track Mouse On', 'el-motionkit' ), 'type' => Controls_Manager::SELECT, 'default' => 'self', 'options' => [ 'self' => esc_html__( 'This widget', 'el-motionkit' ), 'parent' => esc_html__( 'Parent container', 'el-motionkit' ), 'custom' => esc_html__( 'Custom area (advanced)', 'el-motionkit' ) ], 'condition' => [ 'emk_mouse_move_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_mouse_move_selector', [ 'label' => esc_html__( 'CSS Selector', 'el-motionkit' ), 'type' => Controls_Manager::TEXT, 'placeholder' => '.motion-area', 'condition' => [ 'emk_mouse_move_enable' => 'yes', 'emk_mouse_move_scope' => 'custom' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_mouse_move_x', [ 'label' => esc_html__( 'Move Horizontal (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 30, 'condition' => [ 'emk_mouse_move_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_mouse_move_y', [ 'label' => esc_html__( 'Move Vertical (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 30, 'condition' => [ 'emk_mouse_move_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_mouse_move_duration', [ 'label' => esc_html__( 'Follow Speed (seconds)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 0.35, 'min' => 0, 'max' => 2, 'step' => 0.05, 'condition' => [ 'emk_mouse_move_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->end_controls_section();
	}

	public static function register_cursor_hover_controls( $element ) {
		$element->start_controls_section( 'emk_section_cursor_hover', [ 'label' => sprintf( '<i class="emk-logo"></i> %s', esc_html__( 'Cursor Hover', 'el-motionkit' ) ), 'tab' => Controls_Manager::TAB_ADVANCED ] );
		$element->add_control( 'emk_cursor_hover_enable', [ 'label' => esc_html__( 'Enable', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'return_value' => 'yes', 'frontend_available' => true ] );
		$element->add_control( 'emk_cursor_hover_text', [ 'label' => esc_html__( 'Cursor Text', 'el-motionkit' ), 'type' => Controls_Manager::TEXT, 'default' => esc_html__( 'View', 'el-motionkit' ), 'condition' => [ 'emk_cursor_hover_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_cursor_hover_size', [ 'label' => esc_html__( 'Cursor Size (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 86, 'min' => 24, 'max' => 300, 'condition' => [ 'emk_cursor_hover_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_cursor_hover_bg', [ 'label' => esc_html__( 'Cursor Background', 'el-motionkit' ), 'type' => Controls_Manager::COLOR, 'default' => '#111111', 'condition' => [ 'emk_cursor_hover_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_cursor_hover_color', [ 'label' => esc_html__( 'Cursor Text Color', 'el-motionkit' ), 'type' => Controls_Manager::COLOR, 'default' => '#ffffff', 'condition' => [ 'emk_cursor_hover_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->end_controls_section();
	}

	public static function register_hover_image_controls( $element ) {
		$element->start_controls_section( 'emk_section_hover_image', [ 'label' => sprintf( '<i class="emk-logo"></i> %s', esc_html__( 'Hover Image', 'el-motionkit' ) ), 'tab' => Controls_Manager::TAB_ADVANCED ] );
		$element->add_control( 'emk_hover_image_enable', [ 'label' => esc_html__( 'Enable', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'return_value' => 'yes', 'frontend_available' => true ] );
		$element->add_control( 'emk_hover_image', [ 'label' => esc_html__( 'Image', 'el-motionkit' ), 'type' => Controls_Manager::MEDIA, 'condition' => [ 'emk_hover_image_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_hover_image_size', [ 'label' => esc_html__( 'Image Size (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 220, 'min' => 40, 'max' => 800, 'condition' => [ 'emk_hover_image_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_hover_image_offset_x', [ 'label' => esc_html__( 'Offset Horizontal (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 24, 'condition' => [ 'emk_hover_image_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_hover_image_offset_y', [ 'label' => esc_html__( 'Offset Vertical (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 24, 'condition' => [ 'emk_hover_image_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_hover_image_speed', [ 'label' => esc_html__( 'Follow Speed (seconds)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 0.18, 'min' => 0, 'max' => 1, 'step' => 0.02, 'condition' => [ 'emk_hover_image_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->end_controls_section();
	}

	public static function register_parallax_controls( $element ) {
		$element->start_controls_section( 'emk_section_parallax', [ 'label' => sprintf( '<i class="emk-logo"></i> %s', esc_html__( 'Parallax', 'el-motionkit' ) ), 'tab' => Controls_Manager::TAB_ADVANCED ] );
		$element->add_control( 'emk_parallax_enable', [ 'label' => esc_html__( 'Enable', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'return_value' => 'yes', 'frontend_available' => true ] );
		$element->add_control( 'emk_parallax_y', [ 'label' => esc_html__( 'Parallax Distance (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 120, 'min' => 0, 'max' => 800, 'condition' => [ 'emk_parallax_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_parallax_scrub', [ 'label' => esc_html__( 'Smoothness (seconds)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 1, 'min' => 0, 'max' => 3, 'step' => 0.1, 'condition' => [ 'emk_parallax_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_parallax_start', [ 'label' => esc_html__( 'Start Position', 'el-motionkit' ), 'type' => Controls_Manager::TEXT, 'default' => 'top bottom', 'condition' => [ 'emk_parallax_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_parallax_end', [ 'label' => esc_html__( 'End Position', 'el-motionkit' ), 'type' => Controls_Manager::TEXT, 'default' => 'bottom top', 'condition' => [ 'emk_parallax_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->end_controls_section();
	}

	public static function register_pin_controls( $element ) {
		$element->start_controls_section( 'emk_section_pin', [ 'label' => sprintf( '<i class="emk-logo"></i> %s', esc_html__( 'Pin Element', 'el-motionkit' ) ), 'tab' => Controls_Manager::TAB_ADVANCED ] );
		$element->add_control( 'emk_pin_enable', [ 'label' => esc_html__( 'Enable', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'return_value' => 'yes', 'default' => '', 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_start_preset', [ 'label' => esc_html__( 'Pin Position', 'el-motionkit' ), 'type' => Controls_Manager::SELECT, 'default' => 'top', 'options' => [ 'top' => esc_html__( 'Top of viewport (default)', 'el-motionkit' ), 'center' => esc_html__( 'Center of viewport', 'el-motionkit' ), 'bottom' => esc_html__( 'Bottom of viewport', 'el-motionkit' ), '80pct' => esc_html__( '80% down', 'el-motionkit' ), 'custom' => esc_html__( 'Custom (advanced)', 'el-motionkit' ) ], 'condition' => [ 'emk_pin_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_start_offset', [ 'label' => esc_html__( 'Offset (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 0, 'min' => -500, 'max' => 500, 'step' => 10, 'condition' => [ 'emk_pin_enable' => 'yes', 'emk_pin_start_preset!' => 'custom' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_start_custom', [ 'label' => esc_html__( 'Custom Start', 'el-motionkit' ), 'type' => Controls_Manager::TEXT, 'default' => 'top top', 'condition' => [ 'emk_pin_enable' => 'yes', 'emk_pin_start_preset' => 'custom' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_hold', [ 'label' => esc_html__( 'Hold Duration (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 600, 'min' => 0, 'max' => 5000, 'step' => 50, 'condition' => [ 'emk_pin_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_spacing', [ 'label' => esc_html__( 'Add Space Below', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'default' => 'yes', 'return_value' => 'yes', 'condition' => [ 'emk_pin_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_smooth', [ 'label' => esc_html__( 'Smooth Pin', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'default' => '', 'return_value' => 'yes', 'condition' => [ 'emk_pin_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_disable_mobile', [ 'label' => esc_html__( 'Disable on Mobile', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'default' => 'yes', 'return_value' => 'yes', 'condition' => [ 'emk_pin_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_start', [ 'label' => esc_html__( 'Start (legacy)', 'el-motionkit' ), 'type' => Controls_Manager::HIDDEN, 'default' => 'top top', 'condition' => [ 'emk_pin_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_end', [ 'label' => esc_html__( 'End (legacy)', 'el-motionkit' ), 'type' => Controls_Manager::HIDDEN, 'default' => '+=600', 'condition' => [ 'emk_pin_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_pin_scrub', [ 'label' => esc_html__( 'Scrub (legacy)', 'el-motionkit' ), 'type' => Controls_Manager::HIDDEN, 'default' => 0, 'condition' => [ 'emk_pin_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->end_controls_section();
	}

	public static function register_horizontal_scroll_controls( $element ) {
		$element->start_controls_section( 'emk_section_horizontal_scroll', [ 'label' => sprintf( '<i class="emk-logo"></i> %s', esc_html__( 'Horizontal Scroll', 'el-motionkit' ) ), 'tab' => Controls_Manager::TAB_ADVANCED ] );
		$element->add_control( 'emk_horizontal_enable', [ 'label' => esc_html__( 'Enable', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'return_value' => 'yes', 'frontend_available' => true ] );
		$element->add_control( 'emk_horizontal_track_selector', [ 'label' => esc_html__( 'Track Selector', 'el-motionkit' ), 'type' => Controls_Manager::TEXT, 'default' => '.emk--horizontal-track', 'condition' => [ 'emk_horizontal_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_horizontal_end', [ 'label' => esc_html__( 'Scroll Distance (px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 900, 'min' => 100, 'max' => 10000, 'step' => 50, 'condition' => [ 'emk_horizontal_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_horizontal_pin', [ 'label' => esc_html__( 'Pin This Section', 'el-motionkit' ), 'type' => Controls_Manager::SWITCHER, 'default' => 'yes', 'return_value' => 'yes', 'condition' => [ 'emk_horizontal_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_horizontal_scrub', [ 'label' => esc_html__( 'Smoothness (seconds)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 1, 'min' => 0, 'max' => 3, 'step' => 0.1, 'condition' => [ 'emk_horizontal_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->add_control( 'emk_horizontal_breakpoint', [ 'label' => esc_html__( 'Disable on Mobile (below px)', 'el-motionkit' ), 'type' => Controls_Manager::NUMBER, 'default' => 768, 'min' => 0, 'max' => 1920, 'condition' => [ 'emk_horizontal_enable' => 'yes' ], 'frontend_available' => true ] );
		$element->end_controls_section();
	}
}

EMK_Clean_Motion_Controls::init();
