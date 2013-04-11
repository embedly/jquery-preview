/*globals jQuery:true, sprintf:true, escape:true*/
// Simple util to add embedly data to the form as hidden inputs.
;(function($){

  var default_args = [
    'original_url',
    'url',
    'type',
    'provider_url',
    'provider_display',
    'provider_name',
    'favicon_url',
    'title',
    'description',
    'thumbnail_url',
    'author_name',
    'author_url',
    'media_type',
    'media_html',
    'media_width',
    'media_height'
  ];

  $.fn.addInputs = function(data, args){
    return $(this).each(function(){
      // Args!
      args = $.isArray(args)? args: default_args;

      var $this = $(this);

      // function
      $.each(args, function(i, key){

        var value = '';
        if (key.indexOf('media') === 0){
          var name = key.split('_')[1];
          if (data.media.hasOwnProperty(name)){
            value = data.media[name];
          }
        } else if (data.hasOwnProperty(key)){
          value = data[key];
        }

        var $input = $('<input type="hidden"/>').attr({
          name: key,
          value: escape(value)
        });

        $this.append($input);
      });
    });
  };
})(jQuery, window, document);