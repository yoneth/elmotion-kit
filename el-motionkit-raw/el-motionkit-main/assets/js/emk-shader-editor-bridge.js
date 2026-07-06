/*! EMK Shader Editor Bridge — relays Elementor editor settings to the preview iframe */
(function ($) {
  'use strict';

  if (typeof window.elementor === 'undefined') return;

  var VERSION = '2.5.2-live-preview-poll';
  var iframe = null;
  var iframeWindow = null;
  var lastSnapshotById = {};
  var currentId = null;
  var prevId = null;
  var scheduled = null;
  var polling = null;

  function getIframeWindow() {
    var nextIframe = document.getElementById('elementor-preview-iframe');
    var nextWindow = nextIframe && nextIframe.contentWindow;
    if (nextIframe !== iframe || nextWindow !== iframeWindow) {
      iframe = nextIframe;
      iframeWindow = nextWindow;
      lastSnapshotById = {};
    }
    return iframeWindow;
  }

  function getIframeDocument() {
    var win = getIframeWindow();
    try {
      return win && win.document;
    } catch (e) {
      return null;
    }
  }

  function escapeAttr(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function getElementInIframe(id) {
    var doc = getIframeDocument();
    return doc && id ? doc.querySelector('[data-id="' + escapeAttr(id) + '"]') : null;
  }

  function getRootContainer() {
    var documentModel = elementor.documents &&
      elementor.documents.getCurrent &&
      elementor.documents.getCurrent();
    return documentModel && documentModel.container;
  }

  function childrenOf(container) {
    var children = container && container.children;
    if (!children) return [];
    if (Array.isArray(children)) return children;
    if (children.models) return children.models;
    if (typeof children.toArray === 'function') return children.toArray();
    return [];
  }

  function findContainer(container, id) {
    var children;
    var i;
    var found;
    if (!container || !id) return null;
    if (container.id === id) return container;
    children = childrenOf(container);
    for (i = 0; i < children.length; i++) {
      found = findContainer(children[i], id);
      if (found) return found;
    }
    return null;
  }

  function getModelId(model) {
    if (!model) return null;
    if (model.id) return model.id;
    if (model.model && model.model.id) return model.model.id;
    if (model.attributes && model.attributes.id) return model.attributes.id;
    if (typeof model.get === 'function') {
      return model.get('id') || model.get('_id') || model.get('dataId') || null;
    }
    return null;
  }

  function copyOwn(target, source) {
    var key;
    if (!source) return target;
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function getSettings(model) {
    var raw = null;
    var nested = null;
    var out = {};

    if (!model) return out;

    if (model.settings) {
      raw = model.settings.attributes || model.settings;
    }

    if (!raw && typeof model.get === 'function') {
      nested = model.get('settings');
      raw = nested && (nested.attributes || nested);
    }

    if (!raw && model.attributes) {
      raw = model.attributes;
    }

    copyOwn(out, raw);
    copyOwn(out, model.changed);

    return out;
  }

  function getSettingsForId(id) {
    return getSettings(findContainer(getRootContainer(), id));
  }

  function getSelectedId() {
    var selection = elementor.selection;
    var elements = selection && selection.getElements && selection.getElements();
    if (elements && elements.length) {
      var model = elements[0];
      return getModelId(model);
    }
    // Fallback: CSS class detection
    var doc = getIframeDocument();
    var selected = doc && doc.querySelector('.elementor-element-edit-mode');
    if (selected) return selected.getAttribute('data-id');
    return currentId;
  }

  function shaderSnapshot(settings) {
    var keys = [];
    var out = {};
    var i;
    var key;

    if (!settings) return '{}';
    for (key in settings) {
      if (
        Object.prototype.hasOwnProperty.call(settings, key) &&
        key.indexOf('emk_shader_') === 0
      ) {
        keys.push(key);
      }
    }
    keys.sort();
    for (i = 0; i < keys.length; i++) {
      out[keys[i]] = settings[keys[i]];
    }
    return JSON.stringify(out);
  }

  function withShaders(callback) {
    var attempts = 0;
    function wait() {
      var win = getIframeWindow();
      if (win && win.EMKShaders) {
        callback(win);
        return;
      }
      attempts += 1;
      if (attempts <= 50) {
        setTimeout(wait, 100);
      }
    }
    wait();
  }

  function renderById(id, settings, force) {
    var snapshot;
    if (!id) return;

    snapshot = shaderSnapshot(settings);
    if (!force && lastSnapshotById[id] === snapshot) return;
    lastSnapshotById[id] = snapshot;

    withShaders(function (win) {
      var element = getElementInIframe(id);
      if (!element) return;

      if (!settings || settings.emk_shader_enable !== 'yes') {
        win.EMKShaders.destroy(element);
        return;
      }

      win.EMKShaders.run(element, {
        get: function (key) {
          return settings[key];
        }
      });
    });
  }
  function syncSelected(force) {
    var id = getSelectedId();
    if (!id) return;
    // Destroy shader on previously selected element when selection changes
    if (id !== prevId) {
      if (prevId) renderById(prevId, { emk_shader_enable: '' }, true);
      prevId = id;
    }
    currentId = id;
    renderById(id, getSettingsForId(id), !!force);
  }

  function scheduleSync(force) {
    clearTimeout(scheduled);
    scheduled = setTimeout(function () {
      syncSelected(!!force);
    }, 80);
    setTimeout(function () { syncSelected(!!force); }, 350);
    setTimeout(function () { syncSelected(!!force); }, 1000);
  }

  function bindModel(model) {
    var settingsModel;
    currentId = getModelId(model) || currentId;

    if (model && !model.__emkShaderBridgeBound && typeof model.on === 'function') {
      model.__emkShaderBridgeBound = true;
      model.on('change', function () { scheduleSync(true); });
    }

    settingsModel = model && (model.settings || (typeof model.get === 'function' && model.get('settings')));
    if (
      settingsModel &&
      !settingsModel.__emkShaderBridgeBound &&
      typeof settingsModel.on === 'function'
    ) {
      settingsModel.__emkShaderBridgeBound = true;
      settingsModel.on('change', function () { scheduleSync(true); });
    }

    scheduleSync(true);
  }

  function bindPanelHooks() {
    if (!elementor.hooks || elementor.hooks.__emkShaderBridgeBound) return;
    elementor.hooks.__emkShaderBridgeBound = true;
    elementor.hooks.addAction('panel/open_editor/widget', function (panel, model) { bindModel(model); });
    elementor.hooks.addAction('panel/open_editor/container', function (panel, model) { bindModel(model); });
    elementor.hooks.addAction('panel/open_editor/section', function (panel, model) { bindModel(model); });
    elementor.hooks.addAction('panel/open_editor/column', function (panel, model) { bindModel(model); });
  }

  function bindPanelDomFallback() {
    $(document).on(
      'change input click',
      '.elementor-control-emk_shader_enable input,' +
      '.elementor-control-emk_shader_enable .elementor-switch,' +
      '.elementor-control[class*="emk_shader_"] input,' +
      '.elementor-control[class*="emk_shader_"] select,' +
      '.elementor-control[class*="emk_shader_"] textarea',
      function () {
        scheduleSync(true);
      }
    );
  }

  function startPolling() {
    if (polling) return;
    polling = setInterval(function () {
      syncSelected(false);
    }, 500);
    scheduleSync(true);
  }

  bindPanelHooks();
  bindPanelDomFallback();
  startPolling();

  window.EMKShaderEditorBridge = {
    version: VERSION,
    sync: function () { syncSelected(true); },
    render: function (id) { renderById(id, getSettingsForId(id), true); }
  };
})(jQuery);