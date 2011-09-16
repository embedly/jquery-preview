  //Add to jQuery
  $.fn.preview = function(options, callback){
    $.preview = Preview(this, options);
    return this;
  }
})(jQuery);