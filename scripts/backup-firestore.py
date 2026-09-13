"""Private local text-post snapshot, using the explicitly authorized owner's login."""
import json, os, subprocess, urllib.request
from pathlib import Path
from datetime import datetime, timezone
PROJECT='andile-portfolio-personal'
ACCOUNT='thabheloduve@gmail.com'
token=subprocess.check_output(['gcloud','auth','print-access-token','--account='+ACCOUNT],text=True).strip()
url=f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents/posts?pageSize=1000'
posts=[]
def decode(v):
 if 'stringValue' in v:return v['stringValue']
 if 'arrayValue' in v:return [decode(x) for x in v['arrayValue'].get('values',[])]
 raise ValueError('Unexpected field type; backup aborted')
while url:
 req=urllib.request.Request(url,headers={'Authorization':'Bearer '+token,'x-goog-user-project':PROJECT})
 with urllib.request.urlopen(req,timeout=30) as r:data=json.load(r)
 posts.extend({k:decode(v) for k,v in d['fields'].items()} for d in data.get('documents',[]))
 cursor=data.get('nextPageToken');url=f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents/posts?pageSize=1000&pageToken={cursor}' if cursor else None
folder=Path(__file__).resolve().parents[3]/'work/private-backups'
folder.mkdir(parents=True,exist_ok=True);folder.chmod(0o700)
path=folder/(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-posts.json')
fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as f:json.dump(posts,f,ensure_ascii=False,indent=2)
print(f'Private snapshot saved: {len(posts)} posts. Never commit backup files.')
