/*globals jQuery:true, sprintf:true*/
;(function($){

  var Thumb = function(elem, options){
    this.init(elem, options);
  };
  Thumb.prototype = {
    init : function (elem, options) {
      this.$elem = $(elem);
      this.options = $.extend({}, {preview:null, onchange: $.noop}, options);

      // Thumbnail Controls
      this.$elem.find('.controls .left').on('click', $.proxy(this.left, this));
      this.$elem.find('.controls .right').on('click', $.proxy(this.right, this));
      this.$elem.find('.controls .nothumb').on('click', $.proxy(function(e){
        e.preventDefault();
        this.$elem.hide();
      }, this));

      // Bind triggers so that we can have other elements controller the scroll
      // and none selectors
      this.$elem.on('right', $.proxy(this.right, this));
      this.$elem.on('left', $.proxy(this.left, this));

      // Keep track of everything when we show and hide the thumbnail_url
      this.$elem.on('hide', $.proxy(this.hide, this));
      this.$elem.on('show', $.proxy(this.show, this));

      //Show hide the controls.
      this.$elem.one('mouseenter', function () {
        $(this).on('mouseenter mouseleave', function () {
          $(this).find('.controls').toggle();
        });
      });

      // set some data on the thumb so that we can use it later on.
      this.$elem.data('length', this.$elem.find('.images li').length);
      this.$elem.data('current', 1);
    },
    left: function(e){
      e.preventDefault();
      this.scroll(-1);
    },
    right: function(e){
      e.preventDefault();
      this.scroll(1);
    },
    update: function(img){
      if (img === undefined){
        img = null;
      }
      this.options.onchange.call(img, img);
    },
    scroll : function (dir) {
      var images = this.$elem.find('.images');

      //Grabs the current 'left' style
      var width = parseInt(images.find('li').css('width'), 10);

      // Left
      var left = parseInt(images.css('left'), 10);
      //Gets the number of images
      var len = images.find('img').length * width;

      //General logic to set the new left value
      if (dir < 0) {
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
      // Set the current thumb.
      var current = this.$elem.data('current');
      this.$elem.data('current', current+dir);

      // Get the current image selected
      var thumb = images.find('img').eq((left / -width)).get(0);

      // Callback
      this.update(thumb);

      // Sets the new left.
      images.css('left', left + 'px');
    },
    hide : function (e) {
      // tell onchange that there is no thumb.
      this.$elem.hide();
      this.update(null);
    },
    show: function(){
      this.$elem.show();
      // Reset the current URL
      var current = this.$elem.data('current');
      var img = this.$elem.find('.images img').eq(current-1).get(0);

      // tell onchange that there is a thumb
      this.update(img);
    }

  };
  $.fn.thumb = function(options){
    return $(this).each(function(){
      $(this).data('thumb', new Thumb(this, options));
    });
  };
})(jQuery);