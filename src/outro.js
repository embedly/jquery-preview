
  //Set up the Preview Functions for jQuery
  $.fn.preview = function(options, callback){
    $.p = Preview(this, options);
    return this;
  }
})(jQuery);