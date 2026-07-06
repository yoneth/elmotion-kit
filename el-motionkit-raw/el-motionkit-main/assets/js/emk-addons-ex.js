/* global EMK_ADDONS_JS */
(function ($) {
  /**
   * @param $scope The Widget wrapper element as a jQuery element
   * @param $ The jQuery alias
   */

  // Make sure you run this code under Elementor.
  // Text animation in editor ONLY via Play Now button (editor.js)
  // On frontend, handled by the Animation handler below
  
  // Elementor 3 may already have fired `elementor/frontend/init` before this
  // script runs (script order: elementor-frontend.js loads first). Bind the
  // listener and, if the event has already passed, run the body right away.
  const runOnElementorReady = function () {
    const device_width = $(window).width();
    if (typeof elementorFrontend !== "object") return;

    const elementorBreakpoints =
      elementorFrontend.config.responsive.activeBreakpoints;
    const Modules = elementorModules.frontend.handlers.Base;

    let smooth_value = 1.35;
    let on_mobile = false;
    let mobile_media = "min-width: 768px";
    let trigger_selector_store = [];

    if (null !== EMK_ADDONS_JS.smoothScroller) {
      smooth_value = EMK_ADDONS_JS.smoothScroller.smooth;
      on_mobile = "on" === EMK_ADDONS_JS.smoothScroller.mobile ? true : false;
      mobile_media = EMK_ADDONS_JS.smoothScroller?.media ?? mobile_media;
    }

    const editor_active =
      typeof elementor !== "undefined" &&
      elementorFrontend &&
      elementorFrontend.isEditMode();

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    if (window.ScrollToPlugin) {
      gsap.registerPlugin(ScrollToPlugin);
    }

    if (
      (editor_active && EMK_ADDONS_JS.smoothScroller?.disableMode == "true") ||
      (EMK_ADDONS_JS.smoothScroller?.disableMode == true && editor_active)
    ) {
    } else {
      if ("function" === typeof ScrollSmoother && "object" === typeof gsap) {
        // 1. Define a global emkInitSmoother
        window.emkInitSmoother = function (smoothValue = 1) {
          // kill any old instance
          if (window.emk_smoother) {
            window.emk_smoother.kill();
          }
          if (
            EMK_ADDONS_JS?.page_smoother?.disable &&
            EMK_ADDONS_JS.page_smoother.disable == true
          ) {
            return;
          }

          let normalize = document.querySelector(
            ".emk--normalize-smoother, .elementor-widget-video"
          );

          // create a new one
          window.emk_smoother = ScrollSmoother.create({
            smooth: smooth_value,
            effects: true,
            smoothTouch: 0.1,
            normalizeScroll: false,
            ignoreMobileResize: false, //false
          });
        };

        let gsap_mm = gsap.matchMedia();

        if (on_mobile) {
          window.emkInitSmoother(smooth_value); // pass a new smoothValue if you want
        } else {
          gsap_mm.add(`(${mobile_media})`, () => {
            window.emkInitSmoother(smooth_value); // pass a new smoothValue if you want
          });
        }
      }
    }

    if ("object" === typeof gsap) {
      let gsap_mm = gsap.matchMedia();

      if ("object" === typeof ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }

      const Animation = Modules.extend({
        bindEvents: function bindEvents() {
          this.run();
        },
        onElementChange(propertyName, value) {},
        run: function run() {
          if (
            "none" === this.getElementSettings("emk-animation") &&
            this.isEdit
          ) {
            this.apply_trigger({
              trigger_type: "on_scroll",
              trigger_selector: trigger_selector_store[this.getID()],
              emk_method: "from",
              finalConfig: {},
            });
          } else {
            this.fade_animation();
            this.custom_animation();
          }
          //widget animation
          if ("widget" === this.getElementType()) {
            //text animation
            if (!this.isEdit) {
              document.fonts.ready.then(() => {
                this.text_animation();
              });
            } else {
              this.text_animation();
            }
            //image animation
            this.image_animation();
          }
          // Button Move Animation
          this.button_move_animation();
          
        },

      

        text_animation: function text_animation() {
          // In editor: only animate via Play Now button
          if (this.isEdit) return;
          
          var animType = this.getElementSettings("emk_text_animation");
          if (!animType || animType === 'none') return;

          let match_media_key = "all";
          const trigger_type = this.getElementSettings("emk_text_trigger");
          const trigger_selector = this.getElementSettings(
            "emk_trigger_text_selector"
          );

          const text_wrapper = this.getElementSettings("emk_anim_txt_wrapper");
          const text_start_trigger =
            this.getElementSettings("emk_anim_txt_s_t");
          const text_end_trigger = this.getElementSettings("emk_anim_txt_e_t");
          const text_start = this.getElementSettings("emk_anim_txt_s");
          const text_start_cus = this.getElementSettings("emk_anim_txt_s_cus");
          const text_end = this.getElementSettings("emk_anim_txt_e");
          const text_end_cus = this.getElementSettings("emk_anim_txt_e_cus");
          const text_marker = this.getElementSettings("emk_anim_txt_markers");

          //if has min max key
          if (this.getElementSettings("text_animation_breakpoint")) {
            const breakpoint =
              elementorBreakpoints[
                this.getElementSettings("text_animation_breakpoint")
              ].value;

            if ("min" === this.getElementSettings("text_breakpoint_min_max")) {
              match_media_key = "min-width: " + breakpoint + "px";
            } else {
              match_media_key = "max-width: " + breakpoint + "px";
            }
          }

          //char/word animation — same code path as the editor Play Now
          // button (EMKTextAnimationShared.runTextAnimation).
          if ("char" === animType || "word" === animType) {
            const container = this.findElement(".elementor-widget-container");
            const target = container.find(".emk--text").last()[0]
              || container.find(".emk--title").last()[0];
            if (!target) return;
            const settings = {
              text_translate_x: this.getElementSettings("text_translate_x"),
              text_translate_y: this.getElementSettings("text_translate_y"),
              text_duration: this.getElementSettings("text_duration"),
              text_delay: this.getElementSettings("text_delay"),
              text_stagger: this.getElementSettings("text_stagger"),
            };
            const shared = window.EMKTextAnimationShared;
            const result = shared && shared.runTextAnimation
              ? shared.runTextAnimation(target, settings, animType, window, { immediate: false })
              : null;
            if (!result || !result.animTargets || !result.animTargets.length) {
              return () => {};
            }
            let emk_text_scrub = this.getElementSettings("spin_text_scrub");
            if ("number" === emk_text_scrub) {
              emk_text_scrub = this.getElementSettings("emk_scrub_number");
            } else {
              emk_text_scrub = emk_text_scrub == "yes" ? true : false;
            }
            document.fonts.ready.then(() => {
              this.apply_trigger({
                trigger_type: trigger_type || "on_scroll", trigger_selector, emk_method: "fromTo",
                finalConfig: result.toVars, fromVars: result.fromVars,
                element: result.animTargets, isSplit: true,
                wrapper_type: text_wrapper, start_trigger: text_start_trigger,
                end_trigger: text_end_trigger, start: text_start,
                start_cus: text_start_cus, end: text_end, end_cus: text_end_cus,
                scrub: emk_text_scrub, markers: text_marker,
              });
            });
            return () => {
              if (result.split) result.split.revert();
            };
          }

          //text_move_animation — same code path as the editor Play Now
          // button (EMKTextAnimationShared.runTextAnimation), so the live
          // frontend and the editor preview produce byte-identical motion
          // for the same widget settings.
          if ("text_move" === animType) {
            const container = this.findElement(".elementor-widget-container");
            const target = container.find(".emk--text").last()[0]
              || container.find(".emk--title").last()[0];
            if (!target) return;
            const settings = {
              text_rotation_di: this.getElementSettings("text_rotation_di"),
              text_rotation: this.getElementSettings("text_rotation"),
              text_transform_origin: this.getElementSettings("text_transform_origin"),
              text_duration: this.getElementSettings("text_duration"),
              text_delay: this.getElementSettings("text_delay"),
              text_stagger: this.getElementSettings("text_stagger"),
            };
            const shared = window.EMKTextAnimationShared;
            const result = shared && shared.runTextAnimation
              ? shared.runTextAnimation(target, settings, "text_move", window, { immediate: false })
              : null;
            if (!result || !result.animTargets || !result.animTargets.length) {
              return () => {};
            }
            let emk_text_scrub = this.getElementSettings("spin_text_scrub");
            if ("number" === emk_text_scrub) {
              emk_text_scrub = this.getElementSettings("emk_scrub_number");
            } else {
              emk_text_scrub = emk_text_scrub == "yes" ? true : false;
            }
            // The `trigger_type` setting is undefined for widgets that
            // never opened the trigger dropdown, but the user still
            // expects the text animation to play on scroll. Default to
            // "on_scroll" so the ScrollTrigger is created.
            this.apply_trigger({
              trigger_type: trigger_type || "on_scroll",
              trigger_selector,
              emk_method: "fromTo",
              finalConfig: result.toVars,
              fromVars: result.fromVars,
              element: result.animTargets,
              isSplit: true,
              wrapper_type: text_wrapper,
              start_trigger: text_start_trigger,
              end_trigger: text_end_trigger,
              start: text_start,
              start_cus: text_start_cus,
              end: text_end,
              end_cus: text_end_cus,
              scrub: emk_text_scrub,
              markers: text_marker,
            });
            return () => {
              if (result.split) result.split.revert();
            };
          }
          //text-reveal-animation — same code path as the editor Play Now
          // button (EMKTextAnimationShared.runTextAnimation).
          if ("text_reveal" === animType) {
            const container = this.findElement(".elementor-widget-container");
            const target = container.find(".emk--text").last()[0]
              || container.find(".emk--title").last()[0];
            if (!target) return;
            const settings = {
              text_duration: this.getElementSettings("text_duration"),
              text_delay: this.getElementSettings("text_delay"),
              text_stagger: this.getElementSettings("text_stagger"),
            };
            const shared = window.EMKTextAnimationShared;
            const result = shared && shared.runTextAnimation
              ? shared.runTextAnimation(target, settings, "text_reveal", window, { immediate: false })
              : null;
            if (!result || !result.animTargets || !result.animTargets.length) {
              return () => {};
            }
            let emk_text_scrub = this.getElementSettings("spin_text_scrub");
            if ("number" === emk_text_scrub) {
              emk_text_scrub = this.getElementSettings("emk_scrub_number");
            } else {
              emk_text_scrub = emk_text_scrub == "yes" ? true : false;
            }
            this.apply_trigger({
              trigger_type: trigger_type || "on_scroll",
              trigger_selector,
              emk_method: "fromTo",
              finalConfig: result.toVars,
              fromVars: result.fromVars,
              element: result.animTargets,
              isSplit: true,
              wrapper_type: text_wrapper,
              start_trigger: text_start_trigger,
              end_trigger: text_end_trigger,
              start: text_start,
              start_cus: text_start_cus,
              end: text_end,
              end_cus: text_end_cus,
              scrub: emk_text_scrub,
              markers: text_marker,
            });
            return () => {
              if (result.split) result.split.revert();
            };
          }

          // Text Invert With Scroll
          if ("text_invert" === animType) {
            const RGBToHSL = (r, g, b) => {
              r /= 255;
              g /= 255;
              b /= 255;
              const l = Math.max(r, g, b);
              const s = l - Math.min(r, g, b);
              const h = s
                ? l === r
                  ? (g - b) / s
                  : l === g
                  ? 2 + (b - r) / s
                  : 4 + (r - g) / s
                : 0;
              return [
                60 * h < 0 ? 60 * h + 360 : 60 * h,
                100 *
                  (s
                    ? l <= 0.5
                      ? s / (2 * l - s)
                      : s / (2 - (2 * l - s))
                    : 0),
                (100 * (2 * l - s)) / 2,
              ];
            };

            const length = this.findElement(
              ".elementor-widget-container"
            ).children().length;
            const element = $(
              this.findElement(".elementor-widget-container").children()[
                length - 1
              ]
            );
            let color = element.css("color");

            color = color.toString();
            color = color.match(/(\d+)/g);
            color = RGBToHSL(color[0], color[1], color[2]);
            color = `${color[0].toFixed(1)}, ${color[1].toFixed(
              1
            )}%, ${color[2].toFixed(1)}%`;
            element.css("--text-color", color);

            if ("all" === match_media_key) {
              const split = new SplitText(element, {
                type: "lines",
                linesClass: "invert-line",
              });
              split.lines.forEach((target) => {
                gsap.to(target, {
                  backgroundPositionX: 0,
                  ease: "none",
                  scrollTrigger: {
                    trigger: target,
                    scrub: 1,
                    start: "top 85%",
                    end: "bottom center",
                  },
                });
              });
            } else {
              gsap_mm.add(`(${match_media_key})`, () => {
                const split = new SplitText(element, {
                  type: "lines",
                  linesClass: "invert-line",
                });

                split.lines.forEach((target) => {
                  gsap.to(target, {
                    backgroundPositionX: 0,
                    ease: "none",
                    scrollTrigger: {
                      trigger: target,
                      scrub: 1,
                      start: "top 85%",
                      end: "bottom center",
                    },
                  });
                });

                return () => {
                  // optional
                  // custom cleanup code here (runs when it STOPS matching)
                  split.revert();
                };
              });
            }
          }

          // Spin Text

          if ("text_spin" === animType) {
            const container = this.findElement(".elementor-widget-container");
            const lastEl = container.children().last();
            const clone = lastEl[0].cloneNode(true);

            $(clone).addClass("duplicate-text");
            lastEl.css({ perspective: "600px", "white-space": "nowrap" });
            $(clone).css({ perspective: "600px", "white-space": "nowrap" });

            lastEl.after(clone);
            gsap.set(clone, { yPercent: -100 });

            const originalSplit = new SplitText(lastEl[0], { type: "chars" });
            const cloneSplit = new SplitText(clone, { type: "chars" });

            gsap.set(cloneSplit.chars, { opacity: 0 });

            const delay = this.getElementSettings("text_delay") || 0;
            const duration = 0.4;
            const stagger = { each: 0.03, ease: "power1", from: "start" };
            const height = lastEl[0].offsetHeight;
            const origin = `50% 50% -${height / 2}`;

            const createTimeline = () => {
              const tl = gsap.timeline();
              tl.set(cloneSplit.chars, {
                rotationX: -90,
                transformOrigin: origin,
              });

              tl.to(
                originalSplit.chars,
                {
                  delay,
                  duration,
                  rotationX: 90,
                  transformOrigin: origin,
                  opacity: 0,
                  stagger,
                  ease: "power2.in",
                },
                0
              );

              tl.to(
                cloneSplit.chars,
                {
                  duration: 0.001,
                  delay,
                  opacity: 1,
                  stagger,
                },
                0.001
              );

              tl.to(
                cloneSplit.chars,
                {
                  duration,
                  delay,
                  rotationX: 0,
                  stagger,
                },
                0
              );

              return tl;
            };

            const runAnimation = () => {
              if (match_media_key === "all") {
                createTimeline();
              } else {
                const gsap_mm = gsap.matchMedia();
                gsap_mm.add(`(${match_media_key})`, createTimeline);
              }
            };

            const debounce = (func, wait = 300) => {
              let timeout;
              return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
              };
            };

            if (
              (trigger_type === "click" || trigger_type === "mouseover") &&
              trigger_selector &&
              document.querySelector(trigger_selector)
            ) {
              const target = document.querySelector(trigger_selector);
              const newTarget = target.cloneNode(true);
              target.parentNode.replaceChild(newTarget, target);

              const debouncedAnimation = debounce(runAnimation, 300);
              newTarget.addEventListener(trigger_type, debouncedAnimation);
            } else if (
              trigger_type === "on_scroll" ||
              trigger_type === "play_with_scroll"
            ) {
              const tl = createTimeline();
              ScrollTrigger.create({
                animation: tl,
                trigger: container[0],
                start: this.getElementSettings("spin_text_start") || "top 85%",
                end: this.getElementSettings("spin_text_end") || "top 30%",
                scrub: scrub ? scrub : false,
                toggleActions:
                  this.getElementSettings("spin_text_toggle_action") ||
                  "play none none none",
                invalidateOnRefresh: true,
              });
            } else {
              // "on_load" or no trigger_type provided
              runAnimation();
            }

            return () => {
              originalSplit.revert();
              cloneSplit.revert();
            };
          }

          // Text Scale Animation — same code path as the editor Play Now
          // button (EMKTextAnimationShared.runTextAnimation).
          if ("text_scale" === animType) {
            const container = this.findElement(".elementor-widget-container");
            const target = container.find(".emk--text").last()[0]
              || container.find(".emk--title").last()[0];
            if (!target) return;
            const settings = {
              text_duration: this.getElementSettings("text_duration"),
              text_delay: this.getElementSettings("text_delay"),
              text_stagger: this.getElementSettings("text_stagger"),
              text_scale_num: this.getElementSettings("text_scale_num"),
              text_scale_break: this.getElementSettings("text_scale_break"),
              scale_text_ease: this.getElementSettings("scale_text_ease"),
            };
            const shared = window.EMKTextAnimationShared;
            const result = shared && shared.runTextAnimation
              ? shared.runTextAnimation(target, settings, "text_scale", window, { immediate: false })
              : null;
            if (!result || !result.animTargets || !result.animTargets.length) {
              return () => {};
            }
            let emk_pin_scrub = this.getElementSettings("spin_text_scrub");
            this.apply_trigger({
              trigger_type: trigger_type || "on_scroll",
              trigger_selector,
              emk_method: "fromTo",
              finalConfig: result.toVars,
              fromVars: result.fromVars,
              element: result.animTargets,
              isSplit: true,
              wrapper_type: text_wrapper,
              start_trigger: text_start_trigger,
              end_trigger: text_end_trigger,
              start: text_start,
              start_cus: text_start_cus,
              end: text_end,
              end_cus: text_end_cus,
              scrub: emk_pin_scrub,
              markers: text_marker,
            });
            return () => {
              if (result.split) result.split.revert();
            };
          }
        },

        image_animation: function image_animation() {
          if (
            this.isEdit &&
            !this.getElementSettings("emk_img_animation_editor")
          ) {
            return;
          }

          if ("reveal" === this.getElementSettings("emk-image-animation")) {
            let wrap = this.findElement("img").parent();
            const element = this.$element;
            this.findElement("img").parent().parent().css("overflow", "hidden");
            wrap.css({
              overflow: "hidden",
              display: "block",
              visibility: "hidden",
              transition: "none",
            });

            let start = this.getElementSettings("emk-animation-start");
            if ("custom" === this.getElementSettings("emk-animation-start")) {
              start = this.getElementSettings("emk_animation_custom_start");
            }

            let start_from = this.getElementSettings("emk_a_start_from");
            let ease = this.getElementSettings("image-ease");
            let image_hover_effect = false;
            let image_hover_class = [
              "effect-zoom-in",
              "effect-zoom-out",
              "left-move",
              "right-move",
            ];
            let image_hover_effect_class = "";
            $.each(image_hover_class, function (index, value) {
              if (element.hasClass(`emk--image-${value}`)) {
                image_hover_effect_class = `emk--image-${value}`;
                element.removeClass(image_hover_effect_class);
              }
            });

            wrap.each(function () {
              let image = $(this).find("img");
              let tl = gsap.timeline({
                scrollTrigger: {
                  trigger: $(this),
                  start: start,
                },
              });

              let contentAnim = { ease: ease, onComplete };
              let imageAnim = { scale: 1.3, delay: -1.5, ease: ease };

              switch (start_from) {
                case "left":
                  contentAnim.xPercent = 100;
                  imageAnim.xPercent = -100;
                  break;
                case "right":
                  contentAnim.xPercent = -100;
                  imageAnim.xPercent = 100;
                  break;
                case "top":
                  contentAnim.yPercent = 100;
                  imageAnim.yPercent = -100;
                  break;
                case "bottom":
                  contentAnim.yPercent = -100;
                  imageAnim.yPercent = 100;
                  break;
              }

              function onComplete() {
                if (image_hover_effect) {
                  element.addClass(image_hover_effect_class);
                  image_hover_effect = false;
                }
              }

              tl.set($(this), { autoAlpha: 1 });
              tl.from($(this), 1.5, contentAnim);
              tl.from(image, 1.5, imageAnim);

              // tl.set($(this), { autoAlpha: 1 });
              // tl.from($(this), 1.5, {
              //   xPercent: 100,
              //   ease: ease,
              //   onComplete: function () {
              //     if (image_hover_effect) {
              //       element.addClass(image_hover_effect_class);
              //       image_hover_effect = false;
              //     }
              //   },
              // });
              // tl.from(image, 1.5, {
              //   xPercent: -100,
              //   scale: 1.3,
              //   delay: -1.5,
              //   ease: ease,
              // });
            });
          }

          if ("scale" === this.getElementSettings("emk-image-animation")) {
            let image = this.findElement("img");

            let start = this.getElementSettings("emk-animation-start");

            if ("custom" === this.getElementSettings("emk-animation-start")) {
              start = this.getElementSettings("emk_animation_custom_start");
            }

            gsap.set(image, {
              scale: this.getElementSettings("emk-scale-start"),
            });

            gsap.to(image, {
              scrollTrigger: {
                trigger: this.$element,
                start: start,
                scrub: true,
              },
              scale: this.getElementSettings("emk-scale-end"),
              ease: this.getElementSettings("image-ease"),
            });

            image.parent().css("overflow", "hidden");
          }

          if ("stretch" === this.getElementSettings("emk-image-animation")) {
            let image = this.findElement("img");
            let wrap = this.findElement("img").parent();
            wrap.css("padding-bottom", "395px");

            let imageStretch = gsap.timeline({
              scrollTrigger: {
                trigger: wrap,
                start: "top top",
                pin: true,
                scrub: 1,
                pinSpacing: false,
                end: "bottom bottom+=100",
              },
            });
            imageStretch.to(image, {
              width: "100%",
              borderRadius: "0px",
            });

            wrap.css("transition", "none");
          }
        },

        //    fade_animation: function fade_animation() {
        //       if ("none" === this.getElementSettings("emk-animation")) {
        //         return;
        //       }

        //       if (
        //         this.isEdit &&
        //         !this.getElementSettings("emk_animation_editor")
        //       ) {
        //         return;
        //       }

        //       const fade_direction = this.getElementSettings("fade-from");
        //       const trigger_type = this.getElementSettings("emk_trigger") || "on_scroll";
        //       const duration_value = this.getElementSettings("data-duration");
        //       const fade_offset = this.getElementSettings("fade-offset");
        //       const delay_value = this.getElementSettings("delay");
        //       const ease_value = this.getElementSettings("ease");
        //       let match_media_key = "all";

        //       this.$element.css("transition", "none");

        //       //if has min max key
        //       if (this.getElementSettings("fade_animation_breakpoint")) {
        //         const breakpoint =
        //           elementorBreakpoints[
        //             this.getElementSettings("fade_animation_breakpoint")
        //           ].value;

        //         if ("min" === this.getElementSettings("fade_breakpoint_min_max")) {
        //           match_media_key = "min-width: " + breakpoint + "px";
        //         } else {
        //           match_media_key = "max-width: " + breakpoint + "px";
        //         }
        //       }

        //       let config = {
        //         opacity: 0,
        //         ease: ease_value,
        //         duration: duration_value,
        //         delay: delay_value,
        //       };

        //       if ("fade" === this.getElementSettings("emk-animation")) {
        //         if ("top" === fade_direction) {
        //           config.y = -fade_offset;
        //         }

        //         if ("bottom" === fade_direction) {
        //           config.y = fade_offset;
        //         }

        //         if ("left" === fade_direction) {
        //           config.x = -fade_offset;
        //         }

        //         if ("right" === fade_direction) {
        //           config.x = fade_offset;
        //         }

        //         if ("scale" === fade_direction) {
        //           config.scale = this.getElementSettings("emk-a-scale");
        //         }
        //       }

        //       if ("move" === this.getElementSettings("emk-animation")) {
        //         const rotation_di = this.getElementSettings("emk_a_rotation_di");
        //         const transformOrigin = this.getElementSettings(
        //           "emk_a_transform_origin"
        //         );
        //         const rotation = this.getElementSettings("emk_a_rotation");
        //         config.force3D = true;
        //         config.transformOrigin = transformOrigin;

        //         if ("x" === rotation_di) {
        //           config.rotationX = rotation;
        //         }

        //         if ("y" === rotation_di) {
        //           config.rotationY = rotation;
        //         }

        //         gsap.set(this.$element.parent(), {
        //           perspective: 400,
        //         });
        //       }

        //       if (trigger_type) {
        //         config.scrollTrigger = {
        //           trigger: this.$element,
        //           start: "top 85%",
        //         };
        //       }
        //       console.log(config);
        //       if ("all" === match_media_key) {
        //         gsap.from(this.$element, config);
        //       } else {
        //         gsap_mm.add(`(${match_media_key})`, () => {
        //           gsap.from(this.$element, config);

        //           return () => {
        //             // optional
        //             // custom cleanup code here (runs when it STOPS matching)
        //           };
        //         });
        //       }
        // },

        fade_animation: function fade_animation() {
          if (
            this.getElementSettings("emk-animation") === "none" ||
            this.getElementSettings("emk-animation") === "custom"
          )
            return;
          if (
            this.isEdit &&
            !this.getElementSettings("emk_animation_editor")
          ) {
            return;
          }

          const fade_direction = this.getElementSettings("fade-from");
          const trigger_type =
            this.getElementSettings("emk_trigger") || "on_scroll";
          const trigger_selector = this.getElementSettings(
            "emk_trigger_selector"
          );

          if (trigger_selector) {
            trigger_selector_store[this.getID()] = trigger_selector;
          }

          const wrapper = this.getElementSettings("emk_anim_wrapper");
          const start_trigger = this.getElementSettings("emk_anim_s_t");
          const end_trigger = this.getElementSettings("emk_anim_e_t");
          const start = this.getElementSettings("emk_anim_s");
          const start_cus = this.getElementSettings("emk_anim_s_cus");
          const end = this.getElementSettings("emk_anim_e");
          const end_cus = this.getElementSettings("emk_anim_e_cus");
          const markers = this.getElementSettings("emk_anim_markers");

          const emk_method = this.getElementSettings("emk_method") || "from";
          const duration_value = this.getElementSettings("data-duration");
          const fade_offset = this.getElementSettings("fade-offset");
          const delay_value = this.getElementSettings("delay");
          const ease_value = this.getElementSettings("ease");

          let config = {
            opacity: 0,
            ease: ease_value,
            duration: duration_value,
            //  duration: 0.1,
            delay: delay_value,
            // delay: 0.1,
          };

          if (this.getElementType() === "container") {
            this.$element.addClass("emk-disable-transition");
          }

          this.$element.css("transition", "none");

          //if has min max key

          if ("fade" === this.getElementSettings("emk-animation")) {
            if ("top" === fade_direction) {
              config.y = -fade_offset;
            }

            if ("bottom" === fade_direction) {
              config.y = fade_offset;
            }

            if ("left" === fade_direction) {
              config.x = -fade_offset;
            }

            if ("right" === fade_direction) {
              config.x = fade_offset;
            }

            if ("scale" === fade_direction) {
              config.scale = this.getElementSettings("emk-a-scale");
            }
          }
          // 3D Move Animation
          if ("move" === this.getElementSettings("emk-animation")) {
            const rotation_di = this.getElementSettings("emk_a_rotation_di");
            const transformOrigin = this.getElementSettings(
              "emk_a_transform_origin"
            );
            const rotation = this.getElementSettings("emk_a_rotation");
            config.force3D = true;
            config.transformOrigin = transformOrigin;

            if ("x" === rotation_di) {
              config.rotationX = rotation;
            }

            if ("y" === rotation_di) {
              config.rotationY = rotation;
            }

            gsap.set(this.$element.parent(), {
              perspective: 400,
            });
          }
    
          this.apply_trigger({
            trigger_type,
            trigger_selector,
            emk_method,
            finalConfig: config,
            element: this.$element,
            wrapper_type: wrapper,
            start_trigger,
            end_trigger,
            start,
            start_cus,
            end,
            end_cus,
            markers,
          });
        },

        custom_animation: function custom_animation() {
          if (this.getElementSettings("emk-animation") !== "custom") {
            return;
          }
          if (
            this.isEdit &&
            "none" == this.getElementSettings("emk-animation")
          ) {
            gsap.killTweensOf(this.$element); // Kills all animations affecting .box
            gsap.set(this.$element, { clearProps: "all" }); // reset inline styles
            if (document.querySelector(trigger_selector)) {
              const oldElement = document.querySelector(trigger_selector);
              const newElement = oldElement.cloneNode(true);
              oldElement.parentNode.replaceChild(newElement, oldElement);
            }
          }

          if ("custom" !== this.getElementSettings("emk-animation")) {
            return;
          }

          if (
            this.isEdit &&
            !this.getElementSettings("emk_animation_editor")
          ) {
            return;
          }

          const ease_value = this.getElementSettings("ease");
          const trigger_type = this.getElementSettings("emk_trigger");
          const trigger_selector = this.getElementSettings(
            "emk_trigger_selector"
          );
          if (trigger_selector) {
            trigger_selector_store[this.getID()] = trigger_selector;
          }

          const wrapper = this.getElementSettings("emk_anim_wrapper");
          const start_trigger = this.getElementSettings("emk_anim_s_t");
          const end_trigger = this.getElementSettings("emk_anim_e_t");
          const start = this.getElementSettings("emk_anim_s");
          const start_cus = this.getElementSettings("emk_anim_s_cus");
          const end = this.getElementSettings("emk_anim_e");
          const end_cus = this.getElementSettings("emk_anim_e_cus");
          const markers = this.getElementSettings("emk_anim_markers");

          const emk_method = this.getElementSettings("emk_method") || "from";
          const custom_props = this.getElementSettings("emk_ani_custom_props");

          let config = {
            ease: ease_value,
          };

          if (this.getElementType() === "container") {
            this.$element.addClass("emk-disable-transition");
          }

          this.$element.css("transition", "none");

          const refineprops = custom_props.reduce(
            (out, { property, value }) => ({
              ...out,
              [property]: this.perse_value(value),
            }),
            {}
          );
          const finalConfig = { ...refineprops, ...config };

          this.apply_trigger({
            trigger_type,
            trigger_selector,
            emk_method,
            finalConfig,
            wrapper_type: wrapper,
            start_trigger,
            end_trigger,
            start,
            start_cus,
            end,
            end_cus,
            markers,
          });
        },

        generate_animation: function generate_animation({
          emk_method,
          finalConfig,
          isKillAnim = true,
          element,
          isSplit,
          on_emk_update,
          fromVars,
        }) {
          const target = element || this.$element;
          let tween = null;

          const getMatchMediaKey = () => {
            const bpKey = this.getElementSettings("fade_animation_breakpoint");
            const minOrMax = this.getElementSettings("fade_breakpoint_min_max");

            if (!bpKey || !elementorBreakpoints[bpKey]) return "all";

            const breakpoint = elementorBreakpoints[bpKey].value;
            return `${
              minOrMax === "min" ? "min" : "max"
            }-width: ${breakpoint}px`;
          };

          const runTween = () => {
            const tweenConfig = {
              ...finalConfig,
              onComplete: () => {
                if (!isKillAnim) return;
                tween.kill();
                if (!isSplit) {
                  gsap.set(target, { clearProps: "all" });
                }
                tween = null;
              },
            };
            if (typeof on_emk_update === "function") {
              tweenConfig.onUpdate = on_emk_update;
            }
            if (emk_method === "fromTo" && fromVars) {
              tween = gsap.fromTo(target, fromVars, tweenConfig);
            } else {
              tween = gsap[emk_method](target, tweenConfig);
            }
          };

          const match_media_key = getMatchMediaKey();

          if (match_media_key === "all") {
            runTween();
          } else {
            const gsap_mm = gsap.matchMedia();
            gsap_mm.add(`(${match_media_key})`, runTween);
          }
        },

        apply_trigger: function apply_trigger({
          trigger_type,
          trigger_selector,
          emk_method,
          finalConfig,
          element,
          isSplit = false,
          wrapper_type,
          start_trigger,
          end_trigger,
          start,
          start_cus,
          end,
          end_cus,
          scrub,
          markers,
          on_emk_update,
          fromVars,
        }) {
          const target = element || this.$element;
          gsap.killTweensOf(target);
          // if (!isSplit) gsap.set(target, { clearProps: "all" });
          if (
            !isSplit &&
            (trigger_type == "mouseover" || trigger_type === "click")
          )
            gsap.set(target, { clearProps: "all" });

          const debounce = (func, wait = 300) => {
            let timeout;
            return function (...args) {
              clearTimeout(timeout);
              timeout = setTimeout(() => func.apply(this, args), wait);
            };
          };

          const runAnimation = () => {
            if (
              trigger_type === "on_scroll" ||
              trigger_type === "play_with_scroll"
            ) {
              const scrollTriggerConfig = {
                trigger: target[0],
                start: "top 85%",
                scrub: scrub ? scrub : false,
              };

              if (wrapper_type === "custom") {
                if (start_trigger) scrollTriggerConfig.trigger = start_trigger;
                if (end_trigger) scrollTriggerConfig.endTrigger = end_trigger;
                if (markers) scrollTriggerConfig.markers = markers;
                if (scrub) scrollTriggerConfig.scrub = scrub;
                if (start) {
                  if (start === "custom") {
                    scrollTriggerConfig.start = start_cus;
                  } else {
                    scrollTriggerConfig.start = start;
                  }
                }
                if (end) {
                  if (end === "custom") {
                    scrollTriggerConfig.end = end_cus;
                  } else {
                    scrollTriggerConfig.end = end;
                  }
                }
              }

              let section = this.$element;

              // Convert to DOM element if it's a selector string
              if (typeof section === "string") {
                section = document.querySelector(section);
              }

              if (section?.length) {
                const dataId = section[0].getAttribute("data-id");
                if (dataId) scrollTriggerConfig.id = dataId;
              } else {
                const dataId = section.getAttribute("data-id");
                if (dataId) scrollTriggerConfig.id = dataId;
              }
              if (window.gsap && window.ScrollTrigger) {
                const existing = ScrollTrigger.getById(scrollTriggerConfig.id);
                if (existing) existing.kill();
              }

              finalConfig = {
                ...finalConfig,
                scrollTrigger: scrollTriggerConfig,
              };
            }
            this.generate_animation({
              emk_method,
              finalConfig,
              isKillAnim:
                trigger_type !== "play_with_scroll" &&
                trigger_type !== "on_scroll",
              element,
              isSplit,
              on_emk_update,
              fromVars,
            });
          };

          // Check if it's a hover or click trigger
          if (
            (trigger_type === "mouseover" || trigger_type === "click") &&
            trigger_selector &&
            document.querySelector(trigger_selector)
          ) {
            const oldEl = document.querySelector(trigger_selector);
            const newEl = oldEl.cloneNode(true);
            oldEl.parentNode.replaceChild(newEl, oldEl);

            const debouncedHandler = debounce(runAnimation, 300);
            newEl.addEventListener(trigger_type, debouncedHandler);
          } else {
            runAnimation();
          }
        },

        perse_value: function parse_value(value) {
          if (typeof value !== "string") return value;

          const lower = value.toLowerCase().trim();

          // Boolean detection
          if (lower === "true") return true;
          if (lower === "false") return false;

          // Pure number (integer or float)
          if (/^-?\d+(\.\d+)?$/.test(value)) {
            return parseFloat(value);
          }

          // All other values: return as string
          return value;
        },

        button_move_animation: function button_move_animation() {
          const btnWrap = this.findElement(".btn-wrapper");
          const btnCircle = this.findElement(".btn-item");
          if (btnWrap.length) {
            btnWrap.mousemove(function (e) {
              callParallax(e);
            });

            function callParallax(e) {
              parallaxIt(e, btnCircle, 80);
            }

            function parallaxIt(e, target, movement) {
              const relX = e.pageX - btnWrap.offset().left;
              const relY = e.pageY - btnWrap.offset().top;
              gsap.to(target, 0.5, {
                x: ((relX - btnWrap.width() / 2) / btnWrap.width()) * movement,
                y:
                  ((relY - btnWrap.height() / 2) / btnWrap.height()) * movement,
                ease: Power2.easeOut,
              });
            }

            btnWrap.mouseleave(function (e) {
              gsap.to(btnCircle, 0.5, {
                x: 0,
                y: 0,
                ease: Power2.easeOut,
              });
            });
          }

          // Button Hover Animation
          const btn_hover_all = this.findElement(".btn-hover-bgchange");
          if (btn_hover_all.length) {
            const newSpan = document.createElement("span");
            btn_hover_all.append(newSpan);
            btn_hover_all.on("mouseenter", function (e) {
              var x = e.pageX - $(this).offset().left;
              var y = e.pageY - $(this).offset().top;

              $(this).find("span").css({
                top: y,
                left: x,
              });
            });
            btn_hover_all.on("mouseout", function (e) {
              var x = e.pageX - $(this).offset().left;
              var y = e.pageY - $(this).offset().top;
              $(this).find("span").css({
                top: y,
                left: x,
              });
            });
          }
        },
      });

      elementorFrontend.hooks.addAction(
        "frontend/element_ready/widget",
        function ($scope) {
          elementorFrontend.elementsHandler.addHandler(Animation, {
            $element: $scope,
          });
        }
      );

      elementorFrontend.hooks.addAction(
        "frontend/element_ready/container",
        function ($scope) {
          elementorFrontend.elementsHandler.addHandler(Animation, {
            $element: $scope,
          });
        }
      );

      // Elementor 4 fires the generic 'frontend/element_ready/widget' on page
      // load; the per-type hooks above may never fire. Register a generic
      // fallback so handlers still attach to EMK widgets. Dedupe so the same
      // widget doesn't get multiple Animation instances stacked.
      const attachEmkAnimation = function ($scope) {
        if (!$scope || !$scope[0]) return;
        if (
          !$scope[0].classList.contains('emk--text') &&
          !$scope[0].classList.contains('emk--title') &&
          !$scope[0].querySelector('.emk--text') &&
          !$scope[0].querySelector('.emk--title')
        ) {
          return;
        }
        if ($scope[0].__emkAnimationBound) return;
        $scope[0].__emkAnimationBound = true;
        elementorFrontend.elementsHandler.addHandler(Animation, {
          $element: $scope,
        });
      };
      elementorFrontend.hooks.addAction(
        'frontend/element_ready/widget',
        attachEmkAnimation
      );
      ['heading', 'text-editor', 'emk--title', 'emk--text'].forEach(function(type) {
        elementorFrontend.hooks.addAction(
          'frontend/element_ready/' + type + '.default',
          attachEmkAnimation
        );
      });

    }

  }
  $(window).on("elementor/frontend/init", runOnElementorReady);
  // If elementorFrontend.hooks isn't ready yet (init event fired before
  // this script ran), wait until it's available, then run the body.
  const waitForElementor = function () {
    if (
      typeof elementorFrontend === "object" &&
      elementorFrontend.hooks &&
      !elementorFrontend.hooks.__emkAddonsExBound
    ) {
      elementorFrontend.hooks.__emkAddonsExBound = true;
      runOnElementorReady();
      return;
    }
    setTimeout(waitForElementor, 50);
  };
  waitForElementor();
})(jQuery);

function aaerefreshOnImageLoad() {
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    // if it’s already loaded, you can skip
    if (img.complete) return;
    img.addEventListener("load", () => {
      ScrollTrigger.refresh();
    });
  });
}

// run it on DOM ready (or after you inject triggers)
document.addEventListener("DOMContentLoaded", aaerefreshOnImageLoad);
