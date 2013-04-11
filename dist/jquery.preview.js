/*! jQuery Preview - v0.3.1 - 2013-04-11
* https://github.com/embedly/jquery-preview
* Copyright (c) 2013 Sean Creeley; Licensed BSD */
;(function($){
/**
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
**/

var sprintf = (function() {
  function get_type(variable) {
    return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
  }
  function str_repeat(input, multiplier) {
    for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
    return output.join('');
  }

  var str_format = function() {
    if (!str_format.cache.hasOwnProperty(arguments[0])) {
      str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
    }
    return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
  };

  str_format.format = function(parse_tree, argv) {
    var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
    for (i = 0; i < tree_length; i++) {
      node_type = get_type(parse_tree[i]);
      if (node_type === 'string') {
        output.push(parse_tree[i]);
      }
      else if (node_type === 'array') {
        match = parse_tree[i]; // convenience purposes only
        if (match[2]) { // keyword argument
          arg = argv[cursor];
          for (k = 0; k < match[2].length; k++) {
            if (!arg.hasOwnProperty(match[2][k])) {
              throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
            }
            arg = arg[match[2][k]];
          }
        }
        else if (match[1]) { // positional argument (explicit)
          arg = argv[match[1]];
        }
        else { // positional argument (implicit)
          arg = argv[cursor++];
        }

        if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
          throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
        }
        switch (match[8]) {
          case 'b': arg = arg.toString(2); break;
          case 'c': arg = String.fromCharCode(arg); break;
          case 'd': arg = parseInt(arg, 10); break;
          case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
          case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
          case 'o': arg = arg.toString(8); break;
          case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
          case 'u': arg = Math.abs(arg); break;
          case 'x': arg = arg.toString(16); break;
          case 'X': arg = arg.toString(16).toUpperCase(); break;
        }
        arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
        pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
        pad_length = match[6] - String(arg).length;
        pad = match[6] ? str_repeat(pad_character, pad_length) : '';
        output.push(match[5] ? arg + pad : pad + arg);
      }
    }
    return output.join('');
  };

  str_format.cache = {};

  str_format.parse = function(fmt) {
    var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
    while (_fmt) {
      if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
        parse_tree.push(match[0]);
      }
      else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
        parse_tree.push('%');
      }
      else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
        if (match[2]) {
          arg_names |= 1;
          var field_list = [], replacement_field = match[2], field_match = [];
          if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
            field_list.push(field_match[1]);
            while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
              if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                field_list.push(field_match[1]);
              }
              else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                field_list.push(field_match[1]);
              }
              else {
                throw('[sprintf] huh?');
              }
            }
          }
          else {
            throw('[sprintf] huh?');
          }
          match[2] = field_list;
        }
        else {
          arg_names |= 2;
        }
        if (arg_names === 3) {
          throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
        }
        parse_tree.push(match);
      }
      else {
        throw('[sprintf] huh?');
      }
      _fmt = _fmt.substring(match[0].length);
    }
    return parse_tree;
  };

  return str_format;
})();

var vsprintf = function(fmt, argv) {
  argv.unshift(fmt);
  return sprintf.apply(null, argv);
};

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


})(jQuery, window, document);