import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SOURCE_IMAGE = 'C:\\Users\\mdmus\\.gemini\\antigravity-ide\\brain\\b234838a-8fdc-488f-b671-4172387bb034\\.user_uploaded\\media_1792337181067.png';

async function generateAll() {
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('Source image not found:', SOURCE_IMAGE);
    process.exit(1);
  }

  const publicDir = path.resolve('public');
  const iconsDir = path.resolve('public/icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  console.log('Generating favicons and app icons from source image...');

  // 1. Favicon (128x128 PNG)
  await sharp(SOURCE_IMAGE)
    .resize(128, 128)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created: public/favicon.png (128x128)');

  // 2. Apple Touch Icon (180x180 PNG)
  await sharp(SOURCE_IMAGE)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created: public/apple-touch-icon.png (180x180)');

  // 3. 192x192 PWA Icon
  await sharp(SOURCE_IMAGE)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-192x192.png'));
  await sharp(SOURCE_IMAGE)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192x192.png'));
  console.log('Created: public/icons/icon-192x192.png & public/icon-192x192.png');

  // 4. 512x512 PWA Icon
  await sharp(SOURCE_IMAGE)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'icon-512x512.png'));
  await sharp(SOURCE_IMAGE)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512x512.png'));
  console.log('Created: public/icons/icon-512x512.png & public/icon-512x512.png');

  // 5. 761x761 PWA Icon
  await sharp(SOURCE_IMAGE)
    .resize(761, 761)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-761x761.png'));
  console.log('Created: public/icon-761x761.png (761x761)');

  // 6. Maskable 512x512 Icon (Safe Area: 80% scale centered on #FBF9F6 luxury off-white)
  // For maskable icons, we place an 80% scaled logo (410x410) inside a 512x512 canvas with matching background
  const scaledLogo = await sharp(SOURCE_IMAGE)
    .resize(410, 410)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 251, g: 249, b: 246, alpha: 1 } // #FBF9F6 theme-color
    }
  })
    .composite([{ input: scaledLogo, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 251, g: 249, b: 246, alpha: 1 }
    }
  })
    .composite([{ input: scaledLogo, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512x512.png'));
  console.log('Created: public/icons/icon-maskable-512x512.png & public/icon-maskable-512x512.png (maskable safe area)');

  console.log('\nAll favicons and app icons generated successfully!');
}

generateAll().catch(err => {
  console.error('Failed generating icons:', err);
  process.exit(1);
});
