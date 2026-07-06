(function (window) {
  function readNumber(value, fallback) {
    return value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value))
      ? parseFloat(value)
      : fallback;
  }

  function buildSpec(animType, settings) {
    var dtxn = readNumber(settings.text_translate_x, 20);
    var dtyn = readNumber(settings.text_translate_y, 8);
    var dw = readNumber(settings.text_duration, 1);
    var dl = readNumber(settings.text_delay, 0.15);
    var dsgRaw = settings.text_stagger;
    var dsg = dsgRaw !== undefined && dsgRaw !== null && dsgRaw !== '' && !isNaN(parseFloat(dsgRaw))
      ? parseFloat(dsgRaw)
      : null;

    var spec = {
      animType: animType,
      needsSplit: false,
      splitType: 'chars words',
      fromVars: { autoAlpha: 0, x: dtxn, y: dtyn },
      toVars: { autoAlpha: 1, x: 0, y: 0, duration: dw, delay: dl, stagger: dsg !== null ? dsg : 0.02, ease: 'power2.out' },
      targetKey: 'chars'
    };

    if (animType === 'word') {
      spec.splitType = 'chars words';
      spec.targetKey = 'words';
      spec.fromVars = { autoAlpha: 0, x: dtxn, y: dtyn };
      spec.toVars = { autoAlpha: 1, x: 0, y: 0, duration: dw, delay: dl, stagger: dsg !== null ? dsg : 0.08, ease: 'power2.out' };
    } else if (animType === 'text_move') {
      var rd = settings.text_rotation_di || 'x';
      var rot = readNumber(settings.text_rotation, -80);
      var to = settings.text_transform_origin || '50% 50% -30';
      spec.needsSplit = true;
      spec.targetKey = 'lines';
      spec.splitType = 'lines';
      // GSAP strips Z from transformOrigin, so the Z is applied via inline CSS
      // in emk-addons-ex.js. Keep GSAP vars free of transformOrigin entirely.
      spec.fromVars = { autoAlpha: 0, force3D: true };
      spec.fromVars[rd === 'y' ? 'rotationY' : 'rotationX'] = rot;
      spec.toVars = { autoAlpha: 1, force3D: true, duration: dw, delay: dl, ease: 'power2.out' };
      spec.toVars[rd === 'y' ? 'rotationY' : 'rotationX'] = 0;
      spec.toVars._emkTransformOrigin = to;
    } else if (animType === 'text_reveal') {
      spec.targetKey = 'chars';
      spec.splitType = 'chars words';
      spec.fromVars = { autoAlpha: 0, yPercent: 100, force3D: true };
      spec.toVars = { autoAlpha: 1, yPercent: 0, force3D: true, duration: dw, delay: dl, stagger: dsg !== null ? dsg : 0.015, ease: 'circ.out' };
    } else if (animType === 'text_scale') {
      var sn = readNumber(settings.text_scale_num, 1.12);
      var ease = settings.scale_text_ease || 'power2.out';
      spec.targetKey = settings.text_scale_break || 'chars';
      spec.splitType = 'lines words chars';
      spec.fromVars = { autoAlpha: 0, scale: sn, transformOrigin: '50% 0%', force3D: true };
      spec.toVars = { autoAlpha: 1, scale: 1, force3D: true, duration: dw, delay: dl, stagger: dsg !== null ? dsg : 0.02, ease: ease };
    } else if (animType === 'text_spin') {
      spec.needsSplit = true;
      spec.targetKey = 'lines';
      spec.splitType = 'lines';
      spec.fromVars = { autoAlpha: 0, rotationY: 70, transformOrigin: '50% 50% -25' };
      spec.toVars = { autoAlpha: 1, rotationY: 0, duration: dw, delay: dl, stagger: dsg !== null ? dsg : 0.02, ease: 'power2.out' };
    }

    return spec;
  }

  function getContent(model, settings, target) {
    if (model && model.attributes && model.attributes.widgetType === 'emk--text' && settings.text) return settings.text;
    if (settings.title) return settings.title;
    if (settings._title) return settings._title;
    if (settings.editor) return settings.editor;
    return target ? target.innerHTML : '';
  }

  function splitDetached(doc, html, splitType) {
    var temp = doc.createElement('div');
    temp.innerHTML = html;
    var el = temp.querySelector(':scope > :last-child') || temp.lastElementChild || temp;
    var split = new window.SplitText(el, { type: splitType, split: 'text' });
    [['lines', split.lines], ['words', split.words], ['chars', split.chars]].forEach(function(entry) {
      var key = entry[0], list = entry[1] || [];
      list.forEach(function(node) {
        if (node && node.setAttribute) node.setAttribute('data-emk-split', key);
      });
    });
    return { temp: temp, split: split };
  }
  // Unified animation runner: same code path for editor preview and frontend.
  // `target` is the .emk--text / .emk--title element inside the widget.
  // `settings` is a plain object of widget settings (same shape in both contexts).
  // `options.immediate` (default true) — when false, do NOT run the tween.
  //   Callers can read result.spec and result.animTargets, then build their
  //   own tween (e.g. wrapped in a ScrollTrigger for the live frontend).
  // Returns { tween, split, animType, spec, animTargets }.
  function runTextAnimation(target, settings, animType, win, options) {
    win = win || window;
    options = options || {};
    var gsap = win.gsap;
    var SplitText = win.SplitText;
    if (!target || !gsap || !SplitText) return null;

    var spec = buildSpec(animType, settings);
    if (!spec || !animType || animType === 'none') return null;

    // Multi-paragraph target handling. GSAP SplitText 3.13+ requires a
    // single Element, not an HTMLCollection, so when the target has child
    // paragraphs we split each one and concatenate the resulting
    // lines / words / chars into a single virtual set of animTargets.
    var splitChildren = null;
    if (target.children && target.children.length) {
      splitChildren = Array.prototype.slice.call(target.children);
    }
    var splitRoot = splitChildren ? target : target;
    // GSAP SplitText 3.13+ sometimes refuses to split an element that has
    // been touched by Elementor's editor (the element has a `_x_marker`
    // and possibly other hooks). The robust fix is to swap the target
    // for a freshly-created div with the same content. This only affects
    // the editor preview, not the live frontend (the live frontend gets
    // a clean DOM on every page load).
    if (options.editorClone === true && target.parentNode && target.parentNode.contains(target)) {
      try {
        var replacement = win.document.createElement(target.tagName);
        replacement.className = target.className;
        if (target.id) replacement.id = target.id;
        replacement.innerHTML = target.innerHTML;
        target.parentNode.replaceChild(replacement, target);
        target = replacement;
        splitRoot = replacement.children && replacement.children.length
          ? replacement.children
          : replacement;
      } catch (cloneErr) {
        // fall through to original target
      }
    }
    // If the target was already split (by a prior Play Now click, the
    // frontend element_ready handler, or a stale ScrollTrigger), revert
    // the previous split first so we get a clean DOM. SplitText returns
    // empty arrays when called on an already-split element, so without
    // this the editor preview silently no-ops.
    if (target._emkSplit) {
      try { target._emkSplit.revert(); } catch (e1) {}
      target._emkSplit = null;
    }
    if (target._emkAnimTween && target._emkAnimTween.kill) {
      try { target._emkAnimTween.kill(); } catch (e2) {}
      target._emkAnimTween = null;
    }
    // Also unwrap any leftover aria-labels that a stale split left behind
    // (Belt and suspenders for cases where the previous split's revert()
    // was lost — e.g. a JS error mid-animation).
    try {
      var ariaLabels = target.querySelectorAll('[aria-label]');
      ariaLabels.forEach(function (n) { n.removeAttribute('aria-label'); });
    } catch (e3) {}

    var container = target.closest ? target.closest('.elementor-widget-container') : null;
    if (container && !container.style.perspective) {
      container.style.perspective = '400px';
    }
    var split = null;
    if (splitChildren && splitChildren.length) {
      // Multi-paragraph: split each child individually, then merge the
      // per-key arrays so the rest of the function still works against
      // a single split-like object.
      var allLines = [], allWords = [], allChars = [];
      var childSplits = [];
      var perChildOpts = spec.needsSplit
        ? { type: spec.splitType }
        : { type: spec.splitType, split: 'text' };
      for (var ci = 0; ci < splitChildren.length; ci++) {
        var cs = new SplitText(splitChildren[ci], perChildOpts);
        childSplits.push(cs);
        if (cs.lines) for (var li = 0; li < cs.lines.length; li++) allLines.push(cs.lines[li]);
        if (cs.words) for (var wi = 0; wi < cs.words.length; wi++) allWords.push(cs.words[wi]);
        if (cs.chars) for (var ki = 0; ki < cs.chars.length; ki++) allChars.push(cs.chars[ki]);
      }
      allLines.forEach(function (n) { if (n && n.setAttribute) n.setAttribute('data-emk-split', 'lines'); });
      allWords.forEach(function (n) { if (n && n.setAttribute) n.setAttribute('data-emk-split', 'words'); });
      allChars.forEach(function (n) { if (n && n.setAttribute) n.setAttribute('data-emk-split', 'chars'); });
      split = {
        lines: allLines,
        words: allWords,
        chars: allChars,
        _isMulti: true,
        _childSplits: childSplits,
        revert: function () {
          for (var ri = 0; ri < childSplits.length; ri++) {
            try { childSplits[ri].revert(); } catch (e) { /* noop */ }
          }
        },
      };
    } else if (spec.needsSplit) {
      split = new SplitText(splitRoot, { type: spec.splitType });
      [['lines', split.lines], ['words', split.words], ['chars', split.chars]].forEach(function (e) {
        (e[1] || []).forEach(function (n) {
          if (n && n.setAttribute) n.setAttribute('data-emk-split', e[0]);
        });
      });
    } else {
      split = new SplitText(splitRoot, { type: spec.splitType, split: 'text' });
      [['lines', split.lines], ['words', split.words], ['chars', split.chars]].forEach(function (e) {
        (e[1] || []).forEach(function (n) {
          if (n && n.setAttribute) n.setAttribute('data-emk-split', e[0]);
        });
      });
    }

    // Pick the targets per the spec.
    var animTargets;
    if (spec.targetKey === 'lines') {
      animTargets = split.lines;
    } else if (spec.targetKey === 'words') {
      animTargets = split.words;
    } else {
      // text_reveal falls back to chars even though it also produces lines/words
      animTargets = split[spec.targetKey] || split.chars;
    }

    if (!animTargets || !animTargets.length) {
      return { tween: null, split: split, animType: animType, spec: spec, animTargets: animTargets };
    }

    var fv = Object.assign({}, spec.fromVars);
    if (fv.rotationX != null || fv.rotationY != null) fv.force3D = true;

    // When immediate=false, do NOT create the tween here. The caller (the
    // live frontend) builds the tween itself, typically wrapping it in a
    // ScrollTrigger. We still set the FROM state on the targets so the
    // animation looks correct before the trigger fires.
    if (options.immediate === false) {
      gsap.set(animTargets, fv);
    }

    var tween = null;
    if (options.immediate !== false) {
      tween = gsap.fromTo(animTargets, fv, spec.toVars);
    }

    // GSAP strips the Z from transformOrigin, and overwrites style.cssText
    // every tick, so re-apply the user's X Y Z transformOrigin via inline CSS
    // on every frame. Applies to both editor and frontend.
    if (spec.toVars && spec.toVars._emkTransformOrigin) {
      var origin = spec.toVars._emkTransformOrigin;
      var nodes = animTargets;
      var apply = function () {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i] && nodes[i].style) nodes[i].style.transformOrigin = origin;
        }
      };
      apply();
      if (tween && tween.eventCallback) {
        tween.eventCallback('onUpdate', apply);
      }
    }

    // Stash references on the target so the next call to runTextAnimation
    // can revert this split (see the cleanup block at the top of this
    // function). Editor Play Now re-runs on every click; without this the
    // second click would re-split an already-split DOM and produce 0 lines.
    target._emkSplit = split;
    if (tween) target._emkAnimTween = tween;
    return { tween: tween, split: split, animType: animType, spec: spec, animTargets: animTargets, fromVars: fv, toVars: spec.toVars };
  }

  function getContent(model, settings, target) {
    if (model && model.attributes && model.attributes.widgetType === 'emk--text' && settings.text) return settings.text;
    if (settings.title) return settings.title;
    if (settings._title) return settings._title;
    if (settings.editor) return settings.editor;
    return target ? target.innerHTML : '';
  }

  function splitDetached(doc, html, splitType) {
    var temp = doc.createElement('div');
    temp.innerHTML = html;
    var el = temp.querySelector(':scope > :last-child') || temp.lastElementChild || el;
    var split = new window.SplitText(el, { type: splitType, split: 'text' });
    [['lines', split.lines], ['words', split.words], ['chars', split.chars]].forEach(function(entry) {
      var key = entry[0], list = entry[1] || [];
      list.forEach(function(node) {
        if (node && node.setAttribute) node.setAttribute('data-emk-split', key);
      });
    });
    return { temp: temp, split: split };
  }

  window.EMKTextAnimationShared = {
    buildSpec: buildSpec,
    getContent: getContent,
    splitDetached: splitDetached,
    readNumber: readNumber,
    runTextAnimation: runTextAnimation,
  };
 })(window);
