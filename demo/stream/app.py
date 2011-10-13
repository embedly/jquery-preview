import os
import json
import tornado.ioloop
import tornado.web

# Going to save the posts in memory just for testing.
posts = []

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('index.html')

class Posts(tornado.web.RequestHandler):
    def get(self):
        self.write(json.dumps(posts))


class UpdateHandler(tornado.web.RequestHandler):

    def post(self):
        p = dict([(k, v[0]) for k, v in self.request.arguments.items()])
        posts.append(p)
        self.write(json.dumps(p))

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