set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p /tmp/uitest && cp "$HERE"/*.js "$HERE"/*.html "$HERE"/*.py "$HERE"/*.json /tmp/uitest/ 2>/dev/null || true
cd /tmp/uitest
E=/opt/npm-tools/node_modules/.bin/esbuild
NODE_PATH=/opt/npm-tools/node_modules $E entry.js --bundle --minify --define:process.env.NODE_ENV='"production"' --outfile=react_bundle.js --log-level=error
python3 - <<'PY'
import re
s=open('/home/claude/rondoufit/index.html',encoding='utf-8').read()
m=re.search(r'<script type="text/babel">(.*)</script>\s*</body>',s,re.S)
open('/tmp/uitest/app.jsx','w',encoding='utf-8').write(m.group(1))
PY
$E app.jsx --loader:.jsx=jsx --jsx=transform --outfile=app.js --log-level=error
