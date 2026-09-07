import json, os, urllib.request
from urllib.parse import urlparse
url=os.environ['PUBLIC_HEALTH_URL']
parsed=urlparse(url)
assert parsed.scheme=='https' and parsed.hostname.endswith('.innobyte-it.tech') and not parsed.username and not parsed.password
with urllib.request.urlopen(url,timeout=15) as response:
    assert json.load(response)=={'status':'ok','revision':os.environ['GITHUB_SHA']}
print('Public HTTPS revision verified')
