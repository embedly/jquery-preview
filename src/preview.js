/*globals jQuery:true, sprintf:true*/

;(function($){


  // Bunch of randoms that we will use throughout
  var PreviewUtils = function(){};
  PreviewUtils.prototype = {
    protocolExp: /^http(s?):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i,
    urlExp : /[\-\w]+(\.[a-z]{2,})+(\S+)?(\/|\/[\w#!:.?+=&%@!\-\/])?/gi,
    secure: window.location.protocol === 'https:'? true:false,
    // Finds the first URL in the status, we only ever work on one.
    url: function(text){
      // Kill whitespace.
      text = $.trim(text);

      //ignore the status it's blank.
      if (text === '') {
        return null;
      }

      // Simple regex to make sure the url with a protocol is valid.
      var matches = text.match(this.protocolExp);

      // see if we have a url
      var url = matches? matches[0] : null;

      //No urls is the status. Try for urls without scheme i.e. example.com
      if (url === null) {
        matches = text.match(this.urlExp);
        url = matches ? 'http://'+matches[0] : null;
      }
      url = $.trim(url);

      if (url === ""){
        return null;
      }

      //Note that in both cases we only grab the first URL.
      return url;
    },
    none: function(obj){
      return (obj === null || obj === undefined);
    },
    image: function(url, options){
      if (this.none(url)){
        return url;
      }
      if (this.secure){
        return 'https://i.embed.ly/1/display?' + $.param({key:options.key, url:url});
      }
      return url;
    }
  };
  // We use this a bunch of places.
  var utils = new PreviewUtils();


  var render = function(data, options){
    var $elem = $(this);

    // Clone the data obj so we can add to it.
    var obj = $.extend(true, {}, data);
    obj.title = obj.title ? obj.title : obj.url;

    // If there is a favicon we should add it.
    var favicon = obj.favicon_url ? '<img class="favicon" src="%(favicon_url)s">': '';

    // Use Display proxy if we are on https.
    obj.favicon_url = utils.image(obj.favicon_url, options);
    var images = $.map(obj.images, function(i){
      i.src = utils.image(i.url, options);
      return sprintf('<li><img src="%(src)s" data-url="%(url)s"/></li>', i);
    }).join('');

    // add the thumbnail controls.
    if (images !== ''){
      images = ['<div class="thumb">',
        '<div class="controls">',
          '<a class="left" href="#">&#9664;</a>',
          '<a class="right" href="#">&#9654;</a>',
          '<a class="nothumb" href="#">&#10005;</a>',
        '</div>',
        '<div class="items">',
          '<ul class="images">',
            images,
          '</ul>',
        '</div>',
      '</div>'].join('');
    }

    // Create the final template.
    var attributes = [
      '<div class="attributes">',
        '<a class="title" href="#" contenteditable=true>%(title)s</a>',
        '<p><a class="description" href="#" contenteditable=true>%(description)s</a></p>',
        '<span class="meta">',
          favicon,
          '<a class="provider" href="%(provider_url)s">%(provider_display)s</a>',
        '</span>',
      '</div>',
      '<div class="action"><a href="#" class="close">&#10005;</a></div>'
      ].join('');

    // render the html.
    var html = [
      '<div class="selector">',
        images,
        sprintf(attributes, obj),
      '</div>'
    ].join('');

    // Figure out where to put it. If there is a contianer, then use that.
    var $wrapper = $elem.closest(options.container).find(options.wrapper).eq(0);

    if ($wrapper.length === 0){
      $wrapper = $(options.wrapper).eq(0);
    }

    // If we found a wrapper, use it.
    if ($wrapper.length !== 1){
      return false;
    }
    // Set the URL
    $wrapper.html($(html));

    // Add the thumb scroller.
    $wrapper.find('.thumb').thumb({
      onchange: function(elem){
        // Update the data.
        var val = null;
        if (!utils.none(elem)){
          val = $(elem).attr('data-url');
        }
        $elem.data('preview').thumbnail_url = val;
      }
    });

    // Add the blur on the title and description.
    $wrapper.find('.title').on('blur', function(e){
      $elem.data('preview').title = $(e.target).text();
    });
    $wrapper.find('.description').on('blur',function(e){
      $elem.data('preview').description = $(e.target).text();
    });

    // Binds the close button.
    $wrapper.find('.action .close').bind('click', $.proxy(function(e){
      // Let elem know that the selector was closed
      $elem.trigger('close');
      $wrapper.find('.selector').remove();
    }, this));

    // the close button.
    $wrapper.find('.selector').bind('mouseenter mouseleave', function () {
      $(this).find('.action').toggle();
    });

    // bind to the close event on the element.
    $elem.on('close', function(){
      $wrapper.find('.selector').remove();
    });
  };

  var defaults = {
    debug : false,
    bind : true,
    error: null,
    success: null,
    render: render,

    wrapper: '.selector-wrapper',
    container: 'form',
    field : null,
    query: {
      wmode : 'opaque',
      words : 30,
      maxwidth : 560
    }
  };

  var Preview = function(elem, options){
    this.init(elem, options);
  };

  Preview.prototype = {

    $form: null,
    data: {},

    init: function(elem, options){
      //set up the elem that we are working on.
      this.elem = elem;
      this.$elem = $(elem);

      // Helps us key track so we don't make duplicate requests.
      this.url = null;

      // If the elem is inside a form, add it here.
      var $form = this.$elem.parents('form').eq(0);
      if ($form.length === 1){
        this.$form = $form;
      }
      // Set up options.
      this.options = $.extend({}, defaults, options);

      // Allow people to do change the bind functionality.
      if (this.options.bind === true){
        // Attach events, proxy so "this" is correct.
        this.$elem.on('keyup', $.proxy(this.keyUp, this));
        this.$elem.on('paste', $.proxy(this.paste, this));
        this.$elem.on('blur', $.proxy(this.paste, this));
      }

      // Set the data attr.
      this.$elem.data('preview', {});

      // A couple of custom events.
      this.$elem.on('close', $.proxy(this.clear, this));
      this.$elem.on('clear', $.proxy(this.clear, this));
      this.$elem.on('preview', $.proxy(this.fetch, this));

      // Update the preview data.
      this.$elem.on('update', $.proxy(function(e, name, value){
        this.$elem.data('preview')[name] = value;
      }, this));

    },
    log: function(){
      if (this.options.debug  && window.console){
        window.console.log(Array.prototype.slice.call(arguments));
      }
    },
    // data upkeep.
    update: function(key, value){
      var data = this.$elem.data('preview');
      data[key] = value;
    },
    clear: function(){
      this.$elem.data('preview', {});
    },
    /* EVENTS */
    keyUp : function (e) {
      // Only respond to keys that insert whitespace (spacebar, enter) or
      // on delete 8.
      if (e.which !== 32 && e.which !== 13 && e.which !== 8) {
        return null;
      }
      //See if there is a url in the status textarea
      var url = utils.url(this.$elem.val());
      this.log('onKeyUp url:'+url);
      if (url === null) {
        // Close the selector
        this.$elem.trigger('close');
        return null;
      }
      // If there is a url, then we need to unbind the event so it doesn't fire
      // again. This is very common for all status updaters as otherwise it
      // would create a ton of unwanted requests.
      //this.$elem.off('keyup');

      //Fire the fetch metadata function
      this.fetch(url);
    },
    paste : function (e) {
      //We delay the fire on paste.
      setTimeout($.proxy(function(){
        this.fetch();
      }, this), 200);
    },
    /* AJAX */
    fetch: function(url){
      if ($.type(url) !== "string"){
        url = utils.url(this.$elem.val());
      }
      this.log(url);

      if (url === null || this.url === url){
        return false;
      }
      // Close the old selector if there was one.
      this.$elem.trigger('close');

      // Let's us know what URL we are currently working on.
      this.url = url;

      // Trigger loading.
      this.$elem.trigger('loading');

      // use Embedly jQuery to make the call.
      $.embedly.extract(url, {
        key: this.options.key,
        query : this.options.query
      }).progress($.proxy(this._callback,this));
    },
    error: function(obj){
      // By default Preview does nothing for error cases. If you would
      // like to do something else, you should overwrite this funciton.
      if (this.options.error !== null){
        $.proxy(this.options.error, this.elem)(obj);
      }
    },
    _callback: function(obj){
      // Here is where you actually care about the obj
      this.log(obj);

      // Trigger loaded
      this.$elem.trigger('loaded');

      // Every obj should have a 'type'. This is a clear sign that
      // something is off. This is a basic check to make sure we should
      // proceed. Generally will never happen.
      if (!obj.hasOwnProperty('type')) {
        this.log('Embedly returned an invalid response');
        this.error(obj);
        return false;
      }

      // Error. If the url was invalid, or 404'ed or something else. The
      // endpoint will pass back an obj  of type 'error'. Generally this is
      // were the default workflow should happen.
      if (obj.type === 'error') {
        this.log('URL ('+obj.url+') returned an error: '+ obj.error_message);
        this.error(obj);
        return false;
      }

      // Malicious URL.
      if (!obj.safe) {
        this.log('URL ('+obj.url+') was deemed unsafe: ' + obj.safe_message);
        this.error(obj);
        return false;
      }

      // Generally you only want to handle preview objs that are of type
      // `html` or `image`. Others could include `ppt`,`video` or `audio`
      // which I don't believe you have a good solution for yet. We could
      // wrap them in HTML5 tags, but won't work cross browser.
      if (!(obj.type in {'html':'', 'image':''})) {
        this.log('URL ('+obj.url+') returned a type ('+obj.type+') not handled');
        this.error(obj);
        return false;
      }

      // set the thumb to the first url
      if (obj.images.length > 0){
        obj['thumbnail_url'] = obj.images[0].url;
      }

      // We put the object into data, so we can use it elsewhere.
      this.$elem.data('preview', obj);

      // Create a selector to render the bad boy.
      $.proxy(this.options.render, this.elem)(obj, this.options);

      if (this.options.success !== null){
        $.proxy(this.options.success, this.elem)(obj);
      }

      this.log('done', obj);
    }
  };

  //Set up the Preview Functions for jQuery
  $.fn.preview = function(options, callback){
    return $(this).each(function(i,e){
      new Preview(this, options);
    });
  };
})(jQuery, window, document);
