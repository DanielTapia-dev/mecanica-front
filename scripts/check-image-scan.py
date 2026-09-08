#!/usr/bin/env python3
"""Require a completed ECR basic scan with no CRITICAL findings before deploy."""
import json
import re
import subprocess
import sys
import time

tag = sys.argv[1]
assert re.fullmatch(r'[a-f0-9]{40}(-rollback-test)?', tag)
command = ['aws', 'ecr', 'describe-image-scan-findings', '--region', 'us-east-1',
           '--repository-name', 'factupro/mecanica-nextjs', '--image-id', 'imageTag=' + tag]
for attempt in range(60):
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode:
        if 'ScanNotFoundException' not in result.stderr:
            raise RuntimeError('Unable to read ECR image scan')
    else:
        scan = json.loads(result.stdout)
        status = scan['imageScanStatus']['status']
        if status == 'COMPLETE':
            counts = scan.get('imageScanFindings', {}).get('findingSeverityCounts', {})
            print('ECR scan severity counts:', json.dumps(counts, sort_keys=True))
            if counts.get('CRITICAL', 0):
                raise RuntimeError('Critical image findings block deployment')
            break
        if status not in ('PENDING', 'IN_PROGRESS'):
            raise RuntimeError('ECR scan did not complete: ' + status)
    time.sleep(5)
else:
    raise RuntimeError('ECR image scan timed out; deployment not attempted')
