<?php
/**
 * El MotionKit — Marquee widget.
 *
 * A horizontal infinite-scroll marquee with two content modes (text list
 * or image gallery). The animation is a pure GSAP timeline that loops
 * at a constant speed; each text item keeps its intrinsic width so the
 * marquee looks natural regardless of text length.
 *
 * This file is a from-scratch implementation built against the public
 * Elementor 4 controls API and the GSAP 3 documentation. It does NOT
 * borrow control IDs, ordering, or comments from any other plugin.
 *
 * @package ElMotionKit
 */

namespace EMK\Widgets;

use Elementor\Group_Control_Border;
use Elementor\Group_Control_Image_Size;
use Elementor\Group_Control_Text_Stroke;
use Elementor\Group_Control_Typography;
use Elementor\Icons_Manager;
use Elementor\Repeater;
use Elementor\Widget_Base;
use Elementor\Controls_Manager;

defined( 'ABSPATH' ) || exit;

class Marquee extends Widget_Base {

	// Widget name (Elementor identifier, stored in saved page data)
	// stays 'emk--brand-slider' for backward compat with existing
	// pages. User-facing name and class are 'Marquee' / `Marquee`.
	const WIDGET_NAME   = 'emk--brand-slider';
	const CATEGORY      = 'el-motion-kit';
	const STYLE_HANDLE  = 'emk--marquee';
	const SCRIPT_HANDLE = 'emk--marquee';

	/** @return string */
	public function get_name() {
		return self::WIDGET_NAME;
	}

	/** @return string */
	public function get_title() {
		return esc_html__( 'Marquee', 'el-motionkit' );
	}

	/** @return string */
	public function get_icon() {
		return 'eicon-carousel emk-badge';
	}

	/** @return array */
	public function get_categories() {
		return [ self::CATEGORY ];
	}

	/** @return array */
	public function get_script_depends() {
		return [ 'gsap', self::SCRIPT_HANDLE ];
	}

	/** @return array */
	public function get_style_depends() {
		return [ self::STYLE_HANDLE ];
	}

	/** @return array */
	public function get_keywords() {
		return [ 'marquee', 'ticker', 'carousel', 'logo', 'text' ];
	}

	protected function register_controls() {
		$this->register_content_section();
		$this->register_animation_section();
		$this->register_image_style_section();
		$this->register_text_style_section();
	}

	private function register_content_section(): void {
		$this->start_controls_section(
			'emk_marquee_content',
			[
				'label' => esc_html__( 'Marquee Content', 'el-motionkit' ),
			]
		);

		$this->add_control(
			'slide_mode',
			[
				'label'   => esc_html__( 'Content Type', 'el-motionkit' ),
				'type'    => Controls_Manager::SELECT,
				'default' => 'text',
				'options' => [
					'text'  => esc_html__( 'Text', 'el-motionkit' ),
					'image' => esc_html__( 'Image', 'el-motionkit' ),
				],
			]
		);

		// Image mode: gallery + image-size
		$this->add_control(
			'image_gallery',
			[
				'label'      => esc_html__( 'Add Images', 'el-motionkit' ),
				'type'       => Controls_Manager::GALLERY,
				'default'    => [],
				'show_label' => false,
				'dynamic'    => [ 'active' => true ],
				'condition'  => [ 'slide_mode' => 'image' ],
			]
		);

		$this->add_group_control(
			Group_Control_Image_Size::get_type(),
			[
				'name'      => 'logo_thumb',
				'separator' => 'none',
				'condition' => [ 'slide_mode' => 'image' ],
			]
		);

		// Text mode: repeater of items + separator icon
		$repeater = new Repeater();
		$repeater->add_control(
			'item_text',
			[
				'label'       => esc_html__( 'Text', 'el-motionkit' ),
				'type'        => Controls_Manager::TEXT,
				'default'     => esc_html__( 'Designer', 'el-motionkit' ),
				'label_block' => true,
			]
		);

		$this->add_control(
			'text_items',
			[
				'label'       => esc_html__( 'Text List', 'el-motionkit' ),
				'type'        => Controls_Manager::REPEATER,
				'fields'      => $repeater->get_controls(),
				'default'     => [
					[ 'item_text' => esc_html__( 'Content', 'el-motionkit' ) ],
					[ 'item_text' => esc_html__( '(Health Advisor & Coach)', 'el-motionkit' ) ],
					[ 'item_text' => esc_html__( 'News', 'el-motionkit' ) ],
					[ 'item_text' => esc_html__( 'Creative Director', 'el-motionkit' ) ],
				],
				'title_field' => '{{{ item_text }}}', // phpcs:ignore
				'condition'   => [ 'slide_mode' => 'text' ],
			]
		);

		$this->add_control(
			'separator_icon',
			[
				'label'     => esc_html__( 'Separator', 'el-motionkit' ),
				'type'      => Controls_Manager::ICONS,
				'default'   => [
					'value'   => 'far fa-star',
					'library' => 'fa-brands',
				],
				'condition' => [ 'slide_mode' => 'text' ],
			]
		);

		$this->end_controls_section();
	}

