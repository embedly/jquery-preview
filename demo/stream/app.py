import os
import json
import tornado.ioloop
import tornado.web

# Going to save the posts in memory just for testing.
class DB(object):
    
    def __init__(self):
        self.posts = []
    
    def save(self,obj):
        self.posts.append(obj)
        return obj
        
    def all(self):
        return self.posts

db = DB()


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('index.html')

class Posts(tornado.web.RequestHandler):
    def get(self):
        self.write(json.dumps(db.all()))


class UpdateHandler(tornado.web.RequestHandler):

    def post(self):
        #Overly verbose
        data = {}
        for name in ['type', 'original_url', 'url', 'title', 'description',
            'favicon_url', 'provider_url', 'provider_display', 'safe',
            'html', 'thumbnail_url', 'object_type', 'image_url']:
            data[name] = self.get_argument(name, None)

        # This also works
        # data = dict([(k, v[0]) for k, v in self.request.arguments.items()])
        
        # Save the data off and return the object that we will pass back.
        obj = db.save(data)

        # Write a json response
        self.write(json.dumps(obj))

app_settings = {
    'debug' : True,
    'static_path': os.path.join(os.path.dirname(__file__), "../.."),
}

url_mapping = [
    (r"/", MainHandler),
    (r"/posts", Posts),
    (r"/update", UpdateHandler),
]

if __name__ == "__main__":
    application = tornado.web.Application(url_mapping, **app_settings)
    application.listen(8000)
    tornado.ioloop.IOLoop.instance().start()