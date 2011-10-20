"""
We use this in development to build jquery.preview.js
"""

import os
import glob
import shutil
from time import sleep
from docutils.core import publish_string
from optparse import OptionParser

DIR_PATH = os.path.abspath(os.path.dirname(__file__))
SRC_PATH = os.path.join(DIR_PATH, 'src/')

def build():

    p = open(os.path.join(DIR_PATH, 'jquery.preview.js'), 'w')

    f = open(os.path.join(DIR_PATH, 'jquery.preview.full.js'), 'w')

    for e in ['lib/mustache.js', 'lib/underscore.js']:
        n = open(os.path.join(DIR_PATH, e), 'r')
        f.write(n.read())
        f.write('\n')
        n.close()


    for e in ['src/intro.js', 'src/utils.js', 'lib/linkify.js', 'src/selector.js', 'src/display.js',
        'src/preview.js', 'src/outro.js']:
        n = open(os.path.join(DIR_PATH, e), 'r')
        l = n.read()
        p.write(l)
        p.write('\n')
        f.write(l)
        f.write('\n')
        n.close()

    f.close()
    p.close()


def wait():
    build();
    current = None
    while 1:
        sleep(1)
        now = {}

        for f in glob.glob(SRC_PATH+'*'):
            now[f] = os.stat(f).st_mtime

        if current is None:
            current = now
            continue

        b = False
        for f,t in current.items():
            if now[f] != t:
                print '--detected a change to %s. building' % f
                b = True
                break

        if b:
            build()
            current = now



if __name__ == '__main__':
    parser = OptionParser(usage="usage: %prog [options]",
                              version="%prog 1.0")

    parser.add_option("-b", "--build",
                      action="store_true",
                      dest="build",
                      default=False,
                      help="Build minified versions of jquery.embed.ly",)

    parser.add_option("-y", "--yui",
                      action="store",
                      dest="yui",
                      default=None,
                      help="Path to the YUI Compressor",)

    parser.add_option("--html",
                    action="store_true",
                    dest="html",
                    default=False,
                    help="Path to the YUI Compressor",)

    (options, args) = parser.parse_args()


    if options.html:
        # Don't know where else to put this, but prints out an HTML version of
        # the README for index.html
        f = open(os.path.join(DIR_PATH, 'README.rest'), 'r')
        print publish_string(f.read(), writer_name='html')
        f.close()

    elif options.build:

        # Make Sure we have YUI
        if not options.yui:
            raise ValueError("Cannot Build. YUICommpressor path is not avalible.")

        #Absolute Path
        if options.yui.startswith('/'):
            yui_path = options.yui
        else:
            yui_path = os.path.join(DIR_PATH, options.yui)

        # Make sure the file exists at least
        if not os.path.exists(yui_path):
            raise ValueError("Not a valid path to the YUICommpressor: %s" % yui_path)

        # Let's build jquery.preview.js just in case.
        build()

        # Minify it and add it over to bulid.
        os.system("java -jar %s -o %s/jquery.preview.min.js %s/jquery.preview.js" %
            (yui_path, DIR_PATH, DIR_PATH))

        os.system("java -jar %s -o %s/jquery.preview.full.min.js %s/jquery.preview.full.js" %
            (yui_path, DIR_PATH, DIR_PATH))



    else:
        try:
            wait()
        except KeyboardInterrupt:
            print 'stopping wait'