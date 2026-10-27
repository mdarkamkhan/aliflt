import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const [,, inputPath, setId] = process.argv;

if (!inputPath || !setId) {
  console.error('Usage: node scripts/save-cover.mjs <inputPath> <setId>');
  process.exit(1);
}

async function run() {
  const cleanInput = inputPath.replace(/^file:\/\/\/?/, '');
  if (!fs.existsSync(cleanInput)) {
    console.error(`Input file does not exist: ${cleanInput}`);
    process.exit(1);
  }

  const outDir = path.join('public', 'uploads', 'curated-sets');
  const thumbDir = path.join('public', 'thumbs', 'uploads', 'curated-sets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true });
  }

  const destFile = path.join(outDir, `${setId}.webp`);
  const thumbFile = path.join(thumbDir, `${setId}.webp`);

  await sharp(cleanInput)
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destFile);

  await sharp(cleanInput)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbFile);

  console.log(`Saved WebP cover to: ${destFile} and thumbnail to: ${thumbFile}`);

  // Update markdown file
  const mdFile = path.join('src', 'content', 'products', `${setId}.md`);
  if (fs.existsSync(mdFile)) {
    let content = fs.readFileSync(mdFile, 'utf-8');
    const newImagePath = `/uploads/curated-sets/${setId}.webp`;
    if (content.match(/^image:\s*.*$/m)) {
      content = content.replace(/^image:\s*.*$/m, `image: "${newImagePath}"`);
    } else {
      content = content.replace(/^---\r?\n/, `---\nimage: "${newImagePath}"\n`);
    }
    fs.writeFileSync(mdFile, content, 'utf-8');
    console.log(`Updated frontmatter in: ${mdFile}`);
  } else {
    console.warn(`Markdown file not found: ${mdFile}`);
  }
}

run().catch(err => {
  console.error('Error saving cover:', err);
  process.exit(1);
});
