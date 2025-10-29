/* js/main.js */
/* 💡 CLEANUP: This file has been simplified.
  All GitHub API fetching (fetchCollectionItems, renderSwapper) 
  has been REMOVED because Eleventy now builds your galleries statically.
  This file now ONLY handles client-side interactivity.
*/

/* ==================================================
===== Swapper and Gallery Logic ==================
================================================== 
*/
function initializeSwapper(swapperSelector, options = {}) {
     const swapper = document.querySelector(swapperSelector);
    if (!swapper) return; // Exit if this gallery isn't on the current page

    const items = swapper.querySelectorAll('.swapper-item');
    const prevBtn = swapper.querySelector('.prev-btn');
    const nextBtn = swapper.querySelector('.next-btn');
    let currentIndex = 0;
    let autoplayInterval = null;

    if (items.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        
        // If it's a banner, we don't need to do anything else
        if (options.isBanner) {
            // But if it's NOT a banner and only 1 item, show it
            if (items.length === 1) {
                showItem(0);
            }
            return;
        }
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
        if (options.autoplay && items.length > 1) { 
            autoplayInterval = setInterval(next, options.autoplay);
        }
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }
    
    showItem(currentIndex); // Show the first item
    startAutoplay(); // Start the slideshow
}


/* ==================================================
===== Main Execution (On Page Load) ==============
================================================== 
*/
document.addEventListener('DOMContentLoaded', () => {
    
    // 💡 UPDATED: We now just INITIALIZE the static galleries
    
    // --- Galleries on ALL pages ---
    initializeSwapper('.banner-swapper', { isBanner: true, autoplay: 5000 });

    // --- Galleries on Homepage (index.liquid) ---
    initializeSwapper('.products-panel-gallery', { autoplay: 4000 });
    initializeSwapper('.works-panel-gallery', { autoplay: 3000 });
    initializeSwapper('.services-panel-gallery', { autoplay: 3500 });

    // --- Galleries on Products page (products.html) ---
    // 💡 REMOVED: initializeSwapper('.product-swapper', ...);

    // --- Galleries on Services page (services-works.liquid) ---
    initializeSwapper('.services-swapper', { autoplay: 4000 });
    initializeSwapper('.works-swapper', { autoplay: 3000 });


    // --- Close banner button ---
    const closeBtn = document.querySelector('.close-banner-btn');
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            const banner = document.getElementById('top-banner');
            if (banner) banner.style.display = 'none';
        });
    }

    // --- SCROLL ANIMATION LOGIC (for .fade-in-section) ---
    const sectionsToFade = document.querySelectorAll('.fade-in-section');
    
    if (sectionsToFade.length > 0) {
        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); 
                }
            });
        }, { threshold: 0.1 });

        sectionsToFade.forEach(section => {
            sectionObserver.observe(section);
        });
    }

    // --- 💡 NEW: "INFINITE SCROLL" for Product Grid ---
    const productCards = document.querySelectorAll('.product-card');
    
    if (productCards.length > 0) {
        const cardObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add a slight delay based on the item's index
                    // This creates a nice "staggered" load-in effect
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, 100 * (index % 10)); // 100ms delay per item, resets every 10
                    
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px' }); // Start loading 50px before it's fully in view

        productCards.forEach(card => {
            cardObserver.observe(card);
        });
    }

    // --- CHATBOT LOGIC --- 
    // (Your existing chatbot code would go here)
});
