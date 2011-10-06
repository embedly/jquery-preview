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
    templates : {'small' : [
      '<div class="item">',
        '<div class="thumbnail">',
          '<a href="{{orginal_url}}">',
            '<img title="{{title}}" src="{{thumbnail_url}}"/>',
            '<span class="overlay"></span>',
          '</a>',
        '</div>',
        '<div class="attributes">',
          '<a class="title" href="{{orginal_url}}">{{title}}</a>',
          '<p class="description">{{description}}</p>',
          '<span class="meta">',
            '<img class="favicon" src="{{favicon_url}}"/>',
            '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
          '</span>',
        '<div>',
      '</div>'].join('')},

    get : function(){
      
      
    },
    remove : function(){
      
    },
    // Will do something with this later.
    toView : function(obj){
      return obj;
    },
    // Will do something with this later.
    toPartials : function(obj){
      return null;
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
    
    }
  }

  _.extend(Display, display);

  _.bindAll(Display);

  return Display;
}