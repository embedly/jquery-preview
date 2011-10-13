
  //Set up the Preview Functions for jQuery
  $.fn.preview = function(options, callback){
    $.preview = new Preview(this, options);
    return this;
  }
})(jQuery);