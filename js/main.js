document.addEventListener("DOMContentLoaded", () => {
    
    /* ================================
          1. CART LOGIC 🛒
    ================================ */
    const cart = {
        items: {},
        init() {
            const stored = localStorage.getItem("alifCart");
            if (stored) this.items = JSON.parse(stored);
            this.updateIcon();
        },
        save() {
            localStorage.setItem("alifCart", JSON.stringify(this.items));
        },
        add(id, title, price, image) {
            if (!this.items[id]) {
                this.items[id] = { title, price: Number(price), image, qty: 1 };
            } else {
                this.items[id].qty++;
            }
            this.save();
            this.updateIcon();
            if(window.showToast) window.showToast("Added to cart!");
        },
        remove(id) {
            delete this.items[id];
            this.save();
            this.updateIcon();
        },
        updateIcon() {
            let total = 0;
            for (const id in this.items) total += this.items[id].qty;

            // 1. Desktop Icon Update
            const desktopCount = document.getElementById("cartCount");
            if (desktopCount) {
                desktopCount.textContent = total;
                desktopCount.style.display = total > 0 ? 'flex' : 'none';
            }

            // 2. Mobile Bottom Icon Update
            const mobileCount = document.getElementById("cartCountMobile");
            if (mobileCount) {
                mobileCount.textContent = total;
                mobileCount.style.display = total > 0 ? 'inline-block' : 'none';
            }
        },
        getTotalPrice() {
            let total = 0;
            for (const id in this.items) {
                const it = this.items[id];
                total += it.price * it.qty;
            }
            return total;
        }
    };
    cart.init(); // Start Cart

    /* ================================
         2. TOAST MESSAGE 🍞
    ================================ */
    window.showToast = function(msg) {
        // Purana toast hatao agar koi hai
        const existing = document.querySelector('.toast');
        if(existing) existing.remove();

        const t = document.createElement("div");
        t.className = "toast";
        t.textContent = msg;
        document.body.appendChild(t);
        
        setTimeout(() => t.classList.add("show"), 100);
        setTimeout(() => {
            t.classList.remove("show");
            setTimeout(() => t.remove(), 300);
        }, 3000);
    };

    /* ================================
         3. SIDEBAR NAVIGATION (FIXED) 🛠️
    ================================ */
    const navToggle = document.getElementById("navToggleBtn");
    const sidebar = document.getElementById("sidebarMenu");
    const overlay = document.getElementById("sidebarOverlay");
    const closeBtn = document.getElementById("sidebarCloseBtn");
    const body = document.body;

    if (navToggle && sidebar && overlay) {
        const openMenu = () => {
            // FIX: 'active' ki jagah 'is-open' use kiya CSS match karne ke liye
            sidebar.classList.add("is-open");
            overlay.classList.add("is-open");
            body.classList.add("sidebar-open"); // CSS class for overflow hidden
        };
        const closeMenu = () => {
            sidebar.classList.remove("is-open");
            overlay.classList.remove("is-open");
            body.classList.remove("sidebar-open");
        };

        navToggle.addEventListener("click", openMenu);
        if (closeBtn) closeBtn.addEventListener("click", closeMenu);
        overlay.addEventListener("click", closeMenu);
    }

    /* ================================
         4. BOTTOM NAVIGATION ACTIVE STATE 📱
    ================================ */
    const bottomNavItems = document.querySelectorAll('.b-nav-item');
    const currentPath = window.location.pathname;

    bottomNavItems.forEach(item => {
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });

    /* ================================
         5. SEARCH OVERLAY UI 🔍
    ================================ */
    const searchOverlay = document.getElementById('search-overlay');
    const openSearchBtn = document.getElementById('open-search');
    const closeSearchBtn = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');

    if (openSearchBtn && searchOverlay) {
        openSearchBtn.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            setTimeout(() => { if(searchInput) searchInput.focus(); }, 100);
        });
    }

    if (closeSearchBtn && searchOverlay) {
        closeSearchBtn.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
            if(searchInput) searchInput.value = ''; 
            const results = document.getElementById('search-results');
            if(results) results.innerHTML = ''; 
        });
    }

    /* ================================
         6. FILTER BUTTONS
    ================================ */
    const filterButtons = document.querySelectorAll(".filter-btn");
    const productCards = document.querySelectorAll(".product-card");

    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                filterButtons.forEach(b => b.classList.remove("active"));
                e.currentTarget.classList.add("active");

                const rawValues = e.currentTarget.dataset.filterValues || e.currentTarget.dataset.filter || "all";
                const filterValues = rawValues.split(",").map(s => s.trim().toLowerCase());

                productCards.forEach(card => {
                    const cardCategory = (card.dataset.category || "").toLowerCase();
                    if (filterValues.includes("all") || filterValues.includes(cardCategory)) {
                        card.classList.remove("hidden");
                        card.style.display = "block";
                        setTimeout(() => card.classList.add("is-visible"), 10);
                    } else {
                        card.classList.remove("is-visible");
                        card.classList.add("hidden");
                        setTimeout(() => {
                            if (card.classList.contains("hidden")) card.style.display = "none";
                        }, 300);
                    }
                });
            });
        });
    }

    /* ================================
         7. CLICK HANDLING (Add to Cart / Buy)
    ================================ */
    document.addEventListener("click", (e) => {
        const target = e.target.closest('button') || e.target; 

        // Add To Cart Logic
        if (target && (target.id === "addToCartBtn" || target.classList.contains("add-to-cart-btn"))) {
            
            if (target.textContent.includes("GO TO CART")) {
                window.location.href = "/cart/";
                return;
            }

            const productId = target.dataset.productId || target.dataset.id;
            
            if(productId) {
                cart.add(
                    productId,
                    target.dataset.title,
                    target.dataset.price,
                    target.dataset.image
                );

                target.textContent = "GO TO CART";
                target.style.backgroundColor = "#000";
                target.style.color = "#fff";
                
                if(window.showToast) window.showToast(`${target.dataset.title} added to cart`);
            }
        }

        // Buy Now (WhatsApp)
        if (target && target.id === "buyNowBtn") {
            const msg = `*Hi Alif!* I want to buy:\n*${target.dataset.title}*\nPrice: ₹${target.dataset.price}`;
            window.open(`https://wa.me/7250470009?text=${encodeURIComponent(msg)}`, '_blank');
        }

        // Cart Page Logic
        if (target && target.classList.contains("qty-btn")) {
            const id = target.dataset.id;
            if (target.dataset.action === "inc") cart.items[id].qty++;
            if (target.dataset.action === "dec" && cart.items[id].qty > 1) cart.items[id].qty--;
            cart.save();
            renderCartPage();
            cart.updateIcon();
        }
        
        if (target && target.classList.contains("remove-btn")) {
            cart.remove(target.dataset.id);
            renderCartPage();
        }
    });

    /* ================================
         8. RENDER CART PAGE
    ================================ */
    function renderCartPage() {
        const container = document.getElementById("cart-items-container");
        if (!container) return;

        const empty = document.getElementById("cart-empty-message");
        const actions = document.getElementById("cart-actions");
        const summary = document.getElementById("cart-summary");
        const totalDisplay = document.getElementById("cart-total");

        container.innerHTML = "";
        const itemIds = Object.keys(cart.items);

        if (itemIds.length === 0) {
            if (empty) empty.style.display = "block";
            if (actions) actions.style.display = "none";
            if (summary) summary.style.display = "none";
            return;
        }

        if (empty) empty.style.display = "none";
        if (actions) actions.style.display = "block";
        if (summary) summary.style.display = "block";

        itemIds.forEach((id) => {
            const item = cart.items[id];
            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <div class="cart-img-box"><img src="${item.image}" alt="product"></div>
                <div class="cart-info">
                    <h4>${item.title}</h4>
                    <p class="price">₹${item.price}</p>
                    <div class="cart-item-quantity">
                        <button class="cart-item-qty-btn qty-btn" data-id="${id}" data-action="dec">-</button>
                        <span class="cart-item-qty-text">${item.qty}</span>
                        <button class="cart-item-qty-btn qty-btn" data-id="${id}" data-action="inc">+</button>
                    </div>
                </div>
                <button class="remove-btn" data-id="${id}">&times;</button>
            `;
            container.appendChild(div);
        });

        if (totalDisplay) totalDisplay.textContent = "Total: ₹" + cart.getTotalPrice();
    }
    renderCartPage();

    /* ================================
         9. WHATSAPP ORDER BUTTON
    ================================ */
    const orderBtn = document.getElementById("proceedToOrderBtn");
    if (orderBtn) {
        orderBtn.onclick = () => {
            let text = "*New Order Request* 📦\n\n";
            let total = 0;
            for (let id in cart.items) {
                let it = cart.items[id];
                text += `▪️ ${it.title} (x${it.qty}) - ₹${it.price * it.qty}\n`;
                total += it.price * it.qty;
            }
            text += `\n*Grand Total: ₹${total}*`;
            window.open(`https://wa.me/7250470009?text=${encodeURIComponent(text)}`, '_blank');
        };
    }

    /* ================================
         10. SWAPPER / GALLERY LOGIC
    ================================ */
    function initSwapper(selector) {
        const wrap = document.querySelector(selector);
        if (!wrap) return;

        const items = wrap.querySelectorAll(".swapper-item");
        const prevBtn = wrap.querySelector(".prev-btn");
        const nextBtn = wrap.querySelector(".next-btn");

        if (items.length === 0) return;

        let current = 0;
        function show(i) {
            items.forEach(x => x.classList.remove("active"));
            items[i].classList.add("active");
            current = i;
        }
        show(0);

        if (prevBtn) prevBtn.onclick = (e) => { e.preventDefault(); show((current - 1 + items.length) % items.length); };
        if (nextBtn) nextBtn.onclick = (e) => { e.preventDefault(); show((current + 1) % items.length); };

        let startX = 0;
        wrap.addEventListener("touchstart", e => (startX = e.touches[0].clientX), { passive: true });
        wrap.addEventListener("touchend", e => {
            let endX = e.changedTouches[0].clientX;
            if (endX < startX - 50) { // Swipe Left
                if (nextBtn) nextBtn.click(); else show((current + 1) % items.length);
            }
            if (endX > startX + 50) { // Swipe Right
                if (prevBtn) prevBtn.click(); else show((current - 1 + items.length) % items.length);
            }
        }, { passive: true });
    }

    // Initialize all
    [".product-swapper", ".banner-swapper", ".products-panel-gallery", 
     ".services-panel-gallery", ".works-panel-gallery", ".designs-panel-gallery"]
    .forEach(sel => initSwapper(sel));

    /* ================================
         11. INTRO SPLASH REMOVER
    ================================ */
    // FIX: ID changed to 'intro-splash' to match your HTML
    const splash = document.getElementById('intro-splash'); 

    if (sessionStorage.getItem('alifAppVisited') === 'true') {
        if (splash) splash.style.display = 'none'; 
    } else {
        if (splash) {
            setTimeout(() => {
                // CSS Animation handles most of it, we just remove element
                splash.style.opacity = '0'; 
                setTimeout(() => splash.remove(), 500);
                
                sessionStorage.setItem('alifAppVisited', 'true'); 
            }, 2500); // 2.5 seconds sync with CSS animation
        }
    }

});
