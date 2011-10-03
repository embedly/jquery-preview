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
    form : null,
    type : 'link',
    options : {
      'selector' : {},
      'field' : null,
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
      
      // Tells us which form we are working in.
      this.form = this.options.form ? this.options.form : this.elem.parents('form').eq(0);

      //We Need to make sure there is a Key.
      if (!this.default_data.hasOwnProperty('key')){
        log('Options did not include a Embedly API key. Aborting.')
      }else{
        //Sets up Selector
        this.selector = Selector(this.form, this.options);
        
        // Sets up Feed
        this.feed = Feed(this.options.feed);

        // Overwrites any funtions
        _.extend(this, this.options.preview)
        
        // Binds all the functions that you want.
        this.bind();
      }
    },
    /*
     * Utils for handling the status.
     */
    getStatusUrl : function(obj){
      // Grabs the status out of the Form.
      var status = this.elem.val();

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
          value : obj.hasOwnProperty(n) && obj[n] ? encodeURIComponent(obj[n]): ''
        }
        
        // It's possible that the title or description or something else is
        // already in the form. If it is then we need to Love them for who they
        // are and fill in values.
        if($('#id_'+n).length){
          // It's hidden, use it
          if ($('#id_'+n).attr('type') == 'hidden'){
            $('#id_'+n).attr(d);
          } else{
            // Be careful here.
            if (!$('#id_'+n).val()){
              $('#id_'+n).val(obj[n]);
            } else {
              // Use the value in the obj
              obj[n] = $('#id_'+n).val();
            }
            // Bind updates to the select.
            $('#id_'+n).bind('keyup', function(e){
              $.preview.selector.update(e);
             });
          }
          $('#id_'+n).addClass('preview_input');
        } else{
          d['class'] ='preview_input';
          elem.append($('<input />').attr(d));
        }
      });

      // Now use the selector obj to render the selector.
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
      this.elem.val('');
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
      this.elem.bind('keyup', this.keyUp);
      
      //
      this.elem.live('blur', this.fetch);
      this.elem.bind('paste', this.paste);

      //Bind Submit
      $(this.form).bind('submit', this._submit);
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