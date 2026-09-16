from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json
base=Path('docs')
class Page(HTMLParser):
 def __init__(self): super().__init__();self.ids=[];self.refs=[];self.images=[];self.h1=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='img':self.images.append(a)
  for key in ('href','src','poster'):
   if a.get(key):self.refs.append(a[key])
pages={}
for path in base.rglob('*.html'):
 p=Page();p.feed(path.read_text());pages[path]=p
 assert len(p.ids)==len(set(p.ids)),f'duplicate ids: {path}'
 assert all('alt' in im for im in p.images),f'missing alt: {path}'
 assert 'name="viewport"' in path.read_text()
 assert 'rel="canonical"' in path.read_text()
for path,page in pages.items():
 for ref in page.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc:continue
  if u.path.startswith('/wonderabouts/'):dest=base/u.path.removeprefix('/wonderabouts/')
  elif not u.path:dest=path
  else:dest=path.parent/u.path
  if dest.is_dir():dest=dest/'index.html'
  assert dest.exists(),f'broken path {path}: {ref}'
  if u.fragment and dest in pages:assert unquote(u.fragment) in pages[dest].ids,f'broken anchor {path}: {ref}'
print(f'PASS: {len(pages)} HTML pages; local links, fragments, alt text, unique IDs, canonical URLs and viewport tags')
