/*
 * Embedly Preview JQuery v0.0.1
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
function Selector(elem, selector){

  //Base Selector
  var Selector = {
    template : [
      '<div id="selector">',
        '<div class="thumbnail">',
          '<div class="controls">',
            '<a class="left" href="#">&#9664;</a>',
            '<a class="right" href="#">&#9654;</a>',
            '<a class="nothumb" href="#">&#10005;</a>',
          '</div>',
          '<div class="items">',
            '<ul class="images"></ul>',
          '</div>',
        '</div>',
        '<div class="attributes">',
          '<a class="title" href="#"></a>',
          '<p><a class="description" href="#"></a></p>',
          '<span class="meta">',
            '<img class="favicon" src="">',
            '<a class="provider"></a>',
          '</span>',
        '</div>',
        '<div class="action"><a href="#" class="close">&#10005;</a></div>',
      '</div>'].join(''),

    // If a developer wants complete control of the selector, they can
    // override the render function.
    render : function(obj){
      
      // If the #selector ID is there then replace it with the template. Just
      // tells us where it should be on the page.
      if ($('#selector').length){
        $('#selector').replaceWith(this.template)
      } else {
        elem.append(this.template);
      }

      //Sets all the values in the template.
      $('#selector .title').text(obj.title);
      $('#selector .description').text(obj.description);
      $('#selector .favicon').attr('src', obj.favicon_url);

      $('#selector .provider').attr('href', obj.provider_url);
      $('#selector .provider').text(obj.provider_display);

      _.each(obj.images, function(i){
        $('#selector .images').append('<li><img src="'+i.url+'" /></li>');
      });
      
      if (obj.images.length > 0){
        $('#id_thumbnail_url').val(encodeURIComponent(obj.images[0].url));
      } else{
         $('#selector .thumbnail').hide();
      }
      
      if (obj.images.length == 1){
        $('.controls .left, .controls .right').hide();
      }

      this.bind();
    },
    //Clears the selector post submit.
    clear : function(){    
      $('#selector').html('');
      $('.preview_input').remove();
    },
    scroll : function(dir, e){
      e.preventDefault();

      //Grabs the current 'left' style
      var width = parseInt($('#selector .thumbnail').css('width'));

      // Left
      var left = parseInt($('#selector .images').css('left'));
      //Gets the number of images
      var len = $('#selector .images img').length * width;

      //General logic to set the new left value
      if (dir == 'left'){
        left = parseInt(left)+width;
      if (left > 0) return false;
      } else if (dir == 'right'){
        left = parseInt(left)-width;
      if (left <= -len) return false;
      } else {
        log('not a valid direction: '+dir)
      return false;
      }
      
      var thumb = encodeURIComponent($('#selector .images img').eq((left/-100)).attr('src'));
      
      //  Puts the current thumbnail into the thumbnail_url input
      $('#id_thumbnail_url').val(thumb);

      // Sets the new left.
      $('.images').css('left',left+'px');
    },
    nothumb : function(e){
      e.preventDefault(); 
      $('#selector .thumbnail').hide();
      $('#id_thumbnail_url').val('');
    },
    // When a user wants to Edit a title or description we need to switch out
    // an input or text area
    title : function(e){
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

      // puts the a tag back on blur. It's a single bind so it will be
      // trashed on blur.
      elem.one('blur', function(e){
        var elem = $(e.target);
        // Sets the New Title in the hidden inputs
        $('#id_title').val(encodeURIComponent(elem.val()));
        
        $(e.target).replaceWith($('<a/>').attr(
          {
            'class':'title',
            'href' : '#'
          }).text(elem.val())
        );
      });  
    },
    //Same as before, but for description
    description : function(e){
      e.preventDefault();      
      //overwrite the a tag with the value of the tag.
      var elem = $('<textarea/>').attr({
        'class' : 'description',
        }).text($(e.target).text());

      $(e.target).replaceWith(elem);

      //Set the focus on this element
      elem.focus();

      // puts the a tag back on blur. It's a single bind so it will be
      // trashed on blur.
      elem.one('blur', function(e){
        var elem = $(e.target);
        // Sets the New Title in the hidden inputs
        $('#id_title').val(encodeURIComponent(elem.val()));

        $(e.target).replaceWith($('<a/>').attr(
          {
            'class':'description',
            'href' : '#'
          }).text(elem.val())
        );
      });  
    },
    // Binds the correct events for the controls.
    bind : function(){  

      // Thumbnail Controls
      $('#selector .controls .left').bind('click', _.bind(this.scroll, {}, 'left'));
      $('#selector .controls .right').bind('click', _.bind(this.scroll, {}, 'right'));
      $('#selector .controls .nothumb').bind('click', this.nothumb);
      
      // Binds the close button.
      $('#selector .action .close').live('click', this.clear);
      $('#selector').live('mouseenter mouseleave', function(){
        $('#selector .action').toggle();
      });
      
      //Show hide the controls.
      $('#selector .thumbnail').one('mouseenter', function(){
        $('#selector .thumbnail').bind('mouseenter mouseleave', function(){ $('#selector .thumbnail .controls').toggle();});
      });

      //Edit Title and Description handlers.
      $('#selector .attributes .title').live('click', this.title);
      $('#selector .attributes .description').live('click', this.description);
    }
  }

  _.bindAll(Selector);
  return Selector;
}
// A set of functions that allows developers to create a feed from the responses.
function Feed(feed){

  var Feed = {
    template : [
      '<div class="item">',
        '<div class="thumbnail">',
          '<a>',
            '<img>',
            '<span class="overlay"></span>',
          '</a>',
        '</div>',
        '<div class="attributes">',
          '<a class="title"></a>',
          '<p class="description"></p>',
          '<span class="meta">',
            '<img class="favicon" />',
            '<a class="provider"></a>',
          '</span>',
        '<div>',
      '</div>'].join(''),

    get : function(){
      
      
    },
    remove : function(){
      
    },
    //Creates a feed object based on the obj we pass back.
    create : function(obj){
      var e = $('#feed').prepend(this.template).children().first();

      e.find('.title').text(obj.title);
      e.find('.description').text(obj.description);
      e.find('.favicon').attr('src', obj.favicon_url);
      e.find('.provider').attr('href', obj.provider_url);
      e.find('.provider').text(obj.provider_display);
      e.find('.thumbnail img').attr('src', obj.thumbnail_url);
    
    },
    play : function(e){
    
    }
  }

  _.bindAll(Feed);
  return Feed;
}
/* Preview
 * 
 *
 *
 *
 *
 */


