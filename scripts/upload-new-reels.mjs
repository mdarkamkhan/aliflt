import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'b4r0p4me';
const API_KEY = process.env.CLOUDINARY_API_KEY || '392283927334272';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'R1kjAr37B6Y75X_WOsCT-L_ur-U';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true
});

const VIDEO_DIR = 'D:\\reels\\new reels';
const OUTPUT_FILE = path.resolve('src/data/reels.json');

function uploadVideo(filePath, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(filePath, options, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

// Natural sort order for downloadmedia files
function getFileNumber(filename) {
  const match = filename.match(/\((\d+)\)/);
  if (match) return parseInt(match[1], 10);
  return 0; // base file downloadmedia-20261019.mp4
}

async function uploadNewReels() {
  if (!fs.existsSync(VIDEO_DIR)) {
    console.error(`Directory not found: ${VIDEO_DIR}`);
    process.exit(1);
  }

  // Load existing reels
  let existingReels = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    existingReels = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  }

  const existingSourceFiles = new Set(existingReels.map(r => r.source_file).filter(Boolean));
  const existingPublicIds = new Set(existingReels.map(r => r.public_id).filter(Boolean));

  // Determine starting index
  let maxIndex = 0;
  for (const r of existingReels) {
    const num = parseInt((r.id || '').replace('reel-', ''), 10);
    if (!isNaN(num) && num > maxIndex) {
      maxIndex = num;
    }
  }

  console.log(`Current existing reels count: ${existingReels.length} (highest ID: reel-${maxIndex})`);

  // Get and sort files naturally
  const allFiles = fs.readdirSync(VIDEO_DIR)
    .filter(f => f.toLowerCase().endsWith('.mp4'))
    .sort((a, b) => getFileNumber(a) - getFileNumber(b));

  console.log(`Found ${allFiles.length} video files in ${VIDEO_DIR}`);

  let currentIndex = maxIndex + 1;
  let uploadCount = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const filePath = path.join(VIDEO_DIR, file);

    // Skip if already in existing reels by source_file
    if (existingSourceFiles.has(file)) {
      console.log(`[${i + 1}/${allFiles.length}] Skipping ${file} (already registered in reels.json)`);
      continue;
    }

    const publicId = `alif-reels/reel_${String(currentIndex).padStart(2, '0')}`;
    const stats = fs.statSync(filePath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n[${i + 1}/${allFiles.length}] Uploading ${file} (${sizeMb} MB) as ${publicId}...`);
    const startTime = Date.now();

    try {
      const res = await uploadVideo(filePath, {
        resource_type: 'video',
        folder: 'alif-reels',
        public_id: `reel_${String(currentIndex).padStart(2, '0')}`,
        chunk_size: 6000000,
        overwrite: true
      });

      const rawUrl = res.secure_url;
      const optimizedVideo = rawUrl.replace('/video/upload/', '/video/upload/f_auto,q_auto/');
      const posterUrl = rawUrl.replace('/video/upload/', '/video/upload/so_0,f_auto,q_auto,w_480/').replace(/\.[^/.]+$/, '.jpg');

      const record = {
        id: `reel-${currentIndex}`,
        title: `Boutique Reel #${currentIndex}`,
        video: optimizedVideo,
        raw_url: rawUrl,
        poster: posterUrl,
        public_id: res.public_id,
        duration: res.duration || null,
        width: res.width || null,
        height: res.height || null,
        source_file: file,
        category: 'curated-sets',
        style: 'boutique-collection',
        tags: ['new-arrival', 'boutique', 'ensemble', 'sahibganj'],
        linked_service: 'blouse',
        linked_products: []
      };

      existingReels.push(record);
      existingSourceFiles.add(file);
      existingPublicIds.add(res.public_id);

      // Save immediately after each upload to prevent data loss
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingReels, null, 2), 'utf-8');

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✓ Success: Reel #${currentIndex} uploaded in ${elapsed}s! Total reels: ${existingReels.length}`);
      uploadCount++;
      currentIndex++;
    } catch (err) {
      console.error(`✗ Error uploading ${file}:`, err.message || err);
    }
  }

  console.log(`\n========================================`);
  console.log(`Upload complete! Uploaded ${uploadCount} new reels.`);
  console.log(`Total reels now in ${OUTPUT_FILE}: ${existingReels.length}`);
  console.log(`========================================`);
}

uploadNewReels();
