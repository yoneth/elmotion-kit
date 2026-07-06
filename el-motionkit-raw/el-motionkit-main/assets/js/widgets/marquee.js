/*!
 * El MotionKit — Marquee widget frontend.
 *
 * Replaces Swiper with a pure GSAP timeline that scrolls the track
 * from x:0 to x:-trackWidth at a constant speed and loops with no
 * visible seam. Each text item keeps its intrinsic width (no
 * equalisation), so the marquee looks natural regardless of text
 * length.
 *
 * Triggered by Elementor's `frontend/element_ready/emk--marquee.default`
 * hook. Re-runs on `resize` so the timeline re-measures if the
 * container width changes (Elementor responsive controls).
 *
 * Edge cases:
 *   - Tab hidden  -> tween paused (saves GPU).
 *   - Hover       -> tween paused (only when pause_on_hover setting
 *                    is on).
 *   - Resize      -> tween killed and rebuilt with new measurements.
 *   - direction=right -> tween reverses direction.
 */
( function ( $ ) {
	'use strict';

	var DEFAULTS = {
		// Pixels per second the track scrolls.
		speed_pps: 80,
		// 'left' (default) or 'right'.
		direction: 'left',
		// Pause on hover.
		pause: false,
		// Linear is the only easing we use — sampeyan asked for
		// continuous linear motion with no easing in/out.
		ease: 'none',
		// Pause the tween when the document tab is hidden.
		respect_tab_visibility: true,
	};

	/**
	 * Read the marquee data-attribute off the wrapper.
	 *
	 * @param {jQuery} $wrapper
	 * @return {Object}
	 */
	function read_settings( $wrapper ) {
		var raw = $wrapper.attr( 'data-emk-marquee' );
		if ( ! raw ) {
			return DEFAULTS;
		}
		try {
			return $.extend( {}, DEFAULTS, JSON.parse( raw ) );
		} catch ( e ) {
			return DEFAULTS;
		}
	}

	/**
	 * Measure the items.
	 *
	 * The widget render() duplicates the items in the track, so the
	 * total scrollWidth is roughly 2 * (sum of one copy). We want to
	 * scroll exactly one copy width per cycle for a seamless loop.
	 *
	 * @param {HTMLElement} trackEl
	 * @return {number} single copy width in px, or 0 if not measurable
	 */
	function measure_single_copy_width( trackEl ) {
		// The widget render() duplicates the items three times so the
		// track has 3 * (single-copy-width). The cleanest measurement is
		// track.scrollWidth / 3, which is independent of how the items
		// are styled (padding, border, gap). We also read the copy count
		// from data-emk-marquee so the right divisor is used even if the
		// data attribute is stale.
		var scroll = trackEl.scrollWidth;
		var copies = parseInt( trackEl.parentElement.parentElement.getAttribute( 'data-emk-marquee' ) || '3', 10 );
		if ( ! copies || copies < 1 ) copies = 3;
		if ( scroll && scroll > 0 ) {
			var children = trackEl.children;
			var expected = children.length / copies;
			if ( children.length >= copies && Math.abs( scroll - copies * sum_children_copy_width( children, expected ) ) > 4 ) {
				// scrollWidth disagrees with the children sum — prefer the
				// children sum so the loop aligns with rendered items.
				return sum_children_copy_width( children, expected );
			}
			return Math.round( scroll / copies );
		}
		return sum_children_copy_width( trackEl.children, Math.floor( trackEl.children.length / copies ) );
	}

	/**
	 * Sum the widths of the first `expected_per_copy` children.
	 *
	 * NOTE: getBoundingClientRect().width on a flex item with padding-right
	 * ALREADY includes the padding. Adding padding again would double-count
	 * the gaps between items, so we just sum the rendered widths.
	 *
	 * @param {HTMLCollection|NodeList} children
	 * @param {number} per_copy
	 * @return {number}
	 */
	function sum_children_copy_width( children, per_copy ) {
		if ( ! children || ! children.length || ! per_copy ) {
			return 0;
		}
		var width = 0;
		for ( var i = 0; i < per_copy; i++ ) {
			width += children[ i ].getBoundingClientRect().width;
		}
		return Math.round( width );
	}


	/**
	 * Build and start the GSAP timeline.
	 *
	 * @param {jQuery} $scope
	 */
	function init_marquee( $scope ) {
		if ( typeof window.gsap === 'undefined' ) {
			return;
		}

		var wrapper = $scope.find( '.emk--marquee' ).first();
		if ( ! wrapper.length ) {
			return;
		}
		var track = wrapper.find( '.emk--marquee-track' ).first();
		if ( ! track.length ) {
			return;
		}

		// Kill any previous timeline on this scope so re-init on
		// resize / hot-reload doesn't stack.
		if ( track[ 0 ]._emkMarqueeTween ) {
			track[ 0 ]._emkMarqueeTween.kill();
			track[ 0 ]._emkMarqueeTween = null;
		}
		// Reset transform in case a previous run left it shifted.
		gsap.set( track[ 0 ], { x: 0, clearProps: 'transform' } );

		var settings = read_settings( wrapper );

		var single_copy = measure_single_copy_width( track[ 0 ] );
		if ( single_copy <= 0 ) {
			// Empty track or all items hidden; nothing to animate.
			return;
		}

		// Duration in seconds so that the track crosses one full
		// copy width at the requested speed. Linear -> no easing.
		var duration = single_copy / Math.max( 1, settings.speed_pps );

		// Direction: 'left' means the track moves to the left, which
		// in CSS terms is x: 0 -> x: -single_copy. For 'right' we
		// go the other way: x: -single_copy -> x: 0.
		var fromX = ( 'right' === settings.direction ) ? -single_copy : 0;
		var toX   = ( 'right' === settings.direction ) ? 0 : -single_copy;

		// Animate from -> to. Use a single tween + repeat: -1 so
		// the seam is exactly the boundary between -single_copy and
		// 0 (the second copy takes over). Linear keeps speed
		// constant.
		// Animate from -> to. Use a single tween + repeat: -1 so
		// the seam is exactly the boundary between -single_copy and
		// 0 (the second copy takes over). Linear keeps speed
		// constant. We nudge -1px to absorb any sub-pixel rounding so
		// the second copy starts 1px before the visible edge — no gap.
		var tween = gsap.fromTo(
			track[ 0 ],
			{ x: fromX },
			{
				x: toX,
				duration: duration,
				ease: settings.ease,
				repeat: -1,
				force3D: true,
			}
		);

		track[ 0 ]._emkMarqueeTween = tween;

		// Pause-on-hover.
		if ( settings.pause ) {
			wrapper.on( 'mouseenter.emk-marquee', function () {
				tween.pause();
			} );
			wrapper.on( 'mouseleave.emk-marquee', function () {
				tween.resume();
			} );
		}

		// Tab visibility.
		if ( settings.respect_tab_visibility ) {
			// Use a namespaced handler so we can clean it up on re-init.
			$( document ).on(
				'visibilitychange.emk-marquee-' + wrapper.attr( 'data-id' ),
				function () {
					if ( document.hidden ) {
						tween.pause();
					} else {
						tween.resume();
					}
				}
			);
		}
	}

	/**
	 * Re-measure and re-init. Called on window resize.
	 */
	function reinit_marquees() {
		$( '.emk--marquee' ).each( function () {
			var wrapper = $( this );
			var track = wrapper.find( '.emk--marquee-track' );
			if ( ! track.length ) {
				return;
			}
			// Find the parent .elementor-element scope to call init.
			var scope = wrapper.closest( '.elementor-element' );
			if ( scope.length ) {
				init_marquee( scope );
			}
		} );
	}

	// Elementor frontend hook. The widget name is `emk--marquee`.
	$( window ).on( 'elementor/frontend/init', function () {
		elementorFrontend.hooks.addAction(
			'frontend/element_ready/emk--brand-slider.default',
			function ( $scope ) {
				init_marquee( $scope );
			}
		);
	} );

	// Re-init on resize. Debounced so we don't rebuild on every
	// pixel of a window drag.
	var resize_timer = null;
	$( window ).on( 'resize.emk-marquee', function () {
		clearTimeout( resize_timer );
		resize_timer = setTimeout( reinit_marquees, 200 );
	} );

} )( jQuery );
