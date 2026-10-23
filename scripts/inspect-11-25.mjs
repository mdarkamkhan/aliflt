import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/curated-sets-analysis.json', 'utf-8'));

// Filter out crape as well!
function isFilteredOut(f) {
  const title = (f.title || '').toLowerCase();
  const id = (f.id || '').toLowerCase();
  const cat = (f.category || '').toLowerCase();
  return title.includes('crape') || title.includes('crepe') || id.includes('crape') || id.includes('crepe') || cat.includes('crape') || cat.includes('crepe');
}

console.log('=== Curated Sets 11 to 25 Details (Filtering Crape/Crepe) ===');
for (let i = 11; i <= 25; i++) {
  const pad = String(i).padStart(3, '0');
  const setId = `curated-set-alif-set-${pad}`;
  const setObj = data.find(s => s.id === setId);
  if (!setObj) {
    console.log(`Set ${setId} not found!`);
    continue;
  }
  const validFabrics = setObj.fabrics.filter(f => !isFilteredOut(f));
  console.log(`\n[${setId}] "${setObj.title}"`);
  console.log(`  Valid Fabrics (${validFabrics.length}):`);
  validFabrics.slice(0, 3).forEach((f, idx) => {
    console.log(`    ${idx + 1}. [${f.id}] "${f.title}" (${f.category}) -> ${f.image}`);
  });
}
