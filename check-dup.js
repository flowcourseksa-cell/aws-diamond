const fs = require('fs');
const path = require('path');
const dir = path.join('lib', 'data', 'facts');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

let allFacts = new Set();
let duplicates = [];
let count = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // Match text between quotes
  const matches = content.match(/"([^"]+)"/g);
  if (matches) {
    for (let m of matches) {
      if (m.length > 20) {
        if (allFacts.has(m)) {
          duplicates.push(m);
        } else {
          allFacts.add(m);
        }
        count++;
      }
    }
  }
}
console.log('Total extracted strings:', count);
console.log('Duplicates found:', duplicates.length);
if (duplicates.length > 0) {
  console.log('Sample duplicates:', duplicates.slice(0, 5));
}
