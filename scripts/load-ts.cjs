const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createRequire } = require('node:module');
const cache = new Map();
module.exports = function loadTs(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports:{} };
  cache.set(file,mod);
  const nativeRequire = createRequire(file);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
  }).outputText;
  new Function('exports','require','module',code)(mod.exports, id => {
    const relative = path.resolve(path.dirname(file),id+'.ts');
    return id.startsWith('.') && fs.existsSync(relative) ? module.exports(relative) : nativeRequire(id);
  },mod);
  return mod.exports;
};
