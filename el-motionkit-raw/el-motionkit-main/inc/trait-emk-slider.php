<?php
/**
 * El MotionKit — Slider trait.
 *
 * Reusable building blocks for Swiper-based widgets (currently used by
 * the Brand Slider). Provides:
 *   - register_slider_controls()  – common slider option controls
 *   - get_slider_attributes()     – returns the JS config that slider.js
 *                                   hands to Swiper
 *   - render_slider_navigation()  – previous / next arrow markup
 *   - render_slider_pagination()  – dots / fraction / progressbar markup
 *   - render_swiper_button()      – single arrow icon
 *
 * This file is a from-scratch implementation built against the public
 * Elementor 4 controls API and the Swiper 8 documentation. Style
 * controls (color, size, typography, etc.) are intentionally NOT
 * registered here — each consuming widget registers its own style
 * section with widget-specific selectors.
 *
 * @package ElMotionKit
 */

namespace EMK;

use Elementor\Controls_Manager;
use Elementor\Icons_Manager;
use Elementor\Plugin;

defined( 'ABSPATH' ) || exit;

trait EMK_Slider_Trait {

	/**
	 * Register the common slider option controls.
	 *
	 * Adding widgets can call this from their own `register_controls()`,
	 * optionally passing an array of default values to override the
	 * built-in defaults.
	 *
	 * Setting keys registered:
	 *   slides_to_show, slides_to_show_{breakpoint},
	 *   autoplay, autoplay_delay, autoplay_interaction,
	 *   allow_touch_move, loop, mousewheel, speed,
	 *   space_between, space_between_{breakpoint},
	 *   navigation, navigation_previous_icon, navigation_next_icon,
	 *   pagination, pagination_type,
	 *   direction.
	 *
	 * @param array $overrides Map of default-value overrides.
	 * @return void
	 */
	protected function register_slider_controls( array $overrides = [] ): void {
		$defaults = [
			'slides_to_show'       => 3,
			'autoplay'             => 'yes',
			'autoplay_delay'       => 3000,
			'autoplay_interaction' => 'true',
			'allow_touch_move'     => 'false',
			'loop'                 => 'true',
			'mousewheel'           => '',
			'speed'                => 500,
			'space_between'        => 20,
			'navigation'           => 'yes',
			'pagination'           => 'yes',
			'pagination_type'      => 'bullets',
			'direction'            => 'ltr',
		];
		$d = array_merge( $defaults, $overrides );

		// Slides to show (1..10 or "auto")
		$slides_choices = [ 'auto' => esc_html__( 'Auto', 'el-motionkit' ) ];
		foreach ( range( 1, 10 ) as $i ) {
			$slides_choices[ (string) $i ] = (string) $i;
		}

		$this->add_responsive_control(
			'slides_to_show',
			[
				'label'       => esc_html__( 'Slides Per View', 'el-motionkit' ),
				'type'        => Controls_Manager::SELECT,
				'default'     => $d['slides_to_show'],
				'required'    => true,
				'options'     => $slides_choices,
				'render_type' => 'template',
				'selectors'   => [
					'{{WRAPPER}} .emk__slider' => '--slides-to-show: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'autoplay',
			[
				'label'   => esc_html__( 'Autoplay', 'el-motionkit' ),
				'type'    => Controls_Manager::SWITCHER,
				'default' => $d['autoplay'],
			]
		);

		$this->add_control(
			'autoplay_delay',
			[
				'label'     => esc_html__( 'Autoplay Delay (ms)', 'el-motionkit' ),
				'type'      => Controls_Manager::NUMBER,
				'min'       => 0,
				'step'      => 100,
				'default'   => $d['autoplay_delay'],
				'condition' => [ 'autoplay' => 'yes' ],
			]
		);

		$this->add_control(
			'autoplay_interaction',
			[
				'label'     => esc_html__( 'Pause on Interaction', 'el-motionkit' ),
				'type'      => Controls_Manager::SWITCHER,
				'default'   => $d['autoplay_interaction'],
				'condition' => [ 'autoplay' => 'yes' ],
			]
		);

		$this->add_control(
			'allow_touch_move',
			[
				'label'     => esc_html__( 'Allow Touch Move', 'el-motionkit' ),
				'type'      => Controls_Manager::SWITCHER,
				'separator' => 'before',
				'default'   => $d['allow_touch_move'],
			]
		);

		// Loop requires a re-render (no 'render_type' = 'none')
		$this->add_control(
			'loop',
			[
				'label'   => esc_html__( 'Loop', 'el-motionkit' ),
				'type'    => Controls_Manager::SWITCHER,
				'default' => $d['loop'],
			]
		);

		$this->add_control(
			'mousewheel',
			[
				'label'       => esc_html__( 'Mouse Wheel', 'el-motionkit' ),
				'description' => esc_html__( 'Tip: disable Loop when using Mouse Wheel.', 'el-motionkit' ),
				'type'        => Controls_Manager::SWITCHER,
				'default'     => $d['mousewheel'],
			]
		);

		$this->add_control(
			'speed',
			[
				'label'   => esc_html__( 'Transition Speed (ms)', 'el-motionkit' ),
				'type'    => Controls_Manager::NUMBER,
				'min'     => 0,
				'step'    => 50,
				'default' => $d['speed'],
			]
		);

		$this->add_responsive_control(
			'space_between',
			[
				'label'       => esc_html__( 'Space Between (px)', 'el-motionkit' ),
				'type'        => Controls_Manager::NUMBER,
				'min'         => 0,
				'default'     => $d['space_between'],
				'render_type' => 'template',
				'selectors'   => [
					'{{WRAPPER}} .emk__slider' => '--space-between: {{VALUE}}px;',
				],
			]
		);

		$this->add_control(
			'navigation',
			[
				'label'     => esc_html__( 'Arrows', 'el-motionkit' ),
				'type'      => Controls_Manager::SWITCHER,
				'separator' => 'before',
				'default'   => $d['navigation'],
			]
		);

		$this->add_control(
			'navigation_previous_icon',
			[
				'label'            => esc_html__( 'Previous Arrow Icon', 'el-motionkit' ),
				'type'             => Controls_Manager::ICONS,
				'fa4compatibility' => 'icon',
				'skin'             => 'inline',
				'label_block'      => false,
				'skin_settings'    => [
					'inline' => [
						'none' => [
							'label' => 'Default',
							'icon'  => 'eicon-chevron-left',
						],
						'icon' => [ 'icon' => 'eicon-star' ],
					],
				],
				'recommended'      => [
					'fa-regular' => [ 'arrow-alt-circle-left', 'caret-square-left' ],
					'fa-solid'   => [
						'angle-double-left', 'angle-left', 'arrow-alt-circle-left',
						'arrow-circle-left', 'arrow-left', 'caret-left',
						'caret-square-left', 'chevron-circle-left', 'chevron-left',
						'long-arrow-alt-left',
					],
				],
				'condition'        => [ 'navigation' => 'yes' ],
			]
		);

		$this->add_control(
			'navigation_next_icon',
			[
				'label'            => esc_html__( 'Next Arrow Icon', 'el-motionkit' ),
				'type'             => Controls_Manager::ICONS,
				'fa4compatibility' => 'icon',
				'skin'             => 'inline',
				'label_block'      => false,
				'skin_settings'    => [
					'inline' => [
						'none' => [
							'label' => 'Default',
							'icon'  => 'eicon-chevron-right',
						],
						'icon' => [ 'icon' => 'eicon-star' ],
					],
				],
				'recommended'      => [
					'fa-regular' => [ 'arrow-alt-circle-right', 'caret-square-right' ],
					'fa-solid'   => [
						'angle-double-right', 'angle-right', 'arrow-alt-circle-right',
						'arrow-circle-right', 'arrow-right', 'caret-right',
						'caret-square-right', 'chevron-circle-right', 'chevron-right',
						'long-arrow-alt-right',
					],
				],
				'condition'        => [ 'navigation' => 'yes' ],
			]
		);

		$this->add_control(
			'pagination',
			[
				'label'     => esc_html__( 'Pagination', 'el-motionkit' ),
				'type'      => Controls_Manager::SWITCHER,
				'separator' => 'before',
				'default'   => $d['pagination'],
			]
		);

		$this->add_control(
			'pagination_type',
			[
				'label'     => esc_html__( 'Pagination Style', 'el-motionkit' ),
				'type'      => Controls_Manager::SELECT,
				'default'   => $d['pagination_type'],
				'options'   => [
					'bullets'     => esc_html__( 'Bullets', 'el-motionkit' ),
					'fraction'    => esc_html__( 'Fraction', 'el-motionkit' ),
					'progressbar' => esc_html__( 'Progress Bar', 'el-motionkit' ),
				],
				'condition' => [ 'pagination' => 'yes' ],
			]
		);

		$this->add_control(
			'direction',
			[
				'label'     => esc_html__( 'Direction', 'el-motionkit' ),
				'type'      => Controls_Manager::SELECT,
				'separator' => 'before',
				'default'   => $d['direction'],
				'options'   => [
					'ltr' => esc_html__( 'Left to Right', 'el-motionkit' ),
					'rtl' => esc_html__( 'Right to Left', 'el-motionkit' ),
				],
			]
		);
	}

	/**
	 * Build the JS data object that the frontend slider.js hands to
	 * `new Swiper(el, config)`.
	 *
	 * Adds a render attribute on `carousel-wrapper` so the consuming
	 * widget can print it without a second call.
	 *
	 * @param array $settings Widget settings (defaults to current).
	 * @return array Swiper options.
	 */
	protected function get_slider_attributes( array $settings = [] ): array {
		if ( empty( $settings ) ) {
			$settings = $this->get_settings_for_display();
		}

		// Backward-compat: legacy SELECT controls stored 'true' / 'false' as
		// strings; new SWITCHER controls store 'yes' or ''. Treat any truthy
		// non-empty value other than the explicit 'false' string as on.
		$is_on = static function ( $value ): bool {
			return ! empty( $value ) && 'false' !== $value;
		};
		$autoplay_on   = ! empty( $settings['autoplay'] ) && 'false' !== $settings['autoplay'];
		$nav_on        = $is_on( $settings['navigation'] ?? '' );
		$pag_on        = $is_on( $settings['pagination'] ?? '' );
		$loop_on       = $is_on( $settings['loop'] ?? '' );
		$touch_on      = $is_on( $settings['allow_touch_move'] ?? '' );
		$mousewheel_on = $is_on( $settings['mousewheel'] ?? '' );

		$config = [
			'loop'           => $loop_on,
			'speed'          => (int) ( $settings['speed'] ?? 500 ),
			'allowTouchMove' => $touch_on,
			'slidesPerView'  => ( $settings['slides_to_show'] ?? 3 ),
			'spaceBetween'   => (int) ( $settings['space_between'] ?? 20 ),
		];

		if ( $autoplay_on ) {
			$config['autoplay'] = [
				'delay'                => (int) ( $settings['autoplay_delay'] ?? 3000 ),
				'disableOnInteraction' => $is_on( $settings['autoplay_interaction'] ?? '' ),
			];
		}
		if ( $nav_on ) {
			$config['navigation'] = [
				'nextEl' => '.elementor-element-' . $this->get_id() . ' .emk-arrow-next',
				'prevEl' => '.elementor-element-' . $this->get_id() . ' .emk-arrow-prev',
			];
		}
		if ( $pag_on ) {
			$config['pagination'] = [
				'el'        => '.elementor-element-' . $this->get_id() . ' .swiper-pagination',
				'clickable' => true,
				'type'      => $settings['pagination_type'] ?? 'bullets',
			];
		}
		if ( $mousewheel_on ) {
			$config['mousewheel'] = [ 'releaseOnEdges' => true ];
		}

		// Breakpoint overrides
		$breakpoints = Plugin::$instance->breakpoints->get_active_breakpoints();
		foreach ( $breakpoints as $name => $bp ) {
			$sps   = $settings[ 'slides_to_show_' . $name ] ?? $settings['slides_to_show'] ?? 3;
			$space = $settings[ 'space_between_' . $name ] ?? $settings['space_between'] ?? 20;
			$config['breakpoints'][ $bp->get_value() ] = [
				'slidesPerView' => $sps,
				'spaceBetween'  => (int) $space,
			];
		}

		$this->add_render_attribute(
			'carousel-wrapper',
			[
				'class' => 'emk__slider swiper',
				'dir'   => $settings['direction'] ?? 'ltr',
				'style' => 'position: static',
			]
		);

		return $config;
	}

	/**
	 * Render the previous / next arrow markup.
	 *
	 * @return void
	 */
	protected function render_slider_navigation(): void {
		if ( empty( $this->get_settings( 'navigation' ) ) ) {
			return;
		}
		?>
		<div class="emk-slider-nav">
			<div class="emk-arrow emk-arrow-prev" role="button" tabindex="0" aria-label="<?php esc_attr_e( 'Previous slide', 'el-motionkit' ); ?>">
				<?php $this->render_swiper_button( 'previous' ); ?>
			</div>
			<div class="emk-arrow emk-arrow-next" role="button" tabindex="0" aria-label="<?php esc_attr_e( 'Next slide', 'el-motionkit' ); ?>">
				<?php $this->render_swiper_button( 'next' ); ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Render the pagination dot/fraction/progressbar container.
	 *
	 * @return void
	 */
	protected function render_slider_pagination(): void {
		if ( empty( $this->get_settings( 'pagination' ) ) ) {
			return;
		}
		?>
		<div class="emk-slider-pag">
			<div class="swiper-pagination"></div>
		</div>
		<?php
	}
	/**
	 * Register navigation (arrow) style controls. Designed to be called
	 * inside a START_CONTROLS_SECTION / END_CONTROLS_SECTION pair owned
	 * by the consuming widget.
	 */
	protected function register_slider_navigation_style_controls(): void {
		$this->add_responsive_control(
			'arrow_size',
			[
				'label'     => esc_html__( 'Arrow Size', 'el-motionkit' ),
				'type'      => Controls_Manager::SLIDER,
				'range'     => [ 'px' => [ 'min' => 10, 'max' => 100 ] ],
				'selectors' => [
					'{{WRAPPER}} .emk-arrow' => 'font-size: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
			'arrow_circle_size',
			[
				'label'     => esc_html__( 'Arrow Box Size', 'el-motionkit' ),
				'type'      => Controls_Manager::SLIDER,
				'range'     => [ 'px' => [ 'min' => 20, 'max' => 200 ] ],
				'selectors' => [
					'{{WRAPPER}} .emk-arrow' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->start_controls_tabs( 'tabs_emk_arrow_style' );

		$this->start_controls_tab(
			'tab_emk_arrow_normal',
			[ 'label' => esc_html__( 'Normal', 'el-motionkit' ) ]
		);
		$this->add_control(
			'arrow_color',
			[
				'label'     => esc_html__( 'Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .emk-arrow' => 'color: {{VALUE}}; fill: {{VALUE}};',
				],
			]
		);
		$this->add_control(
			'arrow_background',
			[
				'label'     => esc_html__( 'Background', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .emk-arrow' => 'background-color: {{VALUE}};',
				],
			]
		);
		$this->end_controls_tab();

		$this->start_controls_tab(
			'tab_emk_arrow_hover',
			[ 'label' => esc_html__( 'Hover', 'el-motionkit' ) ]
		);
		$this->add_control(
			'arrow_hover_color',
			[
				'label'     => esc_html__( 'Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .emk-arrow:hover, {{WRAPPER}} .emk-arrow:focus' => 'color: {{VALUE}}; fill: {{VALUE}};',
				],
			]
		);
		$this->add_control(
			'arrow_hover_background',
			[
				'label'     => esc_html__( 'Background', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .emk-arrow:hover, {{WRAPPER}} .emk-arrow:focus' => 'background-color: {{VALUE}};',
				],
			]
		);
		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->add_responsive_control(
			'arrow_gap',
			[
				'label'      => esc_html__( 'Gap Between Arrows', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px', 'em' ],
				'range'      => [ 'px' => [ 'min' => 0, 'max' => 100 ] ],
				'separator'  => 'before',
				'selectors'  => [
					'{{WRAPPER}} .emk-slider-nav' => 'gap: {{SIZE}}{{UNIT}};',
				],
			]
		);
	}

	/**
	 * Register pagination style controls (bullets, fraction, progressbar).
	 * Designed to be called inside a START_CONTROLS_SECTION /
	 * END_CONTROLS_SECTION pair owned by the consuming widget.
	 */
	protected function register_slider_pagination_style_controls(): void {
		// Bullets
		$this->add_control(
			'bullets_color',
			[
				'label'     => esc_html__( 'Bullet Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .swiper-pagination-bullet' => 'background: {{VALUE}};',
				],
				'condition' => [ 'pagination_type' => 'bullets' ],
			]
		);
		$this->add_control(
			'bullets_active_color',
			[
				'label'     => esc_html__( 'Active Bullet Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .swiper-pagination-bullet-active' => 'background: {{VALUE}};',
				],
				'condition' => [ 'pagination_type' => 'bullets' ],
			]
		);
		$this->add_responsive_control(
			'bullets_size',
			[
				'label'     => esc_html__( 'Bullet Size', 'el-motionkit' ),
				'type'      => Controls_Manager::SLIDER,
				'range'     => [ 'px' => [ 'min' => 4, 'max' => 30 ] ],
				'selectors' => [
					'{{WRAPPER}} .swiper-pagination-bullet' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
				],
				'condition' => [ 'pagination_type' => 'bullets' ],
			]
		);

		// Fraction
		$this->add_control(
			'fraction_color',
			[
				'label'     => esc_html__( 'Fraction Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .swiper-pagination-fraction' => 'color: {{VALUE}};',
				],
				'condition' => [ 'pagination_type' => 'fraction' ],
			]
		);

		// Progress bar
		$this->add_control(
			'progressbar_color',
			[
				'label'     => esc_html__( 'Progress Bar Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .swiper-pagination-progressbar' => 'background-color: {{VALUE}};',
				],
				'condition' => [ 'pagination_type' => 'progressbar' ],
			]
		);
		$this->add_control(
			'progressbar_fill_color',
			[
				'label'     => esc_html__( 'Progress Bar Fill Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .swiper-pagination-progressbar-fill' => 'background-color: {{VALUE}};',
				],
				'condition' => [ 'pagination_type' => 'progressbar' ],
			]
		);
	}

	/**
	 * Render a single arrow icon (previous or next).
	 *
	 * @param string $type Either 'previous' or 'next'.
	 * @return void
	 */
	private function render_swiper_button( string $type ): void {
		$direction     = ( 'next' === $type ) ? 'right' : 'left';
		$icon_settings = $this->get_settings( 'navigation_' . $type . '_icon' );

		if ( empty( $icon_settings['value'] ) ) {
			$icon_settings = [
				'library' => 'eicons',
				'value'   => 'eicon-chevron-' . $direction,
			];
		}

		\Elementor\Icons_Manager::render_icon( $icon_settings, [ 'aria-hidden' => 'true' ] );
	}
}
