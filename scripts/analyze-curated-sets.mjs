import fs from 'fs';
import path from 'path';

const productsDir = 'src/content/products';
const allFiles = fs.readdirSync(productsDir);

const productsMap = new Map();

for (const file of allFiles) {
  if (!file.endsWith('.md')) continue;
  const content = fs.readFileSync(path.join(productsDir, file), 'utf-8');
  const id = file.replace(/\.md$/, '');
  
  // Extract frontmatter
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  const fmLines = match[1].split(/\r?\n/);
  const data = {};
  for (const line of fmLines) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) {
      let val = kv[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      data[kv[1]] = val;
    }
  }
  productsMap.set(id, { id, file, data, rawContent: content });
}

// Accessory filter
const accessoryCategories = ['lace', 'latkan', 'tailoring material', 'tailoring matrial', 'tailoring-material', 'fall', 'thread', 'needles', 'oil', 'chalk'];
const accessoryWords = ['lace', 'latkan', 'needle', 'chalk', 'oil', 'tape', 'bobbin', 'thread', 'fall', 'border'];

function isAccessory(p) {
  if (!p) return true;
  const cat = (p.data.category || '').toLowerCase();
  const title = (p.data.title || '').toLowerCase();
  const id = p.id.toLowerCase();

  if (accessoryCategories.some(c => cat === c || cat.includes(c))) return true;
  if (accessoryWords.some(w => title.includes(w) || id.includes(w))) return true;
  return false;
}

const curatedSets = [];

for (const [id, prod] of productsMap.entries()) {
  if (!id.startsWith('curated-set-')) continue;

  // Extract combo_products
  const comboMatch = prod.rawContent.match(/combo_products:\s*\r?\n([\s\S]*?)(?:\r?\n[a-zA-Z0-9_-]+:|$)/);
  const comboIds = [];
  if (comboMatch) {
    const lines = comboMatch[1].split(/\r?\n/);
    for (const l of lines) {
      const idMatch = l.match(/-\s*id:\s*["']?([^"'\r\n]+)["']?/);
      if (idMatch) {
        comboIds.push(idMatch[1].trim());
      }
    }
  }

  // Find fabric pieces
  const pieces = [];
  for (const cid of comboIds) {
    const cp = productsMap.get(cid);
    if (!cp) {
      pieces.push({ id: cid, found: false });
    } else {
      const isAcc = isAccessory(cp);
      pieces.push({
        id: cid,
        found: true,
        title: cp.data.title,
        category: cp.data.category,
        image: cp.data.image,
        isAccessory: isAcc
      });
    }
  }

  const fabrics = pieces.filter(p => p.found && !p.isAccessory);
  const alreadyGenerated = fs.existsSync(path.join('public', 'uploads', 'curated-sets', `${id}.webp`));

  curatedSets.push({
    id,
    title: prod.data.title,
    currentImage: prod.data.image,
    alreadyGenerated,
    totalPieces: pieces.length,
    fabricCount: fabrics.length,
    fabrics: fabrics.map(f => ({
      id: f.id,
      title: f.title,
      category: f.category,
      image: f.image,
      existsOnDisk: fs.existsSync(path.join('public', f.image?.replace(/^\//, '') || ''))
    }))
  });
}

console.log(`Total Curated Sets: ${curatedSets.length}`);
const alreadyDone = curatedSets.filter(s => s.alreadyGenerated).length;
console.log(`Already Generated: ${alreadyDone}`);
console.log(`Pending: ${curatedSets.length - alreadyDone}`);

const fabricCounts = {};
curatedSets.forEach(s => {
  fabricCounts[s.fabricCount] = (fabricCounts[s.fabricCount] || 0) + 1;
});
console.log('Fabric count breakdown per set:', fabricCounts);

// Write details to JSON for easy batch processing
fs.writeFileSync('scripts/curated-sets-analysis.json', JSON.stringify(curatedSets, null, 2));
console.log('Saved details to scripts/curated-sets-analysis.json');
