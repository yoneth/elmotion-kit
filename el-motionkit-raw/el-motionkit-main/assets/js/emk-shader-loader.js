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

  var ShaderHandler = elementorModules.frontend.handlers.Base.extend({
    bindEvents: function () {
      if (this.getElementSettings('emk_shader_enable') === 'yes') {
        enqueueOrRun(this.$element[0], this.getElementSettings());
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
