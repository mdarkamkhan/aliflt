import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processCovers() {
  const targetDir = 'public/uploads/directory';
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  console.log('1. Processing services.webp from lehenga.webp...');
  await sharp('public/uploads/services/lehenga.webp')
    .resize(900, 1200, { fit: 'cover', position: 'top' })
    .webp({ quality: 88, effort: 5 })
    .toFile(path.join(targetDir, 'services.webp'));

  console.log('2. Processing products.webp from curated-set-alif-set-001.webp...');
  await sharp('public/uploads/curated-sets/curated-set-alif-set-001.webp')
    .resize(900, 1200, { fit: 'cover', position: 'center' })
    .webp({ quality: 88, effort: 5 })
    .toFile(path.join(targetDir, 'products.webp'));

  console.log('3. Processing location.webp from railway-station.webp...');
  await sharp('public/uploads/routes/railway-station.webp')
    .resize(900, 1200, { fit: 'cover', position: 'center' })
    .webp({ quality: 88, effort: 5 })
    .toFile(path.join(targetDir, 'location.webp'));

  console.log('4. Processing designs.webp from 1763826770264-1000026110.webp...');
  await sharp('public/uploads/1763826770264-1000026110.webp')
    .resize(900, 1200, { fit: 'cover', position: 'center' })
    .webp({ quality: 88, effort: 5 })
    .toFile(path.join(targetDir, 'designs.webp'));

  console.log('5. Processing works.webp from 1000019607.webp...');
  await sharp('public/uploads/1000019607.webp')
    .resize(900, 1200, { fit: 'cover', position: 'center' })
    .webp({ quality: 88, effort: 5 })
    .toFile(path.join(targetDir, 'works.webp'));

  // 6. Download Reel #1 poster to local reels.webp so it does not rely on third-party cdn and is fast
  console.log('6. Processing reels.webp from reel #1 poster...');
  const res = await fetch('https://res.cloudinary.com/b4r0p4me/video/upload/so_0,f_auto,q_auto,w_720/v1792336434/alif-reels/reel_01.jpg');
  if (res.ok) {
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await sharp(buffer)
      .resize(900, 1200, { fit: 'cover', position: 'center' })
      .webp({ quality: 88, effort: 5 })
      .toFile(path.join(targetDir, 'reels.webp'));
    console.log('Reels cover updated successfully.');
  }

  console.log('All 6 directory card covers updated successfully!');
}

processCovers().catch(err => {
  console.error(err);
  process.exit(1);
});
