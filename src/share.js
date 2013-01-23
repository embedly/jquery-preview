;(function(){
  // Handles the thumbs fun things.

  defaults = {
    onchange: $.noop
  }
  var Thumb = function(elem, options){
    this.init(elem, options);
  };
  Thumb.prototype = {
    init : function (elem, options) {
      this.$elem = $(elem);
      this.options = $.extend({}, defaults, options);

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
      this.options.onchange.call(null, null)
    },
  };
  $.fn.thumb = function(options){
    return $(this).each(function(){
      $(this).data('thumb', new Thumb(this, options));
    });
  };
})(jQuery);


;(function($){
  // Bunch of randoms that we will use throughout
  var PreviewUtils = function(){};
  PreviewUtils.prototype = {
    protocolExp: /^http(s?):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i,
    urlExp : /[-\w]+(\.[a-z]{2,})+(\S+)?(\/|\/[\w#!:.?+=&%@!\-\/])?/gi,

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
      return url
    },
    none: function(obj){
      return (obj === null || obj === undefined)
    }

  }
  // We use this a bunch of places.
  utils = new PreviewUtils();

  var Selector = function(){};

  Selector.prototype = {

    template: ['<div class="selector">',
      '%(image_html)s',
      '<div class="attributes">',
        '{{>attributes}}',
        '<span class="meta">',
          '{{>favicon}}',
          '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
        '</span>',
      '</div>',
      '<div class="action"><a href="#" class="close">&#10005;</a></div>',
    '</div>'].join(''),
    render: function($elem, data, preview, options){
      // We use simple sprintf to create this, you however should use something
      // like Mustache or Handlebars.
      this.preview = preview;

      // Clone the data obj so we can add to it.
      var obj = $.extend(true, {}, data);
      obj.title = obj.title ? obj.title : obj.url;

      // If there is a favicon we should add it.
      var favicon = obj.favicon_url? '<img class="favicon" src="%(favicon_url)s">': '';
      var images = obj.images.map(function(i){return sprintf('<li><img src="%(url)s"/></li>', i)}).join('');

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
        '</div>'].join('')
      }

      // Create the final template.
      var template = ['<div class="selector">',
        images,
        '<div class="attributes">',
          '<a class="title" href="#" contenteditable=true>%(title)s</a>',
          '<p><a class="description" href="#" contenteditable=true>%(description)s</a></p>',
          '<span class="meta">',
            favicon,
            '<a class="provider" href="%(provider_url)s">%(provider_display)s</a>',
          '</span>',
        '</div>',
        '<div class="action"><a href="#" class="close">&#10005;</a></div>',
      '</div>'].join('');

      // render the html.
      var html = sprintf(template, obj);

      // Figure out where to put it.
      var $wrapper = $elem.closest('form').find(options.selector).eq(0);

      if ($wrapper.length === 0){
        $wrapper = $('.selector-wrapper').eq(0);
      }

      // If we found a wrapper, use it.
      if ($wrapper.length !== 1){
        return false;
      }
      // Set the URL
      $wrapper.html($(html));

      // Add the thumb scroller.
      $wrapper.find('.thumb').thumb({
        onchange: $.proxy(function(elem){
          if (utils.none(elem)){
            this.preview.update('thumbnail_url', null);
          } else {
            this.preview.update('thumbnail_url', $(elem).attr('src'));
          }
        }, this)
      });

      // Add the blur on the title and description.
      $wrapper.find('.title').on('blur', $.proxy(function(e){
        this.preview.update('title', $(e.target).text());
      }, this));
      $wrapper.find('.description').on('blur', $.proxy(function(e){
        this.preview.update('description', $(e.target).text());
      }, this));

      // Binds the close button.
      $wrapper.find('.action .close').bind('click', $.proxy(function(e){
        this.preview.close();
        $wrapper.find('.selector').remove();
      }, this));

      // the close button.
      $wrapper.find('.selector').bind('mouseenter mouseleave', function () {
        $(this).find('.action').toggle();
      });

      // bind to the close event on the element.
      $elem.on('close', $.proxy(function(){
        this.preview.clear();
        $wrapper.find('.selector').remove();
      }, this));
    }
  };

  var defaults =  {
    debug : true,
    selector : {
      selector: '.selector-wrapper'
    },
    preview : {},
    field : null,
    query: {
      wmode : 'opaque',
      words : 30,
      maxwidth : 560
    }
  }

  var Preview = function(elem, options){
    this.init(elem, options);
  }

  Preview.prototype = {

    $form: null,
    data: {},

    init: function(elem, options){
      //set up the elem that we are working on.
      this.elem = elem;
      this.$elem = $(elem);

      // If the elem is inside a form, add it here.
      $form = this.$elem.parents('form').eq(0);
      if ($form.length === 1){
        this.$form = $form;
      }
      // Set up options.
      this.options = $.extend({}, defaults, options);

      // Attach events, proxy so "this" is correct.
      this.$elem.on('keyup', $.proxy(this.keyUp, this));
      this.$elem.on('paste', $.proxy(this.paste, this));
      this.$elem.on('blur', $.proxy(this.paste, this));
      this.$elem.data('preview', {});
    },
    log: function(){
      if (this.options.debug  && window.console){
        console.log(Array.prototype.slice.call(arguments));
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
      // Only respond to keys that insert whitespace (spacebar, enter)
      if (e.which !== 32 && e.which !== 13) {
        return null;
      }
      //See if there is a url in the status textarea
      var url = utils.url(this.$elem.val());
      if (url === null) {
        return null;
      }
      this.log('onKeyUp url:'+url);

      // If there is a url, then we need to unbind the event so it doesn't fire
      // again. This is very common for all status updaters as otherwise it
      // would create a ton of unwanted requests.
      this.$elem.off('keyup');

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
      if (url === undefined){
        url = utils.url(this.$elem.val());
      }
      this.log(url);

      if (url === null || this.data.original_url === url){
        return false;
      }

      // use Embedly jQuery to make the call.
      $.embedly.preview(url, {
        key: this.options.key,
        query : this.options.query
      }).progress($.proxy(this._callback,this));
    },
    error: function(obj){
      // By default Preview does nothing for error cases. If you would
      // like to do something else, you should overwrite this funciton.
    },
    _callback: function(obj){
      // Here is where you actually care about the obj
      this.log(obj);

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
        log('URL ('+obj.url+') was deemed unsafe: ' + obj.safe_message);
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
      console.log(this.$elem, this.$elem.data('preview'))

      // Create a selector to render the bad boy.
      var selector = new Selector();
      selector.render(this.$elem, obj, this, this.options.selector);

      this.log('done', obj);
    }
  };

  //Set up the Preview Functions for jQuery
  $.fn.preview = function(options, callback){
    return $(this).each(function(i,e){
      new Preview(this, options);
    });
  };
})(jQuery);