#!/usr/bin/env python3
"""Invoke the fixed document and wait for a verified deployment or rollback."""
import json
import os
import re
import subprocess
import sys
import time

sha = os.environ['GITHUB_SHA']
assert re.fullmatch(r'[a-f0-9]{40}', sha)
drill = '--rollback-test' in sys.argv
tag = sha + ('-rollback-test' if drill else '')
instance = os.environ['PLATFORM_INSTANCE_ID']
assert re.fullmatch(r'i-[a-f0-9]{17}', instance)
base = ['aws', '--region', 'us-east-1', '--output', 'json', 'ssm']
result = json.loads(subprocess.check_output(base + [
    'send-command', '--instance-ids', instance,
    '--document-name', 'factupro-platform-production-deploy-mecanica-nextjs',
    '--parameters', json.dumps({'ImageTag': [tag]}),
    '--timeout-seconds', '900', '--comment', 'mecanica-nextjs commit ' + tag,
], text=True))
command = result['Command']['CommandId']
print('SSM command:', command, flush=True)
for attempt in range(150):
    response = subprocess.run(base + ['get-command-invocation', '--command-id', command,
                              '--instance-id', instance], capture_output=True, text=True)
    if response.returncode:
        if 'InvocationDoesNotExist' not in response.stderr:
            raise RuntimeError('Cannot read SSM invocation')
    else:
        invocation = json.loads(response.stdout)
        status = invocation['Status']
        if status not in ('Pending', 'InProgress', 'Delayed'):
            output = invocation.get('StandardOutputContent', '').splitlines()
            if drill:
                assert status == 'Failed' and f'ROLLBACK_OK revision={sha}' in output, 'Rollback not verified'
                print('ROLLBACK_TEST_OK restored revision=' + sha)
            else:
                assert status == 'Success' and f'DEPLOY_OK revision={sha}' in output, 'Deployment not verified'
                print('DEPLOY_OK revision=' + sha)
            break
    time.sleep(6)
else:
    raise RuntimeError('SSM timed out; inspect state before retrying')
