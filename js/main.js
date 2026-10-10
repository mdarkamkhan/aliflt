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

    // Initialize all generic swappers
    [".product-swapper", ".products-panel-gallery", 
     ".services-panel-gallery", ".works-panel-gallery", ".designs-panel-gallery"]
    .forEach(sel => initSwapper(sel));

    /* ================================
         11. BANNER CAROUSEL LOGIC
    ================================ */
    function initBannerCarousel(selector) {
        const wrap = document.querySelector(selector);
        if (!wrap) return;

        const items = wrap.querySelectorAll(".swapper-item");
        const dots = wrap.querySelectorAll(".banner-dot");
        
        if (items.length <= 1) {
            if (items.length === 1 && items[0].dataset.type === 'video') {
                const vid = items[0].querySelector('video');
                if (vid) {
                    vid.loop = true;
                    vid.play().catch(e => console.warn("Video autoplay blocked", e));
                }
            }
            return;
        }

        let current = 0;
        let autoplayTimer = null;

        function show(i) {
            const prevType = items[current].dataset.type;
            if (prevType === 'video') {
                const prevVid = items[current].querySelector('video');
                if (prevVid) prevVid.pause();
            }

            items.forEach(x => x.classList.remove("active"));
            if (dots.length > 0) dots.forEach(x => x.classList.remove("active"));
            
            items[i].classList.add("active");
            if (dots.length > 0) dots[i].classList.add("active");
            
            current = i;
            
            const newType = items[i].dataset.type;
            clearTimeout(autoplayTimer);
            
            if (newType === 'video') {
                const newVid = items[i].querySelector('video');
                if (newVid) {
                    newVid.play().catch(e => console.warn("Video autoplay blocked", e));
                    newVid.onended = () => nextSlide();
                } else {
                    autoplayTimer = setTimeout(nextSlide, 5000);
                }
            } else {
                autoplayTimer = setTimeout(nextSlide, 5000);
            }
        }
        
        function nextSlide() { show((current + 1) % items.length); }
        function prevSlide() { show((current - 1 + items.length) % items.length); }

        show(0);

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                show(idx);
            });
        });

        let startX = 0;
        let startY = 0;
        wrap.addEventListener("touchstart", e => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        wrap.addEventListener("touchend", e => {
            let endX = e.changedTouches[0].clientX;
            let endY = e.changedTouches[0].clientY;
            let diffX = Math.abs(endX - startX);
            let diffY = Math.abs(endY - startY);
            if (diffX > 50 && diffX > diffY) { 
                if (endX < startX) nextSlide();
                else prevSlide();
            }
        }, { passive: true });
    }
    initBannerCarousel(".banner-swapper");

    /* ================================
         11.5 PRODUCT SMART SHUFFLE & PULL-TO-REFRESH
    ================================ */
    const productGrid = document.querySelector(".product-grid");
    if (productGrid) {
        const cards = Array.from(productGrid.querySelectorAll(".product-card"));
        
        if (cards.length > 0) {
            // Helpers
            const shuffleArray = (arr) => {
                let current = arr.length, temp, random;
                while (current !== 0) {
                    random = Math.floor(Math.random() * current);
                    current--;
                    temp = arr[current];
                    arr[current] = arr[random];
                    arr[random] = temp;
                }
                return arr;
            };

            const chunkSize = 6;
            
            // Core generation logic
            const executeSmartShuffle = (storageKey) => {
                let newOrder = [];
                const generateOrder = () => {
                    // 1. Group by category
                    const categories = {};
                    cards.forEach(card => {
                        const cat = (card.dataset.category || "uncategorized").toLowerCase();
                        if (!categories[cat]) categories[cat] = [];
                        categories[cat].push(card);
                    });

                    // 2. Chunk-shuffle within each category queue
                    const shuffledCategories = {};
                    for (const cat in categories) {
                        let catCards = categories[cat];
                        let shuffledCat = [];
                        for (let i = 0; i < catCards.length; i += chunkSize) {
                            const chunk = catCards.slice(i, i + chunkSize);
                            shuffledCat = shuffledCat.concat(shuffleArray(chunk));
                        }
                        shuffledCategories[cat] = shuffledCat;
                    }

                    // 3. Interleave (Round-Robin)
                    let tempOrder = [];
                    let catKeys = Object.keys(shuffledCategories);
                    let maxLen = Math.max(...catKeys.map(k => shuffledCategories[k].length));
                    
                    for (let i = 0; i < maxLen; i++) {
                        // Shuffle keys each round for extra natural variance
                        catKeys = shuffleArray(catKeys.slice());
                        
                        for (const cat of catKeys) {
                            if (shuffledCategories[cat][i]) {
                                tempOrder.push(shuffledCategories[cat][i]);
                            }
                        }
                    }
                    return tempOrder;
                };

                newOrder = generateOrder();
                let newOrderIds = newOrder.map(c => c.getAttribute('href')).join(',');
                const lastOrder = sessionStorage.getItem(storageKey);

                if (lastOrder && lastOrder === newOrderIds) {
                    newOrder = generateOrder();
                    newOrderIds = newOrder.map(c => c.getAttribute('href')).join(',');
                }

                sessionStorage.setItem(storageKey, newOrderIds);

                // Reorder DOM
                newOrder.forEach(card => {
                    productGrid.appendChild(card);
                });
            };

            // Detect type and assign specific storage key
            const shuffleType = productGrid.dataset.shuffleType || 'product';
            const storageKey = shuffleType === 'design' ? 'alifDesignOrder' : 'alifProductOrder';

            // Run once on load
            executeSmartShuffle(storageKey);

            // PULL TO REFRESH LOGIC
            const ptrIndicator = document.createElement("div");
            ptrIndicator.id = "ptr-indicator";
            ptrIndicator.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>`;
            document.body.appendChild(ptrIndicator);
            document.body.style.overscrollBehaviorY = 'contain';

            let startY = 0;
            let currentY = 0;
            let isPulling = false;
            let refreshTriggered = false;
            const threshold = 70;

            window.addEventListener('touchstart', (e) => {
                if (window.scrollY <= 0) {
                    startY = e.touches[0].clientY;
                    isPulling = true;
                    refreshTriggered = false;
                    ptrIndicator.style.transition = 'none';
                }
            }, { passive: true });

            window.addEventListener('touchmove', (e) => {
                if (!isPulling) {
                    if (window.scrollY <= 0) {
                        isPulling = true;
                        startY = e.touches[0].clientY;
                        refreshTriggered = false;
                        ptrIndicator.style.transition = 'none';
                    }
                    return;
                }

                currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;

                if (pullDistance < 0) {
                    isPulling = false;
                    ptrIndicator.style.transform = 'translateX(-50%) translateY(-40px)';
                    ptrIndicator.style.opacity = '0';
                    return;
                }

                if (pullDistance > 0 && window.scrollY <= 0) {
                    const pullPercent = Math.min(pullDistance / threshold, 1);
                    ptrIndicator.style.transform = `translateX(-50%) translateY(${Math.min(pullDistance, threshold + 20)}px) rotate(${pullPercent * 180}deg)`;
                    ptrIndicator.style.opacity = pullPercent;
                    
                    if (pullDistance > threshold) {
                        ptrIndicator.classList.add('ready');
                        refreshTriggered = true;
                    } else {
                        ptrIndicator.classList.remove('ready');
                        refreshTriggered = false;
                    }
                } else {
                    isPulling = false;
                }
            }, { passive: true });

            window.addEventListener('touchend', () => {
                if (!isPulling) return;
                isPulling = false;
                ptrIndicator.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

                if (refreshTriggered) {
                    ptrIndicator.classList.remove('ready');
                    ptrIndicator.classList.add('refreshing');
                    ptrIndicator.style.transform = `translateX(-50%) translateY(${threshold}px)`;
                    
                    setTimeout(() => {
                        executeSmartShuffle();
                        if(window.showToast) window.showToast("Products refreshed!");
                        
                        setTimeout(() => {
                            ptrIndicator.style.transform = 'translateX(-50%) translateY(-40px)';
                            ptrIndicator.style.opacity = '0';
                            setTimeout(() => ptrIndicator.classList.remove('refreshing'), 300);
                        }, 400);
                    }, 600);
                } else {
                    ptrIndicator.style.transform = 'translateX(-50%) translateY(-40px)';
                    ptrIndicator.style.opacity = '0';
                }
                refreshTriggered = false;
            }, { passive: true });
        }
    }

});
    /* ================================
         12. PWA INSTALL LOGIC (RESTORED) 📱
    ================================ */
    let deferredPrompt;
    const installBtn = document.getElementById('install-pwa-btn');

    // 1. Browser se signal ka wait karo (Standard Way)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Agar signal mila, toh button dikhao
        if(installBtn) installBtn.style.display = 'flex';
        console.log("📲 PWA Ready to install");
    });

    // 2. FORCE SHOW ON MOBILE (iPhone/Android fix)
    // Agar browser signal na bhi de, tab bhi mobile par button dikhao
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && installBtn) {
        installBtn.style.display = 'flex'; 
    }

    // 3. Button Click Logic
    if(installBtn) {
        installBtn.addEventListener('click', () => {
            if(deferredPrompt) {
                // Scenario A: Automatic Prompt Available (Android Chrome)
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                    } else {
                        console.log('User dismissed the A2HS prompt');
                    }
                    deferredPrompt = null;
                });
            } else {
                // Scenario B: Manual Instructions (iPhone / App already installed)
                alert("To install app:\n\n1. Tap Share icon / Menu (⋮)\n2. Select 'Add to Home Screen'");
            }
        });
    }
    /* ================================
         13. ALiF AI CHATBOT (ZARA / APPLE MONOCHROME MINIMALIST UI) 🤖
    ================================ */
    /* ================================
         13. ALiF AI CHATBOT (SHARP LUXURY UI WITH BACKDROP BLUR & SCROLL LOCK) 🤖
    ================================ */
    let chatContainer = document.getElementById('chat-widget');
    if (!chatContainer) {
        chatContainer = document.createElement('div');
        chatContainer.id = 'chat-widget';
        document.body.appendChild(chatContainer);
    }
    
    // Inject Backdrop Blur Overlay
    let chatBackdrop = document.getElementById('chat-backdrop');
    if (!chatBackdrop) {
        chatBackdrop = document.createElement('div');
        chatBackdrop.id = 'chat-backdrop';
        document.body.appendChild(chatBackdrop);
    }
    
    if (chatContainer) {
        // 1. Inject Minimalist Monochrome HTML UI
        chatContainer.innerHTML = `
            <button id="chat-button" title="Chat with ALiF AI" aria-label="Open Chat">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>

            <div id="chat-window" class="mono-chat-window">
                <div id="chat-header">
                    <div class="chat-header-title">
                        <span class="brand-title">ALiF</span>
                        <span class="brand-sub">ASSISTANT</span>
                    </div>
                    <button id="close-chat" aria-label="Close Chat">&times;</button>
                </div>

                <div id="chat-messages">
                    <div class="message ai-message">Hello! Welcome to ALiF Ladies Tailor & Boutique. How can I help you today?</div>
                    <div class="chat-chips-container">
                        <button type="button" class="chat-chip" data-msg="Shop location aur timings bataiye">Location & Timings</button>
                        <button type="button" class="chat-chip" data-msg="Stitching rates kya hain?">Stitching Rates</button>
                        <button type="button" class="chat-chip" data-msg="Laces aur Latkans dikhao">Laces & Latkans</button>
                        <button type="button" class="chat-chip" data-msg="WhatsApp contact number kya hai?">WhatsApp Support</button>
                    </div>
                </div>

                <form id="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off">
                    <button type="submit" id="chat-send" aria-label="Send Message" disabled>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </form>
            </div>
        `;

        // 2. Logic Variables
        const chatBtn = document.getElementById('chat-button');
        const chatWindow = document.getElementById('chat-window');
        const closeChat = document.getElementById('close-chat');
        const msgArea = document.getElementById('chat-messages');
        const chatForm = document.getElementById('chat-input-area');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');

        // 3. Dynamic Send Button Validation (Minimum 4 Characters Required)
        function updateSendButtonState() {
            const val = chatInput.value.trim();
            if (val.length >= 4) {
                chatSend.disabled = false;
                chatSend.classList.add('is-active');
            } else {
                chatSend.disabled = true;
                chatSend.classList.remove('is-active');
            }
        }

        chatInput.addEventListener('input', updateSendButtonState);

        // 4. Toggle Chat (Open & Close with Blur & Body Scroll Lock)
        const openChatWidget = () => {
            chatWindow.classList.add('is-open');
            chatBackdrop.classList.add('is-open');
            document.body.classList.add('chat-active');
            chatBtn.style.display = 'none';
            chatInput.focus();
        };

        const closeChatWidget = () => {
            chatWindow.classList.remove('is-open');
            chatBackdrop.classList.remove('is-open');
            document.body.classList.remove('chat-active');
            chatBtn.style.display = 'flex';
        };

        chatBtn.addEventListener('click', openChatWidget);
        // 5. Handle Quick Chips Click
        msgArea.addEventListener('click', (e) => {
            const chip = e.target.closest('.chat-chip');
            if (chip) {
                const userMsg = chip.dataset.msg;
                if (userMsg) {
                    sendMessage(userMsg);
                }
            }
        });

        // 6. Conversation History & Catalog Index
        const conversationHistory = [];
        let searchIndex = [];
        fetch('/search.json').then(r => r.json()).then(data => { searchIndex = data; }).catch(e => console.warn(e));

        // 7. Render Catalog Cards in Chat
        function renderChatCatalog(category) {
            if (!searchIndex || searchIndex.length === 0) return;
            const targetCat = (category || 'all').toLowerCase();
            
            const matchedItems = searchIndex.filter(item => {
                if (targetCat === 'all') return true;
                const catStr = (item.category || '').toLowerCase();
                const titleStr = (item.title || '').toLowerCase();
                return catStr.includes(targetCat) || titleStr.includes(targetCat);
            }).slice(0, 4);

            if (matchedItems.length === 0) return;

            const slider = document.createElement('div');
            slider.className = 'chat-catalog-slider';
            
            matchedItems.forEach(item => {
                const card = document.createElement('a');
                card.href = item.url;
                card.className = 'chat-catalog-item';
                card.innerHTML = `
                    <div class="chat-catalog-img">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="chat-catalog-info">
                        <span class="chat-catalog-title">${item.title}</span>
                        <span class="chat-catalog-price">${item.price ? '₹' + item.price : 'View Item'}</span>
                    </div>
                `;
                slider.appendChild(card);
            });

            msgArea.appendChild(slider);
            msgArea.scrollTop = msgArea.scrollHeight;
        }

        // 8. Send Message Function
        async function sendMessage(text) {
            if (!text) return;

            // Add User Message to UI & History
            addMessage(text, 'user-message');
            conversationHistory.push({ role: 'user', parts: [{ text: text }] });

            chatInput.value = '';
            updateSendButtonState();

            // AI Typing Indicator
            const loadingId = 'loading-' + Date.now();
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message ai-message typing-indicator';
            loadingDiv.id = loadingId;
            loadingDiv.innerHTML = `<span></span><span></span><span></span>`;
            msgArea.appendChild(loadingDiv);
            msgArea.scrollTop = msgArea.scrollHeight;

            try {
                const response = await fetch('/.netlify/functions/ask-ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        history: conversationHistory
                    })
                });

                const data = await response.json();
                
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();

                if (response.ok) {
                    let replyText = data.reply || "";
                    let catalogCat = null;
                    
                    const match = replyText.match(/\[SHOW_CATALOG:?\s*(\w*)\]/i);
                    if (match) {
                        catalogCat = match[1] || 'all';
                        replyText = replyText.replace(/\[SHOW_CATALOG:?\s*\w*\]/gi, '').trim();
                    }

                    addMessage(replyText, 'ai-message');
                    conversationHistory.push({ role: 'model', parts: [{ text: replyText }] });

                    if (catalogCat) {
                        renderChatCatalog(catalogCat);
                    }
                } else {
                    addMessage(data.error || "Server down. Please call us directly.", 'ai-message');
                }
            } catch (error) {
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();
                addMessage("Oops! My AI brain is offline right now.", 'ai-message');
            }
        }

        // 7. Form Submit Event
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text.length >= 4) {
                sendMessage(text);
            }
        });

        // Helper: Add Message to UI
        function addMessage(text, className) {
            const div = document.createElement('div');
            div.className = `message ${className}`;
            div.textContent = text;
            msgArea.appendChild(div);
            msgArea.scrollTop = msgArea.scrollHeight;
        }
    }


/* ================================
     13. SMART PRODUCT RECOMMENDATIONS
================================ */
document.addEventListener("DOMContentLoaded", () => {
    const recEngine = document.getElementById("product-recommendation-engine");
    if (!recEngine) return;

    const currentUrl = recEngine.getAttribute("data-url");
    const currentCategory = (recEngine.getAttribute("data-category") || "").toLowerCase();
    const currentTitle = (recEngine.getAttribute("data-title") || "").toLowerCase();
    
    // Determine context (product vs design)
    const pageType = currentUrl.includes('/designs/') ? 'design' : 'product';

    const getKeywords = (title) => {
        return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    };
    const currentKeywords = getKeywords(currentTitle);

    const renderCards = (items, containerId, sectionId) => {
        const container = document.getElementById(containerId);
        const section = document.getElementById(sectionId);
        if (!container || !section) return;

        if (items.length === 0) {
            section.style.display = 'none';
            return;
        }

        let html = '';
        items.forEach(item => {
            html += `<a href="${item.url}" style="text-decoration: none; color: #000; min-width: 160px;">
                    <div style="aspect-ratio: 1/1.2; overflow: hidden; margin-bottom: 10px; border: 1px solid #f0f0f0;">
                        <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <p style="margin: 0; font-size: 0.9rem; text-align: center;">${item.title}</p>
                    <p style="margin: 0; font-size: 0.85rem; text-align: center; color: #666;">${item.price ? '₹' + item.price : 'Price on Request'}</p>
                </a>`;
        });

        container.innerHTML = html;
        section.style.display = 'block';
    };

    // Check Cache First
    const rawCache = sessionStorage.getItem('alifRecommendationCache');
    let recCache = {};
    try { recCache = rawCache ? JSON.parse(rawCache) : { product: {}, design: {} }; } catch(e) { recCache = { product: {}, design: {} }; }
    
    // Ensure structure exists
    if (!recCache[pageType]) recCache[pageType] = {};

    if (recCache[pageType][currentUrl]) {
        const cachedData = recCache[pageType][currentUrl];
        renderCards(cachedData.similar, 'similar-items-container', 'similar-items-section');
        renderCards(cachedData.ymal, 'ymal-container', 'ymal-section');
        return;
    }

    fetch('/search.json')
        .then(res => res.json())
        .then(catalog => {
            if (!catalog || catalog.length === 0) return;

            let similarItems = [];
            let ymalItems = [];
            
            // Filter catalog by page type first so Designs only recommend Designs, and Products only recommend Products
            const typeFilteredCatalog = catalog.filter(item => item.url.includes(`/${pageType}s/`));
            
            // 1. Score items for SIMILAR ITEMS
            const similarScored = typeFilteredCatalog
                .filter(item => item.url !== currentUrl)
                .map(item => {
                    let score = 0;
                    const itemCat = (item.category || "").toLowerCase();
                    const itemKeywords = getKeywords(item.title);
                    
                    if (itemCat && itemCat === currentCategory) {
                        score += 50;
                    }

                    // Keyword overlap
                    let matches = currentKeywords.filter(kw => itemKeywords.includes(kw));
                    if (matches.length > 0) score += (matches.length * 20);

                    // Random rotation (0-10)
                    score += Math.random() * 10;
                    
                    return { item, score };
                })
                .sort((a, b) => b.score - a.score);

            similarItems = similarScored.slice(0, 12).map(s => s.item);

            // 2. Score items for YOU MAY ALSO LIKE
            const similarUrls = similarItems.map(i => i.url);
            const totalItems = typeFilteredCatalog.length;

            const ymalScored = typeFilteredCatalog
                .filter(item => item.url !== currentUrl && !similarUrls.includes(item.url))
                .map((item, index) => {
                    let score = 0;
                    const itemCat = (item.category || "").toLowerCase();
                    
                    if (itemCat && itemCat !== currentCategory) {
                        score += 30; // Encourage cross-category discovery
                    } else {
                        score += 5; // Allow same category if we really need it
                    }

                    // Freshness (assuming catalog array is older->newer)
                    score += (index / totalItems) * 20;

                    // Heavy random rotation for discovery (0-30)
                    score += Math.random() * 30;

                    return { item, score };
                })
                .sort((a, b) => b.score - a.score);

            ymalItems = ymalScored.slice(0, 12).map(s => s.item);

            // Save to Cache
            recCache[pageType][currentUrl] = { similar: similarItems, ymal: ymalItems };
            sessionStorage.setItem('alifRecommendationCache', JSON.stringify(recCache));

            // Render HTML
            renderCards(similarItems, 'similar-items-container', 'similar-items-section');
            renderCards(ymalItems, 'ymal-container', 'ymal-section');
        })
        .catch(err => console.error("Error loading recommendations:", err));
});

/* ================================
     14. OFFER COUNTDOWN TIMER
================================ */
document.addEventListener("DOMContentLoaded", () => {
    function updateTimers() {
        const now = new Date().getTime();
        
        // 1. Main Product Page Offer (id="productOfferContainer")
        const mainOffer = document.getElementById("productOfferContainer");
        if (mainOffer) {
            const endDateStr = mainOffer.getAttribute("data-offer-end");
            const timerEl = mainOffer.querySelector(".countdown");
            
            if (endDateStr && timerEl) {
                const endDate = new Date(endDateStr).getTime();
                const distance = endDate - now;

                if (distance < 0) {
                    // Offer Expired
                    const regularPrice = mainOffer.getAttribute("data-regular-price");
                    mainOffer.innerHTML = `<div class="product-detail-price">₹${regularPrice}</div>`;
                    
                    // Revert Cart Buttons
                    const btnCart = document.getElementById("addToCartBtn");
                    const btnBuy = document.getElementById("buyNowBtn");
                    if (btnCart) btnCart.setAttribute("data-price", regularPrice);
                    if (btnBuy) btnBuy.setAttribute("data-price", regularPrice);
                } else {
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    
                    timerEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                }
            }
        }

        // 2. Product Grid Offers (class="product-card-price has-offer")
        const gridOffers = document.querySelectorAll(".product-card-price-wrapper");
        gridOffers.forEach(wrapper => {
            const offerPriceDiv = wrapper.querySelector(".has-offer");
            if (!offerPriceDiv) return;
            
            const endDateStr = offerPriceDiv.getAttribute("data-offer-end");
            const timerEl = wrapper.querySelector(".offer-timer-mini");
            
            if (endDateStr) {
                const endDate = new Date(endDateStr).getTime();
                const distance = endDate - now;
                
                if (distance < 0) {
                    // Revert to regular
                    const del = offerPriceDiv.querySelector("del");
                    if (del) {
                        wrapper.innerHTML = `<div class="product-card-price">${del.innerText}</div>`;
                        const card = wrapper.closest('.product-card');
                        if (card) {
                            const badge = card.querySelector('.discount-badge');
                            if (badge) badge.remove();
                        }
                    }
                } else if (timerEl) {
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    
                    timerEl.innerHTML = `Ends in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
                }
            }
        });
    }

    // Run immediately, then every second
    updateTimers();
    setInterval(updateTimers, 1000);
});
