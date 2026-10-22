const fs = require('fs');
const path = require('path');

const ROOT = 'd:/aliflt-main';
const PRODUCTS_DIR = path.join(ROOT, 'src', 'content', 'products');
const REELS_JSON = path.join(ROOT, 'src', 'data', 'reels.json');

const reelsData = JSON.parse(fs.readFileSync(REELS_JSON, 'utf-8'));
const reelsByCode = new Map();
const reelsBySlug = new Map();
reelsData.forEach((r, idx) => {
  r._index = idx + 1;
  if (r.curated_set_code) reelsByCode.set(r.curated_set_code, r);
  if (r.curated_set_slug) reelsBySlug.set(r.curated_set_slug, r);
});

function detectFabricType(slug) {
  const s = slug.toLowerCase();
  if (s.includes('crush-silk-dupatta') || (s.includes('crush') && s.includes('dupatta'))) return 'Crush Silk Dupatta';
  if (s.includes('crush-top') || s.includes('crush-bottom')) return 'Crush Silk';
  if (s.includes('fandy-silk-dupatta') || (s.includes('fandy') && s.includes('dupatta'))) return 'Fandy Silk Dupatta';
  if (s.includes('fandy-top') || s.includes('fandy-bottom') || s.includes('fandy-silk')) return 'Fandy Silk';
  if (s.includes('velvet-lace')) return 'Velvet Lace';
  if (s.includes('velvet')) return 'Velvet';
  if (s.includes('tissue-silk')) return 'Tissue Silk';
  if (s.includes('georgette')) return 'Georgette';
  if (s.includes('satin')) return 'Satin';
  if (s.includes('-net-') || s.includes('-net')) return 'Net';
  if (s.includes('rayon')) return 'Rayon';
  if (s.includes('moss-crape') || s.includes('moss-crepe')) return 'Moss Crepe';
  if (s.includes('crepe') || s.includes('crape')) return 'Crepe';
  if (s.includes('silk')) return 'Silk';
  return null;
}

function detectColour(slug) {
  const s = slug.toLowerCase();
  if (s.includes('rani-pink')) return 'Rani Pink';
  if (s.includes('champagne-gold')) return 'Champagne Gold';
  if (s.includes('crimson-red')) return 'Crimson';
  if (s.includes('emerald-green')) return 'Emerald';
  if (s.includes('sage-green')) return 'Sage Green';
  if (s.includes('pearl-white') || s.includes('pearl-ivory')) return 'Pearl';
  if (s.includes('jet-black')) return 'Jet Black';
  if (s.includes('soft-pink')) return 'Soft Pink';
  if (s.includes('ivory') || s.includes('ivory-cream')) return 'Ivory';
  if (s.includes('teal-green')) return 'Teal';
  if (s.includes('butter-yellow')) return 'Butter Yellow';
  if (s.includes('sunshine-yellow')) return 'Sunshine Yellow';
  if (s.includes('burgundy') || s.includes('maroon')) return 'Burgundy';
  if (s.includes('rose-gold')) return 'Rose Gold';
  if (s.includes('deep-wine')) return 'Deep Wine';
  if (s.includes('mint-green')) return 'Mint Green';
  if (s.includes('silver-grey')) return 'Silver Grey';
  if (s.includes('black-champagne')) return 'Black Champagne';
  if (s.includes('bronze-gold')) return 'Bronze Gold';
  return null;
}

function detectOccasion(reel) {
  const tags = (reel.tags || []).map(t => t.toLowerCase());
  const style = (reel.style || '').toLowerCase();
  const service = (reel.linked_service || '').toLowerCase();
  if (tags.includes('bridal') || style === 'bridal') return 'Bridal';
  if (tags.includes('lehenga') || service === 'lehenga') return 'Lehenga';
  if (tags.includes('party wear') || tags.includes('party')) return 'Party Wear';
  if (tags.includes('festive') || style === 'festive') return 'Festive';
  if (tags.includes('traditional') || style === 'traditional') return 'Traditional';
  if (service === 'blouse') return 'Blouse';
  if (service === 'kurti-top') return 'Kurti';
  return 'Festive';
}

function buildSetTitle(reel, comboProducts) {
  const occasion = detectOccasion(reel);
  const fabrics = [];
  let colour = null;
  for (const slug of comboProducts) {
    const f = detectFabricType(slug);
    if (f && !fabrics.includes(f)) fabrics.push(f);
    if (!colour) colour = detectColour(slug);
  }
  if (!colour) {
    for (const p of (reel.linked_products || [])) {
      const pc = detectColour((p.toLowerCase ? p.toLowerCase() : p));
      if (pc) { colour = pc; break; }
    }
  }
  const priority = ['Crush Silk', 'Fandy Silk', 'Tissue Silk', 'Velvet', 'Georgette', 'Satin', 'Net', 'Rayon', 'Crepe', 'Silk'];
  let pf = fabrics.find(f => priority.some(p => f.startsWith(p))) || fabrics[0] || 'Fabric';
  const parts = [];
  if (colour) parts.push(colour);
  parts.push(pf);
  parts.push(occasion);
  parts.push('Set');
  return parts.join(' ');
}

const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.startsWith('curated-set-alif-set-') && f.endsWith('.md')).sort();
console.log('Processing ' + files.length + ' files...');
let updated = 0, skipped = 0;

for (const file of files) {
  const fp = path.join(PRODUCTS_DIR, file);
  const content = fs.readFileSync(fp, 'utf-8');
  const slug = file.replace('.md', '');
  
  const codeMatch = content.match(/product_code:\s*"([^"]+)"/);
  const productCode = codeMatch ? codeMatch[1] : null;
  
  const reel = reelsBySlug.get(slug) || (productCode ? reelsByCode.get(productCode) : null);
  if (!reel) { console.log('  SKIP (no reel): ' + file); skipped++; continue; }
  
  const comboMatches = [...content.matchAll(/^\s+-\s+id:\s*"([^"]+)"/gm)];
  const comboProducts = comboMatches.map(m => m[1]);
  
  const oldTitle = (content.match(/^title:\s*"([^"]+)"/m) || [])[1] || '?';
  const newTitle = buildSetTitle(reel, comboProducts);
  
  const newContent = content.replace(/^(title:\s*)"[^"]*"/m, $1"");
  
  if (newContent !== content) {
    fs.writeFileSync(fp, newContent, 'utf-8');
    console.log('  OK: ' + file + ' => ' + newTitle);
    updated++;
  } else {
    console.log('  UNCHANGED: ' + file);
  }
}

console.log('Done! Updated: ' + updated + ', Skipped: ' + skipped);