	private function register_animation_section(): void {
		$this->start_controls_section(
			'emk_marquee_animation',
			[
				'label' => esc_html__( 'Animation', 'el-motionkit' ),
			]
		);

	// Speed in pixels per second. Lower = slower. 80 px/s reads
	// as a calm continuous scroll. No `render_type` here — the
	// value must be saved to the post meta so the JS reads the
	// latest user setting on each page load.
	$this->add_control(
		'speed_pps',
		[
			'label'       => esc_html__( 'Speed (px / second)', 'el-motionkit' ),
			'description' => esc_html__( 'Higher = faster. Linear continuous motion, no easing.', 'el-motionkit' ),
			'type'        => Controls_Manager::NUMBER,
			'min'         => 5,
			'max'         => 500,
			'step'        => 5,
			'default'     => 80,
		]
	);

		// Direction: left-to-right (reverse) toggle.
		$this->add_control(
			'direction',
			[
				'label'   => esc_html__( 'Direction', 'el-motionkit' ),
				'type'    => Controls_Manager::SELECT,
				'default' => 'left',
				'options' => [
					'left'  => esc_html__( 'Scroll Left', 'el-motionkit' ),
					'right' => esc_html__( 'Scroll Right', 'el-motionkit' ),
				],
			]
		);

		// Pause on hover.
		$this->add_control(
			'pause_on_hover',
			[
				'label'   => esc_html__( 'Pause on Hover', 'el-motionkit' ),
				'type'    => Controls_Manager::SWITCHER,
				'default' => '',
			]
		);

		// Edge gradient mask (soft fade-out at both ends).
		$this->add_control(
			'edge_fade',
			[
				'label'       => esc_html__( 'Edge Fade', 'el-motionkit' ),
				'description' => esc_html__( 'Adds a soft mask at the start and end of the marquee.', 'el-motionkit' ),
				'type'        => Controls_Manager::SWITCHER,
				'default'     => 'yes',
			]
		);

		$this->end_controls_section();
	}

