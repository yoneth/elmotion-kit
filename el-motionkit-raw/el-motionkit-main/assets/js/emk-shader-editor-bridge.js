/*! EMK Shader Editor Bridge — relays setting changes to preview iframe */
(function ($) {
  'use strict';

  if (typeof elementor === 'undefined' || !elementor.hooks) return;

  var iframe, iframeWindow;

  function getIframe() {
    if (!iframe || iframe.contentWindow !== iframeWindow) {
      iframe = document.getElementById('elementor-preview-iframe');
      iframeWindow = iframe && iframe.contentWindow;
    }
    return iframeWindow;
  }

  function getShadersHandler(element) {
    var win = getIframe();
    if (!win || !element) return null;
    // Elementor stores handlers per data-id
    var id = element.dataset.id || element.getAttribute('data-id');
    if (!id) return null;
    // Find handler through jQuery data
    var $el = win.jQuery && win.jQuery(element);
    if ($el && $el.data) {
      return $el.data('elementor-frontend-handler');  
    }
    return null;
  }

  function runShaders(element, settings) {
    var win = getIframe();
    if (!win || !win.EMKShaders) return;
    if (!settings || settings.emk_shader_enable !== 'yes') {
      win.EMKShaders.destroy(element);
      return;
    }
    // Wrap settings with .get() method
    var wrapped = { get: function (key) { return settings[key]; } };
    win.EMKShaders.run(element, wrapped);
  }

  // Listen for setting changes via Elementor hooks (parent window)
  elementor.hooks.addAction('panel/open_editor/widget', function (panel, model) {
    // When element is selected in editor
  });

  // Better: listen for all setting changes on any element
  elementor.channels.editor.on('change:emk_shader_enable', function (model) {
    var iframeEl = getIframe() && getIframe().document.querySelector('[data-id="' + model.id + '"]');
    if (iframeEl) {
      runShaders(iframeEl, model.changed);
    }
  });

  // Catch-all: when any element setting changes in the editor
  elementor.channels.editor.on('change', function (model) {
    if (!model.changed) return;
    var changedKeys = Object.keys(model.changed);
    var hasShaderChange = changedKeys.some(function (k) { return k.indexOf('emk_shader_') === 0; });
    if (!hasShaderChange) return;

    var iframeEl = getIframe() && getIframe().document.querySelector('[data-id="' + model.id + '"]');
    if (!iframeEl) return;

    if (model.changed.emk_shader_enable === 'yes') {
      // Need the full settings for run(), not just the changed ones
      var allSettings = model.attributes;
      runShaders(iframeEl, allSettings);
    } else if ('emk_shader_enable' in model.changed) {
      runShaders(iframeEl, { emk_shader_enable: '' });
    }
  });

  // Also listen via the panel events (more reliable in some cases)
  $(document).on('change', '.elementor-control-emk_shader_enable input, .elementor-control-emk_shader_enable .elementor-switch', function () {
    // This catches the control change in the panel
    // The model change above should already handle this
  });

})(jQuery);