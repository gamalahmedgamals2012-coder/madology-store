const fs = require('fs');
const path = require('path');
const audit = JSON.parse(fs.readFileSync('scan-unused-css-v2-output.json', 'utf8'));
const unusedClasses = new Set(audit.unusedClasses);
const cssFiles = fs.readdirSync('public').filter(f => f.endsWith('.css')).map(f => path.join('public', f));
for (const file of cssFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const cls of unusedClasses) {
      if (!cls) continue;
      const re = new RegExp(`\\.${cls}(?![A-Za-z0-9_-])`);
      if (re.test(line)) {
        console.log(`${path.basename(file)}:${i + 1}: ${line.trim()}  // ${cls}`);
      }
    }
  }
}
