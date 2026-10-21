const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
// Keep the portal usable when its HTML is opened without a separate asset server.
const html = read('src/index.html')
  .replace('<link rel="stylesheet" href="./style.css">', () => `<style>${read('public/style.css')}</style>`)
  .replace('<script src="./app.js"></script>', () => `<script>${read('public/vendor/jspdf.umd.min.js')}\n${read('public/vendor/jspdf.plugin.autotable.min.js')}\n${read('public/app.js').replace(/<\/script/gi, '<\\/script')}</script>`);
fs.writeFileSync(path.join(__dirname, 'public/index.html'), html);

fs.mkdirSync(path.join(__dirname, 'docs'), {recursive: true});
fs.writeFileSync(path.join(__dirname, 'docs/index.html'), html);
fs.writeFileSync(path.join(__dirname, 'docs/.nojekyll'), '');
