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
const htmlClassRegex = /class\s*=\s*["']([^"']+)["']/g;
const htmlIdRegex = /id\s*=\s*["']([^"']+)["']/g;
const cssClassRegex = /\.([A-Za-z0-9_-]+)/g;
const cssIdRegex = /#([A-Za-z0-9_-]+)/g;
const stringLiteralRegex = /['"]([^'"\\]+)['"]/g;
const classesInHtml = new Set();
const idsInHtml = new Set();
const classesInJs = new Set();
const idsInJs = new Set();
const classesInHtmlOrJs = new Set();
function extractHtml(file) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = htmlClassRegex.exec(text))) {
    m[1].split(/\s+/).forEach(c => classesInHtml.add(c));
  }
  while ((m = htmlIdRegex.exec(text))) idsInHtml.add(m[1]);
}
function extractJs(file) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = stringLiteralRegex.exec(text))) {
    const value = m[1];
    if (!value) continue;
    const parts = value.split(/\s+/);
    for (const part of parts) {
      if (/^[A-Za-z0-9_-]+$/.test(part)) {
        classesInJs.add(part);
      }
    }
  }
  if (/getElementById\(['"][^'"\\]+['"]\)/.test(text)) {
    const ids = [...text.matchAll(/getElementById\(['"]([^'"\\]+)['"]\)/g)];
    ids.forEach(m => idsInJs.add(m[1]));
  }
  // classList operations
  const classOps = [...text.matchAll(/classList\.(?:add|remove|toggle|contains)\(([^)]+)\)/g)];
  classOps.forEach(m => {
    const arg = m[1];
    const strings = [...arg.matchAll(/['"]([^'"\\]+)['"]/g)];
    strings.forEach(s => classesInJs.add(s[1]));
  });
  const classNameOps = [...text.matchAll(/\.className\s*=\s*['"]([^'"\\]+)['"]/g)];
  classNameOps.forEach(m => m[1].split(/\s+/).forEach(c => classesInJs.add(c)));
}
function extractCss(file) {
  const text = fs.readFileSync(file, 'utf8');
  const cleaned = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  const parts = cleaned.split('{');
  for (let i = 0; i < parts.length - 1; i++) {
    const sel = parts[i].split(/\r?\n/).pop().trim();
    if (!sel) continue;
    selectors.push(sel);
  }
  return selectors;
}
htmlFiles.forEach(extractHtml);
jsFiles.forEach(extractJs);
const cssClasses = new Set();
const cssIds = new Set();
const cssSelectors = [];
for (const file of cssFiles) {
  const selectors = extractCss(file);
  selectors.forEach(sel => {
    cssSelectors.push({file, selector: sel});
    for (const m of sel.matchAll(cssClassRegex)) cssClasses.add(m[1]);
    for (const m of sel.matchAll(cssIdRegex)) cssIds.add(m[1]);
  });
}
const usedClasses = new Set([...classesInHtml, ...classesInJs]);
const usedIds = new Set([...idsInHtml, ...idsInJs]);
const unusedClasses = [...cssClasses].filter(c => !usedClasses.has(c)).sort();
const unusedIds = [...cssIds].filter(i => !usedIds.has(i)).sort();
const output = { unusedClasses, unusedIds, usedClasses: [...usedClasses].sort(), usedIds: [...usedIds].sort(), cssSelectors };
fs.writeFileSync('scan-unused-css-output.json', JSON.stringify(output, null, 2));
console.log('scan complete');
