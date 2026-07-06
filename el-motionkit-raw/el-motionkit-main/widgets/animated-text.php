<?php

namespace EMK\Widgets;

use Elementor\Group_Control_Text_Shadow;
use Elementor\Group_Control_Typography;
use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Text
 *
 * Elementor widget for animated text.
 *
 * @since 1.0.0
 */
class Animated_Text extends Widget_Base {
	/**
	 * Retrieve the widget name.
	 *
	 * @return string Widget name.
	 * @since 1.0.0
	 *
	 * @access public
	 *
	 */
	public function get_name() {
		return 'emk--text';
	}

	/**
	 * Retrieve the widget title.
	 *
	 * @return string Widget title.
	 * @since 1.0.0
	 *
	 * @access public
	 */
	public function get_title() {
		return esc_html__( 'Animated Text', 'el-motionkit' );
	}

	/**
	 * Retrieve the widget icon.
	 *
	 * @return string Widget icon.
	 * @since 1.0.0
	 *
	 * @access public
	 *
	 */
	public function get_icon() {
		// The eicon-* class is what Elementor's global icon font applies to.
		// The emk-badge class triggers the EMK logo badge overlay in editor.min.css.
		return 'eicon-animation-text emk-badge';
	}

	/**
	 * Retrieve the list of categories the widget belongs to.
	 *
	 * Used to determine where to display the widget in the editor.
	 *
	 * Note that currently Elementor supports only one category.
	 * When multiple categories passed, Elementor uses the first one.
	 *
	 * @return array Widget categories.
	 * @since 1.0.0
	 *
	 * @access public
	 *
	 */
	public function get_categories() {
		return [ 'el-motion-kit' ];
	}

	/**
	 * Register the widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 *
	 * @access protected
	 */
	protected function register_controls() {
		$this->start_controls_section(
			'section_content',
			[
				'label' => esc_html__( 'Content', 'el-motionkit' ),
			]
		);

		$this->add_control(
			'text',
			[
				'label'   => esc_html__( 'Text', 'el-motionkit' ),
				'type'    => Controls_Manager::WYSIWYG,
				'dynamic'     => [
					'active' => true,
				],
				'default' => esc_html__( 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'el-motionkit' ),
			]
		);

		$this->add_responsive_control(
			'text_cols',
			[
				'label'     => esc_html__( 'Columns', 'el-motionkit' ),
				'type'      => Controls_Manager::SELECT,
				'default'   => '',
				'options'   => [
					''   => esc_html__( 'Default', 'el-motionkit' ),
					'1'  => esc_html__( '1', 'el-motionkit' ),
					'2'  => esc_html__( '2', 'el-motionkit' ),
					'3'  => esc_html__( '3', 'el-motionkit' ),
					'4'  => esc_html__( '4', 'el-motionkit' ),
					'5'  => esc_html__( '5', 'el-motionkit' ),
					'6'  => esc_html__( '6', 'el-motionkit' ),
					'7'  => esc_html__( '7', 'el-motionkit' ),
					'8'  => esc_html__( '8', 'el-motionkit' ),
					'9'  => esc_html__( '9', 'el-motionkit' ),
					'10' => esc_html__( '10', 'el-motionkit' ),
				],
				'selectors' => [
					'{{WRAPPER}} .emk--text' => 'columns: {{VALUE}};',
				],
			]
		);

		$this->add_responsive_control(
			'text_col_gap',
			[
				'label'      => esc_html__( 'Columns Gap', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px' ],
				'range'      => [
					'px' => [
						'min' => 0,
						'max' => 300,
					],
				],
				'selectors'  => [
					'{{WRAPPER}} .emk--text' => 'gap: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
			'align',
			[
				'label'     => esc_html__( 'Alignment', 'el-motionkit' ),
				'type'      => Controls_Manager::CHOOSE,
				'options'   => [
					'left'    => [
						'title' => esc_html__( 'Left', 'el-motionkit' ),
						'icon'  => 'eicon-text-align-left',
					],
					'center'  => [
						'title' => esc_html__( 'Center', 'el-motionkit' ),
						'icon'  => 'eicon-text-align-center',
					],
					'right'   => [
						'title' => esc_html__( 'Right', 'el-motionkit' ),
						'icon'  => 'eicon-text-align-right',
					],
					'justify' => [
						'title' => esc_html__( 'Justified', 'el-motionkit' ),
						'icon'  => 'eicon-text-align-justify',
					],
				],
				'default'   => '',
				'separator' => 'before',
				'selectors' => [
					'{{WRAPPER}}' => 'text-align: {{VALUE}};',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_style',
			[
				'label' => esc_html__( 'Style', 'el-motionkit' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'title_color',
			[
				'label'     => esc_html__( 'Text Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .emk--text' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name'     => 'typography',
				'selector' => '{{WRAPPER}} .emk--text, {{WRAPPER}} .emk--text *',
			]
		);

		$this->add_group_control(
			Group_Control_Text_Shadow::get_type(),
			[
				'name'     => 'text_shadow',
				'selector' => '{{WRAPPER}} .emk--text',
			]
		);

		$this->add_control(
			'heading_link',
			[
				'label'     => esc_html__( 'Link', 'el-motionkit' ),
				'type'      => Controls_Manager::HEADING,
				'separator' => 'before',
			]
		);

		$this->add_control(
			'title_link_hover_color',
			[
				'label'     => esc_html__( 'Hover Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .emk--text a:hover,{{WRAPPER}} .emk--text a:focus' => 'color: {{VALUE}} !important;',
				],
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render the widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 *
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();

		if ( '' === $settings['text'] ) {
			return;
		}

		$this->add_render_attribute( 'text-attr', 'class', 'emk--text' );

		$title_html = sprintf( '<div %1$s>%2$s</div>', $this->get_render_attribute_string( 'text-attr' ), $this->parse_text_editor( $settings['text'] ) );

		echo wp_kses_post( $title_html );
	}
}
