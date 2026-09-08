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
backend_name = name + '-backend'
network = name + '-net'
revision = 'a' * 40
backend_host = 'mecanica-backend'

mock_backend = r"""
const http = require('http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/mecanica/login' && req.method === 'POST') {
      res.end(JSON.stringify({
        token: 'synthetic-session-token',
        usuario: {
          id: '1',
          username: 'smoke-user',
          nombre: 'Smoke',
          activo: true,
          rol: {
            id: 'role-1',
            codigo: 'ADMIN',
            nombre: 'Administrador',
            estados: Array.from({ length: 200 }, (_, index) => ({
              id: 'state-' + index,
              codigo: 'STATE_' + index
            }))
          }
        }
      }));
      return;
    }
    if (req.url === '/api/mecanica/roles' && req.headers.authorization === 'Bearer synthetic-session-token') {
      res.end(JSON.stringify({ roles: [] }));
      return;
    }
    res.statusCode = 403;
    res.end(JSON.stringify({ message: 'La petición no tiene la cabecera de autenticación' }));
  });
}).listen(8011, '0.0.0.0');
"""

session_smoke = r"""
const origin = 'http://127.0.0.1:3000';
(async () => {
  const login = await fetch(origin + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'smoke-user', password: 'smoke-password' })
  });
  if (login.status !== 200) process.exit(1);
  const loginPayload = await login.json();
  if (loginPayload.user.roles[0].estados.length !== 200) process.exit(1);
  const setCookies = login.headers.getSetCookie();
  const cookie = setCookies.map(value => value.split(';', 1)[0]).join('; ');
  if (!cookie.includes('mecanica_auth_token=synthetic-session-token') || !cookie.includes('mecanica_auth_user=')) process.exit(1);
  const userSetCookie = setCookies.find(value => value.startsWith('mecanica_auth_user='));
  if (!userSetCookie || userSetCookie.length >= 4096) process.exit(1);
  const roles = await fetch(origin + '/api/mecanica/roles', { headers: { Cookie: cookie } });
  if (roles.status !== 200) process.exit(1);
  const userCookie = cookie.split('; ').find(value => value.startsWith('mecanica_auth_user='));
  const incompleteSession = await fetch(origin + '/api/auth/session', { headers: { Cookie: userCookie } });
  if (incompleteSession.status !== 401) process.exit(1);
})().catch(() => process.exit(1));
"""

def run(*args):
    return subprocess.check_output(args, text=True)

metadata = json.loads(run('docker', 'image', 'inspect', image))[0]
assert metadata['Architecture'] == 'arm64'
assert metadata['Config']['User'] in ('node', '1000:1000')
try:
    run('docker', 'network', 'create', '--internal', network)
    run('docker', 'run', '-d', '--name', backend_name, '--network', network,
        '--network-alias', backend_host, '--read-only', '--cap-drop=ALL',
        '--security-opt=no-new-privileges:true', '--memory=128m', '--cpus=0.25',
        '--entrypoint', 'node', image, '-e', mock_backend)
    command = ['docker', 'run', '-d', '--name', name, '--network', network,
               '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges:true',
               '--memory=600m', '--cpus=0.5', '--tmpfs', '/tmp:size=32m,mode=1777',
               '-e', 'APP_REVISION=' + revision,
               '-e', 'MECANICA_BACKEND_URL=http://' + backend_host + ':8011']
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
    run('docker', 'exec', name, 'node', '-e', session_smoke)
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
    subprocess.run(['docker','rm','-f',backend_name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    subprocess.run(['docker','network','rm',network],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
