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
      
      // Set up the object if it's there.
      p['object'] = '';
      if (obj.object_type == 'video' || obj.object_type == 'rich'){
        p['object'] = '<div class="media video">{{{html}}}</div>';
      } else if (obj.object_type == 'photo' || obj.type == 'image'){
        p['object'] = '<div class="media image"><img alt="{{title}}" src="{{image_url}}"/></div>';
      }
      
      if (this.type == 'rich' && obj.object_type != 'link'){
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

      // A template can be a dict of all the use cases.
      if (_.isObject(template)){
        template = template[obj.object_type];
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