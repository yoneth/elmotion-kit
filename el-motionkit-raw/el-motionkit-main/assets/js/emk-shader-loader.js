/*! EMK Shader Loader — loads heavy shader assets on-demand */
(function ($) {
  'use strict';

  if (typeof elementorFrontend === 'undefined') return;
  if (document.body.classList.contains('elementor-editor-active')) return;

  var state = { loaded: false, loading: false, queue: [] };

  function getBaseUrl() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;
      if (src && src.indexOf('emk-shader-loader') !== -1) {
        return src.substring(0, src.lastIndexOf('/') + 1);
      }
    }
    return '';
  }

  function loadShaderAssets() {
    if (state.loading) return;
    state.loading = true;
    var baseUrl = getBaseUrl();
    var loadedCount = 0;

    function onAssetLoad() {
      loadedCount++;
      if (loadedCount >= 2) {
        var runtime = document.createElement('script');
        runtime.src = baseUrl + 'emk-shaders.min.js';
        runtime.async = false;
        runtime.onload = function () {
          state.loaded = true;
          state.loading = false;
          for (var i = 0; i < state.queue.length; i++) {
            var item = state.queue[i];
            if (window.EMKShaders) {
              EMKShaders.run(item.element, item.settings);
            }
          }
          state.queue = [];
        };
        document.head.appendChild(runtime);
      }
    }

    // Load paper-shaders library (198 KB)
    var s1 = document.createElement('script');
    s1.src = baseUrl + 'emk-paper-shaders.min.js';
    s1.async = false;
    s1.onload = onAssetLoad;
    document.head.appendChild(s1);

    // Load preset definitions (36 KB)
    var s2 = document.createElement('script');
    s2.src = baseUrl + 'emk-shader-presets.min.js';
    s2.async = false;
    s2.onload = onAssetLoad;
    document.head.appendChild(s2);
  }

  function enqueueOrRun(element, settings) {
    if (state.loaded) {
      if (window.EMKShaders) {
        EMKShaders.run(element, settings);
      }
    } else {
      state.queue.push({ element: element, settings: settings });
      if (!state.loading) loadShaderAssets();
    }
  }

  function getSetting(settings, key) {
    if (!settings) return undefined;
    // Direct getElementSettings call (works for widget-specific controls)
    if (typeof settings.get === 'function') {
      try { var v = settings.get(key); if (v !== undefined && v !== null && v !== '') return v; } catch(e) {}
    }
    // Fallback from DOM data-settings (needed for custom Common controls in Elementor 4.x)
    if (settings.domSettings && settings.domSettings[key] !== undefined) return settings.domSettings[key];
    return undefined;
  }

  function buildSettings(handler) {
    var domSettings = null;
    if (handler.element && handler.element.dataset && handler.element.dataset.settings) {
      try { domSettings = JSON.parse(handler.element.dataset.settings); } catch(e) {}
    }
    return { get: function(k) { return getSetting({get: function(key) { return handler.getElementSettings(key); }, domSettings: domSettings}, k); }, domSettings: domSettings };
  }

  var ShaderHandler = elementorModules.frontend.handlers.Base.extend({
    bindEvents: function () {
      var settings = buildSettings(this);
      if (getSetting(settings, 'emk_shader_enable') === 'yes') {
        enqueueOrRun(this.$element[0], settings);
      }
    },
    onDestroy: function () {
      if (this.$element && this.$element[0] && window.EMKShaders) {
        EMKShaders.destroy(this.$element[0]);
      }
    }
  });

  $(window).on('elementor/frontend/init', function () {
    elementorFrontend.hooks.__emkShadersBound = true;
    elementorFrontend.hooks.addAction('frontend/element_ready/widget', function ($element) {
      elementorFrontend.elementsHandler.addHandler(ShaderHandler, { $element: $element });
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/container', function ($element) {
      elementorFrontend.elementsHandler.addHandler(ShaderHandler, { $element: $element });
    });
  });
})(jQuery);
