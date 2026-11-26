// scripts/sync-ai-context.mjs
// Post-build step copying Astro-compiled dist/ai-context.json into netlify/functions/generated/
// so serverless ask-ai.js always ships with up-to-date products, services, and offers.

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, 'dist', 'ai-context.json');
const targetDir = path.join(rootDir, 'netlify', 'functions', 'generated');
const targetPath = path.join(targetDir, 'ai-context.json');

if (!fs.existsSync(sourcePath)) {
  console.error(`[sync-ai-context] Missing build output at ${sourcePath}`);
  process.exit(1);
}

const raw = fs.readFileSync(sourcePath, 'utf8');
const parsed = JSON.parse(raw);

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetPath, JSON.stringify(parsed));

const productCount = parsed?.counts?.products ?? 0;
const serviceCount = parsed?.counts?.services ?? 0;
const offerCount = parsed?.counts?.offers ?? 0;
const discountedCount = Array.isArray(parsed?.products)
  ? parsed.products.filter((p) => p.offer_price !== null && p.offer_price !== undefined).length
  : 0;

console.log(
  `[sync-ai-context] Synced ${productCount} products (${discountedCount} discounted), ${serviceCount} services, ${offerCount} offers -> netlify/functions/generated/ai-context.json`
);
