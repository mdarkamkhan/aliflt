import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const CLOUD_NAME = 'b4r0p4me';
const API_KEY = '392283927334272';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || process.argv[2] || 'R1kjAr37B6Y75X_WOsCT-L_ur-U';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true
});

const VIDEO_DIR = 'D:\\reels\\product';
const OUTPUT_FILE = path.resolve('src/data/reels.json');

function uploadVideo(filePath, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(filePath, options, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

async function uploadAll() {
  if (!fs.existsSync(VIDEO_DIR)) {
    console.error(`Directory not found: ${VIDEO_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(VIDEO_DIR).filter(f => f.toLowerCase().endsWith('.mp4'));
  console.log(`Found ${files.length} videos in ${VIDEO_DIR}`);

  // Load existing results for resume capability
  let existing = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    } catch (_) {
      existing = [];
    }
  }

  const resultsMap = new Map();
  for (const item of existing) {
    if (item.public_id) {
      resultsMap.set(item.public_id, item);
    }
  }

  let index = 1;

  for (const file of files) {
    const publicId = `alif-reels/reel_${String(index).padStart(2, '0')}`;
    const filePath = path.join(VIDEO_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

    if (resultsMap.has(publicId)) {
      console.log(`[${index}/${files.length}] Already uploaded: ${publicId}`);
      index++;
      continue;
    }

    console.log(`[${index}/${files.length}] Uploading ${file} (${sizeMb} MB)...`);

    try {
      const res = await uploadVideo(filePath, {
        resource_type: 'video',
        folder: 'alif-reels',
        public_id: `reel_${String(index).padStart(2, '0')}`,
        chunk_size: 6000000,
        overwrite: true
      });

      const rawUrl = res.secure_url;
      const optimizedVideo = rawUrl.replace('/video/upload/', '/video/upload/f_auto,q_auto/');
      const posterUrl = rawUrl.replace('/video/upload/', '/video/upload/so_0,f_auto,q_auto,w_480/').replace(/\.[^/.]+$/, '.jpg');

      const record = {
        id: `reel-${index}`,
        title: `Atelier Reel #${index}`,
        video: optimizedVideo,
        raw_url: rawUrl,
        poster: posterUrl,
        public_id: res.public_id,
        duration: res.duration || null,
        width: res.width || null,
        height: res.height || null
      };

      resultsMap.set(publicId, record);

      // Save incrementally after each successful upload
      const currentList = Array.from(resultsMap.values()).sort((a, b) => {
        const numA = parseInt(a.id.replace('reel-', ''), 10) || 0;
        const numB = parseInt(b.id.replace('reel-', ''), 10) || 0;
        return numA - numB;
      });

      fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(currentList, null, 2), 'utf-8');

      console.log(`Success: Reel #${index} uploaded! (${currentList.length}/${files.length} saved)`);
    } catch (err) {
      console.error(`Failed uploading ${file}:`, err.message || err);
    }

    index++;
  }

  const finalOutput = Array.from(resultsMap.values()).sort((a, b) => {
    const numA = parseInt(a.id.replace('reel-', ''), 10) || 0;
    const numB = parseInt(b.id.replace('reel-', ''), 10) || 0;
    return numA - numB;
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput, null, 2), 'utf-8');
  console.log(`\nAll done! Successfully registered ${finalOutput.length} reels in ${OUTPUT_FILE}`);
}

uploadAll();
