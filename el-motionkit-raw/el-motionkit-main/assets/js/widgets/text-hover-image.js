(function ($) {
  /**
   * Text Hover Image - cursor-follow image reveal
   */
  function initTextHoverImage() {
    $('.emk--text-hover-image .hover_text').each(function () {
      var hover_text = this;
      if (hover_text._emkInitialized) return;
      hover_text._emkInitialized = true;
      
      hover_text.addEventListener("mousemove", function (event) {
        var contentBox = hover_text.getBoundingClientRect();
        var dx = event.clientX - contentBox.x;
        var dy = event.clientY - contentBox.y;
        if (hover_text.children[0]) {
          hover_text.children[0].style.transform = "translate(" + dx + "px, " + dy + "px)";
        }
      });
    });
  }

  // Run on Elementor frontend init (if not yet fired)
  $(window).on('elementor/frontend/init', function () {
    elementorFrontend.hooks.addAction('frontend/element_ready/emk--t-h-image.default', function ($scope) {
      initTextHoverImage();
    });
  });

  // Also run immediately on DOM ready
  $(function () {
    initTextHoverImage();
  });
})(jQuery);
