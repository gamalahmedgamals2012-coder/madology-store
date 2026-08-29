const fs = require('fs');
const path = require('path');
const audit = JSON.parse(fs.readFileSync('selector-audit-output.json','utf8'));
const unused = new Set(audit.unusedCssClasses);
for (const file of audit.cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const cls of unused) {
      if (!cls) continue;
      const re = new RegExp(`\\.${cls}(?![A-Za-z0-9_-])`);
      if (re.test(line)) {
        console.log(`${path.basename(file)}:${i+1}: ${line.trim()}`);
      }
    }
  }
}
