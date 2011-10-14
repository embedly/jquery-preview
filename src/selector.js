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