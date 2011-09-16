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