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
const classAttrRegex = /class\s*=\s*['"]([^'"\\]+)['"]/g;
const idAttrRegex = /id\s*=\s*['"]([^'"\\]+)['"]/g;
const stringLiteralRegex = /['"]([^'"\\]*)['"]/g;
const templateLiteralRegex = /`([^`]*)`/gs;
const classListRegex = /classList\.(?:add|remove|toggle|contains)\(([^)]+)\)/g;
const classNameAssignRegex = /\.className\s*=\s*['"]([^'"\\]+)['"]/g;
const getIdRegex = /getElementById\(['"]([^'"\\]+)['"]\)/g;
const classNameRegex = /[A-Za-z0-9_-]+/g;
const classesInHtml = new Set();
const idsInHtml = new Set();
const classesInJs = new Set();
const idsInJs = new Set();
function extractClassesFromAttrText(text, set) {
  text.split(/\s+/).forEach(cls => {
    if (cls.trim()) set.add(cls.trim());
  });
}
function extractHtml(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(classAttrRegex)) extractClassesFromAttrText(m[1], classesInHtml);
  for (const m of text.matchAll(idAttrRegex)) idsInHtml.add(m[1]);
}
function extractJs(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(classAttrRegex)) extractClassesFromAttrText(m[1], classesInJs);
  for (const m of text.matchAll(idAttrRegex)) idsInJs.add(m[1]);
  for (const m of text.matchAll(classListRegex)) {
    const args = m[1];
    for (const s of args.matchAll(/['"]([^'"\\]+)['"]/g)) {
      extractClassesFromAttrText(s[1], classesInJs);
    }
  }
  for (const m of text.matchAll(classNameAssignRegex)) extractClassesFromAttrText(m[1], classesInJs);
  for (const m of text.matchAll(getIdRegex)) idsInJs.add(m[1]);
  for (const m of text.matchAll(stringLiteralRegex)) {
    const s = m[1];
    if (s.includes('class=')) {
      for (const mm of s.matchAll(classAttrRegex)) extractClassesFromAttrText(mm[1], classesInJs);
    }
  }
  for (const m of text.matchAll(templateLiteralRegex)) {
    const s = m[1];
    for (const mm of s.matchAll(classAttrRegex)) extractClassesFromAttrText(mm[1], classesInJs);
    for (const mm of s.matchAll(idAttrRegex)) idsInJs.add(mm[1]);
  }
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
    for (const m of sel.matchAll(/(?:^|[\s>+~,])\.([A-Za-z_-][A-Za-z0-9_-]*)/g)) cssClasses.add(m[1]);
    for (const m of sel.matchAll(/(?:^|[\s>+~,])#([A-Za-z_-][A-Za-z0-9_-]*)/g)) cssIds.add(m[1]);
  });
}
const usedClasses = new Set([...classesInHtml, ...classesInJs]);
const usedIds = new Set([...idsInHtml, ...idsInJs]);
const unusedClasses = [...cssClasses].filter(c => !usedClasses.has(c)).sort();
const unusedIds = [...cssIds].filter(i => !usedIds.has(i)).sort();
const output = { unusedClasses, unusedIds, classesInHtml: [...classesInHtml].sort(), idsInHtml: [...idsInHtml].sort(), classesInJs: [...classesInJs].sort(), idsInJs: [...idsInJs].sort() };
fs.writeFileSync('scan-unused-css-v2-output.json', JSON.stringify(output, null, 2));
console.log('scan complete');
