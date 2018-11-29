from bs4 import BeautifulSoup
import codecs
import sys
import os

if len(sys.argv) != 2:
    sys.exit("Pass in a report html file to be parsed")

file = codecs.open(sys.argv[1], 'r')
document = BeautifulSoup(file.read(), 'lxml')

# Remove title tags
for s in document('title'):
	s.extract()

# Remove script tags
for s in document('script'):
	s.extract()

# Remove style tags
for s in document('style'):
	s.extract()

print(document)