const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'public');
const htmlFiles = [];
const cssFiles = [];
const jsFiles = [];
const visit = dir => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) visit(full);
    else if (full.endsWith('.html')) htmlFiles.push(full);
    else if (full.endsWith('.css')) cssFiles.push(full);
    else if (full.endsWith('.js')) jsFiles.push(full);
  }
};
visit(root);
const textFiles = [...htmlFiles, ...cssFiles, ...jsFiles];
const htmlClassRe = /class\s*=\s*(['"])([^"'\\]*)\1/g;
const idRe = /id\s*=\s*(['"])([^"'\\]*)\1/g;
const classNameRe = /className\s*=\s*(['"])([^"'\\]*)\1/g;
const classListRe = /classList\.(?:add|remove|toggle|contains)\s*\(([^)]*)\)/g;
const queryClassRe = /(?:querySelectorAll|querySelector|getElementsByClassName|getElementsByName|closest|matches)\s*\(\s*(['"])(\.[^"'\\]+)\1\s*\)/g;
const queryIdRe = /(?:querySelectorAll|querySelector|getElementById|closest|matches)\s*\(\s*(['"])(#[^"'\\]+)\1\s*\)/g;
const jsSelectorRe = /(?:querySelectorAll|querySelector|matches|closest)\s*\(\s*(['"])([^"'\\]+)\1\s*\)/g;
const cssRuleRe = /([^{}]+)\{/g;
const cssVarDeclRe = /--([A-Za-z0-9_-]+)\s*:/g;
const cssVarUseRe = /var\(--([A-Za-z0-9_-]+)\)/g;
const keyframesDeclRe = /@keyframes\s+([A-Za-z0-9_-]+)/g;
const animationNameRe = /animation-name\s*:\s*([^;]+);/g;
const animationRe = /animation\s*:\s*([^;]+);/g;
const cssLineCommentRe = /\/\*([\s\S]*?)\*\//g;
function addWords(str, set) {
  if (!str) return;
  str.split(/\s+/).map(s => s.trim()).filter(Boolean).forEach(v => set.add(v));
}
const usedClassesHtml = new Set();
const usedIdsHtml = new Set();
const usedClassesJs = new Set();
const usedIdsJs = new Set();
const classesInCss = new Set();
const idsInCss = new Set();
const customClasses = new Set();
const customIds = new Set();
const selectors = [];
const selectorCounts = new Map();
const mediaQueries = new Map();
const keyframes = new Map();
const keyframesUsed = new Set();
const cssVars = new Set();
const cssVarsUsed = new Set();
const duplicateDeclarations = new Map();
const fileContents = {};
for (const file of textFiles) fileContents[file] = fs.readFileSync(file, 'utf8');
for (const file of htmlFiles) {
  const text = fileContents[file];
  let match;
  while ((match = htmlClassRe.exec(text))) addWords(match[2], usedClassesHtml);
  while ((match = idRe.exec(text))) usedIdsHtml.add(match[2].trim());
}
for (const file of jsFiles) {
  const text = fileContents[file];
  let match;
  while ((match = classNameRe.exec(text))) addWords(match[2], usedClassesJs);
  while ((match = classListRe.exec(text))) {
    const args = match[1];
    for (const s of args.matchAll(/['"]([^"'\\]+)['"]/g)) addWords(s[1], usedClassesJs);
  }
  while ((match = queryClassRe.exec(text))) usedClassesJs.add(match[2].slice(1));
  while ((match = queryIdRe.exec(text))) usedIdsJs.add(match[2].slice(1));
  while ((match = jsSelectorRe.exec(text))) {
    const sel = match[2].trim();
    const clsMatch = sel.match(/\.([A-Za-z0-9_-]+)/g);
    const idMatch = sel.match(/#([A-Za-z0-9_-]+)/g);
    if (clsMatch) clsMatch.forEach(m => usedClassesJs.add(m.slice(1)));
    if (idMatch) idMatch.forEach(m => usedIdsJs.add(m.slice(1)));
  }
  while ((match = htmlClassRe.exec(text))) addWords(match[2], usedClassesJs);
  while ((match = idRe.exec(text))) usedIdsJs.add(match[2].trim());
  while ((match = text.match(/`([^`]*)`/g)) && match.length) {
    for (const tpl of match) {
      const inner = tpl.slice(1,-1);
      let innerMatch;
      while ((innerMatch = htmlClassRe.exec(inner))) addWords(innerMatch[2], usedClassesJs);
      while ((innerMatch = idRe.exec(inner))) usedIdsJs.add(innerMatch[2].trim());
    }
  }
}
for (const file of cssFiles) {
  const text = fileContents[file];
  const cleaned = text.replace(cssLineCommentRe, '');
  let match;
  while ((match = cssRuleRe.exec(cleaned))) {
    const selector = match[1].trim();
    if (selector) {
      selectors.push({file, selector});
      selectorCounts.set(selector, (selectorCounts.get(selector) || 0) + 1);
      for (const m of selector.matchAll(/\.([A-Za-z0-9_-]+)/g)) classesInCss.add(m[1]);
      for (const m of selector.matchAll(/#([A-Za-z0-9_-]+)/g)) idsInCss.add(m[1]);
    }
  }
  while ((match = cssVarDeclRe.exec(cleaned))) cssVars.add(match[1]);
  while ((match = cssVarUseRe.exec(cleaned))) cssVarsUsed.add(match[1]);
  while ((match = keyframesDeclRe.exec(cleaned))) keyframes.set(match[1], (keyframes.get(match[1]) || 0) + 1);
  while ((match = animationNameRe.exec(cleaned))) keyframesUsed.add(match[1].trim());
  while ((match = animationRe.exec(cleaned))) {
    const vals = match[1].split(/\s+/).filter(Boolean);
    if (vals.length && !/^[0-9.]/.test(vals[0])) keyframesUsed.add(vals[0]);
  }
  for (const line of cleaned.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@media')) {
      mediaQueries.set(trimmed, (mediaQueries.get(trimmed) || 0) + 1);
    }
  }
}
const allUsedClasses = new Set([...usedClassesHtml, ...usedClassesJs]);
const allUsedIds = new Set([...usedIdsHtml, ...usedIdsJs]);
const unusedClasses = [...classesInCss].filter(c => !allUsedClasses.has(c)).sort();
const unusedIds = [...idsInCss].filter(i => !allUsedIds.has(i)).sort();
const unusedVars = [...cssVars].filter(v => !cssVarsUsed.has(v));
const unusedKeyframes = [...keyframes.keys()].filter(k => !keyframesUsed.has(k));
const duplicatedSelectors = [...selectorCounts.entries()].filter(([sel,c]) => c > 1);
const report = {
  htmlFiles, jsFiles, cssFiles,
  usedClassesHtml:[...usedClassesHtml].sort(), usedIdsHtml:[...usedIdsHtml].sort(),
  usedClassesJs:[...usedClassesJs].sort(), usedIdsJs:[...usedIdsJs].sort(),
  classesInCss:[...classesInCss].sort(), idsInCss:[...idsInCss].sort(),
  unusedClasses, unusedIds, unusedVars, unusedKeyframes,
  duplicatedSelectors,
  mediaQueries:[...mediaQueries.entries()],
  keyframes:[...keyframes.entries()],
};
fs.writeFileSync(path.join(process.cwd(), 'frontend-dependency-report.json'), JSON.stringify(report, null, 2));
console.log('Report written to frontend-dependency-report.json');
