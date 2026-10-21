const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
// Keep the portal usable when its HTML is opened without a separate asset server.
const html = read('src/index.html')
  .replaceAll('__MEDICARD_LOGO_SVG__', 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(__dirname, 'public/assets/medicard-logo.svg')).toString('base64'))
  .replaceAll('__MEDICARD_LOGO_PNG__', 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'public/assets/medicard-logo.png')).toString('base64'))
  .replace('<link rel="stylesheet" href="./style.css">', () => `<style>${read('public/style.css')}</style>`)
  .replace('<script src="./app.js"></script>', () => `<script>${read('public/vendor/jspdf.umd.min.js')}\n${read('public/vendor/jspdf.plugin.autotable.min.js')}\n${read('public/app.js').replace(/<\/script/gi, '<\\/script')}</script>`);
fs.writeFileSync(path.join(__dirname, 'public/index.html'), html);

fs.mkdirSync(path.join(__dirname, 'docs'), {recursive: true});
fs.writeFileSync(path.join(__dirname, 'docs/index.html'), html);
fs.writeFileSync(path.join(__dirname, 'docs/.nojekyll'), '');
