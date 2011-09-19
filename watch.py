"""
We use this in development to build jquery.preview.js
"""


import os
import glob
from time import sleep

DIR_PATH = os.path.dirname(__file__)
SRC_PATH = os.path.join(DIR_PATH, 'src/')

def build():
    
    p = open(os.path.join(DIR_PATH, 'jquery.preview.js'), 'w')
    
    for e in ['intro.js', 'utils.js', 'selector.js', 'feed.js',
        'preview.js', 'outro.js']:
        f = open(os.path.join(SRC_PATH, e), 'r')
        p.write(f.read())
        p.write('\n')
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
    try:
        wait()
    except KeyboardInterrupt:
        print 'stopping wait'