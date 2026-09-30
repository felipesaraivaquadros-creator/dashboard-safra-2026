const fs = require('node:fs');
const path = require('node:path');
const root = path.dirname(require.resolve('pdfjs-dist/package.json'));
const target = path.join(__dirname, '..', 'public', 'pdfjs');
fs.mkdirSync(target, { recursive: true });
for (const name of ['pdf.mjs', 'pdf.worker.mjs']) {
  fs.copyFileSync(path.join(root, 'build', name), path.join(target, name));
}
