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
    'object_type',
    'object_html',
    'object_url',
    'object_width',
    'object_height'
  ];

  $.fn.addInputs = function(data, args){
    return $(this).each(function(){
      // Args!
      args = $.isArray(args)? args: default_args;

      var $this = $(this);

      // function
      $.each(args, function(i, key){

        var value = '';
        if (key.indexOf('object') === 0){
          var name = key.split('_')[1];
          if (data.object.hasOwnProperty(name)){
            value = data.object[name];
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