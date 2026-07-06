(function ($) {
  'use strict';

  const hasGsap = () => typeof window.gsap === 'object' && typeof window.gsap.to === 'function';
  const hasScrollTrigger = () => typeof window.ScrollTrigger === 'function' || typeof window.ScrollTrigger === 'object';

  const clampNumber = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  // Resolve Elementor global color variable from :root
  var resolveGlobalColor = function (token) {
    if (typeof token !== 'string' || token.indexOf('globals/colors?id=') !== 0) return null;
    var id = token.split('id=')[1];
    if (!id) return null;
    if (window.EMK_GLOBALS && window.EMK_GLOBALS.colors && window.EMK_GLOBALS.colors[id]) {
      return window.EMK_GLOBALS.colors[id];
    }
    var resolved = getComputedStyle(document.documentElement).getPropertyValue('--e-global-color-' + id).trim();
    if (resolved) return resolved;
    return null;
  };


  const resolveColor = function (handler, key, fallback) {
    // Legacy key map: pre-2.5 installations stored cursor colors under
    // different control names. Check both the requested key and its
    // legacy equivalent in __globals__, model, and data-settings.
    var legacyColorMap = {
      'emk_cursor_hover_bg':    'emk_cursor_hover_cursor_background_color',
      'emk_cursor_hover_color': 'emk_cursor_hover_cursor_color',
    };
    var legacyKey = legacyColorMap[key];
    var keys = legacyKey ? [key, legacyKey] : [key];

    // Parse data-settings once up front
    var domSettings = null;
    if (handler.element && handler.element.dataset && handler.element.dataset.settings) {
      try { domSettings = JSON.parse(handler.element.dataset.settings); } catch (e) { domSettings = null; }
    }

    // Helper: try to resolve from __globals__
    if (domSettings && domSettings.__globals__) {
      for (var i = 0; i < keys.length; i++) {
        var gref = domSettings.__globals__[keys[i]];
        if (gref && typeof gref === 'string' && gref.indexOf('globals/colors?id=') === 0) {
          var r = resolveGlobalColor(gref);
          if (r) return r;
        }
      }
    }

    // Helper: try to resolve from handler model
    try {
      for (var i = 0; i < keys.length; i++) {
        var modelVal = handler.getElementSettings(keys[i]);
        if (modelVal && typeof modelVal === 'string' && modelVal !== '' && modelVal !== fallback) {
          if (modelVal.indexOf('globals/colors?id=') === 0) {
            var r = resolveGlobalColor(modelVal);
            if (r) return r;
          } else {
            return modelVal;
          }
        }
      }
    } catch (e) { /* handler may not have getElementSettings */ }

    // Helper: try to resolve from data-settings direct value
    if (domSettings) {
      for (var i = 0; i < keys.length; i++) {
        var direct = domSettings[keys[i]];
        if (direct && typeof direct === 'string' && direct !== '' && direct !== fallback) {
          if (direct.indexOf('globals/colors?id=') === 0) {
            var r = resolveGlobalColor(direct);
            if (r) return r;
          } else {
            return direct;
          }
        }
      }
    }

    // data-emk attribute fallback (injected by PHP after_add_attributes
    // when Elementor 4.x drops global colors from data-settings).
    if (handler && handler.element) {
      var attrKey = key === 'emk_cursor_hover_bg' ? 'data-emk-cursor-bg' : (key === 'emk_cursor_hover_color' ? 'data-emk-cursor-color' : null);
      if (attrKey) {
        var attrVal = handler.element.getAttribute(attrKey);
        if (attrVal && attrVal !== '' && attrVal !== fallback) {
          return attrVal;
        }
      }
    }
    return fallback;
  };
  const resolveArea = function (element, scope, selector) {
    if (scope === 'parent') return element.parentElement || element;
    if (scope === 'custom' && selector) {
      try { return document.querySelector(selector) || element; } catch (error) { return element; }
    }
    return element;
  };

  // Build a settings adapter with a `.get(key)` method that reads from
  // Base.getElementSettings first, then falls back to the data-settings
  // attribute. Elementor 4.x sometimes doesn't propagate settings to the
  // model for custom widgets, so the data-settings attr is the safety net.
  const buildSettings = function (handler) {
    var legacyMap = {
      'emk_cursor_hover_enable': 'emk_enable_cursor_hover_effect',
      'emk_cursor_hover_text':   'emk_enable_cursor_hover_effect_text',
    };
    var newDefaults = { 'emk_cursor_hover_text': 'View' };
    let domSettings = null;
    if (handler.element && handler.element.dataset && handler.element.dataset.settings) {
      try { domSettings = JSON.parse(handler.element.dataset.settings); } catch (e) { domSettings = null; }
    }
    return {
      get: function (key) {
        var v;
        try { v = handler.getElementSettings(key); } catch (e) { v = undefined; }
        var isDefault = newDefaults[key] && v === newDefaults[key];
        var missing = v === undefined || v === null || v === '';
        // For legacy-mapped keys, skip defaults and empty values so
        // the legacy key check below has a chance to match.
        if (!isDefault && !missing) return v;
        if (domSettings && domSettings[key] !== undefined) {
          var dsIsDefault = newDefaults[key] && domSettings[key] === newDefaults[key];
          var dsMissing = domSettings[key] === '' || domSettings[key] === null;
          if (!dsIsDefault && !dsMissing) return domSettings[key];
        }
        var legacyKey = legacyMap[key];
        if (legacyKey) {
          try { v = handler.getElementSettings(legacyKey); } catch (e) { v = undefined; }
          if (v !== undefined && v !== null && v !== '') return v;
          if (domSettings && domSettings[legacyKey] !== undefined && domSettings[legacyKey] !== '') return domSettings[legacyKey];
          // Legacy not found — re-read the new key value as fallback
          // (we skipped it above because it was default/empty, but now
          // it's the best we have).
          try { v = handler.getElementSettings(key); } catch (e) { v = undefined; }
          if (v !== undefined && v !== null) return v;
          if (domSettings && domSettings[key] !== undefined) return domSettings[key];
        }
        return undefined;
      }
    };
  };

  // Friendly UI adapter: convert the user-facing preset/offset to a GSAP
  // ScrollTrigger "start" string. Falls back to legacy text field if no
  // preset was chosen (backward compat with pre-2.4.2 data).
  const PIN_PRESET_MAP = {
    top: 'top top',
    center: 'top center',
    bottom: 'top bottom',
    '80pct': 'top 80%'
  };
  const resolvePinStart = function (settings) {
    const preset = settings.get('emk_pin_start_preset');
    if (preset && preset !== 'custom') {
      const base = PIN_PRESET_MAP[preset] || 'top top';
      const offset = Number(settings.get('emk_pin_start_offset')) || 0;
      if (offset === 0) return base;
      const op = offset > 0 ? '+=' : '-=';
      return base + op + Math.abs(offset);
    }
    if (preset === 'custom') {
      return String(settings.get('emk_pin_start_custom') || 'top top');
    }
    // Legacy: no preset chosen — read the old text field directly.
    return String(settings.get('emk_pin_start') || 'top top');
  };

  // Friendly UI adapter: convert "Hold Duration (px)" to a GSAP end string.
  // Falls back to legacy text field if the new number is missing.
  const resolvePinEnd = function (settings) {
    const hold = settings.get('emk_pin_hold');
    if (hold !== undefined && hold !== null && hold !== '') {
      const px = Math.max(0, Number(hold) || 0);
      return '+=' + px;
    }
    return String(settings.get('emk_pin_end') || '+=600');
  };

  const createCursor = () => {
    const cursor = document.createElement('div');
    cursor.className = 'emk--cursor-hover';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.style.cssText = [
      'position:fixed','left:0','top:0','z-index:999999','display:flex','align-items:center','justify-content:center',
      'border-radius:999px','pointer-events:none','opacity:0','transform:translate3d(-50%,-50%,0) scale(.85)',
      'will-change:transform,opacity','font-size:12px','line-height:1','font-weight:600','letter-spacing:.02em','text-align:center',
      'transition:opacity .16s ease, transform .16s ease'
    ].join(';');
    document.body.appendChild(cursor);
    return cursor;
  };

  // Elementor may have fired `elementor/frontend/init` before this script
  // ran. Listen for the event AND poll for already-initialized EF so the
  // handler is registered either way (race-safe + dedup'd).
  let emkCleanMotionBound = false;
  const bindEmkCleanMotion = function () {
    if (emkCleanMotionBound) return;
    if (typeof elementorFrontend !== 'object' || !elementorFrontend.hooks) return;
    if (typeof elementorModules !== 'object' || !elementorModules.frontend) return;
    emkCleanMotionBound = true;
    if (elementorFrontend.hooks.__emkCleanMotionBound) return;
    elementorFrontend.hooks.__emkCleanMotionBound = true;
    const Base = elementorModules.frontend.handlers.Base;

    const CleanMotion = Base.extend({
      bindEvents: function () {
        this.element = this.$element && this.$element[0];
        if (!this.element) return;
        this.initMouseMove();
        this.initCursorHover();
        this.initHorizontalScroll();
        this.initHoverImage();
        this.initParallax();
        this.initPin();
      },

      onDestroy: function () {
        if (this.mouseArea) {
          this.mouseArea.removeEventListener('mousemove', this.handleMouseMove);
          this.mouseArea.removeEventListener('mouseleave', this.handleMouseLeave);
        }
        if (this.cursorArea) {
          this.cursorArea.removeEventListener('mouseenter', this.handleCursorEnter);
          this.cursorArea.removeEventListener('mousemove', this.handleCursorMove);
          this.cursorArea.removeEventListener('mouseleave', this.handleCursorLeave);
        }
        if (this.hoverImageArea) {
          this.hoverImageArea.removeEventListener('mouseenter', this.handleHoverImageEnter);
          this.hoverImageArea.removeEventListener('mousemove', this.handleHoverImageMove);
          this.hoverImageArea.removeEventListener('mouseleave', this.handleHoverImageLeave);
        }
        if (this.horizontalTrigger) this.horizontalTrigger.kill();
        if (this.horizontalTween) this.horizontalTween.kill();
        if (this.parallaxTrigger) this.parallaxTrigger.kill();
        if (this.parallaxTween) this.parallaxTween.kill();
        if (this.pinTrigger) this.pinTrigger.kill();
        if (this.cursor && this.cursor.parentNode) this.cursor.parentNode.removeChild(this.cursor);
        if (this.hoverImage && this.hoverImage.parentNode) this.hoverImage.parentNode.removeChild(this.hoverImage);
      },

      initMouseMove: function () {
        const s = buildSettings(this);
        if (s.get('emk_mouse_move_enable') !== 'yes' || !hasGsap()) return;
        const area = resolveArea(this.element, s.get('emk_mouse_move_scope'), s.get('emk_mouse_move_selector'));
        const moveX = clampNumber(s.get('emk_mouse_move_x'), 30);
        const moveY = clampNumber(s.get('emk_mouse_move_y'), 30);
        const duration = clampNumber(s.get('emk_mouse_move_duration'), 0.35);
        const target = this.element;
        this.mouseArea = area;
        this.handleMouseMove = (event) => {
          const rect = area.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          window.gsap.to(target, { x: offsetX * moveX, y: offsetY * moveY, duration, ease: 'power2.out', overwrite: 'auto' });
        };
        this.handleMouseLeave = () => {
          window.gsap.to(target, { x: 0, y: 0, duration, ease: 'power2.out', overwrite: 'auto' });
        };
        area.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        area.addEventListener('mouseleave', this.handleMouseLeave, { passive: true });
      },

      initCursorHover: function () {
        const s = buildSettings(this);
        if (s.get('emk_cursor_hover_enable') !== 'yes') return;
        const size = Math.max(24, clampNumber(s.get('emk_cursor_hover_size'), 86));
        const bg = resolveColor(this, 'emk_cursor_hover_bg', '#111111');
        const color = resolveColor(this, 'emk_cursor_hover_color', '#ffffff');
        const text = String(s.get('emk_cursor_hover_text') || '');
        const cursor = createCursor();
        cursor.textContent = text;
        cursor.style.width = size + 'px';
        cursor.style.height = size + 'px';
        cursor.style.background = bg;
        cursor.style.color = color;
        this.cursor = cursor;
        this.cursorArea = this.element;
        this.handleCursorEnter = () => { cursor.style.opacity = '1'; cursor.style.transform = 'translate3d(-50%,-50%,0) scale(1)'; this.element.classList.add('emk--cursor-hover-active'); };
        this.handleCursorMove = (event) => { cursor.style.left = event.clientX + 'px'; cursor.style.top = event.clientY + 'px'; };
        this.handleCursorLeave = () => { cursor.style.opacity = '0'; cursor.style.transform = 'translate3d(-50%,-50%,0) scale(.85)'; this.element.classList.remove('emk--cursor-hover-active'); };
        this.element.addEventListener('mouseenter', this.handleCursorEnter, { passive: true });
        this.element.addEventListener('mousemove', this.handleCursorMove, { passive: true });
        this.element.addEventListener('mouseleave', this.handleCursorLeave, { passive: true });
      },
      initHorizontalScroll: function () {
        const s = buildSettings(this);
        if (this.getElementType() !== 'container' || s.get('emk_horizontal_enable') !== 'yes' || !hasGsap() || !hasScrollTrigger()) return;
        const minWidth = clampNumber(s.get('emk_horizontal_breakpoint'), 768);
        if (window.innerWidth < minWidth) return;
        const selector = String(s.get('emk_horizontal_track_selector') || '.emk--horizontal-track').trim();
        let track = null;
        try { track = selector ? this.element.querySelector(selector) : null; } catch (error) { track = null; }
        if (!track) track = this.element.querySelector('.emk--horizontal-track');
        if (!track) return;
        const explicitEnd = clampNumber(s.get('emk_horizontal_end'), 0);
        // If user explicitly set a scroll distance, force the track (and its
        // Elementor inner-wrap) to be wider than the container. Flex layout
        // otherwise collapses the inner div to fit the items and the
        // scrollWidth check below would bail.
        if (explicitEnd > 0 && track.scrollWidth <= this.element.clientWidth) {
          const minTrackWidth = this.element.clientWidth + explicitEnd;
          track.style.minWidth = minTrackWidth + 'px';
          track.style.width = minTrackWidth + 'px';
          track.style.flexWrap = 'nowrap';
          track.style.flexShrink = '0';
          const inner = track.querySelector('.e-con-inner');
          if (inner) {
            inner.style.minWidth = minTrackWidth + 'px';
            inner.style.width = minTrackWidth + 'px';
            inner.style.flexWrap = 'nowrap';
            inner.style.flexShrink = '0';
          }
          for (const child of track.querySelectorAll(':scope > *')) {
            child.style.flexShrink = '0';
            const cInner = child.querySelector('.e-con-inner');
            if (cInner) cInner.style.flexShrink = '0';
          }
        }
        if (track.scrollWidth <= this.element.clientWidth) {
          // If the user explicitly set a scroll distance, the JS could force
          // the track to be wider. But for now we just bail — the markup
          // needs to include a wide inner element.
          return;
        }
        const distance = Math.max(0, track.scrollWidth - this.element.clientWidth);
        const scrollDistance = explicitEnd > 0 ? explicitEnd : distance;
        const pin = s.get('emk_horizontal_pin') === 'yes';
        this.element.classList.add('emk--horizontal-scroll');
        track.classList.add('emk--horizontal-track-active');
        track.style.willChange = 'transform';
        // Use ScrollTrigger with onUpdate (mod callback) instead of a tween —
        // simpler and more reliable than gsap.to() with scrub for track x.
        this.horizontalTrigger = window.ScrollTrigger.create({
          trigger: this.element,
          start: 'top top',
          end: '+=' + scrollDistance,
          scrub: 1,
          pin: pin,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const x = -distance * self.progress;
            window.gsap.set(track, { x });
          }
        });
        this.horizontalTween = null;
      },
      initHoverImage: function () {
        const s = buildSettings(this);
        if (s.get('emk_hover_image_enable') !== 'yes') return;
        const image = s.get('emk_hover_image');
        const url = image && image.url ? String(image.url) : '';
        if (!url) return;
        const size = Math.max(40, clampNumber(s.get('emk_hover_image_size'), 220));
        const offsetX = clampNumber(s.get('emk_hover_image_offset_x'), 24);
        const offsetY = clampNumber(s.get('emk_hover_image_offset_y'), 24);
        const speed = Math.max(0, clampNumber(s.get('emk_hover_image_speed'), 0.18));
        const preview = document.createElement('img');
        preview.className = 'emk--hover-image';
        preview.src = url;
        preview.alt = '';
        preview.setAttribute('aria-hidden', 'true');
        preview.style.cssText = ['position:fixed','left:0','top:0','z-index:999998','width:' + size + 'px','height:auto','pointer-events:none','opacity:0','transform:translate3d(0,0,0) scale(.92)','transform-origin:center center','will-change:transform,opacity','transition:opacity .16s ease'].join(';');
        document.body.appendChild(preview);
        this.hoverImage = preview;
        this.hoverImageArea = this.element;
        this.hoverImageFirstMove = true;
        this.handleHoverImageEnter = (event) => {
          this.element.classList.add('emk--hover-image-active');
          // Snap to cursor position instantly on first hover so the image
          // doesn't fly in from the top-left corner (0,0).
          if (event && typeof event.clientX === 'number') {
            if (hasGsap()) {
              window.gsap.set(preview, { x: event.clientX + offsetX, y: event.clientY + offsetY });
              window.gsap.to(preview, { opacity: 1, scale: 1, duration: 0.16, overwrite: 'auto' });
            } else {
              preview.style.transform = 'translate3d(' + (event.clientX + offsetX) + 'px,' + (event.clientY + offsetY) + 'px,0) scale(1)';
              preview.style.opacity = '1';
            }
            this.hoverImageFirstMove = false;
          } else {
            if (hasGsap()) { window.gsap.to(preview, { opacity: 1, scale: 1, duration: 0.16, overwrite: 'auto' }); }
            else { preview.style.opacity = '1'; preview.style.transform = 'scale(1)'; }
          }
        };
        this.handleHoverImageMove = (event) => {
          const x = event.clientX + offsetX; const y = event.clientY + offsetY;
          if (this.hoverImageFirstMove) {
            // First mousemove after enter — set position instantly.
            this.hoverImageFirstMove = false;
            if (hasGsap()) {
              window.gsap.set(preview, { x, y });
              return;
            }
          }
          if (hasGsap()) { window.gsap.to(preview, { x, y, duration: speed, ease: 'power2.out', overwrite: 'auto' }); }
          else { preview.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(1)'; }
        };
        this.handleHoverImageLeave = () => {
          this.element.classList.remove('emk--hover-image-active');
          this.hoverImageFirstMove = true;
          if (hasGsap()) { window.gsap.to(preview, { opacity: 0, scale: 0.92, duration: 0.16, overwrite: 'auto' }); }
          else { preview.style.opacity = '0'; }
        };
        this.element.addEventListener('mouseenter', this.handleHoverImageEnter, { passive: true });
        this.element.addEventListener('mousemove', this.handleHoverImageMove, { passive: true });
        this.element.addEventListener('mouseleave', this.handleHoverImageLeave, { passive: true });
      },

      initParallax: function () {
        const s = buildSettings(this);
        if (s.get('emk_parallax_enable') !== 'yes' || !hasGsap() || !hasScrollTrigger()) return;
        window.gsap.registerPlugin(window.ScrollTrigger);
        const moveY = clampNumber(s.get('emk_parallax_y'), 120);
        const scrub = Math.max(0, clampNumber(s.get('emk_parallax_scrub'), 1));
        const start = String(s.get('emk_parallax_start') || 'top bottom');
        const end = String(s.get('emk_parallax_end') || 'bottom top');
        this.element.classList.add('emk--parallax-active');
        this.parallaxTween = window.gsap.fromTo(this.element, { y: 0 }, {
          y: moveY,
          ease: 'none',
          scrollTrigger: { trigger: this.element, start, end, scrub, invalidateOnRefresh: true }
        });
        this.parallaxTrigger = this.parallaxTween.scrollTrigger;
      },

      initPin: function () {
        const s = buildSettings(this);
        if (s.get('emk_pin_enable') !== 'yes' || !hasGsap() || !hasScrollTrigger()) return;
        // Mobile / responsive check — friendly default is "Disable on Mobile: YES".
        // Legacy users still have emk_pin_breakpoint (default 768).
        const disableMobile = s.get('emk_pin_disable_mobile');
        let minWidth = 0;
        if (disableMobile === 'yes') {
          minWidth = 769;
        } else if (disableMobile === undefined || disableMobile === '') {
          const legacy = clampNumber(s.get('emk_pin_breakpoint'), 0);
          if (legacy > 0) minWidth = legacy;
        }
        if (minWidth > 0 && window.innerWidth < minWidth) return;
        window.gsap.registerPlugin(window.ScrollTrigger);
        const start = resolvePinStart(s);
        const end = resolvePinEnd(s);
        // "Smooth Pin" is the new friendly field. Fall back to legacy emk_pin_scrub.
        const smooth = s.get('emk_pin_smooth');
        const legacyScrub = clampNumber(s.get('emk_pin_scrub'), 0);
        const scrub = smooth === 'yes' ? 1 : (legacyScrub > 0 ? legacyScrub : false);
        const pinSpacing = s.get('emk_pin_spacing') === 'yes';
        this.element.classList.add('emk--pin-active');
        this.pinTrigger = window.ScrollTrigger.create({
          trigger: this.element,
          start,
          end,
          pin: this.element,
          pinSpacing,
          scrub,
          invalidateOnRefresh: true
        });
      }
    });

    elementorFrontend.hooks.addAction('frontend/element_ready/widget', function ($scope) {
      elementorFrontend.elementsHandler.addHandler(CleanMotion, { $element: $scope });
    });
    elementorFrontend.hooks.addAction('frontend/element_ready/container', function ($scope) {
      elementorFrontend.elementsHandler.addHandler(CleanMotion, { $element: $scope });
    });

    // Elementor may fire hooks before ScrollTrigger's initial refresh
    // cycle, so new ScrollTriggers miss position calculation. A single
    // refresh after all widgets are processed fixes parallax, pin, etc.
    if (window.ScrollTrigger && window.ScrollTrigger.refresh) {
      setTimeout(window.ScrollTrigger.refresh, 150);
    }
  };
  $(window).on('elementor/frontend/init', bindEmkCleanMotion);
  // Race-safe: if init already fired, poll for it.
  const waitForEmkCleanMotion = function () {
    if (emkCleanMotionBound) return;
    if (typeof elementorFrontend === 'object' && elementorFrontend.hooks && elementorFrontend.hooks.__emkCleanMotionBound) return;
    bindEmkCleanMotion();
    if (!emkCleanMotionBound) setTimeout(waitForEmkCleanMotion, 50);
  };
  waitForEmkCleanMotion();
})(jQuery);
