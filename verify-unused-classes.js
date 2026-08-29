const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('scan-unused-css-v2-output.json', 'utf8'));
const unusedClasses = data.unusedClasses;
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (p.endsWith('.html') || p.endsWith('.js')) files.push(p);
  }
}
walk(path.join(process.cwd(), 'public'));
const results = {};
for (const cls of unusedClasses) {
  const re = new RegExp(`\\b${cls}\\b`);
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (re.test(text)) {
      if (!results[cls]) results[cls] = [];
      results[cls].push(file);
    }
  }
}
const hits = Object.keys(results).length;
console.log(`found ${hits} used classes among ${unusedClasses.length} candidates`);
for (const cls of Object.keys(results).sort()) {
  console.log(cls, results[cls].join(', '));
}
