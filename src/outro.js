
  // Sets up an initial $.preview for use before the form is initialized.
  // Useful for early access to display if needed.
  $.preview = new Preview(null, {});

  //Set up the Preview Functions for jQuery
  $.fn.preview = function(options, callback){
    $(this).each(function(i,e){
      $.preview = new Preview($(this), options);
    });

    return this;
  }
})(jQuery);