const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'works', 'uploads'),
    path.join(__dirname, '..', 'catalouge')
];

const mdDirs = [
    path.join(__dirname, '..', 'products'),
    path.join(__dirname, '..', 'designs'),
    path.join(__dirname, '..', 'works'),
    path.join(__dirname, '..', 'offers')
];

async function getFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(await getFiles(filePath));
        } else {
            results.push(filePath);
        }
    }
    return results;
}

async function convertImages() {
    console.log('--- Starting WebP Conversion ---');
    let totalOriginalBytes = 0;
    let totalWebpBytes = 0;
    let convertedCount = 0;
    let errorCount = 0;

    for (const dir of targetDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = await getFiles(dir);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                const webpPath = file.substring(0, file.length - ext.length) + '.webp';
                try {
                    const originalSize = fs.statSync(file).size;
                    totalOriginalBytes += originalSize;

                    await sharp(file)
                        .webp({ quality: 80, effort: 4 })
                        .toFile(webpPath);

                    const webpSize = fs.statSync(webpPath).size;
                    totalWebpBytes += webpSize;
                    convertedCount++;

                    // Remove old bulky image
                    fs.unlinkSync(file);

                    if (convertedCount % 25 === 0) {
                        console.log(`Converted ${convertedCount} images...`);
                    }
                } catch (err) {
                    console.error(`Error converting ${file}:`, err.message);
                    errorCount++;
                }
            }
        }
    }

    console.log(`\n=== Conversion Complete ===`);
    console.log(`Images Converted: ${convertedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Original Size: ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`WebP Size: ${(totalWebpBytes / (1024 * 1024)).toFixed(2)} MB`);
    const savedMB = ((totalOriginalBytes - totalWebpBytes) / (1024 * 1024)).toFixed(2);
    const savedPct = totalOriginalBytes > 0 ? (((totalOriginalBytes - totalWebpBytes) / totalOriginalBytes) * 100).toFixed(1) : 0;
    console.log(`Space Saved: ${savedMB} MB (${savedPct}%)`);

    // Update Markdown references
    console.log('\n--- Updating Markdown Image References ---');
    let updatedMdCount = 0;
    for (const mdDir of mdDirs) {
        if (!fs.existsSync(mdDir)) continue;
        const mdFiles = await getFiles(mdDir);
        for (const mdFile of mdFiles) {
            if (path.extname(mdFile).toLowerCase() === '.md' || path.extname(mdFile).toLowerCase() === '.json') {
                const content = fs.readFileSync(mdFile, 'utf8');
                // Replace .jpg, .jpeg, .png in uploads paths
                const updatedContent = content.replace(/(\/uploads\/[^\s"'\)]+?)\.(jpg|jpeg|png)/gi, '$1.webp');
                if (content !== updatedContent) {
                    fs.writeFileSync(mdFile, updatedContent, 'utf8');
                    updatedMdCount++;
                }
            }
        }
    }
    console.log(`Updated ${updatedMdCount} markdown/json files with .webp paths.`);
}

convertImages().catch(console.error);
