const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('safe-unused-classes.json', 'utf8'));
const safeUnused = data.safeUnused;
const cssFiles = fs.readdirSync('public').filter(f => f.endsWith('.css'));
for (const cssFile of cssFiles) {
  const fullPath = path.join('public', cssFile);
  const text = fs.readFileSync(fullPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const keep = [];
  const removed = [];
  let insideRule = false;
  let ruleBuffer = [];
  let ruleSelectors = [];
  let braceDepth = 0;
  const flushRule = () => {
    if (!insideRule) return;
    const selectorText = ruleSelectors.join(' ');
    const removeRule = safeUnused.some(cls => new RegExp(`\\.${cls}(?![A-Za-z0-9_-])`).test(selectorText));
    if (removeRule) {
      removed.push({selector: selectorText, text: ruleBuffer.join('\n')});
    } else {
      keep.push(...ruleBuffer);
    }
    ruleBuffer = [];
    ruleSelectors = [];
    insideRule = false;
    braceDepth = 0;
  };
  for (const line of lines) {
    if (!insideRule) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('@import')) {
        keep.push(line);
        continue;
      }
      if (trimmed.endsWith('{')) {
        insideRule = true;
        ruleBuffer = [line];
        ruleSelectors = [trimmed.slice(0, -1).trim()];
        braceDepth = 1;
        continue;
      }
      keep.push(line);
    } else {
      ruleBuffer.push(line);
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      if (braceDepth === 0) {
        flushRule();
      }
    }
  }
  const out = keep.join('\n');
  fs.writeFileSync(fullPath, out, 'utf8');
  if (removed.length) {
    console.log(`Updated ${cssFile}: removed ${removed.length} rules`);
  }
}
