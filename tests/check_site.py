from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re
base=Path('docs')
class Page(HTMLParser):
 def __init__(self): super().__init__();self.ids=[];self.refs=[];self.images=[];self.h1=0;self.videos=[];self.tracks=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='img':self.images.append(a)
  if tag=='video':self.videos.append(a)
  if tag=='track':self.tracks.append(a)
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
assert not list(base.rglob('*.gif')), 'Retired GIF must not ship'
for path in (base/'index.html',base/'start/index.html'):
 page=pages[path]
 assert len(page.videos)==1 and len(page.tracks)==1, f'Expected one captioned welcome: {path}'
 video=page.videos[0];track=page.tracks[0]
 assert all(k in video for k in ('controls','playsinline','poster','aria-label'))
 assert video.get('preload')=='none' and 'autoplay' not in video and 'loop' not in video
 assert track.get('kind')=='captions' and 'default' in track
 captions=(base/track['src'].removeprefix('/wonderabouts/')).read_text()
 assert captions.startswith('WEBVTT')
 cues=[line for line in captions.splitlines() if line and line!='WEBVTT' and not line.isdigit() and '-->' not in line]
 transcript=re.search(r'<details class="intro-copy" id="welcome-transcript">.*?<div class="prose">(.*?)</div>',path.read_text(),re.S).group(1)
 normalize=lambda text:re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower().replace('’',"'"))
 assert normalize(' '.join(cues))==normalize(re.sub('<[^>]+>',' ',transcript)),f'Captions differ from transcript: {path}'
print('PASS: home/start native players, no autoplay/loop/GIF, caption assets and complete matching transcripts')
