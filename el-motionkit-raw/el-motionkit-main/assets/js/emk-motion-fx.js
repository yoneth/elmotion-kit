/**
 * EMK Motion FX — Frontend animation runner for Image & Text effects.
 *
 * Exposes window.EMKFx.run(target, settings, fxType) used by both the
 * frontend Elementor handler and the editor preview (Play button).
 *
 * This file is independently written against the public GSAP 3 and
 * Elementor 4 APIs. No logic is derived from any other plugin.
 *
 * @package ElMotionKit
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  var hasGsap = function () {
    return typeof window.gsap === 'object' && typeof window.gsap.to === 'function';
  };
  var hasScrollTrigger = function () {
    return typeof window.ScrollTrigger === 'function' || typeof window.ScrollTrigger === 'object';
  };
  var hasSplitText = function () {
    return typeof window.SplitText === 'function';
  };
  var prefersReduced = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  var readNum = function (v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  // Parse data-settings from the element's dataset attribute (safety net
  // when Elementor doesn't propagate settings to the handler model).
  var parseDomSettings = function (el) {
    if (!el || !el.dataset || !el.dataset.settings) return null;
    try { return JSON.parse(el.dataset.settings); } catch (e) { return null; }
  };

  var getSetting = function (handler, key, fallback) {
    var v;
    try { v = handler.getElementSettings(key); } catch (e) { v = undefined; }
    if (v !== undefined && v !== null) return v;
    var ds = parseDomSettings(handler.element);
    if (ds && ds[key] !== undefined) return ds[key];
    return fallback;
  };

  /* ------------------------------------------------------------------ */
  /*  Image FX                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Build clip-path inset string for a given direction.
   * dir: 'left' | 'right' | 'top' | 'bottom'
   * pct: 0-100 (100 = fully clipped on the active side)
   */
  var insetByDir = function (dir, pct) {
    var t = 0, r = 0, b = 0, l = 0;
    if (dir === 'left')   l = pct;
    else if (dir === 'right')  r = pct;
    else if (dir === 'top')    t = pct;
    else if (dir === 'bottom') b = pct;
    return 'inset(' + t + '% ' + r + '% ' + b + '% ' + l + '%)';
  };

  /**
   * Run an image effect on `el` (the <img> element).
   * Returns the GSAP tween so it can be killed on cleanup.
   */
  var runImageFx = function (el, settings, immediate) {
    var fx = settings.emk_img_fx_type || 'none';
    if (fx === 'none') return null;

    var dur = readNum(settings.emk_img_fx_duration, 1);
    var dly = readNum(settings.emk_img_fx_delay, 0);
    var ease = settings.emk_img_fx_ease || 'power2.out';
    var dir  = settings.emk_img_fx_dir || 'left';

    var fromVars = {};
    var toVars   = { duration: dur, delay: dly, ease: ease };

    if (fx === 'wipe') {
      // Wrap in overflow:hidden if not already done by CSS
      var parent = el.parentElement;
      if (parent) {
        var style = parent.getAttribute('style') || '';
        if (style.indexOf('overflow:hidden') === -1 && style.indexOf('overflow: hidden') === -1) {
          parent.style.overflow = 'hidden';
        }
      }
      fromVars.clipPath = insetByDir(dir, 100);
      toVars.clipPath   = insetByDir(dir, 0);
    } else if (fx === 'zoom') {
      fromVars.scale = 1.25;
      fromVars.opacity = 0;
      toVars.scale = 1;
      toVars.opacity = 1;
    } else if (fx === 'elastic') {
      fromVars.scaleY = 0.6;
      fromVars.scaleX = 1.1;
      toVars.scaleY = 1;
      toVars.scaleX = 1;
    }

    if (immediate) {
      // Set final state instantly
      window.gsap.set(el, { clipPath: 'inset(0%)', scale: 1, scaleY: 1, scaleX: 1, opacity: 1 });
      // Animate from -> to without ScrollTrigger
      return window.gsap.fromTo(el, fromVars, toVars);
    }

    // With ScrollTrigger
    window.gsap.registerPlugin(window.ScrollTrigger);
    var start = settings.emk_img_fx_start || 'top 85%';
    var scrub = settings.emk_img_fx_scrub === 'yes' ? true : false;
    toVars.scrollTrigger = {
      trigger: el.closest('[data-element_type]') || el.parentElement || el,
      start: start,
      once: !scrub,
      scrub: scrub,
      invalidateOnRefresh: true
    };
    return window.gsap.fromTo(el, fromVars, toVars);
  };

  /* ------------------------------------------------------------------ */
  /*  Text FX                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Wrap each animation unit in an overflow:hidden container for mask-up.
   */
  var wrapUnits = function (units) {
    if (!units) return;
    for (var i = 0; i < units.length; i++) {
      var unit = units[i];
      var isBlock = getComputedStyle(unit).display === 'block';
      var wrap = document.createElement('div');
      wrap.style.overflow = 'hidden';
      wrap.style.display = isBlock ? 'block' : 'inline-block';
      unit.parentNode.insertBefore(wrap, unit);
      wrap.appendChild(unit);
    }
  };
  var splitTypeFor = function (fx, userSplit) {
    if (fx === 'tilt3d') return 'lines';
    if (fx === 'pop') return 'chars';
    return userSplit || 'words';
  };

  /**
   * Build GSAP fromVars / toVars for a text effect type.
   * Returns { from: {...}, to: {...}, needsMask: bool, needsPerspective: bool }
   */
  var textVars = function (fx, settings) {
    var x  = readNum(settings.emk_txt_fx_x, 0);
    var y  = readNum(settings.emk_txt_fx_y, 40);
    var rot = readNum(settings.emk_txt_fx_rotate, -90);
    var origin = settings.emk_txt_fx_origin || '50% 0%';

    var from = { opacity: 0 };
    var to   = {};
    var needsMask = false;
    var needsPerspective = false;
    var forceLines = false;

    if (fx === 'fade-up') {
      from.y = y;
      from.x = x;
      to.y = 0;
      to.x = 0;
      to.opacity = 1;
    } else if (fx === 'tilt3d') {
      forceLines = true;
      needsPerspective = true;
      from.rotationX = rot;
      from.transformOrigin = origin;
      from.force3D = true;
      to.rotationX = 0;
      to.opacity = 1;
      to.transformOrigin = origin;
      to.force3D = true;
    } else if (fx === 'mask-up') {
      needsMask = true;
      from.yPercent = 110;
      to.yPercent = 0;
      delete from.opacity;
      to.opacity = 1;
    } else if (fx === 'pop') {
      from.scale = 0;
      from.transformOrigin = '50% 50%';
      to.scale = 1;
      to.ease = 'back.out(1.7)';
      delete from.opacity;
      to.opacity = 1;
    }

    return {
      from: from,
      to: to,
      needsMask: needsMask,
      needsPerspective: needsPerspective,
      forceLines: forceLines
    };
  };

  /**
   * Run a text animation on `targetEl` (the text/heading element).
   * Returns { tl, split } so callers can kill/revert.
   *
   * In the Elementor editor preview, SplitText 3.13+ refuses to split
   * elements that have editor-injected markers, returning 0 units.
   * When `immediate === true` (editor preview mode), clone the text
   * content into a fresh `<div>` and split that instead.
   */
  var runTextFx = function (targetEl, settings, immediate) {
    var fx = settings.emk_txt_fx_type || 'none';
    if (fx === 'none' || !hasSplitText()) return null;

    var userSplit = settings.emk_txt_fx_split || 'words';
    var splitType = splitTypeFor(fx, userSplit);
    var vars      = textVars(fx, settings);
    var dur       = readNum(settings.emk_txt_fx_duration, 0.8);
    var dly       = readNum(settings.emk_txt_fx_delay, 0);
    var stg       = readNum(settings.emk_txt_fx_stagger, 0.05);
    var ease      = settings.emk_txt_fx_ease || 'power3.out';
    var trigger   = settings.emk_txt_fx_trigger || 'on-scroll';

    // Kill any previous tween on this element to prevent stacking
    if (targetEl._emkPrevTween) {
      if (targetEl._emkPrevTween.kill) targetEl._emkPrevTween.kill();
      targetEl._emkPrevTween = null;
    }

    // Save original innerHTML for reliable restoration. SplitText
    // modifies the DOM irreversibly; without a stored reference to
    // the SplitText instance there's no way to revert. Saving a
    // backup of the original content lets us restore regardless of
    // how many previous splits were applied (even from earlier code
    // versions that didn't track the instance).
    if (!targetEl._emkOriginalHTML) {
      targetEl._emkOriginalHTML = targetEl.innerHTML;
    } else {
      // Restore original content to remove any leftover wraps/splits
      // from a previous run before re-splitting.
      targetEl.innerHTML = targetEl._emkOriginalHTML;
    }

    // Try splitting the original element first. If SplitText returns 0
    // units (GSAP 3.13+ refuses to split editor-touched nodes in the
    // Elementor preview iframe), fall back to a clone that preserves
    // the original tag name and classes so styling is identical.
    var splitTarget = targetEl;
    var isCloned = false;
    var split = new window.SplitText(splitTarget, {
      type: splitType,
      linesClass: 'emk-fx-line'
    });
    var units = split[splitType] || [];

    if (!units.length) {
      // SplitText returned 0 units — likely the Elementor editor issue
      // (editor-touched nodes have markers that prevent splitting).
      // Fall back to a clone that preserves original tag/class/style.
      split.revert();
      var tag   = targetEl.tagName;
      var clone = document.createElement(tag);
      clone.innerHTML = targetEl.innerHTML;
      if (targetEl.className) clone.className = targetEl.className;
      if (targetEl.id)       clone.id       = targetEl.id;
      clone.style.cssText = targetEl.style.cssText || '';
      targetEl.parentNode.insertBefore(clone, targetEl);
      targetEl.style.display = 'none';
      targetEl._emkOriginalDisplay = '';
      targetEl._emkFxClone = clone;
      splitTarget = clone;
      isCloned = true;
      split = new window.SplitText(splitTarget, {
        type: splitType,
        linesClass: 'emk-fx-line'
      });
      units = split[splitType] || [];
    }
    // Apply perspective for tilt3d — set on the HEADING (parent container)
    // so all line elements share the same 3D perspective space.
    if (vars.needsPerspective && splitTarget) {
      splitTarget.style.perspective = '800px';
    }


    if (!units.length) {
      targetEl._emkPrevSplit = null;
      targetEl._emkPrevTween = null;
      split.revert();
      if (isCloned) {
        targetEl.style.display = targetEl._emkOriginalDisplay || '';
        targetEl._emkFxClone = null;
        targetEl._emkOriginalDisplay = null;
        if (splitTarget.parentNode) splitTarget.parentNode.removeChild(splitTarget);
      }
      return null;
    }

    // Wrap each animation unit in overflow:hidden for mask-up
    if (vars.needsMask) {
      wrapUnits(units);
    }

    // Register SplitText once (idempotent)
    window.gsap.registerPlugin(window.SplitText);

    // Clone cleanup for editor preview
    var cleanupClone = function () {
      if (isCloned) {
        targetEl.style.display = targetEl._emkOriginalDisplay || '';
        targetEl._emkFxClone = null;
        targetEl._emkOriginalDisplay = null;
        if (splitTarget && splitTarget.parentNode) {
          splitTarget.parentNode.removeChild(splitTarget);
        }
      }
    };

    if (immediate || trigger === 'on-load') {
      window.gsap.set(units, vars.from);
      var iToVars = {};
      for (var k in vars.to) {
        if (vars.to.hasOwnProperty(k)) iToVars[k] = vars.to[k];
      }
      if (dly > 0) iToVars.delay = dly;
      iToVars.duration = dur;
      if (!vars.to.ease) iToVars.ease = ease;
      if (stg > 0) iToVars.stagger = stg;
      if (isCloned) iToVars.onComplete = cleanupClone;
      targetEl._emkPrevTween = window.gsap.fromTo(units, vars.from, iToVars);
    } else {
      window.gsap.set(units, vars.from);
      window.gsap.registerPlugin(window.ScrollTrigger);
      var sToVars = {};
      for (var k in vars.to) {
        if (vars.to.hasOwnProperty(k)) sToVars[k] = vars.to[k];
      }
      if (dly > 0) sToVars.delay = dly;
      sToVars.duration = dur;
      if (!vars.to.ease) sToVars.ease = ease;
      if (stg > 0) sToVars.stagger = stg;
      sToVars.scrollTrigger = {
        trigger: splitTarget.closest('[data-element_type]') || splitTarget.parentElement || splitTarget,
        start: settings.emk_txt_fx_start || 'top 85%',
        scrub: settings.emk_txt_fx_scrub === 'yes',
        once: settings.emk_txt_fx_scrub !== 'yes',
        invalidateOnRefresh: true
      };
      targetEl._emkPrevTween = window.gsap.to(units, sToVars);
    }

    targetEl._emkPrevSplit = split;
    return { tl: targetEl._emkPrevTween, split: split };
  };
  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  window.EMKFx = window.EMKFx || {};

  /**
   * Main runner — called by frontend handler and editor preview.
   *
   * @param {Element}  target     The DOM element to animate.
   * @param {Object}   settings   Flat settings object (from Elementor or editor model).
   * @param {string}   fxType     'image' or 'text'.
   * @param {Object}   [opts]     Optional overrides.
   * @param {boolean}  [opts.immediate]  If true, no ScrollTrigger (editor preview).
   * @return {Object|null}  { tween, split? } or null on no-op.
   */
  window.EMKFx.run = function (target, settings, fxType, opts) {
    if (!target || !settings) return null;
    if (!hasGsap()) return null;
    if (prefersReduced()) return null;

    opts = opts || {};
    var immediate = opts.immediate === true;

    if (fxType === 'image') {
      var img = target.tagName === 'IMG' ? target : target.querySelector('img');
      if (!img) return null;
      var tween = runImageFx(img, settings, immediate);
      return tween ? { tween: tween } : null;
    }

    if (fxType === 'text') {
      var textEl = null;
      if (target.classList.contains('elementor-heading-title') ||
          target.classList.contains('emk--text') ||
          target.classList.contains('emk--title')) {
        // Target already is the right text container
        textEl = target;
      } else {
        // Find the text container inside the widget
        textEl = target.querySelector('.elementor-heading-title, .emk--text, .emk--title');
        if (!textEl) {
          var pEls = target.querySelectorAll('p');
          textEl = pEls.length > 1 ? target : (pEls.length === 1 ? pEls[0] : target);
        }
      }
      var result = runTextFx(textEl, settings, immediate);
      return result;
    }

    return null;
  };

  // Cleanup — kill tweens, revert SplitText, remove leftover clones.
  window.EMKFx.cleanup = function (el) {
    if (!el) return;

    // Remove any leftover clone and restore original display
    if (el._emkFxClone) {
      if (el._emkFxClone.parentNode) {
        el._emkFxClone.parentNode.removeChild(el._emkFxClone);
      }
      el.style.display = el._emkOriginalDisplay || '';
      el._emkFxClone = null;
      el._emkOriginalDisplay = null;
    }

    // Restore original HTML (reverts all SplitText + wraps reliably)
    if (el._emkOriginalHTML) {
      el.innerHTML = el._emkOriginalHTML;
      el._emkOriginalHTML = null;
    }

    // Revert by SplitText reference (faster when available)
    if (el._emkPrevSplit) {
      el._emkPrevSplit.revert();
      el._emkPrevSplit = null;
    }

    // Kill any previous tween
    if (el._emkPrevTween) {
      if (el._emkPrevTween.kill) el._emkPrevTween.kill();
      el._emkPrevTween = null;
    }

    // Clean up via __emkFxData (stored by frontend handleScope)
    var data = el.__emkFxData;
    if (data) {
      if (data.tween) data.tween.kill();
      if (data.tl) data.tl.kill();
      if (data.split) data.split.revert();
      el.__emkFxData = null;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Elementor frontend handler registration                           */
  /* ------------------------------------------------------------------ */

  var registerFrontend = function () {
    if (typeof elementorFrontend !== 'object' || !elementorFrontend.hooks) return;
    if (elementorFrontend.hooks.__emkFxRegistered) return;
    elementorFrontend.hooks.__emkFxRegistered = true;

    // Helper: parse settings, run animation, store for cleanup
    var handleScope = function ($scope, fxType) {
      var el = $scope.get(0) || $scope[0];
      if (!el) return;
      // No __emkFxRunning guard — cleanup(el) + __emkFxData handle idempotency

      // Cleanup any previous run
      window.EMKFx.cleanup(el);

      // Build settings object from Elementor handler
      var handler = $scope.data && $scope.data('model');
      var settings = {};
      if (handler && handler.getElementSettings) {
        try {
          var raw = handler.getElementSettings();
          // Copy all emk_* keys
          for (var key in raw) {
            if (raw.hasOwnProperty(key) && key.indexOf('emk_') === 0) {
              settings[key] = raw[key];
            }
          }
        } catch (e) { /* ignore */ }
      }

      // Fallback: parse data-settings attribute
      var ds = parseDomSettings(el);
      if (ds) {
        for (var k in ds) {
          if (ds.hasOwnProperty(k) && k.indexOf('emk_') === 0) {
            if (settings[k] === undefined) {
              settings[k] = ds[k];
            }
          }
        }
      }

      var result = window.EMKFx.run(el, settings, fxType, { immediate: false });
      if (result) {
        el.__emkFxData = result;
      }
    };

    // Image widgets — register both short name and .default (Elementor 4.x
    // can fire either depending on the widget registration).
    elementorFrontend.hooks.addAction('frontend/element_ready/image',           function(s){handleScope(s,'image');});
    elementorFrontend.hooks.addAction('frontend/element_ready/image.default',   function(s){handleScope(s,'image');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--image',      function(s){handleScope(s,'image');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--image.default',function(s){handleScope(s,'image');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--image-box',  function(s){handleScope(s,'image');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--image-box.default',function(s){handleScope(s,'image');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--timeline',   function(s){handleScope(s,'image');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--timeline.default',function(s){handleScope(s,'image');});

    // Text widgets
    elementorFrontend.hooks.addAction('frontend/element_ready/heading',         function(s){handleScope(s,'text');});
    elementorFrontend.hooks.addAction('frontend/element_ready/heading.default', function(s){handleScope(s,'text');});
    elementorFrontend.hooks.addAction('frontend/element_ready/text-editor',     function(s){handleScope(s,'text');});
    elementorFrontend.hooks.addAction('frontend/element_ready/text-editor.default',function(s){handleScope(s,'text');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--title',      function(s){handleScope(s,'text');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--title.default',function(s){handleScope(s,'text');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--text',       function(s){handleScope(s,'text');});
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--text.default',function(s){handleScope(s,'text');});

    // ALSO listen on generic widget/container hooks as fallback —
    // Elementor 4.x often skips per-type hooks (heading, text-editor, etc)
    // and only fires frontend/element_ready/widget and container.
    elementorFrontend.hooks.addAction('frontend/element_ready/widget', function ($scope) {
      var el = $scope.get(0) || $scope[0];
      if (!el) return;
      // Determine widget type from its class
      var cls = el.className || '';
      if (cls.indexOf('elementor-widget-heading') >= 0 ||
          cls.indexOf('elementor-widget-text-editor') >= 0 ||
          cls.indexOf('elementor-widget-emk--title') >= 0 ||
          cls.indexOf('elementor-widget-emk--text') >= 0) {
        handleScope($scope, 'text');
      } else if (cls.indexOf('elementor-widget-image') >= 0 ||
                 cls.indexOf('elementor-widget-emk--image') >= 0 ||
                 cls.indexOf('elementor-widget-emk--image-box') >= 0 ||
                 cls.indexOf('elementor-widget-emk--timeline') >= 0) {
        handleScope($scope, 'image');
      }
    });

    // Cleanup on destroy
    elementorFrontend.hooks.addAction('frontend/element_ready/global', function ($scope) {
      var el = $scope.get(0) || $scope[0];
      if (!el) return;
      var observer = new MutationObserver(function () {
        if (!document.body.contains(el)) {
          window.EMKFx.cleanup(el);
          observer.disconnect();
        }
      });
      observer.observe(el.parentNode || document.body, { childList: true, subtree: true });
    });
  };

  // Bind on elementor/frontend/init, with race-safe fallback
  var bound = false;
  var bind = function () {
    if (bound) return;
    if (typeof elementorFrontend !== 'object' || !elementorFrontend.hooks) {
      setTimeout(bind, 30);
      return;
    }
    bound = true;
    registerFrontend();
  };

  if (typeof jQuery !== 'undefined') {
    jQuery(window).on('elementor/frontend/init', bind);
  }
  bind();

})();
