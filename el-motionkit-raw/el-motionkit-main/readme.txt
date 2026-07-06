=== El MotionKit - GSAP Powered Elementor Addons ===
Contributors: detheme
Tags: Elementor, Elementor Addons, GSAP, Animation, Motion
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 2.5.1
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Elementor motion widgets and GSAP-powered frontend effects for lightweight interactive websites.

== Description ==

El MotionKit provides Elementor widgets and motion-focused frontend effects for WordPress sites. It focuses on animation widgets, sliders, text effects, and motion-ready content components.

This plugin is a fork / from-scratch modification of the Animation Addons for Elementor codebase by Wealcoder / Amelia Rose. The free Animation Addons for Elementor is licensed under GPL v2; portions of El MotionKit are derived from that codebase and remain under the same license. Animation Addons Pro is a separate commercial product by Wealcoder; portions of El MotionKit that originally derived from the commercial Pro product have been removed or rewritten from scratch against the public Elementor 4 controls API and the GSAP 3 documentation. No proprietary code from the commercial Pro product ships with El MotionKit.

Original copyright (c) 2024, Wealcoder / Amelia Rose.
Modifications (c) 2025, deTheme.

== Included Features ==

* Animated Title widget with optional prefix and inline highlight.
* Animated Text widget (Elementor native heading and text-editor also supported).
* Marquee widget (GSAP linear infinite scroll, no Swiper).
* Text Hover Image widget (cursor-follow reveal).
* Text Animation extension for Elementor widgets: character, word, text_move, text_reveal, text_scale, text_invert, 3D spin.
* Image Animation extension: reveal, scale, stretch.
* Glassmorphism extension for Elementor containers.
* Clean Motion Controls: mouse move, cursor hover, horizontal scroll, parallax, hover image, pin element.
* GSAP, ScrollTrigger, ScrollSmoother runtime support.
* Custom CSS extension.

== Not Included ==

* The draw-svg widget (the original derived from the commercial Animation Addons Pro draw-svg widget; the equivalent functionality in El MotionKit, if needed, should be built with the public DrawSVGPlugin directly).
* Timeline / keyframe builder modules.
* Remote site / section import services.
* Marketplace dashboard UI.
* Commercial license server or proprietary updater integration.
* Premium-only modules or bundles from Animation Addons Pro.

== External Services ==

