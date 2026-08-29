const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'public');
const htmlFiles = [];
const cssFiles = [];
const jsFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (name.endsWith('.html')) htmlFiles.push(p);
    else if (name.endsWith('.css')) cssFiles.push(p);
    else if (name.endsWith('.js')) jsFiles.push(p);
  }
}
walk(root);
const classRegex = /(?:class|className)\s*=\s*["']([^"']+)["']/g;
const idRegex = /(?:id|idName)\s*=\s*["']([^"']+)["']/g;
const getIdRegex = /getElementById\(['"]([^'"\)]+)['"]\)/g;
const querySelectorRegex = /querySelector(?:All)?\s*\(\s*['"]([^'"\)]+)['"]\s*\)/g;
const classesInHtml = new Set();
const idsInHtml = new Set();
const classesInJs = new Set();
const idsInJs = new Set();
function collectFromText(text, classes, ids) {
  let m;
  while ((m = classRegex.exec(text))) m[1].split(/\s+/).forEach(c => classes.add(c));
  while ((m = idRegex.exec(text))) ids.add(m[1]);
  while ((m = querySelectorRegex.exec(text))) {
    const sel = m[1].trim();
    if (sel.startsWith('.')) classes.add(sel.slice(1));
    else if (sel.startsWith('#')) ids.add(sel.slice(1));
    for (const part of sel.match(/[.#]([A-Za-z0-9_-]+)/g) || []) {
      if (part.startsWith('.')) classes.add(part.slice(1));
      else if (part.startsWith('#')) ids.add(part.slice(1));
    }
  }
}
for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  collectFromText(text, classesInHtml, idsInHtml);
}
for (const file of jsFiles) {
  const text = fs.readFileSync(file, 'utf8');
  collectFromText(text, classesInJs, idsInJs);
  let m;
  while ((m = getIdRegex.exec(text))) idsInJs.add(m[1]);
}
const cssClasses = new Set();
const cssIds = new Set();
for (const file of cssFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const cleaned = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const parts = cleaned.split('{');
  for (let i = 0; i < parts.length - 1; i++) {
    const sel = parts[i].split('\n').pop().trim();
    if (!sel) continue;
    const chunkSelectors = sel.split(',').map(s => s.trim());
    for (const s of chunkSelectors) {
      for (const m of s.matchAll(/\.([A-Za-z0-9_-]+)/g)) cssClasses.add(m[1]);
      for (const m of s.matchAll(/#([A-Za-z0-9_-]+)/g)) cssIds.add(m[1]);
    }
  }
}
const unusedCssClasses = [...cssClasses].filter(c => !classesInHtml.has(c) && !classesInJs.has(c)).sort();
const unusedCssIds = [...cssIds].filter(i => !idsInHtml.has(i) && !idsInJs.has(i)).sort();
const classesUnusedByCss = [...new Set([...classesInHtml, ...classesInJs])].filter(c => !cssClasses.has(c)).sort();
const idsUnusedByCss = [...new Set([...idsInHtml, ...idsInJs])].filter(i => !cssIds.has(i)).sort();
const result = {
  htmlFiles,
  cssFiles,
  jsFiles,
  classesInHtml: [...classesInHtml].sort(),
  idsInHtml: [...idsInHtml].sort(),
  classesInJs: [...classesInJs].sort(),
  idsInJs: [...idsInJs].sort(),
  cssClasses: [...cssClasses].sort(),
  cssIds: [...cssIds].sort(),
  unusedCssClasses,
  unusedCssIds,
  classesUnusedByCss,
  idsUnusedByCss,
};
fs.writeFileSync(path.join(process.cwd(), 'selector-audit-output.json'), JSON.stringify(result, null, 2));
console.log('selector audit complete.');
