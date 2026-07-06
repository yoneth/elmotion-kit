<?php
/**
 * Elementor Advanced-tab controls for EMK Shaders feature.
 * Provides preset-based animated shader effects via @paper-design/shaders.
 */

namespace EMK\Extensions;

use Elementor\Controls_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class EMK_Shaders {
	public static function init() {
		add_action( 'elementor/element/common/_section_style/after_section_end', [ __CLASS__, 'register_controls' ], 9, 2 );
		add_action( 'elementor/element/container/section_layout/after_section_end', [ __CLASS__, 'register_controls' ], 9, 2 );
	}

	/**
	 * Build the full preset option list used in the Shader Preset select control.
	 *
	 * @return array<string, string> Preset ID => Category — Shader name — Preset name
	 */
	private static function get_preset_options(): array {
		$presets = [];

		$shaders = [
			'Premium' => [
				'mesh-gradient'           => 'Mesh Gradient',
				'grain-gradient'          => 'Grain Gradient',
				'static-mesh-gradient'    => 'Static Mesh Gradient',
				'static-radial-gradient'  => 'Static Radial Gradient',
				'smoke-ring'              => 'Smoke Ring',
				'simplex-noise'           => 'Simplex Noise',
			],
			'Futuristic' => [
				'neuro-noise'   => 'Neuro Noise',
				'god-rays'      => 'God Rays',
				'metaballs'     => 'Metaballs',
				'color-panels'  => 'Color Panels',
				'liquid-metal'  => 'Liquid Metal',
				'gem-smoke'     => 'Gem Smoke',
				'swirl'         => 'Swirl',
				'warp'          => 'Warp',
				'voronoi'       => 'Voronoi',
				'perlin-noise'  => 'Perlin Noise',
			],
			'Editorial' => [
				'paper-texture'    => 'Paper Texture',
				'dithering'        => 'Dithering',
				'dot-grid'         => 'Dot Grid',
				'dot-orbit'        => 'Dot Orbit',
				'halftone-dots'    => 'Halftone Dots',
				'halftone-cmyk'    => 'Halftone CMYK',
				'image-dithering'  => 'Image Dithering',
				'fluted-glass'     => 'Fluted Glass',
				'water'            => 'Water',
				'waves'            => 'Waves',
				'spiral'           => 'Spiral',
				'pulsing-border'   => 'Pulsing Border',
			],
		];

		$preset_names = [
			'mesh-gradient'          => [ 'Default', 'Purple', 'Beach', 'Ink' ],
			'grain-gradient'         => [ 'Default', 'Wave', 'Dots', 'Truchet', 'Ripple', 'Blob' ],
			'static-mesh-gradient'   => [ 'Default', 'Sea', '1960s', 'Sunset' ],
			'static-radial-gradient' => [ 'Default', 'Cross Section', 'Radial', 'Lo-Fi' ],
			'smoke-ring'             => [ 'Default', 'Solar', 'Line', 'Cloud' ],
			'simplex-noise'          => [ 'Default', 'Bubblegum', 'Spots', 'First contact' ],
			'neuro-noise'            => [ 'Default', 'Sensation', 'Bloodstream', 'Ghost' ],
			'god-rays'               => [ 'Default', 'Warp', 'Linear', 'Ether' ],
			'metaballs'              => [ 'Default', 'Ink Drops', 'Background', 'Solar' ],
			'color-panels'           => [ 'Default', 'Glass', 'Gradient', 'Opening' ],
			'liquid-metal'           => [ 'Default', 'Noir', 'Backdrop', 'Stripes' ],
			'gem-smoke'              => [ 'Default', 'Fluorescent', 'Fire', 'Infrared' ],
			'swirl'                  => [ 'Default', 'Opening', '007', 'Candy' ],
			'warp'                   => [ 'Default', 'Cauldron Pot', 'Live Ink', 'Kelp', 'Nectar', 'Passion' ],
			'voronoi'                => [ 'Default', 'Cells', 'Bubbles', 'Lights' ],
			'perlin-noise'           => [ 'Default', 'Nintendo Water', 'Moss', 'Worms' ],
			'paper-texture'          => [ 'Default', 'Abstract', 'Cardboard', 'Details' ],
			'dithering'              => [ 'Default', 'Sine Wave', 'Bugs', 'Ripple', 'Swirl', 'Warp' ],
			'dot-grid'               => [ 'Default', 'Triangles', 'Tree line', 'Wallpaper' ],
			'dot-orbit'              => [ 'Default', 'Shine', 'Bubbles', 'Hallucinatory' ],
			'halftone-dots'          => [ 'Default', 'LED screen', 'Mosaic', 'Round and square' ],
			'halftone-cmyk'          => [ 'Default', 'Drops', 'Newspaper', 'Vintage' ],
			'image-dithering'        => [ 'Default', 'Retro', 'Noise', 'Natural' ],
			'fluted-glass'           => [ 'Default', 'Waves', 'Abstract', 'Folds' ],
			'water'                  => [ 'Default', 'Abstract', 'Streaming', 'Slow-mo' ],
			'waves'                  => [ 'Default', 'Groovy', 'Tangled up', 'Ride the wave' ],
			'spiral'                 => [ 'Default', 'Droplet', 'Jungle', 'Swirl' ],
			'pulsing-border'         => [ 'Default', 'Circle', 'Northern lights', 'Solid line' ],
		];

		// Helper to convert a display preset name to a lower-kebab preset-id suffix.
		$to_kebab = function ( string $name ): string {
			return strtolower( str_replace( [ ' ', '.' ], [ '-', '' ], $name ) );
		};

		foreach ( $shaders as $category => $shader_list ) {
			foreach ( $shader_list as $shader_id => $shader_label ) {
				$names = $preset_names[ $shader_id ] ?? [];
				foreach ( $names as $preset_display ) {
					$preset_id = $shader_id . ':' . $to_kebab( $preset_display );
					$label     = sprintf(
						'%s — %s — %s',
						$category,
						$shader_label,
						$preset_display
					);
					$presets[ $preset_id ] = $label;
				}
			}
		}

		return $presets;
	}

	public static function register_controls( $element ) {
		$element->start_controls_section(
			'emk_section_shaders',
			[
				'label' => sprintf( '<i class="emk-logo"></i> %s', esc_html__( 'EMK Shaders', 'el-motionkit' ) ),
				'tab'   => Controls_Manager::TAB_ADVANCED,
			]
		);

		$basic_condition = [ 'emk_shader_enable' => 'yes' ];

		// === Basic Controls ===

		$element->add_control(
			'emk_shader_enable',
			[
				'label'              => esc_html__( 'Enable Shaders', 'el-motionkit' ),
				'type'               => Controls_Manager::SWITCHER,
				'return_value'       => 'yes',
				'default'            => '',
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_preset',
			[
				'label'              => esc_html__( 'Shader Preset', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'mesh-gradient:default',
				'options'            => self::get_preset_options(),
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_layer',
			[
				'label'              => esc_html__( 'Layer Position', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'behind',
				'options'            => [
					'behind'  => esc_html__( 'Behind content', 'el-motionkit' ),
					'overlay' => esc_html__( 'Above content', 'el-motionkit' ),
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_opacity',
			[
				'label'              => esc_html__( 'Opacity', 'el-motionkit' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => [ '%' ],
				'range'              => [
					'%' => [
						'min'  => 0,
						'max'  => 100,
						'step' => 1,
					],
				],
				'default'            => [
					'unit' => '%',
					'size' => 100,
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_blend',
			[
				'label'              => esc_html__( 'Blend Mode', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'normal',
				'options'            => [
					'normal'      => esc_html__( 'Normal', 'el-motionkit' ),
					'multiply'    => esc_html__( 'Multiply', 'el-motionkit' ),
					'screen'      => esc_html__( 'Screen', 'el-motionkit' ),
					'overlay'     => esc_html__( 'Overlay', 'el-motionkit' ),
					'soft-light'  => esc_html__( 'Soft Light', 'el-motionkit' ),
					'color-dodge' => esc_html__( 'Color Dodge', 'el-motionkit' ),
					'plus-lighter' => esc_html__( 'Plus Lighter', 'el-motionkit' ),
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_palette_mode',
			[
				'label'              => esc_html__( 'Colors', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'preset',
				'options'            => [
					'preset' => esc_html__( 'Use preset colors', 'el-motionkit' ),
					'custom' => esc_html__( 'Custom colors', 'el-motionkit' ),
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$custom_colors_condition = [
			'emk_shader_enable'      => 'yes',
			'emk_shader_palette_mode' => 'custom',
		];

		for ( $i = 1; $i <= 5; $i++ ) {
			$element->add_control(
				"emk_shader_color_{$i}",
				[
					'label'              => sprintf( esc_html__( 'Color %d', 'el-motionkit' ), $i ),
					'type'               => Controls_Manager::COLOR,
					'condition'          => $custom_colors_condition,
					'frontend_available' => true,
					'render_type'        => 'none',
				]
			);
		}

		$element->add_control(
			'emk_shader_image_source',
			[
				'label'              => esc_html__( 'Image Source', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'auto',
				'options'            => [
					'auto'       => esc_html__( 'Auto / first image', 'el-motionkit' ),
					'media'      => esc_html__( 'Upload image', 'el-motionkit' ),
					'background' => esc_html__( 'Element background', 'el-motionkit' ),
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_image',
			[
				'label'              => esc_html__( 'Image', 'el-motionkit' ),
				'type'               => Controls_Manager::MEDIA,
				'condition'          => [
					'emk_shader_enable'      => 'yes',
					'emk_shader_image_source' => 'media',
				],
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_speed_multiplier',
			[
				'label'              => esc_html__( 'Motion Speed', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'min'                => 0,
				'max'                => 3,
				'step'               => 0.05,
				'default'            => 1,
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		// === Advanced Controls ===

		$element->add_control(
			'emk_shader_advanced_heading',
			[
				'label'              => esc_html__( 'Advanced', 'el-motionkit' ),
				'type'               => Controls_Manager::HEADING,
				'separator'          => 'before',
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_fit',
			[
				'label'              => esc_html__( 'Fit', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'cover',
				'options'            => [
					'cover'  => esc_html__( 'Cover', 'el-motionkit' ),
					'contain' => esc_html__( 'Contain', 'el-motionkit' ),
					'none'   => esc_html__( 'None', 'el-motionkit' ),
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_scale',
			[
				'label'              => esc_html__( 'Scale', 'el-motionkit' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => [ 'px' ],
				'range'              => [
					'px' => [
						'min'  => 0.01,
						'max'  => 4,
						'step' => 0.01,
					],
				],
				'default'            => [
					'size' => 1,
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_rotation',
			[
				'label'              => esc_html__( 'Rotation', 'el-motionkit' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => [ 'deg' ],
				'range'              => [
					'deg' => [
						'min'  => 0,
						'max'  => 360,
						'step' => 1,
					],
				],
				'default'            => [
					'size' => 0,
					'unit' => 'deg',
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_offset_x',
			[
				'label'              => esc_html__( 'Offset X', 'el-motionkit' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => [ 'px' ],
				'range'              => [
					'px' => [
						'min'  => -1,
						'max'  => 1,
						'step' => 0.01,
					],
				],
				'default'            => [
					'size' => 0,
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_offset_y',
			[
				'label'              => esc_html__( 'Offset Y', 'el-motionkit' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => [ 'px' ],
				'range'              => [
					'px' => [
						'min'  => -1,
						'max'  => 1,
						'step' => 0.01,
					],
				],
				'default'            => [
					'size' => 0,
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_quality',
			[
				'label'              => esc_html__( 'Quality', 'el-motionkit' ),
				'type'               => Controls_Manager::SELECT,
				'default'            => 'balanced',
				'options'            => [
					'low'      => esc_html__( 'Low', 'el-motionkit' ),
					'balanced' => esc_html__( 'Balanced', 'el-motionkit' ),
					'high'     => esc_html__( 'High', 'el-motionkit' ),
				],
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_disable_mobile',
			[
				'label'              => esc_html__( 'Disable on Mobile', 'el-motionkit' ),
				'type'               => Controls_Manager::SWITCHER,
				'return_value'       => 'yes',
				'default'            => 'yes',
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_mobile_breakpoint',
			[
				'label'              => esc_html__( 'Mobile Breakpoint (px)', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'min'                => 0,
				'max'                => 1920,
				'step'               => 1,
				'default'            => 768,
				'condition'          => [
					'emk_shader_enable'       => 'yes',
					'emk_shader_disable_mobile' => 'yes',
				],
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->add_control(
			'emk_shader_frame',
			[
				'label'              => esc_html__( 'Start Frame', 'el-motionkit' ),
				'type'               => Controls_Manager::NUMBER,
				'min'                => 0,
				'max'                => 1000000,
				'step'               => 1,
				'default'            => 0,
				'condition'          => $basic_condition,
				'frontend_available' => true,
				'render_type'        => 'none',
			]
		);

		$element->end_controls_section();
	}
}

EMK_Shaders::init();
