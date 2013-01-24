;(function($){

  var Thumb = function(elem, options){
    this.init(elem, options);
  };
  Thumb.prototype = {
    init : function (elem, options) {
      this.$elem = $(elem);
      this.options = $.extend({}, {onchange: $.noop}, options);

      // Thumbnail Controls
      this.$elem.find('.left').on('click', $.proxy(this.scroll, this));
      this.$elem.find('.right').on('click', $.proxy(this.scroll, this));
      this.$elem.find('.nothumb').on('click', $.proxy(this.nothumb, this));

      //Show hide the controls.
      this.$elem.one('mouseenter', function () {
        $(this).on('mouseenter mouseleave', function () {
          $(this).find('.controls').toggle();
        });
      });
    },
    scroll : function (e) {
      e.preventDefault();

      var images = this.$elem.find('.images');

      //Grabs the current 'left' style
      var width = parseInt(images.find('li').css('width'), 10);

      // Left
      var left = parseInt(images.css('left'), 10);
      //Gets the number of images
      var len = images.find('img').length * width;

      //General logic to set the new left value
      if ($(e.target).hasClass('left')) {
        left = parseInt(left, 10) + width;
        if (left > 0) {
          return false;
        }
      } else {
        left = parseInt(left, 10) - width;
        if (left <= -len) {
          return false;
        }
      }
      // Get the current image selected
      var thumb = images.find('img').eq((left / -width));

      // Callback
      this.options.onchange.call(thumb, thumb);

      // Sets the new left.
      images.css('left', left + 'px');
    },
    nothumb : function (e) {
      e.preventDefault();
      this.$elem.hide();
      // tell onchange that there is no thumb.
      this.options.onchange.call(null, null);
    }
  };
  $.fn.thumb = function(options){
    return $(this).each(function(){
      $(this).data('thumb', new Thumb(this, options));
    });
  };
})(jQuery);