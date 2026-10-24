import sharp from 'sharp';
import fs from 'fs';

async function processLehenga() {
  const src = 'd:/services/lehenga.png';
  const dest = 'public/uploads/services/lehenga.webp';
  const meta = await sharp(src).metadata();
  console.log(`Converting lehenga.png: ${meta.width}x${meta.height}`);

  await sharp(src)
    .resize({
      width: 900,
      height: 1200,
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 86 })
    .toFile(dest);

  const stat = fs.statSync(dest);
  console.log(`Saved to ${dest} (${Math.round(stat.size / 1024)} KB)`);

  const mdPath = 'src/content/services/lehenga.md';
  let md = fs.readFileSync(mdPath, 'utf8');
  if (md.includes('image:')) {
    md = md.replace(/image:\s*[^\r\n]+/, 'image: "/uploads/services/lehenga.webp"');
  } else {
    md = md.replace(/---\r?\n/, '---\nimage: "/uploads/services/lehenga.webp"\n');
  }
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log(`Updated ${mdPath}`);
}

processLehenga().catch(err => {
  console.error(err);
  process.exit(1);
});
