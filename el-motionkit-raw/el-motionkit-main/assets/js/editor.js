/**
 * EMK Editor Core
 *
 * Play Now button handler: uses the same window.EMKFx.run() runner
 * that the frontend uses, so editor previews are byte-for-byte identical
 * to live output.
 *
 * Debug: window.EMK_EDITOR_DEBUG = true;
 *
 * @package ElMotionKit
 */
/* global jQuery, elementor */
(function () {
  'use strict';

  var _inPlay = false;

  function _dbg() {
    if (window.EMK_EDITOR_DEBUG) {
      try { console.log.apply(console, ['[EMK PlayNow]'].concat(Array.prototype.slice.call(arguments))); } catch (e) {}
    }
  }

  function runPlayNow() {
    if (_inPlay) return;
    requestAnimationFrame(_runInner);
  }

  function _runInner() {
    if (_inPlay) return;
    _inPlay = true;
    _dbg('Play Now clicked');
    try {
      var iframe = document.querySelector('#elementor-preview-iframe, .elementor-preview-iframe');
      if (!iframe) { _dbg('no preview iframe'); return; }
      var w = iframe.contentWindow;
      if (!w || !w.gsap) { _dbg('gsap missing in iframe'); return; }

      var panelView = elementor && elementor.getPanelView ? elementor.getPanelView() : null;
      var currentPageView = panelView ? panelView.getCurrentPageView() : null;
      var editedView = currentPageView ? currentPageView.getOption('editedElementView') : null;
      var model = editedView ? editedView.model : null;
      if (!model) { _dbg('no editedElementView'); return; }

      var settingsModel = model.get('settings');
      if (!settingsModel) { _dbg('no settingsModel'); return; }

      var activeId = (model.get && model.get('id')) || model.id || model.cid;
      if (!activeId) { _dbg('no activeId'); return; }

      var active = w.document.querySelector('.elementor-element-' + activeId);
      if (!active) {
        active = w.document.querySelector('[data-id="' + activeId + '"]');
        if (!active) { _dbg('widget not found in iframe DOM'); return; }
      }

      var txtEnable  = settingsModel.get('emk_txt_fx_enable');
      var imgEnable  = settingsModel.get('emk_img_fx_enable');
      var fxType     = 'text';
      var effectKey  = 'emk_txt_fx_type';

      if (imgEnable === 'yes' && txtEnable !== 'yes') {
        fxType = 'image';
        effectKey = 'emk_img_fx_type';
      }

      var animType = settingsModel.get(effectKey) || 'none';
      if (!animType || animType === 'none') { _dbg('animType none'); return; }

      var selectorMap = {
        text:  '.elementor-heading-title, .emk--text, .emk--title',
        image: 'img'
      };
      var target = active.querySelector(selectorMap[fxType]);
      // text-editor may only have <p> tags — no .emk--text container
      if (!target && fxType === 'text') {
        var paras = active.querySelectorAll('p');
        target = paras.length > 1 ? active : (paras.length === 1 ? paras[0] : null);
      }
      if (!target) { _dbg('no target found for', fxType); return; }

      var settings = {};
      var allKeys = Object.keys(settingsModel.attributes || {});
      for (var i = 0; i < allKeys.length; i++) {
        var k = allKeys[i];
        if (k.indexOf('emk_') === 0) {
          settings[k] = settingsModel.get(k);
        }
      }

      // Clean up on the target heading (runTextFx stores tracking on targetEl,
      // not on the widget). Widget-level cleanup misses the data.
      if (w.EMKFx && typeof w.EMKFx.run === 'function') {
        w.EMKFx.cleanup(target);
        var result = w.EMKFx.run(target, settings, fxType, { immediate: true });
        _dbg('EMKFx.run result', result && (result.tl ? 'timeline' : result.tween ? 'tween' : null));
      } else {
        if (window.EMKFx && typeof window.EMKFx.run === 'function') {
          window.EMKFx.cleanup(target);
          window.EMKFx.run(target, settings, fxType, { immediate: true });
        } else {
          _dbg('EMKFx not found');
        }
      }
    } catch (e) {
      _dbg('error', e && e.message);
    } finally {
      _inPlay = false;
    }
  }

  window.EMKEditorPlayNow = runPlayNow;

  document.addEventListener('click', function (e) {
    var path = e.composedPath ? e.composedPath() : [];
    var matched = null;
    for (var i = 0; i < path.length; i++) {
      var node = path[i];
      if (!node || !node.getAttribute) continue;
      if (node.getAttribute('data-event') === 'emk/fx/preview') {
        matched = node;
        break;
      }
      if (node.classList && node.classList.contains('elementor-button')
          && node.closest && node.closest('.elementor-control-emk_txt_fx_preview_btn')) {
        matched = node;
        break;
      }
    }
    if (!matched) return;
    e.preventDefault();
    runPlayNow();
  }, true);
})();
