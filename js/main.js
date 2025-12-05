document.addEventListener("DOMContentLoaded", () => {
    
    /* ================================
          1. CART LOGIC
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
         2. TOAST MESSAGE
    ================================ */
    window.showToast = function(msg) {
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
            // CSS class match karne ke liye 'is-open' use kiya
            sidebar.classList.add("is-open");
            overlay.classList.add("is-open");
            body.classList.add("sidebar-open");
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
         4. FILTER BUTTONS (FIXED) 🛠️
    ================================ */
    const filterButtons = document.querySelectorAll(".filter-btn");
    const productCards = document.querySelectorAll(".product-card");

    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();

                // 1. Remove Active from all
                filterButtons.forEach(b => b.classList.remove("active"));

                // 2. Add Active to clicked button
                const clickedBtn = e.currentTarget;
                clickedBtn.classList.add("active");

                // 3. Get Filter Value
                const rawValues = clickedBtn.dataset.filterValues || clickedBtn.dataset.filter || "all";
                const filterValues = rawValues.split(",").map(s => s.trim().toLowerCase());

                // 4. Show/Hide Products
                productCards.forEach(card => {
                    const cardCategory = (card.dataset.category || "").toLowerCase();

                    if (filterValues.includes("all") || filterValues.includes(cardCategory)) {
                        // Show
                        card.classList.remove("hidden");
                        card.style.display = "block";
                        setTimeout(() => card.classList.add("is-visible"), 10);
                    } else {
                        // Hide
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
         5. CLICK HANDLING (Add to Cart / Buy)
    ================================ */
    document.addEventListener("click", (e) => {
        const target = e.target.closest('button') || e.target; 

        // Add To Cart Logic
        if (target.id === "addToCartBtn" || target.classList.contains("add-to-cart-btn")) {
            
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
        if (target.id === "buyNowBtn") {
            const msg = `*Hi Alif!* I want to buy:\n*${target.dataset.title}*\nPrice: ₹${target.dataset.price}`;
            window.open(`https://wa.me/7250470009?text=${encodeURIComponent(msg)}`, '_blank');
        }

        // Cart Page Logic
        if (target.classList.contains("qty-btn") && target.dataset.action === "inc") {
            cart.items[target.dataset.id].qty++;
            cart.save();
            renderCartPage();
            cart.updateIcon();
        }
        if (target.classList.contains("qty-btn") && target.dataset.action === "dec") {
            const id = target.dataset.id;
            if (cart.items[id].qty > 1) cart.items[id].qty--;
            cart.save();
            renderCartPage();
            cart.updateIcon();
        }
        if (target.classList.contains("remove-btn")) {
            cart.remove(target.dataset.id);
            renderCartPage();
        }
    });

    /* ================================
         6. RENDER CART PAGE
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
         7. WHATSAPP ORDER BUTTON
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
         8. SWAPPER / GALLERY LOGIC
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

        if (prevBtn) prevBtn.onclick = (e) => {
            e.preventDefault();
            show((current - 1 + items.length) % items.length);
        };
        if (nextBtn) nextBtn.onclick = (e) => {
            e.preventDefault();
            show((current + 1) % items.length);
        };

        // Swipe Support
        let startX = 0;
        wrap.addEventListener("touchstart", e => (startX = e.touches[0].clientX), { passive: true });
        wrap.addEventListener("touchend", e => {
            let endX = e.changedTouches[0].clientX;
            if (endX < startX - 50) { // Swipe Left -> Next
                if (nextBtn) nextBtn.click();
                else show((current + 1) % items.length);
            }
            if (endX > startX + 50) { // Swipe Right -> Prev
                if (prevBtn) prevBtn.click();
                else show((current - 1 + items.length) % items.length);
            }
        }, { passive: true });
    }

    // Initialize all galleries
    initSwapper(".product-swapper");
    initSwapper(".banner-swapper");
    initSwapper(".products-panel-gallery");
    initSwapper(".services-panel-gallery");
    initSwapper(".works-panel-gallery");
    initSwapper(".designs-panel-gallery");

    /* ================================
         10. PWA INSTALL LOGIC
    ================================ */
    let deferredPrompt;
    const installBtn = document.getElementById('install-pwa-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'flex';
    });

    if (installBtn) {
        installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none';
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                    }
                    deferredPrompt = null;
                });
            }
        });
    }

    /* ================================
         11. INTRO SPLASH REMOVER (ONE TIME ONLY)
    ================================ */
    const splash = document.getElementById('intro-splash');

    // 1. Check karo: Kya user ne pehle animation dekha hai?
    if (sessionStorage.getItem('alifAppVisited') === 'true') {
        
        // Agar Haan: Toh splash screen ko turant chupao
        if (splash) {
            splash.style.display = 'none'; 
        }

    } else {
        
        // Agar Nahi: Toh animation chalne do
        if (splash) {
            setTimeout(() => {
                splash.remove(); // 3 second baad hatao
                
                // Memory mein save kar lo ki "Dekh Liya"
                sessionStorage.setItem('alifAppVisited', 'true'); 
            }, 3000);
        }
    }

}); // Closing Main Event Listener
