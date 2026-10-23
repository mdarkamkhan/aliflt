import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/curated-sets-analysis.json', 'utf-8'));

console.log('=== Sample Sets with 1 fabric ===');
data.filter(s => s.fabricCount === 1).slice(0, 5).forEach(s => {
  console.log(`- [${s.id}] "${s.title}":`, s.fabrics.map(f => `${f.title} (${f.category})`));
});

console.log('\n=== Sample Sets with 4 fabrics ===');
data.filter(s => s.fabricCount === 4).slice(0, 5).forEach(s => {
  console.log(`- [${s.id}] "${s.title}":`, s.fabrics.map(f => `${f.title} (${f.category})`));
});
