"""Private local text-post snapshot, using the explicitly authorized owner's login."""
import json, os, subprocess, urllib.request
from pathlib import Path
from datetime import datetime, timezone

MAX_ENV_LINES = 200
ROOT = Path(__file__).resolve().parents[1]


def load_dotenv(path):
    """Load KEY=value pairs from .env without overwriting existing process env."""
    if not path.is_file():
        raise SystemExit('Missing .env; copy .env.example and fill Firebase credentials.')
    lines = path.read_text().splitlines()
    limit = min(len(lines), MAX_ENV_LINES)
    for index in range(limit):
        line = lines[index].strip()
        if not line or line.startswith('#'):
            continue
        assignment = line[7:].strip() if line.startswith('export ') else line
        separator = assignment.find('=')
        if separator < 1:
            continue
        key = assignment[:separator].strip()
        value = assignment[separator + 1:].strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        os.environ.setdefault(key, value)


load_dotenv(ROOT / '.env')
PROJECT = os.environ.get('FIREBASE_PROJECT_ID', '').strip()
ACCOUNT = os.environ.get('FIRESTORE_BACKUP_ACCOUNT', '').strip()
if not PROJECT or not ACCOUNT:
    raise SystemExit('FIREBASE_PROJECT_ID and FIRESTORE_BACKUP_ACCOUNT must be set in .env')

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
