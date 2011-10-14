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
/*
 * linkify - v0.3 - 6/27/2009
 * http://benalman.com/code/test/js-linkify/
 * 
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Licensed under the MIT license
 * http://benalman.com/about/license/
 * 
 * Some regexps adapted from http://userscripts.org/scripts/review/7122
 */
linkify=(function(){var k="[a-z\\d.-]+://",h="(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.){3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",c="(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",n="(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|ye|yt|yu|za|zm|zw)",f="(?:"+c+n+"|"+h+")",o="(?:[;/][^#?<>\\s]*)?",e="(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",d="\\b"+k+"[^<>\\s]+",a="\\b"+f+o+e+"(?!\\w)",m="mailto:",j="(?:"+m+")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@"+f+e+"(?!\\w)",l=new RegExp("(?:"+d+"|"+a+"|"+j+")","ig"),g=new RegExp("^"+k,"i"),b={"'":"`",">":"<",")":"(","]":"[","}":"{","B;":"B+","b:":"b9"},i={callback:function(q,p){return p?'<a href="'+p+'" title="'+p+'" target="_blank">'+q+"</a>":q},punct_regexp:/(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/};return function(u,z){z=z||{};var w,v,A,p,x="",t=[],s,E,C,y,q,D,B,r;for(v in i){if(z[v]===undefined){z[v]=i[v]}}while(w=l.exec(u)){A=w[0];E=l.lastIndex;C=E-A.length;if(/[\/:]/.test(u.charAt(C-1))){continue}do{y=A;r=A.substr(-1);B=b[r];if(B){q=A.match(new RegExp("\\"+B+"(?!$)","g"));D=A.match(new RegExp("\\"+r,"g"));if((q?q.length:0)<(D?D.length:0)){A=A.substr(0,A.length-1);E--}}if(z.punct_regexp){A=A.replace(z.punct_regexp,function(F){E-=F.length;return""})}}while(A.length&&A!==y);p=A;if(!g.test(p)){p=(p.indexOf("@")!==-1?(!p.indexOf(m)?"":m):!p.indexOf("irc.")?"irc://":!p.indexOf("ftp.")?"ftp://":"http://")+p}if(s!=C){t.push([u.slice(s,C)]);s=E}t.push([A,p])}t.push([u.substr(s)]);for(v=0;v<t.length;v++){x+=z.callback.apply(window,t[v])}return x||u}})();
function Selector(form, selector){

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
      'attributes_large' : '<p><a class="description" href="#">{{description}}</a></p>',
      
      
      
    },
    templates : {
      'small': [
        '<div class="selector small">',
          '{{>images_small}}',
          '<div class="attributes">',
            '{{>attributes}}',
            '<span class="meta">',
              '<img class="favicon" src="{{favicon_url}}">',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
          '<div class="action"><a href="#" class="close">&#10005;</a></div>',
        '</div>'].join(''),
      'large' : [
        '<div class="selector large">',
          '<a class="title" href="#">{{title}}</a>',
          '{{>images_large}}',
          '<div class="attributes">',
            '{{>attributes_large}}',
            '<span class="meta">',
              '<img class="favicon" src="{{favicon_url}}">',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
        '</div>'].join(''),
      'rich': [
        '<div class="selector rich">',
            '{{>images_small}}',
            '{{>object}}',
          '<div class="attributes">',
            '{{>attributes}}',
            '<span class="meta">',
              '<img class="favicon" src="{{favicon_url}}">',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
        '</div>'].join('')
    },

    // If a developer wants complete control of the selector, they can
    // override the render function.
    render : function(obj){
      // If the #selector ID is there then replace it with the template. Just
      // tells us where it should be on the page.
      var template = null;

      if (this.template !== null){
        template = this.template;
      } else {
        template = this.templates[this.type];
      }

      var view = this.toView(obj);
      var partials = this.toPartials(obj);

      html = Mustache.to_html(template, view, partials);      

      // If the developer told us where to put the selector, put it there.
      if (form.find(this.selector).length){
        form.find(this.selector).replaceWith(html)
      } else {
        form.append(html);
      }
      
      // We need to keep track of the selector elem so we don't have to do
      // form.find(this.selector) all the time.
      this.elem = form.find(this.selector);

      // If there are images, set the information in the form.
      if (obj.images.length > 0){
        form.find('#id_thumbnail_url').val(encodeURIComponent(obj.images[0].url));
      } else{
        this.elem.find('.thumbnail').hide();
      }
  
      // If there is only one image, hide the left and right buttons.
      if (obj.images.length == 1){
        this.elem.find('.left, .right').hide();
      }

      this.bind();
    },
    // To View. Only exists to be overwritten basiclly.
    toView : function(obj){
      obj['id'] = this.id;

      return obj;
    },
    toPartials : function(obj){
      // Clone partials for later.
      var p = $.extend(true, {}, this.partials);

      // Set up the object if it's there.
      p['object'] = '';
      if (obj.object && (obj.object.type == 'video' || obj.object.type == 'rich')){
        p['object'] = '<a class="title" href="#">{{title}}</a><div class="media">{{{html}}}</div>';
        
      } else if (obj.object && obj.object.type == 'photo'){
        p['object'] = '<div class="media"><img src="{{url}}"/></div>';
      }
      
      // rich has seperate rules when there is an obj. Kind of a lame hack, but
      // it works the best for us right now.
      if (this.type == 'rich' && obj.object && obj.object.type != 'link'){
        p['images_small'] = '';
        p['attributes'] = p['attributes_large'];
      }

      return p;
    },
    //Clears the selector post submit.
    clear : function(e){
      if (e !== undefined) e.preventDefault();
      this.elem.html('');
      form.find('input[type="hidden"].preview_input').remove();
    },
    scroll : function(dir, e){
      e.preventDefault();

      var images = this.elem.find('.images');

      //Grabs the current 'left' style
      var width = parseInt(images.find('li').css('width'));

      // Left
      var left = parseInt(images.css('left'));
      //Gets the number of images
      var len = images.find('img').length * width;

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
      
      var thumb = encodeURIComponent(images.find('img').eq((left/-100)).attr('src'));
      
      //  Puts the current thumbnail into the thumbnail_url input
      form.find('#id_thumbnail_url').val(thumb);

      // Sets the new left.
      images.css('left',left+'px');
    },
    nothumb : function(e){
      e.preventDefault();
      this.elem.find('.thumbnail').hide();
      form.find('#id_thumbnail_url').val('');
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
        form.find('#id_title').val(encodeURIComponent(elem.val()));
        
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
        form.find('#id_title').val(encodeURIComponent(elem.val()));

        $(e.target).replaceWith($('<a/>').attr({
            'class':'description',
            'href' : '#'
          }).text(elem.val())
        );
      }); 
    },
    update : function(e){

      this.elem.find('.'+$(e.target).attr('name')).text($(e.target).val());
    },
    // Binds the correct events for the controls.
    bind : function(){  

      // Thumbnail Controls
      this.elem.find('.left').bind('click', _.bind(this.scroll, {}, 'left'));
      this.elem.find('.right').bind('click', _.bind(this.scroll, {}, 'right'));
      this.elem.find('.nothumb').bind('click', this.nothumb);
      
      // Binds the close button.
      this.elem.find('.action .close').live('click', this.clear);
      this.elem.live('mouseenter mouseleave', function(){
        this.elem.find('.action').toggle();
      });
      
      //Show hide the controls.
      this.elem.find('.thumbnail').one('mouseenter', function(){
        $(this).bind('mouseenter mouseleave', function(){
          $(this).find('.controls').toggle();
        });
      });

      //Edit Title and Description handlers.
      this.elem.find('.title').live('click', this.title);
      this.elem.find('.description').live('click', this.description);
    }
  }

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
        '</div>'].join('')
    },

    get : function(){
      
      
    },
    remove : function(){
      
    },
    // Will do something with this later.
    toView : function(obj){
      if (obj.hasOwnProperty('status')){
        obj['status_linked'] = linkify(obj['status']);
      }      
      return obj;
    },
    // Will do something with this later.
    toPartials : function(obj){
      var p = $.extend(true, {}, this.partials);
      
      if (!obj.thumbnail_url){
        p['thumbnail'] = '';
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
  
      // Allows us to overwrite the view and partials.
      var view = this.toView(obj);
      var partials = this.toPartials(obj);
  
      html = Mustache.to_html(template, view, partials);      

      var e = $(this.selector).prepend(html).children().first();

      e.data('preview', obj);
    },
    play : function(e){
    
    },
    bind : function(){
      $('.thumbnail.video a, .thumbnail.rich a').live('click', function(e){
        e.preventDefault();
        var preview = $(this).parents('.item').data('preview');
        $(this).parents('.item').replaceWith(preview['html']);
      }); 
    }
  }

  _.extend(Display, display);

  _.bindAll(Display);

  Display.bind();

  return Display;
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
          'provider_url', 'provider_display', 'safe', 'html', 'thumbnail_url', 'object_type'],

    default_data : {},
    debug : false,
    form : null,
    type : 'link',
    loading_selector : '.loading',
    options : {
      'selector' : {},
      'field' : null,
      'display' : {},
      'preview' : {}
    },

    init : function(elem, settings){
      // Sets up the data args we are going to send to the API
      var data = {};
      _.each(_.intersection(_.keys(settings),this.api_args), function(n){
        var v = settings[n];
        // 0 or False is ok, but not null or undefined
        if (!(_.isNull(v) || _.isUndefined(v))) data[n] = v;
      });
      this.default_data = data;
      
      this.options = _.extend(this.options, settings);
      
      // Just reminds us which form we should be working on.
      this.form = options.form ? options.form : elem.parents('form');

      //Debug used for logging
      this.debug = this.options.debug;

      //We Need to make sure there is a Key.
      if (!this.default_data.hasOwnProperty('key')){
        log('Options did not include a Embedly API key. Aborting.')
      }else{
        //Sets up Selector
        this.selector = Selector(this.form, this.options.selector);
        
        // Sets up display
        this.display = Display(this.options.display);
        
        
        //this.display.bind();

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
      var status = elem.val();

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
    toggleLoading : function(){
      this.form.find(this.loading_selector).toggle();
    },
    //Metadata Callback
    callback : function(obj){
      //tells the loader to stop
      this.toggleLoading();

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
      this.form.find('input[type="hidden"].preview_input').remove();
  

      //Sets all the data to a hidden inputs for the post.
      var form = this.form;
      _.each(this.display_attrs, function(n){
        
        var v = null;
        
        // Object type let's us know what we are working with. 
        if (n == 'object_type'){
          if (obj.hasOwnProperty('object') && obj['object'].hasOwnProperty('type')){
            v = obj['object']['type'];
          } else{
            v = 'link';
          } 
        }
        else if (n == 'html'){
          if (obj.hasOwnProperty('object') && obj['object'].hasOwnProperty('html')){
            v = obj['object']['html'];
          }
        }
        else{
          v = obj.hasOwnProperty(n) && obj[n] ? encodeURIComponent(obj[n]): '';
        }
        
        
        d = {
          name : n,
          type : 'hidden',
          id : 'id_'+n, 
          value : v
        }
  
        // It's possible that the title or description or something else is
        // already in the form. If it is then we need to Love them for who they
        // are and fill in values.
        var e = form.find('#id_'+n);
        
        if(e.length){
          // It's hidden, use it
          if (e.attr('type') == 'hidden'){
            e.attr(d);
          } else{
            // Be careful here.
            if (!e.val()){
              e.val(obj[n]);
            } else {
              // Use the value in the obj
              obj[n] = e.val();
            }
            // Bind updates to the select.
            e.bind('keyup', function(e){
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
      var original_url = this.form.find('#id_original_url').val();
      if (original_url == encodeURIComponent(url)) return true;

      //Tells the loaded to start
      this.toggleLoading();

      //sets up the data we are going to use in the request.
      var data = _.clone(this.default_data);
      data['url'] = url;

      // Make the request to Embedly. Note we are using the
      // preview endpoint: http://embed.ly/docs/endpoints/1/preview
      $.ajax({
        url: 'http://api.embed.ly/1/preview',
        dataType: 'jsonp',
        data: data,
        success: this.callback,
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
      
      this.form.find('textarea, input').not('input[type="submit"]').each(
        function(i, e){
          var n = $(e).attr('name');
          if (n !== undefined) data[n] = decodeURIComponent($(e).val());
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
    submit : function(e, data){
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
    bind : function(){
      //Bind a bunch of functions.
      log('Starting Bind');
      elem.bind('keyup', this.keyUp);
      
      //
      elem.live('blur', this.fetch);
      elem.bind('paste', this.paste);

      //Bind Submit
      this.form.bind('submit', this._submit);
    }
  }

  //Use Underscore to make ``this`` not suck. 
  _.bindAll(Preview);
  
  //Set up the defaults.
  var defaults = {
    debug : true,
    wmode : 'opaque',
    words : 30,
    maxwidth : 560
  }
  var settings = $.extend(defaults, typeof options != "undefined" ? options : {});

  //Bind Preview Function
  Preview.init(elem, settings);

  //Return the Preview Function that will eventually be namespaced to $.preview.
  return Preview;
}

  //Set up the Preview Functions for jQuery
  $.fn.preview = function(options, callback){
    $(this).each(function(i,e){
      $.preview = new Preview($(this), options);
    });

    return this;
  }
})(jQuery);
