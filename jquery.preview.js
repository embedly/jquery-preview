/*
 * Embedly Preview JQuery v0.0.2
 * =============================
 * This library allows you to easily create a status or url submisstion tool
 * utilizing Embedly's Preview API. For more information see:
 *
 * Embedly: http://embed.ly
 * Embedly Preview API: http://embed.ly/docs/endpoints/1/preview
 *
 * Requirements:
 * -------------
 * jquery-1.6 or higher
 *
 * Usage:
 * ------
 *
 *
 */

(function($){
function log(){
  if ($.preview !== undefined && $.preview.debug && console){
    console.log(Array.prototype.slice.call(arguments));
  }
}
/*!
 * linkify - v0.3 - 6/27/2009
 * http://benalman.com/code/test/js-linkify/
 * 
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Licensed under the MIT license
 * http://benalman.com/about/license/
 * 
 * Some regexps adapted from http://userscripts.org/scripts/review/7122
 */

// Turn text into linkified html.
// 
// var html = linkify( text, options );
// 
// options:
// 
//  callback (Function) - default: undefined - if defined, this will be called
//    for each link- or non-link-chunk with two arguments, text and href. If the
//    chunk is non-link, href will be omitted.
// 
//  punct_regexp (RegExp | Boolean) - a RegExp that can be used to trim trailing
//    punctuation from links, instead of the default.
// 
// This is a work in progress, please let me know if (and how) it fails!

window.linkify = (function(){
  var
    SCHEME = "[a-z\\d.-]+://",
    IPV4 = "(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.){3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",
    HOSTNAME = "(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",
    TLD = "(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|ye|yt|yu|za|zm|zw)",
    HOST_OR_IP = "(?:" + HOSTNAME + TLD + "|" + IPV4 + ")",
    PATH = "(?:[;/][^#?<>\\s]*)?",
    QUERY_FRAG = "(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",
    URI1 = "\\b" + SCHEME + "[^<>\\s]+",
    URI2 = "\\b" + HOST_OR_IP + PATH + QUERY_FRAG + "(?!\\w)",
    
    MAILTO = "mailto:",
    EMAIL = "(?:" + MAILTO + ")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@" + HOST_OR_IP + QUERY_FRAG + "(?!\\w)",
    
    URI_RE = new RegExp( "(?:" + URI1 + "|" + URI2 + "|" + EMAIL + ")", "ig" ),
    SCHEME_RE = new RegExp( "^" + SCHEME, "i" ),
    
    quotes = {
      "'": "`",
      '>': '<',
      ')': '(',
      ']': '[',
      '}': '{',
      'Â»': 'Â«',
      'â€º': 'â€¹'
    },
    
    default_options = {
      callback: function( text, href ) {
        return href ? '<a href="' + href + '" title="' + href + '">' + text + '<\/a>' : text;
      },
      punct_regexp: /(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/
    };
  
  return function( txt, options ) {
    options = options || {};
    
    // Temp variables.
    var arr,
      i,
      link,
      href,
      
      // Output HTML.
      html = '',
      
      // Store text / link parts, in order, for re-combination.
      parts = [],
      
      // Used for keeping track of indices in the text.
      idx_prev,
      idx_last,
      idx,
      link_last,
      
      // Used for trimming trailing punctuation and quotes from links.
      matches_begin,
      matches_end,
      quote_begin,
      quote_end;
    
    // Initialize options.
    for ( i in default_options ) {
      if ( options[ i ] === undefined ) {
        options[ i ] = default_options[ i ];
      }
    }
    
    // Find links.
    while ( arr = URI_RE.exec( txt ) ) {
      
      link = arr[0];
      idx_last = URI_RE.lastIndex;
      idx = idx_last - link.length;
      
      // Not a link if preceded by certain characters.
      if ( /[\/:]/.test( txt.charAt( idx - 1 ) ) ) {
        continue;
      }
      
      // Trim trailing punctuation.
      do {
        // If no changes are made, we don't want to loop forever!
        link_last = link;
        
        quote_end = link.substr( -1 )
        quote_begin = quotes[ quote_end ];
        
        // Ending quote character?
        if ( quote_begin ) {
          matches_begin = link.match( new RegExp( '\\' + quote_begin + '(?!$)', 'g' ) );
          matches_end = link.match( new RegExp( '\\' + quote_end, 'g' ) );
          
          // If quotes are unbalanced, remove trailing quote character.
          if ( ( matches_begin ? matches_begin.length : 0 ) < ( matches_end ? matches_end.length : 0 ) ) {
            link = link.substr( 0, link.length - 1 );
            idx_last--;
          }
        }
        
        // Ending non-quote punctuation character?
        if ( options.punct_regexp ) {
          link = link.replace( options.punct_regexp, function(a){
            idx_last -= a.length;
            return '';
          });
        }
      } while ( link.length && link !== link_last );
      
      href = link;
      
      // Add appropriate protocol to naked links.
      if ( !SCHEME_RE.test( href ) ) {
        href = ( href.indexOf( '@' ) !== -1 ? ( !href.indexOf( MAILTO ) ? '' : MAILTO )
          : !href.indexOf( 'irc.' ) ? 'irc://'
          : !href.indexOf( 'ftp.' ) ? 'ftp://'
          : 'http://' )
          + href;
      }
      
      // Push preceding non-link text onto the array.
      if ( idx_prev != idx ) {
        parts.push([ txt.slice( idx_prev, idx ) ]);
        idx_prev = idx_last;
      }
      
      // Push massaged link onto the array
      parts.push([ link, href ]);
    };
    
    // Push remaining non-link text onto the array.
    parts.push([ txt.substr( idx_prev ) ]);
    
    // Process the array items.
    for ( i = 0; i < parts.length; i++ ) {
      html += options.callback.apply( window, parts[i] );
    }
    
    // In case of catastrophic failure, return the original text;
    return html || txt;
  };
  
})();
function Selector(form, selector) {

  //Base Selector
  var Selector = {
    selector : '.selector',
    type : 'small',
    template : null,
    elem : null,
    partials : {
      'images_small' : [
        '<div class="thumbnail">',
          '<div class="controls">',
            '<a class="left" href="#">&#9664;</a>',
            '<a class="right" href="#">&#9654;</a>',
            '<a class="nothumb" href="#">&#10005;</a>',
          '</div>',
          '<div class="items">',
            '<ul class="images">',
              '{{#images}}',
              '<li><img src="{{url}}"/></li>',
              '{{/images}}',
            '</ul>',
          '</div>',
        '</div>'].join(''),
      'images_large' : ['<div class="thumbnail">',
          '<a class="left" href="#">&#9664;</a>',
          '<div class="items">',
            '<ul class="images">',
              '{{#images}}',
              '<li><img src="{{url}}"/></li>',
              '{{/images}}',
            '</ul>',
          '</div>',
          '<a class="right" href="#">&#9654;</a>',
          '<a class="nothumb" href="#">&#10005;</a>',
        '</div>'].join(''),
      'attributes' : [
          '<a class="title" href="#">{{title}}</a>',
          '<p><a class="description" href="#">{{description}}</a></p>'].join(''),
      'title' : '<a class="title" href="#">{{title}}</a>',
      'description' : '<p><a class="description" href="#">{{description}}</a></p>',
      'favicon' : '<img class="favicon" src="{{favicon_url}}">'
    },
    templates : {
      'small': [
        '<div class="selector small">',
          '{{>images_small}}',
          '<div class="attributes">',
            '{{>attributes}}',
            '<span class="meta">',
              '{{>favicon}}',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
          '<div class="action"><a href="#" class="close">&#10005;</a></div>',
        '</div>'].join(''),
      'large' : [
        '<div class="selector large">',
          '{{>title}}',
          '{{>images_large}}',
          '<div class="attributes">',
            '{{>description}}',
            '<span class="meta">',
              '{{>favicon}}',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
        '</div>'].join(''),
      'rich': {
        'video' : [
          '<div class="selector rich">',
              '{{>title}}',
              '{{>object}}',
            '<div class="attributes">',
              '{{>description}}',
              '<span class="meta">',
                '{{>favicon}}',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
          '</div>'].join(''),
        'rich' : [
          '<div class="selector rich">',
              '{{>title}}',
              '{{>object}}',
            '<div class="attributes">',
              '{{>description}}',
              '<span class="meta">',
                '{{>favicon}}',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
          '</div>'].join(''),
        'photo' : [
          '<div class="selector rich">',
              '{{>title}}',
              '{{>object}}',
            '<div class="attributes">',
              '{{>description}}',
              '<span class="meta">',
                '{{>favicon}}',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
          '</div>'].join(''),
        'link' : [
          '<div class="selector rich">',
              '{{>images_small}}',
            '<div class="attributes">',
              '{{>attributes}}',
              '<span class="meta">',
                '{{>favicon}}',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
          '</div>'].join('')
      }
    },

    // If a developer wants complete control of the selector, they can
    // override the render function.
    render : function (obj) {
      // If the #selector ID is there then replace it with the template. Just
      // tells us where it should be on the page.
      var template = null;

      if (this.template !== null) {
        template = this.template;
      } else {
        template = this.templates[this.type];
      }

      // A template can be a dict of all the use cases.
      if (_.isObject(template)) {
        template = template[obj.object_type];
      }

      var view = this.toView(obj);
      var partials = this.toPartials(obj);

      var html = Mustache.to_html(template, view, partials);

      // If the developer told us where to put the selector, put it there.
      if (form.find(this.selector).length) {
        this.elem = form.find(this.selector).replaceWith(html);
      } else {
        this.elem = form.append(html);
      }

      // We need to keep track of the selector elem so we don't have to do
      // form.find(this.selector) all the time.
      this.elem = form.find(this.selector);

      // Selector may be hidden. Let's show it.
      this.elem.show();

      // If there are images, set the information in the form.
      if (obj.images.length > 0) {
        form.find('#id_thumbnail_url').val(encodeURIComponent(obj.images[0].url));
      } else {
        this.elem.find('.thumbnail').hide();
      }

      // If there is only one image, hide the left and right buttons.
      if (obj.images.length === 1) {
        this.elem.find('.left, .right').hide();
      }

      this.bind();
    },
    // To View. Only exists to be overwritten basiclly.
    toView : function (obj) {
      return obj;
    },
    toPartials : function (obj) {
      // Clone partials for later.
      var p = $.extend(true, {}, this.partials);

      // Set up the object if it's there.
      p.object = '';
      if (obj.object && (obj.object.type === 'video' || obj.object.type === 'rich')) {
        p.object = '<div class="media">{{{html}}}</div>';

      } else if (obj.object && obj.object.type === 'photo') {
        p.object = '<div class="media"><img src="{{url}}"/></div>';
      }

      // If there is no favicon, ignore it.
      if (!obj.favion_url) {
        p.favicon = '';
      }

      return p;
    },
    //Clears the selector post submit.
    clear : function (e) {
      if (e !== undefined) {
        e.preventDefault();
      }
      this.elem.html('');
      this.elem.hide();
      form.find('input[type="hidden"].preview_input').remove();
    },
    scroll : function (dir, e) {
      e.preventDefault();

      var images = this.elem.find('.images');

      //Grabs the current 'left' style
      var width = parseInt(images.find('li').css('width'), 10);

      // Left
      var left = parseInt(images.css('left'), 10);
      //Gets the number of images
      var len = images.find('img').length * width;

      //General logic to set the new left value
      if (dir === 'left') {
        left = parseInt(left, 10) + width;
        if (left > 0) {
          return false;
        }
      } else if (dir === 'right') {
        left = parseInt(left, 10) - width;
        if (left <= -len) {
          return false;
        }
      } else {
        log('not a valid direction: ' + dir);
        return false;
      }

      var thumb = encodeURIComponent(images.find('img').eq((left / -width)).attr('src'));

      //  Puts the current thumbnail into the thumbnail_url input
      form.find('#id_thumbnail_url').val(thumb);

      // Sets the new left.
      images.css('left', left + 'px');
    },
    nothumb : function (e) {
      e.preventDefault();
      this.elem.find('.thumbnail').hide();
      form.find('#id_thumbnail_url').val('');
    },
    // When a user wants to Edit a title or description we need to switch out
    // an input or text area
    title : function (e) {
      e.preventDefault();
      //overwrite the a tag with the value of the tag.
      var elem = $('<input/>').attr({
        'value' : $(e.target).text(),
        'class' : 'title',
        'type' : 'text'
      });

      $(e.target).replaceWith(elem);

      //Set the focus on this element
      elem.focus();

      // Sets up for another bind.
      var t = this.title;

      // puts the a tag back on blur. It's a single bind so it will be
      // trashed on blur.
      elem.one('blur', function (e) {
        var elem = $(e.target);
        // Sets the New Title in the hidden inputs
        form.find('#id_title').val(encodeURIComponent(elem.val()));

        var a = $('<a/>').attr({
            'class': 'title',
            'href' : '#'
          }).text(elem.val());

        $(e.target).replaceWith(a);

        // Bind it back again.
        a.bind('click', t);
      });
    },
    //Same as before, but for description
    description : function (e) {
      e.preventDefault();
      //overwrite the a tag with the value of the tag.
      var elem = $('<textarea/>').attr({
        'class' : 'description'
      }).text($(e.target).text());

      $(e.target).replaceWith(elem);

      //Set the focus on this element
      elem.focus();

      // Sets up for another bind.
      var d = this.description;

      // puts the a tag back on blur. It's a single bind so it will be
      // trashed on blur.
      elem.one('blur', function (e) {
        var elem = $(e.target);
        // Sets the New Title in the hidden inputs
        form.find('#id_description').val(encodeURIComponent(elem.val()));

        var a = $('<a/>').attr({
            'class': 'description',
            'href': '#'
          }).text(elem.val());

        $(e.target).replaceWith(a);

        // Bind it back again.
        a.bind('click', d);

      });
    },
    update : function (e) {
      this.elem.find('.' + $(e.target).attr('name')).text($(e.target).val());
    },
    // Binds the correct events for the controls.
    bind : function () {
      // Thumbnail Controls
      this.elem.find('.left').bind('click', _.bind(this.scroll, {}, 'left'));
      this.elem.find('.right').bind('click', _.bind(this.scroll, {}, 'right'));
      this.elem.find('.nothumb').bind('click', this.nothumb);

      // Binds the close button.
      this.elem.find('.action .close').bind('click', this.clear);
      this.elem.bind('mouseenter mouseleave', function () {
        $(this).find('.action').toggle();
      });

      //Show hide the controls.
      this.elem.find('.thumbnail').one('mouseenter', function () {
        $(this).bind('mouseenter mouseleave', function () {
          $(this).find('.controls').toggle();
        });
      });

      //Edit Title and Description handlers.
      this.elem.find('.title').bind('click', this.title);
      this.elem.find('.description').bind('click', this.description);
    }
  };

  // Overwrites any funtions
  _.extend(Selector, selector);
  _.bindAll(Selector);

  return Selector;
}
/* Display Allows Developers to Easily build a status or link share from the
 * Obj that was created.
 *
 *
 */

function Display(display){

  var Display = {
    selector : '#feed',
    type : 'small',
    template : null,

    partials : {
      'thumbnail' : ['<div class="thumbnail {{object_type}}">',
        '<a href="{{original_url}}" target="_blank">',
          '<img title="{{title}}" src="{{thumbnail_url}}"/>',
          '<span class="overlay"></span>',
        '</a>',
      '</div>'].join('')
    },
    templates : {
      'small' : [
        '<div class="item">',
          '{{>thumbnail}}',
          '<div class="attributes">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '<p class="description">{{description}}</p>',
            '<span class="meta">',
              '<img class="favicon" src="{{favicon_url}}"/>',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
          '<div class="clearfix"></div>',
        '</div>'].join(''),
      'status' :[
        '<div class="item">',
          '<div class="status">{{{status_linked}}}</div>',
          '{{>thumbnail}}',
          '<div class="attributes">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '<p class="description">{{description}}</p>',
            '<span class="meta">',
              '<img class="favicon" src="{{favicon_url}}"/>',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
          '<div class="clearfix"></div>',
        '</div>'].join(''),
      'rich' :  {
          'video' :['<div class="item video">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '{{>object}}',
            '<div class="attributes">',
              '<p class="description">{{description}}</p>',
              '<span class="meta">',
                '<img class="favicon" src="{{favicon_url}}"/>',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
            '<div class="clearfix"></div>',
          '</div>'].join(''),
          'rich' : ['<div class="item rich">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '{{>object}}',
            '<div class="attributes">',
              '<p class="description">{{description}}</p>',
              '<span class="meta">',
                '<img class="favicon" src="{{favicon_url}}"/>',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
            '<div class="clearfix"></div>',
          '</div>'].join(''),
          'photo' : ['<div class="item photo">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '{{>object}}',
            '<div class="attributes">',
              '<p class="description">{{description}}</p>',
              '<span class="meta">',
                '<img class="favicon" src="{{favicon_url}}"/>',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
            '<div class="clearfix"></div>',
          '</div>'].join(''),
          'link': ['<div class="item link">',
            '{{>thumbnail}}',
            '<div class="attributes">',
              '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
              '<p class="description">{{description}}</p>',
              '<span class="meta">',
                '<img class="favicon" src="{{favicon_url}}"/>',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
            '<div class="clearfix"></div>',
          '</div>'].join('')
      }
    },
    // Will do something with this later.
    toView : function(obj){
      if (obj.hasOwnProperty('status')){
        obj.status_linked = linkify(obj.status);
      }
      return obj;
    },
    // Will do something with this later.
    toPartials : function(obj){
      var p = $.extend(true, {}, this.partials);

      if (!obj.thumbnail_url){
        p.thumbnail = '';
      }

      // Set up the object if it's there.
      p.object = '';
      if (obj.object_type === 'video' || obj.object_type === 'rich'){
        p.object = '<div class="media video">{{{html}}}</div>';
      } else if (obj.object_type === 'photo' || obj.type === 'image'){
        p.object = '<div class="media image"><img alt="{{title}}" src="{{image_url}}"/></div>';
      }

      if (this.type === 'rich' && obj.object_type !== 'link'){
        p.thumbnail = '';
      }

      return p;
    },
    //Creates a feed object based on the obj we pass back.
    create : function(obj){
      var template = null;

      // If the developer gives us a template use it.
      if (this.template !== null){
        template = this.template;
      } else{
        template = this.templates[this.type];
      }

      // A template can be a dict of all the use cases.
      if (_.isObject(template)){
        template = template[obj.object_type];
      }

      // Allows us to overwrite the view and partials.
      var view = this.toView(obj);
      var partials = this.toPartials(obj);

      var html = Mustache.to_html(template, view, partials);

      var e = $(this.selector).prepend(html).children().first();

      e.data('preview', obj);
    },
    play : function(e){

    },
    bind : function(){
      $('.thumbnail.video a, .thumbnail.rich a').live('click', function(e){
        e.preventDefault();
        var preview = $(this).parents('.item').data('preview');
        $(this).parents('.item').replaceWith(preview.html);
      });
    }
  };

  _.extend(Display, display);

  _.bindAll(Display);

  Display.bind();

  return Display;
}
/* jQuery Preview - v0.2
 *
 * jQuery Preview is a plugin by Embedly that allows developers to create tools
 * that enable users to share links with rich previews attached.
 *
 */

// Base Preview Object. Holds a common set of functions to interact with
// Embedly's Preview endpoint.
function Preview(elem, options) {

  //Preview Object that We build from the options passed into the function
  var Preview = {

    // List of all the attrs that can be sent to Embedly
    api_args : ['key', 'maxwidth', 'maxheight', 'width', 'wmode', 'autoplay',
      'videosrc', 'allowscripts', 'words', 'chars', 'secure', 'frame'],

    // What attrs we are going to use.
    display_attrs : ['type', 'original_url', 'url', 'title', 'description',
      'favicon_url', 'provider_url', 'provider_display', 'provider_name', 'safe', 'html',
      'thumbnail_url', 'object_type', 'image_url'],

    default_data : {},
    debug : false,
    form : null,
    type : 'link',
    loading_selector : '.loading',
    options : {
      debug : false,
      selector : {},
      field : null,
      display : {},
      preview : {},
      wmode : 'opaque',
      words : 30,
      maxwidth : 560
    },

    init : function (elem, settings) {

      // Sets up options
      this.options = _.extend(this.options, typeof settings !== "undefined" ? settings : {});

      // Sets up the data args we are going to send to the API
      var data = {};
      _.each(_.intersection(_.keys(this.options), this.api_args), function (n) {
        var v = settings[n];
        // 0 or False is ok, but not null or undefined
        if (!(_.isNull(v) || _.isUndefined(v))) {
          data[n] = v;
        }
      });
      this.default_data = data;

      // Just reminds us which form we should be working on.
      this.form = null;
      if (elem){
        this.form = options.form ? options.form : elem.parents('form');
      }

      //Debug used for logging
      this.debug = this.options.debug;

      //Sets up Selector
      this.selector = Selector(this.form, this.options.selector);

      // Sets up display
      this.display = Display(this.options.display);

      // Overwrites any funtions
      _.extend(this, this.options.preview);

      // Binds all the functions that you want.
      if (elem){
        this.bind();
      }
    },
    /*
     * Utils for handling the status.
     */
    getStatusUrl : function (obj) {
      // Grabs the status out of the Form.
      var status = elem.val();

      //ignore the status it's blank.
      if (status === '') {
        return null;
      }

      // Simple regex to make sure the url with a scheme is valid.
      var urlexp = /^http(s?):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      var matches = status.match(urlexp);

      var url = matches? matches[0] : null;

      //No urls is the status. Try for urls without scheme i.e. example.com
      if (url === null) {
        urlexp = /[-\w]+(\.[a-z]{2,})+(\S+)?(\/|\/[\w#!:.?+=&%@!\-\/])?/g;
        matches = status.match(urlexp);
        url = matches? 'http://'+matches[0] : null;
      }

      //Note that in both cases we only grab the first URL.
      return url;
    },
    toggleLoading : function () {
      this.form.find(this.loading_selector).toggle();
    },
    callback : function(obj) {
      // empty. can be overridden by user
    },
    //Metadata Callback
    _callback : function (obj) {
      //tells the loader to stop
      this.toggleLoading();

      // Here is where you actually care about the obj
      log(obj);

      // Every obj should have a 'type'. This is a clear sign that
      // something is off. This is a basic check to make sure we should
      // proceed. Generally will never happen.
      if (!obj.hasOwnProperty('type')) {
        log('Embedly returned an invalid response');
        this.error(obj);
        return false;
      }

      // Error. If the url was invalid, or 404'ed or something else. The
      // endpoint will pass back an obj  of type 'error'. Generally this is
      // were the default workflow should happen.
      if (obj.type === 'error') {
        log('URL ('+obj.url+') returned an error: '+ obj.error_message);
        this.error(obj);
        return false;
      }

      // Generally you only want to handle preview objs that are of type
      // `html` or `image`. Others could include `ppt`,`video` or `audio`
      // which I don't believe you have a good solution for yet. We could
      // wrap them in HTML5 tags, but won't work cross browser.
      if (!(obj.type in {'html':'', 'image':''})) {
        log('URL ('+obj.url+') returned a type ('+obj.type+') not handled');
        this.error(obj);
        return false;
      }

      // If this is a change in the URL we need to delete all the old
      // information first.
      this.form.find('input[type="hidden"].preview_input').remove();


      //Sets all the data to a hidden inputs for the post.
      var form = this.form;
      _.each(this.display_attrs, function (n) {

        var v = null;

        // Object type let's us know what we are working with.
        if (n === 'object_type') {
          if (obj.hasOwnProperty('object') && obj.object.hasOwnProperty('type')) {
            v = obj.object.type;
          } else{
            v = 'link';
          }
          obj.object_type = v;
        }
        // Sets up HTML for the video or rich type.
        else if (n === 'html') {
          if (obj.hasOwnProperty('object') && obj.object.hasOwnProperty('html')) {
            v = obj.object.html;
          }
        }
        // Set up the image URL for previews of the ful image.
        else if (n === 'image_url') {
          if (obj.hasOwnProperty('object') && obj.object.hasOwnProperty('type') && obj.object.type === 'photo') {
            v = obj.object.url;
          } else if (obj.type === 'image') {
            v = obj.url;
          }
          obj.image_url = v;
        }
        else{
          v = obj.hasOwnProperty(n) && obj[n] ? encodeURIComponent(obj[n]): '';
        }

        var d = {
          name : n,
          type : 'hidden',
          id : 'id_'+n,
          value : v
        };

        // It's possible that the title or description or something else is
        // already in the form. If it is then we need to Love them for who they
        // are and fill in values.
        var e = form.find('#id_'+n);

        if(e.length) {
          // It's hidden, use it
          if (e.attr('type') === 'hidden') {
            // jQuery doesn't allow changing the 'type' attribute
            delete d.type;
            
            e.attr(d);
          } else{
            // Be careful here.
            if (!e.val()) {
              e.val(obj[n]);
            } else {
              // Use the value in the obj
              obj[n] = e.val();
            }
            // Bind updates to the select.
            e.bind('keyup', function (e) {
              $.preview.selector.update(e);
            });
          }
          e.addClass('preview_input');
        } else{
          d['class'] ='preview_input';
          form.append($('<input />').attr(d));
        }
      });

      // Now use the selector obj to render the selector.
      this.selector.render(obj);
      this.callback(obj);
    },
    // Used as a generic error callback if something fails.
    error : function () {
      log('error');
      log(arguments);
    },
    // Actually makes the ajax call to Embedly. We make this a seperate
    // function because implementations like Chrome Plugins need to overwrite
    // how the call is made.
    ajax : function(data){
      // Make the request to Embedly. Note we are using the
      // preview endpoint: http://embed.ly/docs/endpoints/1/preview
      $.ajax({
        url: 'http://api.embed.ly/1/preview',
        dataType: 'jsonp',
        data: data,
        success: this._callback,
        error: this.error
      });
    },
    // Fetches the Metadata from the Embedly API
    fetch: function (url) {
      // Get a url out of the status box unless it was passed in.
      if (typeof url === 'undefined' || typeof url !== 'string') {
        url = this.getStatusUrl();
      }

      // If there is no url return false.
      if (url === null) return true;

      //We need to trim the URL.
      url = $.trim(url);

      // If we already looked for a url, there will be an original_url hidden
      // input that we should look for and compare values. If they are the
      // same we will ignore.
      var original_url = this.form.find('#id_original_url').val();
      if (original_url === encodeURIComponent(url)) {
        return true;
      }

      //Tells the loaded to start
      this.toggleLoading();

      //sets up the data we are going to use in the request.
      var data = _.clone(this.default_data);
      data.url = url;

      // make the ajax call
      this.ajax(data);

      return true;
    },
    keyUp : function (e) {
      // Only respond to keys that insert whitespace (spacebar, enter)
      if (e.which !== 32 && e.which !== 13) {
        return null;
      }

      //See if there is a url in the status textarea
      var url = this.getStatusUrl();
      if (url === null) {
        return null;
      }
      log('onKeyUp url:'+url);

      // If there is a url, then we need to unbind the event so it doesn't fire
      // again. This is very common for all status updaters as otherwise it
      // would create a ton of unwanted requests.
      $(this.status_selector).unbind('keyup');

      //Fire the fetch metadata function
      this.fetch(url);
    },
    paste : function (e) {
      //We delay the fire on paste.
      _.delay(this.fetch, 200);
    },
    //The submit post back that readys the data for the actual submit.
    _submit : function (e) {
      var data = {};

      this.form.find('textarea, input').not('input[type="submit"]').each(
        function (i, e) {
          var n = $(e).attr('name');
          if (n !== undefined) {
            data[n] = decodeURIComponent($(e).val());
          }
      });
      // Clears the Selector.
      this.selector.clear();

      // Submits the Event and the Data to the submit function.
      this.submit(e, data);

      //Clear the form.
      elem.val('');

      // This happens in clear, but it may not get get called there. This
      // Makes sure it's cleared.
      this.form.find('input[type="hidden"].preview_input').remove();
    },
    //What we are actually going to do with the data.
    submit : function (e, data) {
      e.preventDefault();
      // We need to submit the data back to the server via the action
      var form = $(e.target);
      $.ajax({
        type : 'post',
        url : form.attr('action'),
        data : $.param(data),
        dataType:'json',
        success : this.display.create
      });
    },
    //Bind a bunch of functions.
    bind : function () {
      log('Starting Bind');

      // Bind Keyup, Blur and Paste
      elem.bind('blur', this.fetch);
      elem.bind('keyup', this.keyUp);
      elem.bind('paste', this.paste);

      //Bind Submit
      this.form.bind('submit', this._submit);

      // the event `attach` tells fetch to run on the input.
      elem.bind('attach', this.fetch);

    }
  };

  //Use Underscore to make ``this`` not suck.
  _.bindAll(Preview);

  //Bind Preview Function
  Preview.init(elem, options);

  //Return the Preview Function that will eventually be namespaced to $.preview.
  return Preview;
}

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
