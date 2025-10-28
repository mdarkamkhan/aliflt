/* js/main.js */
/* All your site scripts, moved from base.liquid */

/* ====== CONFIG ====== */
// 💡 NOTE: This config is for the CLIENT-SIDE GitHub fetcher.
// We are replacing this with Eleventy collections (see Step 4),
// so this section will become obsolete, but we keep it for now.
const OWNER = "mdarkamkhan";      
const REPO  = "aliflt";           
const SITE_ORIGIN = "https://aliflt.netlify.app"; 
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

/* ====== UTIL: parse YAML frontmatter from markdown */
function parseYAMLFrontMatter(text) {
  const fm = text.match(/^---\s*([\s\S]*?)\s*---/);
  if (!fm) return {};
  const lines = fm[1].split(/\r?\n/);
  const data = {};
  for (let line of lines) {
    const m = line.match(/^\s*([A-Za-z0-9_\- ]+)\s*:\s*(.+)$/);
    if (m) {
      let key = m[1].trim();
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      data[key] = val;
    }
  }
  return data;
}

/* ====== Fetch and cache folder listing + parse entries ====== */
// 💡 NOTE: This is the dynamic GitHub fetcher. We are replacing this.
async function fetchCollectionItems(folder) {
  const cacheKey = `ghc_${OWNER}_${REPO}_${folder}`;
  try {
    const rawCache = localStorage.getItem(cacheKey);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Date.now() - parsed.ts < CACHE_TTL) {
        return parsed.items;
      }
    }
  } catch (e) { /* ignore parse errors */ }

  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${folder}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    console.warn(`GitHub API error for ${folder}:`, res.status, res.statusText);
    
    // --- DEBUGGING: Hide banner if API fails ---
    if (folder === 'offers') {
         const banner = document.getElementById('top-banner');
         if (banner) banner.style.display = 'none';
    }
    // --- END DEBUGGING ---
    
    return [];
  }
  const list = await res.json(); 

  const items = [];
  for (const file of list) {
    if (!file.name.match(/\.(md|markdown|json)$/i)) continue; 
    try {
      const rawText = await fetch(file.download_url).then(r => r.text());
      let data = {};
      if (file.name.match(/\.(md|markdown)$/i)) {
        data = parseYAMLFrontMatter(rawText);
      } else { 
        try { data = JSON.parse(rawText); } catch(e){ data = {}; }
      }
      
      let img = data.image || data.img || data.Image || data.photo || null;
      let title = data.title || data.Title || data.name || file.name.replace(/\.(md|markdown|json)$/i, "");
      
      if (img) {
        if (img.startsWith("/")) img = SITE_ORIGIN + img;
        else if (!img.startsWith("http")) img = SITE_ORIGIN + "/" + img;
      }
      
      items.push({ title, image: img, raw: data, slug: file.name });
      
    } catch (err) {
      console.error("Error reading file", file.name, err);
    }
  }

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items }));
  } catch (e) {}

  return items;
}


/* ====== Swapper and Gallery Logic ====== */
function initializeSwapper(swapperSelector, options = {}) {
     const swapper = document.querySelector(swapperSelector);
    if (!swapper) return;

    const items = swapper.querySelectorAll('.swapper-item');
    const prevBtn = swapper.querySelector('.prev-btn');
    const nextBtn = swapper.querySelector('.next-btn');
    let currentIndex = 0;
    let autoplayInterval = null;

    if (items.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return; // No need for controls or autoplay if 0 or 1 item
    }

    function showItem(index) {
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    function next() {
        currentIndex = (currentIndex < items.length - 1) ? currentIndex + 1 : 0;
        showItem(currentIndex);
    }
    
    function prev() {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : items.length - 1;
        showItem(currentIndex);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prev();
            if (autoplayInterval) resetAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            next();
            if (autoplayInterval) resetAutoplay();
        });
    }

    function startAutoplay() {
        // Only start autoplay if it's enabled and there's more than one item
        if (options.autoplay && items.length > 1) { 
            autoplayInterval = setInterval(next, options.autoplay);
        }
    }

function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }
    
    showItem(currentIndex);
    startAutoplay();
}


async function renderSwapper(folder, containerSelector, options = {}) {
     const swapperContainer = document.querySelector(containerSelector);
    if (!swapperContainer) return;

    const items = await fetchCollectionItems(folder);
    const itemsWithImages = items.filter(item => item.image);

    // Sort items by date if it exists
    itemsWithImages.sort((a, b) => {
        const dateA = a.raw.date ? new Date(a.raw.date) : new Date(0);
        const dateB = b.raw.date ? new Date(b.raw.date) : new Date(0);
        return dateB - dateA;
    });

    let content = '';
    if (!itemsWithImages.length) {
        content = "<p class='empty-gallery-message'>No items found.</p>";
        
        // 💡 DEBUGGING FIX: Hide the banner if it finds no content
        if (options.isBanner) {
            const banner = document.getElementById('top-banner');
            if (banner) banner.style.display = 'none';
        }
    } else {
        itemsWithImages.forEach((item, index) => {
            const activeClass = index === 0 ? 'active' : '';
            let itemContent = '';

            if (options.isBanner) {
                 itemContent = `
                    <img src="${item.image}" alt="${item.title}">
                    <div class="banner-content">
                        <h2>${item.title}</h2>
                        <a href="#home" class="banner-cta-btn">Visit Now</a>
                    </div>
                `;
            } else {
                itemContent = `<img src="${item.image}" alt="${item.title}">`;
                if (folder === 'services') {
                    itemContent += `<div class="service-details"><h3>${item.title}</h3></div>`;
                } else if (folder === 'works') {
                     itemContent += `<div class="work-caption"><h3>${item.title}</h3></div>`; // ADDED CAPTION FOR WORKS
                } else { // products
                    itemContent += `<div class="product-label">${item.title}</div>`;
                }
            }
            content += `<div class="swapper-item ${activeClass}">${itemContent}</div>`;

        });
        
        // Add nav buttons if it's not a banner
        if (!options.isBanner) {
            content += `
                <div class="swapper-nav">
                    <button class="swapper-nav-btn prev-btn">❮</button>
                    <button class="swapper-nav-btn next-btn">❯</button>
                </div>
            `;
        }
    }
    
    swapperContainer.innerHTML = content;
    initializeSwapper(containerSelector, options);
}


/* ====== Main Execution ====== */
document.addEventListener('DOMContentLoaded', () => {
    
    // 💡 NOTE: This section will be replaced by static Eleventy code.
    // For now, we leave it so the site doesn't break
    // before you add content in Step 4.
    renderSwapper('offers', '.banner-swapper', { isBanner: true, autoplay: 5000 });
    renderSwapper('services', '.services-swapper', { autoplay: 4000 }); 
    renderSwapper('products', '.product-swapper', { autoplay: 4000 }); 
    renderSwapper('works', '.works-swapper', { autoplay: 3000 }); 

    // Close banner button
    const closeBtn = document.querySelector('.close-banner-btn');
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            const banner = document.getElementById('top-banner');
            if (banner) banner.style.display = 'none';
        });
    }

    // WhatsApp Form Handler (your existing code...)

    // --- SCROLL ANIMATION LOGIC ---
    // This is the fix for your invisible content
    const sectionsToFade = document.querySelectorAll('.fade-in-section');
    
    if (sectionsToFade.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1 
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); 
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sectionsToFade.forEach(section => {
            observer.observe(section);
        });
    }
    // --- END SCROLL ANIMATION ---

    // --- CHATBOT LOGIC --- (your existing code...)
});
                                                  
