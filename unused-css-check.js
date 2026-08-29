const fs = require('fs');
const path = require('path');
const audit = JSON.parse(fs.readFileSync('selector-audit-output.json', 'utf8'));
const candidates = audit.unusedCssClasses;
const files = fs.readdirSync(path.join('public')).filter(f => f.match(/\.(html|js)$/));
const results = [];
for (const cls of candidates) {
  const regex = new RegExp(`\\b${cls}\\b`, 'g');
  const uses = [];
  for (const file of files) {
    const text = fs.readFileSync(path.join('public', file), 'utf8');
    if (regex.test(text)) uses.push(file);
  }
  results.push({class: cls, used: uses.length > 0, files: uses});
}
const used = results.filter(r => r.used);
const unused = results.filter(r => !r.used);
console.log('USED_IN_HTML_JS', used.length);
used.slice(0, 200).forEach(r => console.log(`${r.class}: ${r.files.join(', ')}`));
console.log('UNUSED', unused.length);
unused.forEach(r => console.log(r.class));
