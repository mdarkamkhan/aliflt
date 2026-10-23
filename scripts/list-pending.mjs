import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/curated-sets-analysis.json', 'utf-8'));
const pending = data.filter(s => !s.alreadyGenerated);

console.log(`Total Pending: ${pending.length}`);
console.log('--- Next 10 Sets to Process ---');
pending.slice(0, 10).forEach((s, idx) => {
  console.log(`\n#${idx + 1}: ${s.id} | "${s.title}"`);
  console.log(`  Fabrics (${s.fabrics.length}):`);
  s.fabrics.forEach(f => {
    console.log(`   - [${f.id}] ${f.title} (${f.category}) -> ${f.image} [exists: ${f.existsOnDisk}]`);
  });
});
