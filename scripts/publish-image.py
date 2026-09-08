#!/usr/bin/env python3
"""Do not overwrite immutable tags. Reruns use the previously published commit."""
import json
import os
import re
import subprocess
import sys

local, tag = sys.argv[1:]
account = os.environ['AWS_ACCOUNT_ID']
assert re.fullmatch(r'[0-9]{12}', account)
assert re.fullmatch(r'[a-f0-9]{40}(-rollback-test)?', tag)
repository = 'factupro/mecanica-nextjs'
result = subprocess.run(['aws', 'ecr', 'describe-images', '--repository-name', repository,
                         '--image-ids', 'imageTag=' + tag], capture_output=True, text=True)
if result.returncode == 0:
    assert len(json.loads(result.stdout)['imageDetails']) == 1
    print('Commit image already published; immutable tag retained:', tag)
elif 'ImageNotFoundException' in result.stderr:
    destination = account + '.dkr.ecr.us-east-1.amazonaws.com/' + repository + ':' + tag
    subprocess.run(['docker', 'tag', local, destination], check=True)
    subprocess.run(['docker', 'push', destination], check=True)
else:
    raise RuntimeError('Unable to verify existing ECR image; refusing to publish')
