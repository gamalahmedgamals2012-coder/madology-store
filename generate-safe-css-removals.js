const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('scan-unused-css-v2-output.json', 'utf8'));
const htmlJsFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (p.endsWith('.html') || p.endsWith('.js')) htmlJsFiles.push(p);
  }
}
walk(path.join(process.cwd(), 'public'));
const usedCandidates = [];
for (const cls of data.unusedClasses) {
  const re = new RegExp(`\\b${cls}\\b`);
  for (const file of htmlJsFiles) {
    const text = fs.readFileSync(file, 'utf8');
    if (re.test(text)) {
      usedCandidates.push(cls);
      break;
    }
  }
}
const safeUnused = data.unusedClasses.filter(cls => !usedCandidates.includes(cls));
const cssFiles = fs.readdirSync('public').filter(f => f.endsWith('.css'));
const selectorsByClass = {};
for (const file of cssFiles) {
  const text = fs.readFileSync(path.join('public', file), 'utf8');
  const cleaned = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const parts = cleaned.split('{');
  for (let i = 0; i < parts.length - 1; i++) {
    const sel = parts[i].split(/\r?\n/).pop().trim();
    if (!sel) continue;
    for (const cls of safeUnused) {
      if (new RegExp(`\\.${cls}(?![A-Za-z0-9_-])`).test(sel)) {
        selectorsByClass[cls] = selectorsByClass[cls] || [];
        selectorsByClass[cls].push({ file, selector: sel });
      }
    }
  }
}
console.log('safeUnusedCount', safeUnused.length);
console.log('usedCandidatesCount', usedCandidates.length);
console.log('usedCandidates', usedCandidates.sort().join(','));
for (const cls of safeUnused.sort()) {
  console.log('SAFE', cls);
  const entries = selectorsByClass[cls] || [];
  for (const e of entries) console.log(' ', e.file, e.selector);
}
fs.writeFileSync('safe-unused-classes.json', JSON.stringify({ safeUnused, usedCandidates, selectorsByClass }, null, 2));