	private function register_image_style_section(): void {
		$this->start_controls_section(
			'emk_marquee_image_style',
			[
				'label'     => esc_html__( 'Image', 'el-motionkit' ),
				'tab'       => Controls_Manager::TAB_STYLE,
				'condition' => [ 'slide_mode' => 'image' ],
			]
		);

		$this->add_responsive_control(
			'logo_height',
			[
				'label'      => esc_html__( 'Height', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px', 'em', 'rem', 'vh' ],
				'range'      => [
					'px' => [ 'min' => 8, 'max' => 320, 'step' => 1 ],
					'em' => [ 'min' => 0, 'max' => 20, 'step' => 0.1 ],
				],
				'default'    => [ 'unit' => 'px', 'size' => 48 ],
				'selectors'  => [
					'{{WRAPPER}} .emk--marquee .emk--marquee-item img' => 'height: {{SIZE}}{{UNIT}}; width: auto;',
				],
			]
		);

		$this->add_responsive_control(
			'logo_gap',
			[
				'label'      => esc_html__( 'Space Between Items', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px', 'em', 'rem' ],
				'range'      => [
					'px' => [ 'min' => 0, 'max' => 200 ],
				],
				'default'    => [ 'unit' => 'px', 'size' => 60 ],
				'selectors'  => [
					'{{WRAPPER}} .emk--marquee .emk--marquee-item' => 'padding-right: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name'     => 'logo_border',
				'selector' => '{{WRAPPER}} .emk--marquee .emk--marquee-item img',
			]
		);

		$this->add_responsive_control(
			'logo_border_radius',
			[
				'label'      => esc_html__( 'Border Radius', 'el-motionkit' ),
				'type'       => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em', 'rem' ],
				'selectors'  => [
					'{{WRAPPER}} .emk--marquee .emk--marquee-item img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();
	}

	private function register_text_style_section(): void {
		$this->start_controls_section(
			'emk_marquee_text_style',
			[
				'label'     => esc_html__( 'Text', 'el-motionkit' ),
				'tab'       => Controls_Manager::TAB_STYLE,
				'condition' => [ 'slide_mode' => 'text' ],
			]
		);

		$this->add_control(
			'text_color',
			[
				'label'     => esc_html__( 'Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .emk--marquee .emk--marquee-text' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name'     => 'text_typography',
				'selector' => '{{WRAPPER}} .emk--marquee .emk--marquee-text',
			]
		);

		$this->add_group_control(
			Group_Control_Text_Stroke::get_type(),
			[
				'name'     => 'text_stroke',
				'selector' => '{{WRAPPER}} .emk--marquee .emk--marquee-text',
			]
		);

		$this->add_control(
			'separator_color',
			[
				'label'     => esc_html__( 'Separator Color', 'el-motionkit' ),
				'type'      => Controls_Manager::COLOR,
				'separator' => 'before',
				'selectors' => [
					'{{WRAPPER}} .emk--marquee .emk--marquee-separator i'   => 'color: {{VALUE}};',
					'{{WRAPPER}} .emk--marquee .emk--marquee-separator svg' => 'fill: {{VALUE}};',
				],
			]
		);

		$this->add_responsive_control(
			'separator_size',
			[
				'label'      => esc_html__( 'Separator Size', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px', 'rem' ],
				'range'      => [
					'px' => [ 'min' => 6, 'max' => 200 ],
				],
				'default'    => [ 'unit' => 'px', 'size' => 20 ],
				'selectors'  => [
					'{{WRAPPER}} .emk--marquee .emk--marquee-separator' => 'font-size: {{SIZE}}{{UNIT}}; width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .emk--marquee .emk--marquee-separator .e-font-icon-svg' => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'separator_gap',
			[
				'label'      => esc_html__( 'Separator Gap', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px', 'em', 'rem' ],
				'range'      => [
					'px' => [ 'min' => 0, 'max' => 100 ],
					'em' => [ 'min' => 0, 'max' => 6, 'step' => 0.1 ],
				],
				'default'    => [ 'unit' => 'px', 'size' => 0 ],
				'selectors'  => [
					'{{WRAPPER}} .emk--marquee .emk--marquee-separator' => 'margin-inline: {{SIZE}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'text_gap',
			[
				'label'      => esc_html__( 'Space Between Items', 'el-motionkit' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px', 'em', 'rem' ],
				'range'      => [
					'px' => [ 'min' => 0, 'max' => 200 ],
				],
				'default'    => [ 'unit' => 'px', 'size' => 60 ],
				'selectors'  => [
					'{{WRAPPER}} .emk--marquee .emk--marquee-item' => 'padding-right: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		$mode     = $settings['slide_mode'] ?? 'text';

		$items = ( 'image' === $mode )
			? $this->build_image_items( $settings )
			: $this->build_text_items( $settings );

		if ( empty( $items ) ) {
			return;
		}

		// Render the items THREE times. With three copies the track is
		// 3 * (single-copy-width), so even with the edge-fade mask on
		// the viewport always shows full-opacity text from at least one
		// copy. The GSAP timeline still scrolls exactly one copy width
		// per cycle, so all three copies move together with no visual
		// seam. Doing it server-side keeps the editor iframe in sync
		// with the frontend (no JS race during preview).
		$all_items = array_merge( $items, $items, $items );
		// We still pass the copy count to the JS so the timeline
		// can measure and animate correctly.

		$wrapper_classes = [ 'emk--marquee' ];
		if ( ! empty( $settings['pause_on_hover'] ) ) {
			$wrapper_classes[] = 'emk--marquee-pause-hover';
		}
		if ( ! empty( $settings['edge_fade'] ) ) {
			$wrapper_classes[] = 'emk--marquee-edge-fade';
		}

		// JS-side data-attribute consumed by marquee.js
		$js_data = wp_json_encode(
			[
				'speed_pps' => (int) ( $settings['speed_pps'] ?? 80 ),
				'direction' => $settings['direction'] ?? 'left',
				'pause'     => ! empty( $settings['pause_on_hover'] ),
				'ease'      => 'none', // linear by default; sampeyan asked for this
				'copies'    => 3,
			]
		);
		// Edge fade needs a mask-image (CSS) which targets the wrapper
		// via a data attribute because Elementor's {{WRAPPER}} only
		// resolves inside a selector string.
		?>
		<div class="<?php echo esc_attr( implode( ' ', $wrapper_classes ) ); ?>"
			data-id="<?php echo esc_attr( $this->get_id() ); ?>"
			data-emk-marquee="<?php echo esc_attr( $js_data ); ?>">
			<div class="emk--marquee-viewport">
				<div class="emk--marquee-track">
					<?php echo implode( '', $all_items ); ?>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Build the inner HTML for each text item.
	 *
	 * @param array $settings Widget settings.
	 * @return array<int, string>
	 */
	private function build_text_items( array $settings ): array {
		$items = $settings['text_items'] ?? [];
		if ( empty( $items ) ) {
			return [];
		}
		$separator_html = Icons_Manager::try_get_icon_html(
			$settings['separator_icon'] ?? [],
			[ 'aria-hidden' => 'true' ]
		);

		$sep_size  = $settings['separator_size'] ?? [];
		$sep_unit  = ! empty( $sep_size['unit'] ) ? esc_attr( $sep_size['unit'] ) : 'px';
		$sep_val   = ! empty( $sep_size['size'] ) ? (float) $sep_size['size'] : 20;
		$sep_style = 'font-size:' . $sep_val . $sep_unit . ';';

		// Inject explicit width/height on SVG for initial render.
		// In the editor, selectors CSS handles real-time sizing.
		if ( 0 === strpos( $separator_html, '<svg ' ) ) {
			$separator_html = str_replace(
				'<svg ',
				'<svg width="1em" height="1em" ',
				$separator_html
			);
		}
		$out = [];
		foreach ( $items as $item ) {
			$text = $item['item_text'] ?? '';
			// width: max-content is applied via CSS class so each
			// text item keeps its intrinsic width. white-space:
			// nowrap keeps it on a single line.
			$out[] = sprintf(
				'<div class="emk--marquee-item"><span class="emk--marquee-text">%1$s</span>%2$s</div>',
				esc_html( $text ),
				$separator_html
					? '<span class="emk--marquee-separator" style="' . $sep_style . '">' . $separator_html . '</span>'
					: ''
			);
		}
		return $out;
	}

	/**
	 * Build the inner HTML for each image item.
	 *
	 * @param array $settings Widget settings.
	 * @return array<int, string>
	 */
	private function build_image_items( array $settings ): array {
		$gallery = $settings['image_gallery'] ?? [];
		if ( empty( $gallery ) ) {
			return [];
		}
		$out = [];
		foreach ( $gallery as $attachment ) {
			$image_url = Group_Control_Image_Size::get_attachment_image_src(
				$attachment['id'] ?? 0,
				'logo_thumb',
				$settings
			);
			if ( ! $image_url && ! empty( $attachment['url'] ) ) {
				$image_url = $attachment['url'];
			}
			if ( ! $image_url ) {
				continue;
			}
			$alt = ! empty( $attachment['alt'] ) ? $attachment['alt'] : '';
			$out[] = sprintf(
				'<div class="emk--marquee-item"><img src="%1$s" alt="%2$s" loading="lazy" /></div>',
				esc_url( $image_url ),
				esc_attr( $alt )
			);
		}
		return $out;
	}
}
