import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function updateReelsAndDesigns() {
  const targetDir = 'public/uploads/directory';

  // 1. New Reel Cover: Fetch crisp 720px poster from trending Reel #6 (Anarkali Boutique Outfit) or Reel #4 (Bridal Lehenga)
  console.log('Downloading Reel #6 poster...');
  const res = await fetch('https://res.cloudinary.com/b4r0p4me/video/upload/so_0,f_auto,q_auto,w_720/v1792336475/alif-reels/reel_06.jpg');
  if (res.ok) {
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await sharp(buffer)
      .resize(900, 1200, { fit: 'cover', position: 'center' })
      .webp({ quality: 88, effort: 5 })
      .toFile(path.join(targetDir, 'reels.webp'));
    console.log('Updated reels.webp with Reel #6.');
  } else {
    console.error('Failed to fetch reel poster');
  }

  // 2. New Design Cover: High resolution blouse back neck pattern / sleeve embroidery
  // Using public/uploads/img_20251201_193006.webp (Designer blouse embroidery) or 1763826760339-1000026111.webp
  console.log('Processing new designs.webp from img_20251201_193006.webp...');
  await sharp('public/uploads/img_20251201_193006.webp')
    .resize(900, 1200, { fit: 'cover', position: 'center' })
    .webp({ quality: 88, effort: 5 })
    .toFile(path.join(targetDir, 'designs.webp'));
  console.log('Updated designs.webp with boutique blouse design.');
}

updateReelsAndDesigns().catch(err => {
  console.error(err);
  process.exit(1);
});
