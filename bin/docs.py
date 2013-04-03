"""
We use this in development to build jquery.preview.js
"""
import os
import lxml.html
from docutils.core import publish_string
from optparse import OptionParser

DIR_PATH = os.path.abspath(os.path.dirname(__file__))
DEMO_PATH = os.path.join(DIR_PATH, '../demo')

if __name__ == '__main__':

    f = open(os.path.join(DIR_PATH, '../README.rest'), 'r')
    html = publish_string(f.read(), writer_name='html')
    f.close()
    doc = lxml.html.fromstring(html)


    for pre in doc.xpath('//pre'):
        pre.set('class', 'prettyprint linenums')

    body = doc.xpath('//div[@id="jquery-preview"]')[0]
    body.xpath('.//h1[@class="title"]')[0].drop_tree()

    for heading in body.xpath('//h1|//h2|//h3|//h4'):
        heading.tag = 'h{}'.format(int(heading.tag[1])+1)

    f = open(os.path.join(DEMO_PATH, 'index.html.tmpl'), 'r')
    doc = lxml.html.fromstring(f.read())
    f.close()
    document = doc.xpath('//div[@id="document"]')[0]
    for child in body.getchildren():
        document.append(child)

    f = open(os.path.join(DEMO_PATH, 'index.html'), 'w')
    f.write(lxml.html.tostring(doc))
    f.close()

    print 'Done'