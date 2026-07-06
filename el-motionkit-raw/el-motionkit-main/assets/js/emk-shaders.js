(function ($) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var IMAGE_SHADER_IDS = [
    'fluted-glass', 'water', 'image-dithering', 'heatmap',
    'liquid-metal', 'halftone-dots', 'halftone-cmyk',
    'gem-smoke', 'paper-texture'
  ];

  var SHADER_FRAGMENT_MAP = {
    'mesh-gradient': 'meshGradientFragmentShader',
    'smoke-ring': 'smokeRingFragmentShader',
    'neuro-noise': 'neuroNoiseFragmentShader',
    'dot-orbit': 'dotOrbitFragmentShader',
    'dot-grid': 'dotGridFragmentShader',
    'simplex-noise': 'simplexNoiseFragmentShader',
    'metaballs': 'metaballsFragmentShader',
    'waves': 'wavesFragmentShader',
    'perlin-noise': 'perlinNoiseFragmentShader',
    'voronoi': 'voronoiFragmentShader',
    'warp': 'warpFragmentShader',
    'god-rays': 'godRaysFragmentShader',
    'spiral': 'spiralFragmentShader',
    'swirl': 'swirlFragmentShader',
    'dithering': 'ditheringFragmentShader',
    'grain-gradient': 'grainGradientFragmentShader',
    'pulsing-border': 'pulsingBorderFragmentShader',
    'color-panels': 'colorPanelsFragmentShader',
    'static-mesh-gradient': 'staticMeshGradientFragmentShader',
    'static-radial-gradient': 'staticRadialGradientFragmentShader',
    'paper-texture': 'paperTextureFragmentShader',
    'fluted-glass': 'flutedGlassFragmentShader',
    'water': 'waterFragmentShader',
    'image-dithering': 'imageDitheringFragmentShader',
    'heatmap': 'heatmapFragmentShader',
    'liquid-metal': 'liquidMetalFragmentShader',
    'halftone-dots': 'halftoneDotsFragmentShader',
    'halftone-cmyk': 'halftoneCmykFragmentShader',
    'gem-smoke': 'gemSmokeFragmentShader'
  };

  var ENUM_MAP_NAMES = {
    'DotGridShapes': 'DotGridShapes',
    'DitheringShapes': 'DitheringShapes',
    'DitheringTypes': 'DitheringTypes',
    'WarpPatterns': 'WarpPatterns',
    'PulsingBorderAspectRatios': 'PulsingBorderAspectRatios',
    'GlassDistortionShapes': 'GlassDistortionShapes',
    'GlassGridShapes': 'GlassGridShapes',
    'LiquidMetalShapes': 'LiquidMetalShapes',
    'HalftoneDotsTypes': 'HalftoneDotsTypes',
    'HalftoneDotsGrids': 'HalftoneDotsGrids',
    'HalftoneCmykTypes': 'HalftoneCmykTypes',
    'GemSmokeShapes': 'GemSmokeShapes',
    'GrainGradientShapes': 'GrainGradientShapes'
  };


  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function valueOr(value, fallback) {
    return value === undefined || value === null ? fallback : value;
  }

  function cloneParams(params) {
    var out = {};
    params = params || {};
    for (var key in params) {
      if (hasOwn(params, key)) {
        out[key] = Array.isArray(params[key]) ? params[key].slice() : params[key];
      }
    }
    return out;
  }

  function getCustomPalette(settings) {
    var colors = [];
    for (var i = 1; i <= 5; i++) {
      var color = getColorSetting(settings, 'emk_shader_color_' + i, null);
      colors.push(color && typeof color === 'string' ? color : null);
    }
    return colors;
  }

  function applyCustomColorOverrides(params, settings) {
    if (getSetting(settings, 'emk_shader_palette_mode') !== 'custom') return params;

    var customColors = getCustomPalette(settings);
    var hasCustomColor = false;
    for (var i = 0; i < customColors.length; i++) {
      if (customColors[i]) {
        hasCustomColor = true;
        break;
      }
    }
    if (!hasCustomColor) return params;

    if (Array.isArray(params.colors)) {
      params.colors = params.colors.slice();
      for (var ci = 0; ci < customColors.length && ci < params.colors.length; ci++) {
        if (customColors[ci]) params.colors[ci] = customColors[ci];
      }
      return params;
    }

    for (var pi = 1; pi <= customColors.length; pi++) {
      var prop = 'color' + pi;
      if (hasOwn(params, prop) && customColors[pi - 1]) {
        params[prop] = customColors[pi - 1];
      }
    }

    return params;
  }

  function shaderColor(value, PS, fallback) {
    var color = valueOr(value, fallback || '#000000');
    if (typeof color === 'string' && color.indexOf('globals/colors?id=') === 0) {
      var resolved = resolveGlobalColor(color);
      if (resolved) color = resolved;
    }
    return PS && typeof PS.getShaderColorFromString === 'function'
      ? PS.getShaderColorFromString(color)
      : color;
  }

  function shaderColors(values, PS) {
    var list = Array.isArray(values) ? values : [];
    var colors = [];
    for (var i = 0; i < list.length; i++) {
      colors.push(shaderColor(list[i], PS));
    }
    return colors;
  }

  function enumValue(PS, globalName, value) {
    var enumObj = PS && PS[globalName];
    if (enumObj && enumObj[value] !== undefined) return enumObj[value];
    var num = Number(value);
    return Number.isFinite(num) ? num : value;
  }

  function noiseTexture(PS) {
    return PS && typeof PS.getShaderNoiseTexture === 'function' ? PS.getShaderNoiseTexture() : null;
  }

  function numericSizing(settings, settingKey, paramValue, fallback, elementorDefault) {
    var raw = getSetting(settings, settingKey);
    if (raw !== undefined && raw !== null && raw !== '') {
      var settingValue = parseNum(raw, elementorDefault);
      if (settingValue !== elementorDefault) return settingValue;
    }
    return parseNum(paramValue, fallback);
  }

  function applySizingUniforms(uniforms, params, settings, PS) {
    var fitSetting = getSetting(settings, 'emk_shader_fit');
    var fit = fitSetting && fitSetting !== 'cover' ? fitSetting : valueOr(params.fit, fitSetting || 'cover');
    uniforms.u_fit = PS && PS.ShaderFitOptions && PS.ShaderFitOptions[fit] !== undefined ? PS.ShaderFitOptions[fit] : 2;
    uniforms.u_scale = numericSizing(settings, 'emk_shader_scale', params.scale, 1, 1);
    uniforms.u_rotation = numericSizing(settings, 'emk_shader_rotation', params.rotation, 0, 0);
    uniforms.u_offsetX = numericSizing(settings, 'emk_shader_offset_x', params.offsetX, 0, 0);
    uniforms.u_offsetY = numericSizing(settings, 'emk_shader_offset_y', params.offsetY, 0, 0);
    uniforms.u_originX = parseNum(params.originX, 0.5);
    uniforms.u_originY = parseNum(params.originY, 0.5);
    uniforms.u_worldWidth = parseNum(params.worldWidth, 0);
    uniforms.u_worldHeight = parseNum(params.worldHeight, 0);
    uniforms.u_imageAspectRatio = parseNum(params.imageAspectRatio, 1);
    return uniforms;
  }

  var PARAM_CONVERTERS = {
    'mesh-gradient': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colors: colors,
        u_colorsCount: colors.length,
        u_distortion: params.distortion,
        u_swirl: params.swirl,
        u_grainMixer: params.grainMixer,
        u_grainOverlay: params.grainOverlay
      };
    },

    'grain-gradient': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colors: colors,
        u_colorsCount: colors.length,
        u_softness: params.softness,
        u_intensity: params.intensity,
        u_noise: params.noise,
        u_shape: enumValue(PS, 'GrainGradientShapes', params.shape),
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'static-mesh-gradient': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colors: colors,
        u_colorsCount: colors.length,
        u_positions: params.positions,
        u_waveX: params.waveX,
        u_waveXShift: params.waveXShift,
        u_waveY: params.waveY,
        u_waveYShift: params.waveYShift,
        u_mixing: params.mixing,
        u_grainMixer: params.grainMixer,
        u_grainOverlay: params.grainOverlay
      };
    },

    'static-radial-gradient': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colors: colors,
        u_colorsCount: colors.length,
        u_radius: params.radius,
        u_focalDistance: params.focalDistance,
        u_focalAngle: params.focalAngle,
        u_falloff: params.falloff,
        u_mixing: params.mixing,
        u_distortion: params.distortion,
        u_distortionShift: params.distortionShift,
        u_distortionFreq: params.distortionFreq,
        u_grainMixer: params.grainMixer,
        u_grainOverlay: params.grainOverlay
      };
    },

    'smoke-ring': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colors: colors,
        u_colorsCount: colors.length,
        u_noiseScale: params.noiseScale,
        u_thickness: params.thickness,
        u_radius: params.radius,
        u_innerShape: params.innerShape,
        u_noiseIterations: params.noiseIterations,
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'simplex-noise': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colors: colors,
        u_colorsCount: colors.length,
        u_stepsPerColor: params.stepsPerColor,
        u_softness: params.softness
      };
    },

    'neuro-noise': function (params, PS) {
      return {
        u_colorFront: shaderColor(params.colorFront, PS),
        u_colorMid: shaderColor(params.colorMid, PS),
        u_colorBack: shaderColor(params.colorBack, PS),
        u_brightness: params.brightness,
        u_contrast: params.contrast
      };
    },

    'god-rays': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colorBloom: shaderColor(params.colorBloom, PS),
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colors: colors,
        u_colorsCount: colors.length,
        u_density: params.density,
        u_spotty: params.spotty,
        u_midIntensity: params.midIntensity,
        u_midSize: params.midSize,
        u_intensity: params.intensity,
        u_bloom: params.bloom,
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'metaballs': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colors: colors,
        u_colorsCount: colors.length,
        u_size: params.size,
        u_count: params.count,
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'color-panels': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colors: colors,
        u_colorsCount: colors.length,
        u_colorBack: shaderColor(params.colorBack, PS),
        u_angle1: params.angle1,
        u_angle2: params.angle2,
        u_length: params.length,
        u_edges: params.edges,
        u_blur: params.blur,
        u_fadeIn: params.fadeIn,
        u_fadeOut: params.fadeOut,
        u_density: params.density,
        u_gradient: params.gradient
      };
    },

    'liquid-metal': function (params, PS) {
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colorTint: shaderColor(params.colorTint, PS),
        u_contour: params.contour,
        u_distortion: params.distortion,
        u_softness: params.softness,
        u_repetition: params.repetition,
        u_shiftRed: params.shiftRed,
        u_shiftBlue: params.shiftBlue,
        u_angle: params.angle,
        u_isImage: 0,
        u_shape: enumValue(PS, 'LiquidMetalShapes', params.shape)
      };
    },

    'gem-smoke': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colors: colors,
        u_colorsCount: colors.length,
        u_colorBack: shaderColor(params.colorBack, PS),
        u_innerDistortion: params.innerDistortion,
        u_outerDistortion: params.outerDistortion,
        u_outerGlow: params.outerGlow,
        u_innerGlow: params.innerGlow,
        u_colorInner: shaderColor(params.colorInner, PS),
        u_offset: params.offset,
        u_angle: params.angle,
        u_size: params.size,
        u_isImage: 0,
        u_shape: enumValue(PS, 'GemSmokeShapes', params.shape)
      };
    },

    'swirl': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colors: colors,
        u_colorsCount: colors.length,
        u_bandCount: params.bandCount,
        u_twist: params.twist,
        u_center: params.center,
        u_proportion: params.proportion,
        u_softness: params.softness,
        u_noiseFrequency: params.noiseFrequency,
        u_noise: params.noise
      };
    },

    'warp': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colors: colors,
        u_colorsCount: colors.length,
        u_proportion: params.proportion,
        u_softness: params.softness,
        u_distortion: params.distortion,
        u_swirl: params.swirl,
        u_swirlIterations: params.swirlIterations,
        u_shapeScale: params.shapeScale,
        u_shape: enumValue(PS, 'WarpPatterns', params.shape),
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'voronoi': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colors: colors,
        u_colorsCount: colors.length,
        u_stepsPerColor: params.stepsPerColor,
        u_colorGlow: shaderColor(params.colorGlow, PS),
        u_colorGap: shaderColor(params.colorGap, PS),
        u_distortion: params.distortion,
        u_gap: params.gap,
        u_glow: params.glow,
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'perlin-noise': function (params, PS) {
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colorFront: shaderColor(params.colorFront, PS),
        u_proportion: params.proportion,
        u_softness: params.softness,
        u_octaveCount: params.octaveCount,
        u_persistence: params.persistence,
        u_lacunarity: params.lacunarity
      };
    },

    'paper-texture': function (params, PS) {
      return {
        u_colorFront: shaderColor(params.colorFront, PS),
        u_colorBack: shaderColor(params.colorBack, PS),
        u_contrast: params.contrast,
        u_roughness: params.roughness,
        u_fiber: params.fiber,
        u_fiberSize: params.fiberSize,
        u_crumples: params.crumples,
        u_crumpleSize: params.crumpleSize,
        u_foldCount: params.foldCount,
        u_folds: params.folds,
        u_fade: params.fade,
        u_drops: params.drops,
        u_seed: params.seed,
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'dithering': function (params, PS) {
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colorFront: shaderColor(params.colorFront, PS),
        u_shape: enumValue(PS, 'DitheringShapes', params.shape),
        u_type: enumValue(PS, 'DitheringTypes', params.type),
        u_pxSize: params.size
      };
    },

    'dot-grid': function (params, PS) {
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colorFill: shaderColor(params.colorFill, PS),
        u_colorStroke: shaderColor(params.colorStroke, PS),
        u_dotSize: params.size,
        u_gapX: params.gapX,
        u_gapY: params.gapY,
        u_strokeWidth: params.strokeWidth,
        u_sizeRange: params.sizeRange,
        u_opacityRange: params.opacityRange,
        u_shape: enumValue(PS, 'DotGridShapes', params.shape)
      };
    },

    'dot-orbit': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colors: colors,
        u_colorsCount: colors.length,
        u_size: params.size,
        u_sizeRange: params.sizeRange,
        u_spreading: params.spreading,
        u_stepsPerColor: params.stepsPerColor,
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'halftone-dots': function (params, PS) {
      return {
        u_colorFront: shaderColor(params.colorFront, PS),
        u_colorBack: shaderColor(params.colorBack, PS),
        u_size: params.size,
        u_radius: params.radius,
        u_contrast: params.contrast,
        u_originalColors: params.originalColors,
        u_inverted: params.inverted,
        u_grainMixer: params.grainMixer,
        u_grainOverlay: params.grainOverlay,
        u_grainSize: params.grainSize,
        u_grid: enumValue(PS, 'HalftoneDotsGrids', params.grid),
        u_type: enumValue(PS, 'HalftoneDotsTypes', params.type)
      };
    },

    'halftone-cmyk': function (params, PS) {
      return {
        u_noiseTexture: noiseTexture(PS),
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colorC: shaderColor(params.colorC, PS),
        u_colorM: shaderColor(params.colorM, PS),
        u_colorY: shaderColor(params.colorY, PS),
        u_colorK: shaderColor(params.colorK, PS),
        u_size: params.size,
        u_contrast: params.contrast,
        u_softness: params.softness,
        u_grainSize: params.grainSize,
        u_grainMixer: params.grainMixer,
        u_grainOverlay: params.grainOverlay,
        u_gridNoise: params.gridNoise,
        u_floodC: params.floodC,
        u_floodM: params.floodM,
        u_floodY: params.floodY,
        u_floodK: params.floodK,
        u_gainC: params.gainC,
        u_gainM: params.gainM,
        u_gainY: params.gainY,
        u_gainK: params.gainK,
        u_type: enumValue(PS, 'HalftoneCmykTypes', params.type)
      };
    },

    'image-dithering': function (params, PS) {
      return {
        u_colorFront: shaderColor(params.colorFront, PS),
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colorHighlight: shaderColor(params.colorHighlight, PS),
        u_type: enumValue(PS, 'DitheringTypes', params.type),
        u_pxSize: params.size,
        u_colorSteps: params.colorSteps,
        u_originalColors: params.originalColors,
        u_inverted: params.inverted
      };
    },

    'fluted-glass': function (params, PS) {
      var margin = valueOr(params.margin, 0);
      return {
        u_colorBack: shaderColor(params.colorBack, PS, '#00000000'),
        u_colorShadow: shaderColor(params.colorShadow, PS),
        u_colorHighlight: shaderColor(params.colorHighlight, PS, '#ffffff'),
        u_shadows: params.shadows,
        u_size: params.size,
        u_angle: params.angle,
        u_distortion: params.distortion,
        u_shift: params.shift,
        u_blur: params.blur,
        u_edges: params.edges,
        u_stretch: params.stretch,
        u_distortionShape: enumValue(PS, 'GlassDistortionShapes', params.distortionShape),
        u_highlights: params.highlights,
        u_shape: enumValue(PS, 'GlassGridShapes', params.shape),
        u_marginLeft: valueOr(params.marginLeft, margin),
        u_marginRight: valueOr(params.marginRight, margin),
        u_marginTop: valueOr(params.marginTop, margin),
        u_marginBottom: valueOr(params.marginBottom, margin),
        u_grainMixer: params.grainMixer,
        u_grainOverlay: params.grainOverlay
      };
    },

    'water': function (params, PS) {
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colorHighlight: shaderColor(params.colorHighlight, PS, '#ffffff'),
        u_highlights: params.highlights,
        u_layering: params.layering,
        u_waves: params.waves,
        u_edges: params.edges,
        u_caustic: params.caustic,
        u_size: params.size
      };
    },

    'waves': function (params, PS) {
      return {
        u_colorFront: shaderColor(params.colorFront, PS),
        u_colorBack: shaderColor(params.colorBack, PS),
        u_shape: params.shape,
        u_frequency: params.frequency,
        u_amplitude: params.amplitude,
        u_spacing: params.spacing,
        u_proportion: params.proportion,
        u_softness: params.softness
      };
    },

    'spiral': function (params, PS) {
      return {
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colorFront: shaderColor(params.colorFront, PS),
        u_density: params.density,
        u_distortion: params.distortion,
        u_strokeWidth: params.strokeWidth,
        u_strokeTaper: params.strokeTaper,
        u_strokeCap: params.strokeCap,
        u_noiseFrequency: params.noiseFrequency,
        u_noise: params.noise,
        u_softness: params.softness
      };
    },

    'pulsing-border': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      var margin = valueOr(params.margin, 0);
      return {
        u_colorBack: shaderColor(params.colorBack, PS, '#00000000'),
        u_colors: colors,
        u_colorsCount: colors.length,
        u_roundness: params.roundness,
        u_thickness: params.thickness,
        u_marginLeft: valueOr(params.marginLeft, margin),
        u_marginRight: valueOr(params.marginRight, margin),
        u_marginTop: valueOr(params.marginTop, margin),
        u_marginBottom: valueOr(params.marginBottom, margin),
        u_aspectRatio: enumValue(PS, 'PulsingBorderAspectRatios', params.aspectRatio),
        u_softness: params.softness,
        u_intensity: params.intensity,
        u_bloom: params.bloom,
        u_spots: params.spots,
        u_spotSize: params.spotSize,
        u_pulse: params.pulse,
        u_smoke: params.smoke,
        u_smokeSize: params.smokeSize,
        u_noiseTexture: noiseTexture(PS)
      };
    },

    'heatmap': function (params, PS) {
      var colors = shaderColors(params.colors, PS);
      return {
        u_contour: params.contour,
        u_angle: params.angle,
        u_noise: params.noise,
        u_innerGlow: params.innerGlow,
        u_outerGlow: params.outerGlow,
        u_colorBack: shaderColor(params.colorBack, PS),
        u_colors: colors,
        u_colorsCount: colors.length
      };
    }
  };

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  var mounts = new WeakMap();
  var paperReady = false;
  var paperWaiters = [];

  // Listen for the paper shaders ready event once
  function onPaperReady() {
    paperReady = true;
    for (var i = 0; i < paperWaiters.length; i++) {
      paperWaiters[i]();
    }
    paperWaiters = [];
  }

  if (window.EMKPaperShaders) {
    paperReady = true;
  } else {
    window.addEventListener('emk:paper-shaders-ready', onPaperReady);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function waitForPaperShaders(callback, timeout) {
    if (paperReady) {
      callback();
      return;
    }
    paperWaiters.push(callback);
    if (timeout > 0) {
      setTimeout(function () {
        if (!paperReady) {
          // Remove from waiters list
          var idx = paperWaiters.indexOf(callback);
          if (idx !== -1) paperWaiters.splice(idx, 1);
        }
      }, timeout);
    }
  }

  function strToBool(v) {
    return v === 'yes' || v === true;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function parseNum(val, fallback) {
    if (val && typeof val === 'object' && val.size !== undefined) {
      val = val.size;
    }
    var n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }

  // Resolve global color from __globals__ path
  function resolveGlobalColor(token) {
    if (typeof token !== 'string' || token.indexOf('globals/colors?id=') !== 0) return null;
    var id = token.split('id=')[1];
    if (!id) return null;
    if (window.EMK_GLOBALS && window.EMK_GLOBALS.colors && window.EMK_GLOBALS.colors[id]) {
      return window.EMK_GLOBALS.colors[id];
    }
    var resolved = getComputedStyle(document.documentElement).getPropertyValue('--e-global-color-' + id).trim();
    if (resolved) return resolved;
    return null;
  }

  // Build a settings adapter matching emk-motion.js pattern
  function buildSettings(handler) {
    var domSettings = null;
    if (handler.element && handler.element.dataset && handler.element.dataset.settings) {
      try { domSettings = JSON.parse(handler.element.dataset.settings); } catch (e) { domSettings = null; }
    }
    return {
      get: function (key) {
        var v;
        try { v = handler.getElementSettings(key); } catch (e) { v = undefined; }
        var missing = v === undefined || v === null || v === '';
        if (!missing) return v;
        if (domSettings && domSettings[key] !== undefined) {
          var dsMissing = domSettings[key] === '' || domSettings[key] === null;
          if (!dsMissing) return domSettings[key];
        }
        return undefined;
      }
    };
  }

  // Get a single setting with global color resolution support
  function getSetting(settings, key) {
    var raw = settings.get(key);
    if (raw && typeof raw === 'string' && raw.indexOf('globals/colors?id=') === 0) {
      var resolved = resolveGlobalColor(raw);
      if (resolved) return resolved;
    }
    return raw;
  }

  // Get a color setting, checking for legacy color keys and globals
  function getColorSetting(settings, key, fallback) {
    var raw = settings.get(key);
    if (raw && typeof raw === 'string' && raw !== '') {
      if (raw.indexOf('globals/colors?id=') === 0) {
        var resolved = resolveGlobalColor(raw);
        if (resolved) return resolved;
      }
      return raw;
    }
    return fallback;
  }

  // Parse the preset string into shaderId and preset name
  function parsePresetId(preset) {
    if (!preset || typeof preset !== 'string') return null;
    var colonIdx = preset.indexOf(':');
    if (colonIdx === -1) return null;
    return {
      shaderId: preset.substring(0, colonIdx),
      presetName: preset.substring(colonIdx + 1)
    };
  }

  // Convert camelCase enum name to its Paper Shaders global
  function resolveEnumValue(enumName, value) {
    var globalName = ENUM_MAP_NAMES[enumName];
    if (!globalName) return value;
    var enumObj = window.EMKPaperShaders[globalName];
    if (!enumObj) return value;
    // Try direct key match
    if (enumObj[value] !== undefined) return enumObj[value];
    // Try numeric conversion
    var num = Number(value);
    if (Number.isFinite(num)) return num;
    return value;
  }

  // ---------------------------------------------------------------------------
  // Image handling
  // ---------------------------------------------------------------------------

  function getBackgroundImageUrl(element) {
    var bg = getComputedStyle(element).backgroundImage;
    if (!bg || bg === 'none') return null;
    // Extract URL from url("...") or url(...)
    var m = bg.match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : null;
  }

  function getFirstDescendantImageUrl(element) {
    var imgs = element.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].currentSrc || imgs[i].src;
      if (src && src.length > 0 && src.indexOf('data:image/svg+xml') !== 0) {
        return src;
      }
    }
    return null;
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('Image load failed: ' + url)); };
      // Set crossOrigin for external URLs
      if (url.indexOf('http') === 0 || url.indexOf('https') === 0) {
        img.crossOrigin = 'anonymous';
      }
      img.src = url;
    });
  }

  function isExternalUrl(url) {
    return url && (url.indexOf('http') === 0 || url.indexOf('https') === 0) && url.indexOf(location.origin) !== 0;
  }


  function processedImageBlob(result, preferredKey) {
    if (result && preferredKey && result[preferredKey]) return result[preferredKey];
    if (result && result.blob) return result.blob;
    if (result && result.pngBlob) return result.pngBlob;
    return result;
  }

  // ---------------------------------------------------------------------------
  // EMKShaders public API
  // ---------------------------------------------------------------------------

  var EMKShaders = {
    // Run (mount or update) a shader on an element
    run: function (element, settings) {
      if (!element || !settings) return;

      var enable = getSetting(settings, 'emk_shader_enable');
      if (enable !== 'yes') {
        this.destroy(element);
        return;
      }

      // Mobile check
      var disableMobile = getSetting(settings, 'emk_shader_disable_mobile');
      if (disableMobile === 'yes') {
        var breakpoint = parseNum(getSetting(settings, 'emk_shader_mobile_breakpoint'), 768);
        if (window.innerWidth < breakpoint) {
          this.destroy(element);
          return;
        }
      }

      var self = this;

      // Wait for PaperShaders if not ready
      waitForPaperShaders(function () {
        self._doRun(element, settings);
      }, 1500);
    },

    _doRun: function (element, settings) {
      // Resolve preset
      var presetStr = getSetting(settings, 'emk_shader_preset') || 'mesh-gradient:default';
      var parsed = parsePresetId(presetStr);
      if (!parsed) {
        this.destroy(element);
        return;
      }

      var shaderId = parsed.shaderId;
      var presetName = parsed.presetName;

      // Look up preset data
      var presetData = null;
      if (window.EMK_SHADER_PRESETS && window.EMK_SHADER_PRESETS[shaderId]) {
        var shaderData = window.EMK_SHADER_PRESETS[shaderId];
        if (shaderData.presets && shaderData.presets[presetName]) {
          presetData = shaderData.presets[presetName].params || {};
        }
      }
      if (!presetData) {
        console.warn('EMK Shaders: Preset not found', shaderId, presetName);
        // Still try to proceed with empty params
        presetData = {};
      }

      // Check for existing mount on this element
      var existing = mounts.get(element);

      // If same shader ID, update and return
      if (existing && existing.shaderId === shaderId && existing.presetId === presetStr) {
        this._updateExisting(element, existing, settings, presetData);
        return;
      }

      // If different shader ID, destroy old one
      if (existing) {
        this._destroyMount(element, existing);
        mounts.delete(element);
        existing = null;
      }

      // Resolve the fragment shader
      var fragShaderName = SHADER_FRAGMENT_MAP[shaderId];
      if (!fragShaderName) {
        console.warn('EMK Shaders: Unknown shader ID', shaderId);
        return;
      }
      var PS = window.EMKPaperShaders;
      var fragmentShader = PS[fragShaderName];
      if (!fragmentShader) {
        console.warn('EMK Shaders: Fragment shader not found', fragShaderName);
        return;
      }

      // Create mount node
      var mountNode = document.createElement('div');
      mountNode.className = 'emk--shader-layer';
      mountNode.setAttribute('aria-hidden', 'true');

      // Determine layer position
      var layerPos = getSetting(settings, 'emk_shader_layer') || 'behind';
      var layerClass = layerPos === 'overlay'
        ? 'emk--shader-layer-overlay'
        : 'emk--shader-layer-behind';

      element.classList.add('emk--shader-active', layerClass);
      element.appendChild(mountNode);

      // Compute quality
      var quality = getSetting(settings, 'emk_shader_quality') || 'balanced';
      var minPixelRatio, maxPixelCount;
      if (quality === 'low') {
        minPixelRatio = 1;
        maxPixelCount = 1048576;
      } else if (quality === 'high') {
        minPixelRatio = 2;
        maxPixelCount = 4194304;
      } else {
        minPixelRatio = 1.5;
        maxPixelCount = 2073600;
      }

      // Compute opacity and blend
      var opacity = parseNum(getSetting(settings, 'emk_shader_opacity'), 100);
      var blend = getSetting(settings, 'emk_shader_blend') || 'normal';
      mountNode.style.setProperty('--emk-shader-opacity', (opacity / 100).toString());
      mountNode.style.setProperty('--emk-shader-blend', blend);

      // Compute frame
      var frame = parseNum(getSetting(settings, 'emk_shader_frame'), 0);

      // Compute speed
      var presetSpeed = presetData.u_speed || presetData.speed || 1;
      var speedMultiplier = parseNum(getSetting(settings, 'emk_shader_speed_multiplier'), 1);
      var speed = presetSpeed * speedMultiplier;

      // Check prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        speed = 0;
      }

      // Build uniforms
      var uniforms = this._buildUniforms(shaderId, settings, presetData);

      // Handle image shaders
      var isImageShader = IMAGE_SHADER_IDS.indexOf(shaderId) !== -1;
      var objectUrls = [];

      if (isImageShader) {
        this._handleImageShader(element, shaderId, settings, uniforms, mountNode, {
          fragmentShader: fragmentShader,
          uniforms: uniforms,
          speed: speed,
          frame: frame,
          minPixelRatio: minPixelRatio,
          maxPixelCount: maxPixelCount,
          layerPos: layerPos,
          presetStr: presetStr,
          shaderId: shaderId,
          objectUrls: objectUrls,
          opacity: opacity,
          blend: blend,
          presetData: presetData
        }, objectUrls);
        return;
      }

      // Non-image shader: mount directly
      this._createAndStore(element, mountNode, fragmentShader, uniforms, {
        speed: speed,
        frame: frame,
        minPixelRatio: minPixelRatio,
        maxPixelCount: maxPixelCount
      }, shaderId, presetStr, objectUrls);
    },

    _buildUniforms: function (shaderId, settings, presetData) {
      var PS = window.EMKPaperShaders;
      var params = applyCustomColorOverrides(cloneParams(presetData || {}), settings);
      var converter = PARAM_CONVERTERS[shaderId];
      var uniforms = converter ? converter(params, PS) : {};

      if (!converter && window.console && console.warn) {
        console.warn('EMK Shaders: No parameter converter found', shaderId);
      }

      return applySizingUniforms(uniforms, params, settings, PS);
    },

    _handleImageShader: function (element, shaderId, settings, uniforms, mountNode, config, objectUrls) {
      var imageSource = getSetting(settings, 'emk_shader_image_source') || 'auto';
      var imageUrl = null;

      if (imageSource === 'media') {
        var mediaUrl = getSetting(settings, 'emk_shader_image');
        if (mediaUrl && typeof mediaUrl === 'object' && mediaUrl.url) {
          imageUrl = mediaUrl.url;
        } else if (typeof mediaUrl === 'string' && mediaUrl.length > 0) {
          imageUrl = mediaUrl;
        }
      } else if (imageSource === 'background') {
        imageUrl = getBackgroundImageUrl(element);
      } else {
        // auto — try descendant img, then background, then emptyPixel
        imageUrl = getFirstDescendantImageUrl(element);
        if (!imageUrl) {
          imageUrl = getBackgroundImageUrl(element);
        }
      }

      var PS = window.EMKPaperShaders;
      var emptyPixel = PS.emptyPixel;
      var hasRealImage = !!imageUrl;

      if (!imageUrl) {
        imageUrl = emptyPixel;
      }

      // Process image for special shaders
      var processPromise = null;

      if (shaderId === 'heatmap' && hasRealImage) {
        processPromise = PS.toProcessedHeatmap(imageUrl).then(function (result) {
          var url = URL.createObjectURL(processedImageBlob(result, 'blob'));
          objectUrls.push(url);
          uniforms.u_image = url;
          return url;
        }).catch(function () {
          uniforms.u_image = imageUrl;
        });
      } else if (shaderId === 'liquid-metal' && hasRealImage) {
        processPromise = PS.toProcessedLiquidMetal(imageUrl).then(function (result) {
          var url = URL.createObjectURL(processedImageBlob(result, 'pngBlob'));
          objectUrls.push(url);
          uniforms.u_image = url;
          uniforms.u_isImage = 1;
          return url;
        }).catch(function () {
          uniforms.u_image = imageUrl;
          uniforms.u_isImage = hasRealImage ? 1 : 0;
        });
      } else if (shaderId === 'gem-smoke' && hasRealImage) {
        processPromise = PS.toProcessedGemSmoke(imageUrl).then(function (result) {
          var url = URL.createObjectURL(processedImageBlob(result, 'pngBlob'));
          objectUrls.push(url);
          uniforms.u_image = url;
          uniforms.u_isImage = 1;
          return url;
        }).catch(function () {
          uniforms.u_image = imageUrl;
          uniforms.u_isImage = hasRealImage ? 1 : 0;
        });
      } else {
        // Standard image shader — load and set u_image
        if (hasRealImage && imageUrl !== emptyPixel) {
          processPromise = loadImage(imageUrl).then(function () {
            uniforms.u_image = imageUrl;
          }).catch(function () {
            uniforms.u_image = emptyPixel;
          });
        } else {
          uniforms.u_image = emptyPixel;
          processPromise = Promise.resolve();
        }
      }

      // Set u_isImage for shaders that need it (liquid-metal, gem-smoke)
      if (shaderId !== 'liquid-metal' && shaderId !== 'gem-smoke') {
        if (uniforms.u_isImage === undefined && hasRealImage) {
          uniforms.u_isImage = 1;
        } else if (uniforms.u_isImage === undefined) {
          uniforms.u_isImage = 0;
        }
      }

      processPromise.then(function () {
        EMKShaders._createAndStore(
          element, mountNode, config.fragmentShader, uniforms,
          {
            speed: config.speed,
            frame: config.frame,
            minPixelRatio: config.minPixelRatio,
            maxPixelCount: config.maxPixelCount
          },
          shaderId, config.presetStr, objectUrls
        );
      }).catch(function (err) {
        console.warn('EMK Shaders: Image processing failed', err);
        // Try mounting without image
        uniforms.u_image = emptyPixel;
        EMKShaders._createAndStore(
          element, mountNode, config.fragmentShader, uniforms,
          {
            speed: config.speed,
            frame: config.frame,
            minPixelRatio: config.minPixelRatio,
            maxPixelCount: config.maxPixelCount
          },
          shaderId, config.presetStr, objectUrls
        );
      });
    },

    _createAndStore: function (element, mountNode, fragmentShader, uniforms, opts, shaderId, presetStr, objectUrls) {
      var PS = window.EMKPaperShaders;
      try {
        var mount = new PS.ShaderMount(
          mountNode,
          fragmentShader,
          uniforms,
          { alpha: true, premultipliedAlpha: false },
          opts.speed,
          opts.frame,
          opts.minPixelRatio,
          opts.maxPixelCount
        );

        var record = {
          mount: mount,
          layer: mountNode,
          objectUrls: objectUrls || [],
          shaderId: shaderId,
          presetId: presetStr
        };

        mounts.set(element, record);
      } catch (err) {
        if (!opts.__retry) {
          if (mountNode && mountNode.parentNode) {
            mountNode.parentNode.removeChild(mountNode);
          }
          setTimeout(function () {
            var retryNode = document.createElement('div');
            retryNode.className = 'emk--shader-layer';
            retryNode.setAttribute('aria-hidden', 'true');
            retryNode.style.setProperty('--emk-shader-opacity', mountNode.style.getPropertyValue('--emk-shader-opacity') || '1');
            retryNode.style.setProperty('--emk-shader-blend', mountNode.style.getPropertyValue('--emk-shader-blend') || 'normal');
            element.appendChild(retryNode);
            var retryOpts = {};
            for (var key in opts) {
              if (hasOwn(opts, key)) retryOpts[key] = opts[key];
            }
            retryOpts.__retry = true;
            EMKShaders._createAndStore(element, retryNode, fragmentShader, uniforms, retryOpts, shaderId, presetStr, objectUrls);
          }, 250);
          return;
        }
        element.classList.add('emk--shader-error');
        if (mountNode && mountNode.parentNode) {
          mountNode.parentNode.removeChild(mountNode);
        }
        // Revoke any created object URLs
        for (var i = 0; i < objectUrls.length; i++) {
          URL.revokeObjectURL(objectUrls[i]);
        }
        console.warn('EMK Shaders: WebGL shader could not be initialized', err);
      }
    },

    _updateExisting: function (element, existing, settings, presetData) {
      var mount = existing.mount;
      var PS = window.EMKPaperShaders;

      // Compute new speed
      var presetSpeed = presetData.u_speed || presetData.speed || 1;
      var speedMultiplier = parseNum(getSetting(settings, 'emk_shader_speed_multiplier'), 1);
      var speed = presetSpeed * speedMultiplier;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        speed = 0;
      }

      mount.setSpeed(speed);

      // Update frame
      var frame = parseNum(getSetting(settings, 'emk_shader_frame'), 0);
      mount.setFrame(frame);

      // Update uniforms
      var uniforms = this._buildUniforms(existing.shaderId, settings, presetData);
      mount.setUniformValues(uniforms);

      // Update layer node style
      if (existing.layer) {
        var opacity = parseNum(getSetting(settings, 'emk_shader_opacity'), 100);
        var blend = getSetting(settings, 'emk_shader_blend') || 'normal';
        existing.layer.style.setProperty('--emk-shader-opacity', (opacity / 100).toString());
        existing.layer.style.setProperty('--emk-shader-blend', blend);

        // Check if layer position changed
        var layerPos = getSetting(settings, 'emk_shader_layer') || 'behind';
        element.classList.remove('emk--shader-layer-behind', 'emk--shader-layer-overlay');
        element.classList.add(layerPos === 'overlay' ? 'emk--shader-layer-overlay' : 'emk--shader-layer-behind');
      }

      // Revoke old object URLs
      for (var i = 0; i < existing.objectUrls.length; i++) {
        URL.revokeObjectURL(existing.objectUrls[i]);
      }
      existing.objectUrls = [];

      // Handle image update
      var shaderId = existing.shaderId;
      if (IMAGE_SHADER_IDS.indexOf(shaderId) !== -1) {
        // Re-process image
        var imageSource = getSetting(settings, 'emk_shader_image_source') || 'auto';
        var imageUrl = null;

        if (imageSource === 'media') {
          var mediaUrl = getSetting(settings, 'emk_shader_image');
          if (mediaUrl && typeof mediaUrl === 'object' && mediaUrl.url) {
            imageUrl = mediaUrl.url;
          } else if (typeof mediaUrl === 'string' && mediaUrl.length > 0) {
            imageUrl = mediaUrl;
          }
        } else if (imageSource === 'background') {
          imageUrl = getBackgroundImageUrl(element);
        } else {
          imageUrl = getFirstDescendantImageUrl(element);
          if (!imageUrl) imageUrl = getBackgroundImageUrl(element);
        }

        var hasRealImage = !!imageUrl;
        if (!imageUrl) imageUrl = PS.emptyPixel;

        // For heatmap/liquid-metal/gem-smoke, re-process
        if (shaderId === 'heatmap' && hasRealImage) {
          PS.toProcessedHeatmap(imageUrl).then(function (result) {
            var url = URL.createObjectURL(processedImageBlob(result, 'blob'));
            existing.objectUrls.push(url);
            mount.setUniformValues({ u_image: url });
          }).catch(function () {
            // ignore, keep existing uniform
          });
        } else if (shaderId === 'liquid-metal' && hasRealImage) {
          PS.toProcessedLiquidMetal(imageUrl).then(function (result) {
            var url = URL.createObjectURL(processedImageBlob(result, 'pngBlob'));
            existing.objectUrls.push(url);
            mount.setUniformValues({ u_image: url, u_isImage: 1 });
          }).catch(function () {});
        } else if (shaderId === 'gem-smoke' && hasRealImage) {
          PS.toProcessedGemSmoke(imageUrl).then(function (result) {
            var url = URL.createObjectURL(processedImageBlob(result, 'pngBlob'));
            existing.objectUrls.push(url);
            mount.setUniformValues({ u_image: url, u_isImage: 1 });
          }).catch(function () {});
        } else if (hasRealImage && imageUrl !== PS.emptyPixel) {
          loadImage(imageUrl).then(function () {
            mount.setUniformValues({ u_image: imageUrl, u_isImage: 1 });
          }).catch(function () {
            mount.setUniformValues({ u_image: PS.emptyPixel, u_isImage: 0 });
          });
        } else {
          mount.setUniformValues({ u_image: PS.emptyPixel, u_isImage: 0 });
        }
      }
    },

    _destroyMount: function (element, record) {
      if (!record) return;

      try {
        if (record.mount && typeof record.mount.dispose === 'function') {
          record.mount.dispose();
        }
      } catch (e) {
        // Ignore dispose errors
      }

      if (record.layer && record.layer.parentNode) {
        record.layer.parentNode.removeChild(record.layer);
      }

      element.classList.remove('emk--shader-active', 'emk--shader-layer-behind', 'emk--shader-layer-overlay');
      element.classList.remove('emk--shader-error');

      // Revoke object URLs
      for (var i = 0; i < record.objectUrls.length; i++) {
        URL.revokeObjectURL(record.objectUrls[i]);
      }
    },

    // Destroy a shader on an element
    destroy: function (element) {
      if (!element) return;
      var record = mounts.get(element);
      if (!record) return;
      this._destroyMount(element, record);
      mounts.delete(element);
    }
  };

  // Expose globally
  window.EMKShaders = EMKShaders;

  // ---------------------------------------------------------------------------
  // Elementor frontend handler registration
  // ---------------------------------------------------------------------------

  var emkShadersBound = false;

  var bindEmkShaders = function () {
    if (emkShadersBound) return;
    if (typeof elementorFrontend !== 'object' || !elementorFrontend.hooks) return;
    if (typeof elementorModules !== 'object' || !elementorModules.frontend) return;
    emkShadersBound = true;
    if (elementorFrontend.hooks.__emkShadersBound) return;
    elementorFrontend.hooks.__emkShadersBound = true;

    var Base = elementorModules.frontend.handlers.Base;

    var ShadersHandler = Base.extend({
      bindEvents: function () {
        this.element = this.$element && this.$element[0];
        if (!this.element) return;

        var settings = buildSettings(this);
        var enable = getSetting(settings, 'emk_shader_enable');

        if (enable === 'yes') {
          EMKShaders.run(this.element, settings);
        }
      },

      onElementChange: function (settingKey) {
        if (settingKey !== 'emk_shader_enable') return;
        this.element = this.$element && this.$element[0];
        if (!this.element) return;
        var settings = buildSettings(this);
        if (getSetting(settings, 'emk_shader_enable') === 'yes') {
          EMKShaders.run(this.element, settings);
        } else {
          EMKShaders.destroy(this.element);
        }
      },

      onDestroy: function () {
        if (!this.element) return;
        EMKShaders.destroy(this.element);
      }
    });

    elementorFrontend.hooks.addAction('frontend/element_ready/widget', function ($scope) {
      elementorFrontend.elementsHandler.addHandler(ShadersHandler, { $element: $scope });
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/container', function ($scope) {
      elementorFrontend.elementsHandler.addHandler(ShadersHandler, { $element: $scope });
    });
  };

  $(window).on('elementor/frontend/init', bindEmkShaders);

  // Race-safe: if init already fired, poll for it
  var waitForEmkShaders = function () {
    if (emkShadersBound) return;
    if (typeof elementorFrontend === 'object' && elementorFrontend.hooks && elementorFrontend.hooks.__emkShadersBound) return;
    bindEmkShaders();
    if (!emkShadersBound) setTimeout(waitForEmkShaders, 50);
  };
  waitForEmkShaders();

})(jQuery);
