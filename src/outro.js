
  //Set up the Preview Functions for jQuery
  $.fn.preview = function(options, callback){
    $(this).each(function(i,e){
      $.preview = new Preview($(this), options);
    });

    return this;
  }
})(jQuery);