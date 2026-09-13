"""Refresh public Medium metadata. No article bodies or credentials are stored."""
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / 'dist/blog/medium-posts.json'
if len(sys.argv) > 1:
    feed = Path(sys.argv[1]).read_bytes()
else:
    request = urllib.request.Request('https://medium.com/feed/@andilembele', headers={'User-Agent': 'AndilePortfolio/1.0'})
    with urllib.request.urlopen(request, timeout=30) as response:
        feed = response.read(5_000_000)
posts = {p['url']: p for p in json.loads(target.read_text())} if target.exists() else {}
count = 0
for item in ET.fromstring(feed).findall('./channel/item'):
    link = urlsplit(item.findtext('link', ''))
    if link.scheme != 'https' or link.hostname != 'medium.com' or not link.path.startswith('/@andilembele/'):
        continue
    url = urlunsplit((link.scheme, link.netloc, link.path, '', ''))
    posts[url] = {'title': item.findtext('title', '').strip(), 'date': parsedate_to_datetime(item.findtext('pubDate')).astimezone(timezone.utc).date().isoformat(), 'tags': [c.text for c in item.findall('category') if c.text], 'excerpt': '', 'url': url, 'source': 'Medium'}
    count += 1
if not count:
    raise SystemExit('No matching articles found; existing snapshot preserved.')
temporary = target.with_suffix('.json.tmp')
temporary.write_text(json.dumps(sorted(posts.values(), key=lambda p: p['date'], reverse=True), ensure_ascii=False, indent=2) + '\n')
temporary.replace(target)
print(f'Refreshed {count} articles; {len(posts)} links in snapshot.')
