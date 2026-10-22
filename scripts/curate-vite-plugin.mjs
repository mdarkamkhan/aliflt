import fs from 'node:fs';
import path from 'node:path';

export function curateApiVitePlugin() {
  const CWD = process.cwd();

  return {
    name: 'curate-api-vite-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const url = new URL(req.url, 'http://localhost:4321');

        // GET: /api/curated-sets
        if (req.method === 'GET' && url.pathname === '/api/curated-sets') {
          try {
            const productsDir = path.resolve(CWD, 'src/content/products');
            const files = fs.readdirSync(productsDir);
            const sets = [];

            for (const file of files) {
              if (!file.endsWith('.md')) continue;
              const content = fs.readFileSync(path.join(productsDir, file), 'utf8');
              if (content.includes('category: "Curated Sets"') || content.includes("category: 'Curated Sets'")) {
                const slug = file.replace(/\.md$/, '');
                const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
                const reelMatch = content.match(/linked_reel_id:\s*["']([^"']+)["']/);
                const codeMatch = content.match(/product_code:\s*["']([^"']+)["']/);
                const priceMatch = content.match(/price:\s*([0-9.]+)/);
                const offerMatch = content.match(/offer_price:\s*([0-9.]+)/);
                const imageMatch = content.match(/image:\s*["']([^"']+)["']/);
                const comboMatches = Array.from(content.matchAll(/-\s*["']([^"']+)["']/g)).map(m => m[1]);

                sets.push({
                  slug,
                  title: titleMatch ? titleMatch[1] : slug,
                  reel_id: reelMatch ? reelMatch[1] : null,
                  product_code: codeMatch ? codeMatch[1] : null,
                  price: priceMatch ? Number(priceMatch[1]) : 0,
                  offer_price: offerMatch ? Number(offerMatch[1]) : null,
                  image: imageMatch ? imageMatch[1] : null,
                  combo_products: comboMatches,
                });
              }
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, sets }));
          } catch (e) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: e.message }));
          }
        }

        // POST: /api/save-curated-set
        if (req.method === 'POST' && url.pathname === '/api/save-curated-set') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);

              // Delete action
              if (data.action === 'delete') {
                const { slug, reel_id } = data;
                if (!slug) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ error: 'Missing slug' }));
                }
                const filePath = path.resolve(CWD, 'src/content/products', `${slug}.md`);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }

                if (reel_id) {
                  try {
                    const reelsPath = path.resolve(CWD, 'src/data/reels.json');
                    const reels = JSON.parse(fs.readFileSync(reelsPath, 'utf8'));
                    const reelIdx = reels.findIndex(r => r.id === reel_id);
                    if (reelIdx !== -1) {
                      delete reels[reelIdx].curated_set_slug;
                      delete reels[reelIdx].curated_set_code;
                      fs.writeFileSync(reelsPath, JSON.stringify(reels, null, 2), 'utf8');
                    }
                  } catch (_) {}
                }

                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, action: 'deleted' }));
              }

              // Save action
              if (!data.slug || !data.title) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Title and Slug are required' }));
              }

              const filePath = path.resolve(CWD, 'src/content/products', `${data.slug}.md`);
              const comboListYaml = (data.combo_products || [])
                .map(item => {
                  if (typeof item === 'string') {
                    return `  - id: "${item}"\n    meters: 1\n    unit: "Meter"`;
                  }
                  const pid = item.id || item.slug;
                  const meters = Number(item.meters) || 1;
                  const unit = item.unit || 'Meter';
                  return `  - id: "${pid}"\n    meters: ${meters}\n    unit: "${unit}"`;
                })
                .join('\n');

              const content = `---
title: "${(data.title || '').replace(/"/g, '\\"')}"
date: "${new Date().toISOString()}"
layout: "product.liquid"
tags: "product"
image: "${data.image || '/icons/icon-512x512.png'}"
price: ${Number(data.price) || 0}
${data.offer_price ? `offer_price: ${Number(data.offer_price)}\n` : ''}product_code: "${data.product_code || 'ALIF-SET'}"
category: "Curated Sets"
reel_video: "${data.reel_video || ''}"
linked_reel_id: "${data.reel_id || ''}"
combo_products:
${comboListYaml}
description: "${(data.description || '').replace(/"/g, '\\"')}"
colour: "${(data.colour || '').replace(/"/g, '\\"')}"
fabric: "${(data.fabric || '').replace(/"/g, '\\"')}"
ideal_for: "${(data.ideal_for || 'Bespoke Tailoring & Styling').replace(/"/g, '\\"')}"
delivery_charges: "Free"
return_policy: "7 days exchange (at store)"
---

${data.custom_notes || 'Handcrafted bespoke ensemble curated directly from our trending boutique reel.'}
`;

              fs.writeFileSync(filePath, content, 'utf8');

              // Update reels.json
              if (data.reel_id) {
                try {
                  const reelsPath = path.resolve(CWD, 'src/data/reels.json');
                  const reels = JSON.parse(fs.readFileSync(reelsPath, 'utf8'));
                  const reelIdx = reels.findIndex(r => r.id === data.reel_id);
                  if (reelIdx !== -1) {
                    const itemIds = (data.combo_products || []).map(i => typeof i === 'string' ? i : (i.id || i.slug)).filter(Boolean);
                    reels[reelIdx].curated_set_slug = data.slug;
                    reels[reelIdx].curated_set_code = data.product_code;
                    reels[reelIdx].linked_products = Array.from(new Set([
                      ...(reels[reelIdx].linked_products || []),
                      data.product_code,
                      ...itemIds
                    ]));
                    fs.writeFileSync(reelsPath, JSON.stringify(reels, null, 2), 'utf8');
                  }
                } catch (reelErr) {
                  console.error('Error updating reels.json:', reelErr);
                }
              }

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, slug: data.slug, path: filePath }));
            } catch (err) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST: /api/update-reel-category
        if (req.method === 'POST' && url.pathname === '/api/update-reel-category') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { reel_id, category, style, tags, title } = JSON.parse(body);
              if (!reel_id) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Missing reel_id' }));
              }

              const reelsPath = path.resolve(CWD, 'src/data/reels.json');
              const reels = JSON.parse(fs.readFileSync(reelsPath, 'utf8'));
              const idx = reels.findIndex(r => r.id === reel_id);
              if (idx === -1) {
                res.statusCode = 404;
                return res.end(JSON.stringify({ error: `Reel not found: ${reel_id}` }));
              }

              if (category !== undefined) reels[idx].category = category;
              if (style !== undefined) reels[idx].style = style;
              if (tags !== undefined) reels[idx].tags = tags;
              if (title !== undefined && title.trim()) reels[idx].title = title.trim();

              fs.writeFileSync(reelsPath, JSON.stringify(reels, null, 2), 'utf8');

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, reel: reels[idx] }));
            } catch (err) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}
