#!/usr/bin/env python3
"""Real ARM64 HTTP smoke on an isolated local Docker network; no AWS or production calls."""
import json
import secrets
import subprocess
import sys
import time

APP = 'mecanica-nextjs'
image = sys.argv[1]
name = 'phase7-smoke-' + secrets.token_hex(6)
network = name + '-net'
revision = 'a' * 40

def run(*args):
    return subprocess.check_output(args, text=True)

metadata = json.loads(run('docker', 'image', 'inspect', image))[0]
assert metadata['Architecture'] == 'arm64'
assert metadata['Config']['User'] in ('node', '1000:1000')
try:
    run('docker', 'network', 'create', '--internal', network)
    command = ['docker', 'run', '-d', '--name', name, '--network', network,
               '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges:true',
               '--memory=600m', '--cpus=0.5', '--tmpfs', '/tmp:size=32m,mode=1777',
               '-e', 'APP_REVISION=' + revision]
    if APP != 'factupro-angular':
        command += ['--tmpfs', '/app/.next/cache:size=64m,uid=1000,gid=1000,mode=0700']
    run(*command, image)
    for attempt in range(45):
        result = subprocess.run(['docker', 'exec', name, 'wget', '-qO-',
                                  'http://127.0.0.1:3000/.well-known/platform-health'], capture_output=True, text=True)
        if result.returncode == 0:
            assert json.loads(result.stdout) == {'status':'ok','revision':revision}
            break
        time.sleep(1)
    else:
        raise RuntimeError('Image health did not become ready')
    html = run('docker', 'exec', name, 'wget', '-qO-', 'http://127.0.0.1:3000/')
    assert '<html' in html.lower()
    if APP == 'factupro-nextjs':
        run('docker', 'exec', name, 'node', '-e', "fetch('http://127.0.0.1:3000/dashboard',{redirect:'manual'}).then(r=>{if(r.status!==307||!r.headers.get('location').includes('/?next='))process.exit(1)})")
    if APP != 'factupro-angular':
        run('docker','exec',name,'node','-e',"if(Object.keys(process.env).some(k=>k.startsWith('DB_')||k.startsWith('AWS_')||k==='DATABASE_URL'))process.exit(1)")
    run('docker', 'stop', '--time', '15', name)
    state=json.loads(run('docker','inspect',name))[0]['State']
    assert state['ExitCode'] in (0, 143) and not state['OOMKilled']
    print(APP + ': ARM64 health/revision, HTML, isolation and shutdown without SIGKILL/OOM passed')
finally:
    subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    subprocess.run(['docker','network','rm',network],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