This release does not call legacy vendor or remote import APIs. Some widgets may connect to third-party services only when a site owner explicitly configures that widget, for example a form or email marketing integration. No such connection is made by default.

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/` or install the ZIP through WordPress.
2. Activate El MotionKit from the Plugins screen.
3. Open Elementor and add El MotionKit widgets to a page.

== Changelog ==



= 2.4.11 =
* Fixed `Trait "EMK\EMK_Extension_Widgets_Trait" not found` fatal error on fresh installs. The trait file exists at `inc/EMK_Extension_Widgets_Trait.php` but was never explicitly loaded before `class-plugin.php` parsed it. PHP’s `use` statement doesn’t trigger autoloading — the trait must already be in scope at parse time. The plugin now preloads the trait with `require_once __DIR__ . '/inc/EMK_Extension_Widgets_Trait.php';` immediately before `class-plugin.php`. Dev environments mask the bug because opcache caches the file after a successful request — but the very first request on a fresh install still failed.

= 2.4.10 =
* Marquee separator icon now displays on the frontend. Elementor 4.1 only enqueues Font Awesome CSS in the editor (`elementor/editor/after_enqueue_styles`), not on the frontend. The Marquee widget's default separator icon (`far fa-star`) needs the FA stylesheet to render its glyph; without it the `<i>` element shows as an empty box. EMK now enqueues Elementor's bundled FA 5 stylesheet (`assets/lib/font-awesome/css/all.min.css`) on the frontend so the separator and any future FA-icon controls render correctly. No extra font is shipped — we reuse Elementor's own asset path.
* Marquee speed slider now saves correctly. The `speed_pps` Number control previously had `render_type => 'none'`, which told Elementor not to store the value in the post meta. Removed that flag so the user's speed setting persists in `_elementor_data` and is read by `marquee.js` on every page load. (Direction, edge fade, pause-on-hover were already saving correctly.)

= 2.4.9 =
* Marquee density fix. Render the items THREE times instead of two so the track is 3 * (single-copy-width). The GSAP timeline still scrolls exactly one copy width per cycle, so all three copies move together with no visual seam. With three copies the viewport always shows full-opacity text from at least one copy — eliminates the perceived empty space when the edge-fade mask crosses the boundary between end of one copy and start of the next. The edge-fade width was also reduced from 40 px to 12 px because the wider mask is no longer needed. The JS now reads the copy count from the `data-emk-marquee.copies` attribute and divides `scrollWidth` by that count for an accurate single-copy measurement.

= 2.4.8 =
* Replaced the Swiper-based Brand Slider widget with a new **Marquee** widget. Rendered name is "Marquee" (was "Brand Slider"). File `widgets/brand-slider.php` renamed to `widgets/marquee.php`, class `Brand_Slider` renamed to `Marquee`. CSS class `emk--brand-slider` renamed to `emk--marquee` (and sub-classes `emk--brand-text` to `emk--marquee-text`, `emk--brand-text-item` to `emk--marquee-text-item`, `emk--brand-separator` to `emk--marquee-separator`).
* Animation is now a pure GSAP `fromTo` timeline that scrolls the track by exactly one copy width per cycle and loops with no seam (linear easing, no stop between slides). The Swiper dependency is gone: `get_script_depends()` no longer returns `'swiper'`.
* Each text item now uses `width: max-content` and `white-space: nowrap` so a long text stays on a single line and a short text stays short — no forced equalisation across items.
* New controls: Animation Speed (px/s, default 80), Direction (left/right), Pause on Hover, Edge Fade (soft mask at both ends).
* New `assets/js/widgets/marquee.js` initialises the GSAP timeline and handles tab visibility, hover pause, and window resize re-init. Replaces the old `slider.js` (deleted).
= 2.4.7 =
* Fixed widget icons that previously rendered as empty boxes in the Elementor editor. The `get_icon()` return value is now an `eicon-*` class (e.g. `eicon-animation-text`, `eicon-t-letter`, `eicon-carousel`, `eicon-image-rollover`) followed by the `wcf` class. The first class triggers Elementor's built-in `eicons` font (its global rule matches `[class^=eicon]` and applies the right font-family), and the `wcf` class triggers the EMK logo badge overlay (`.elementor-panel .elementor-element .icon .wcf::after` in `editor.min.css`). The previous setup returned a non-`eicon-*` class (`emk-icon-*` from a custom icomoon font) which Elementor's global selector did not match, so no glyph was rendered.
* Removed the bundled `emk-icons` font-face and the per-icon `emk-icon-*::before` glyph definitions from `editor.css` / `editor.min.css`. The four widgets now reuse Elementor's `eicons` font directly.
* Renamed the icon class in `config.php` from `emk-icon-*` to `eicon-*` to match the new approach.
= 2.4.6 =
* Renamed the Elementor widget category key from `emk` (in widget `get_categories()`) and `emk-single` (in category registration) to a single consistent `el-motion-kit`. Previously widgets fell into Elementor's fallback category because the two keys did not match. The category title "El Motion Kit" and all widgets (Animated Text, Animated Title, Brand Slider, Text Hover Image) now appear under that category in the Elementor editor sidebar.
* Rewrote `widgets/brand-slider.php` and `inc/trait-emk-slider.php` from scratch against the public Elementor 4 and Swiper 8 documentation. Removed dead code (the old `slider_controls()` private method duplicated the trait), removed the unused `enable_grid` / `grid_rows` controls and the unused `ts-navigation` / `ts-pagination` CSS class names, and adopted a smaller, focused class structure (`emk--brand-slider`, `emk--brand-text`, `emk--brand-text-item`, `emk--brand-separator`). Existing saved widget data is fully backwards compatible.
* Renamed residual AAE / WCF identifiers in PHP and JS to EMK equivalents (aae--slider-* prefix classes, wcf/widgets/slider filter, aae-disable-transition, aaeinitSmoother, wcf_pin_scrub_number, wcf_enable_animation_editor, wcf--form-wrapper, wcf--countdown).
= 2.4.5 =
* Removed the draw-svg widget and the bundled gsap-draw.js handler. The widget was derived from the commercial Animation Addons Pro; use the public DrawSVGPlugin directly if you need that effect.
* Rewrote the text-animation effects extension (inc/extensions/emk-text-animation-effects.php) from scratch against the public Elementor 4 controls API.
* Rewrote the image-animation effects extension (inc/extensions/emk-image-animation-effects.php) from scratch against the public Elementor 4 controls API.
* Removed AAE Pro derived handlers from emk-addons-ex.js (PinArea, emk_popup, video mask, video popup, video box) and the AAE-derived prefix classes / filter names.
* Renamed residual AAE / WCF identifiers in PHP and JS to EMK equivalents (aae--slider-* prefix classes, wcf/widgets/slider filter, aae-disable-transition, aaeinitSmoother, wcf_pin_scrub_number, wcf_enable_animation_editor, wcf--form-wrapper, wcf--countdown).
* Added emk_scrub_number and emk_animation_editor setting keys to the text-animation extension so the frontend editor preview can be enabled without depending on AAE-only settings.
* Updated plugin header and this readme to clearly credit both the GPL-licensed Animation Addons for Elementor and the commercial Animation Addons Pro as upstream sources for the original codebase.

= 2.3.7-emk-clean =
* Removed legacy premium catalog entries and inactive premium feature listings.
* Removed bundled premium frontend/editor assets and removed builder references.
* Removed remote import services, marketplace screens, and vendor API claims.
* Kept GPL attribution for the original free Animation Addons for Elementor codebase.
* Verified frontend smoke page with active widgets and sliders.
