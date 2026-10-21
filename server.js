const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'public');
http.createServer((req, res) => {
  const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'};
  const file = files[req.url.split('?')[0]];
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', {'html':'text/html','js':'text/javascript','css':'text/css'}[file.split('.').pop()] + '; charset=utf-8');
  fs.createReadStream(path.join(root, file)).pipe(res);
}).listen(process.env.PORT || 3000, '0.0.0.0');