// Base Preview Object. Holds a common set of functions to interact with
// Embedly's Preview endpoint.
function Preview(elem, options){

  //Preview Object that We build from the options passed into the function
  var Preview = {
    
    // List of all the attrs that can be sent to Embedly
    api_args : ['key', 'maxwidth', 'maxheight', 'width', 'wmode', 'autoplay', 
      'videosrc', 'allowscripts', 'words', 'chars'],
    
    // What attrs we are going to use.
    display_attrs : ['type', 'original_url', 'url', 'title', 'description', 'favicon_url', 
          'provider_url', 'provider_display', 'safe', 'html', 'thumbnail_url'],

    default_data : {},
    debug : false,
    options : {
      'selector' : {},
      'status' : '#id_status',
      'feed' : {},
      'preview' : {}
    },

    init : function(elem, settings){

      //  Tells us what form we are working on.
      this.elem = elem;

      // Sets up the data args we are going to send to the API
      var data = {};
      _.each(_.intersection(_.keys(settings),this.api_args), function(n){
        var v = settings[n];
        // 0 or False is ok, but not null or undefined
        if (!(_.isNull(v) || _.isUndefined(v))) data[n] = v;
      });
      this.default_data = data;

      this.options = _.extend(this.options, settings);

      //Debug used for logging
      this.debug = this.options.debug;

      //We Need to make sure there is a Key.
      if (!this.default_data.hasOwnProperty('key')){
        log('Options did not include a Embedly API key. Aborting.')
      }else{
        this.selector = Selector(elem, this.options.selector);
        this.feed = Feed(this.options.feed);

        _.extend(this, this.options.preview)
        
        this.bind();
      }
    },
    /*
     * Utils for handling the status.
     */
    getStatusUrl : function(obj){
      // Grabs the status out of the Form.
      var status = $(this.options.status).val();

      //ignore the status it's blank.
      if (status == ''){
        return null;
      }

      // Simple regex to make sure the url with a scheme is valid.
      var urlexp = /^http(s?):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      var matches = status.match(urlexp);

      var url = matches? matches[0] : null

      //No urls is the status. Try for urls without scheme i.e. example.com
      if (url === null){
        var urlexp = /[-\w]+(\.[a-z]{2,})+(\S+)?(\/|\/[\w#!:.?+=&%@!\-\/])?/g;
        var matches = status.match(urlexp);
        url = matches? 'http://'+matches[0] : null
      }

      //Note that in both cases we only grab the first URL.
      return url;
    },

    //Metadata Callback
    metadataCallback : function(obj){
      //tells the loader to stop
      $('#loading').hide();

      // Here is where you actually care about the obj
      log(obj);

      // Every obj should have a 'type'. This is a clear sign that
      // something is off. This is a basic check to make sure we should
      // proceed. Generally will never happen.
      if (!obj.hasOwnProperty('type')){
        log('Embedly returned an invalid response'); 
        return false;
      }

      // Error. If the url was invalid, or 404'ed or something else. The
      // endpoint will pass back an obj  of type 'error'. Generally this is
      // were the default workflow should happen.
      if (obj.type == 'error'){
        log('URL ('+obj.url+') returned an error: '+ obj.error_message);
        return false;
      }

      // Generally you only want to handle preview objs that are of type
      // `html` or `image`. Others could include `ppt`,`video` or `audio`
      // which I don't believe you have a good solution for yet. We could
      // wrap them in HTML5 tags, but won't work cross browser.
      if (!(obj.type in {'html':'', 'image':''})){
        log('URL ('+obj.url+') returned a type ('+obj.type+') not handled'); 
        return false;
      }

      // If this is a change in the URL we need to delete all the old
      // information first.
      elem.find('input[type="hidden"]').remove();
      
      //We need to the selector form
      //Ext.fly('display').select('*').remove();

      //Sets all the data to a hidden inputs for the post.
      _.each(this.display_attrs, function(n){
        var d = {
          name : n,
          type : 'hidden',
          id : 'id_'+n,
          class : 'preview_input', 
          value : obj.hasOwnProperty(n) && obj[n] ? encodeURIComponent(obj[n]): ''
        }
        elem.append($('<input />').attr(d));
      });

      //display the display section
      //Ext.fly('display').show();
      //Ext.fly('id_submit').removeClass('disabled');
      //Preview.Display.render(obj);
      this.selector.render(obj);
    },
    errorCallback : function(){
      log('error')
      log(arguments);
    },
    // Fetches the Metadata from the Embedly API
    fetch: function(url){
      // Get a url out of the status box unless it was passed in.
      if (typeof url == 'undefined' || !(typeof url == 'string')){
        url = this.getStatusUrl();
      }

      // If there is no url return false.
      if (url === null) return true;

      //We need to trim the URL.
      url = $.trim(url);

      // If we already looked for a url, there will be an original_url hidden
      // input that we should look for and compare values. If they are the
      // same we will ignore.
      var original_url = $('#id_original_url').val();
      if (original_url == encodeURIComponent(url)) return true;

      //Tells the loaded to start
      $('#loading').show();

      //sets up the data we are going to use in the request.
      var data = _.clone(this.default_data);
      data['url'] = url;

      // Make the request to Embedly. Note we are using the
      // preview endpoint: http://embed.ly/docs/endpoints/1/preview
      $.ajax({
        url: 'http://api.embed.ly/1/preview',
        dataType: 'jsonp',
        data: data,
        success: this.metadataCallback,
        error: this.errorCallback
      });
      return true;
    },
    keyUp : function(e){
      // Ignore Everthing but the spacebar Key event.
      if (e.keyCode != 32) return null;

      //See if there is a url in the status textarea
      var url = this.getStatusUrl();
      if (url == null) return null;
      log('onKeyUp url:'+url);

      // If there is a url, then we need to unbind the event so it doesn't fire
      // again. This is very common for all status updaters as otherwise it
      // would create a ton of unwanted requests.
      $(this.status_selector).unbind('keyup');

      //Fire the fetch metadata function
      this.fetch(url);
    },
    paste : function(e){
      //We delay the fire on paste.
      _.delay(this.fetch, 200);
    },
    //The submit post back that readys the data for the actual submit.
    _submit : function(e, data){
      var data = {};
      $('form input').each(function(i, e){
        var n = $(e).attr('name');
        if (n !== undefined) data[n] = decodeURIComponent($(e).val());
      });
      this.selector.clear();
      this.submit(e, data);
      
      //Clear the form.
      $(this.options.status).val('');
      $('.preview_input').remove();
      
    },
    //What we are actually going to do with the data.
    submit : function(e, data){
      e.preventDefault();
      // We need to submit the data back to the server via the action
      var form = $(e.target);
      $.ajax({
        type : 'post',
        url : form.attr('action'),
        data : $.param(data),
        dataType:'json',
        success : this.feed.create
      });
    },
    bind : function(){
      //Bind a bunch of functions.
      log('Starting Bind');
      $(this.options.status).bind('keyup', this.keyUp);
      
      //
      $(this.options.status).live('blur', this.fetch);
      $(this.options.status).bind('paste', this.paste);

      //Bind Submit
      $(this.elem).bind('submit', this._submit);
    }
  }

  //Use Underscore to make ``this`` not suck. 
  _.bindAll(Preview);
  
  //Set up the defaults.
  var defaults = {
    debug : true,
    status_selector : '#id_status',
    wmode : 'opaque',
    words : 30,
  }
  var settings = $.extend(defaults, typeof options != "undefined" ? options : {});

  //Bind Preview Function
  Preview.init(elem, settings);

  //Return the Preview Function that will eventually be namespaced to $.preview.
  return Preview;
}
  //Add to jQuery
  $.fn.preview = function(options, callback){
    $.preview = Preview(this, options);
    return this;
  }
})(jQuery);
