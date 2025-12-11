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
         13. ALiF AI CHATBOT (RESTORED) 🤖
    ================================ */
    const chatContainer = document.getElementById('chat-widget');
    
    if (chatContainer) {
        // 1. Inject HTML UI
        chatContainer.innerHTML = `
            <button id="chat-button">💬</button>
            <div id="chat-window">
                <div id="chat-header">
                    <span>ALiF ASSISTANT</span>
                    <button id="close-chat" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;">&times;</button>
                </div>
                <div id="chat-messages">
                    <div class="message ai-message">Hello! Main ALiF hun. Main aapki kya madad kar sakta hun? (Price, Address, Contact...)</div>
                </div>
                <form id="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Yahan likhein..." autocomplete="off">
                    <button type="submit" id="chat-send">➤</button>
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

        // 3. Toggle Chat
        chatBtn.addEventListener('click', () => {
            chatWindow.style.display = 'flex';
            chatBtn.style.display = 'none';
            chatInput.focus();
        });

        closeChat.addEventListener('click', () => {
            chatWindow.style.display = 'none';
            chatBtn.style.display = 'flex';
        });

        // 4. Send Message Logic
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            // User Message Show karo
            addMessage(text, 'user-message');
            chatInput.value = '';

            // AI Reply (Thinking Simulation)
            setTimeout(() => {
                const reply = getBotReply(text.toLowerCase());
                addMessage(reply, 'ai-message');
            }, 600);
        });

        // Helper: Add Message to UI
        function addMessage(text, className) {
            const div = document.createElement('div');
            div.className = `message ${className}`;
            div.textContent = text;
            msgArea.appendChild(div);
            msgArea.scrollTop = msgArea.scrollHeight; // Auto scroll to bottom
        }

                // 5. 🧠 ALiF AI BRAIN (Advanced Hinglish Version)
        function getBotReply(input) {
            input = input.toLowerCase();

            // 1. GREETINGS (Salam/Dua)
            if (match(input, ['hi', 'hello', 'hey', 'salam', 'assalam', 'namaste'])) {
                return "Walekum Assalam! 👋 Kahiye, aaj hum aapke liye kya design kar sakte hain?";
            }

            // 2. TIMING / OPENING (Smart Check: Kl, Aaj, Kab, Kula, Time)
            if (match(input, ['time', 'kab', 'khula', 'kula', 'open', 'band', 'closed', 'timing', 'baje', 'kl', 'kal', 'aaj'])) {
                return "🕒 Humara shop Subah 10:00 se Raat 9:00 tak khula rehta hai.\n(Note: Friday ko shop band rehti hai).";
            }

            // 3. ADDRESS / LOCATION (Kahan, Kidhar, Jagah, Shop)
            if (match(input, ['address', 'kahan', 'kidhar', 'jagah', 'location', 'shop', 'dukan', 'map', 'sahibganj'])) {
                return "📍 Humara pata hai: Joy Fastfood ke paas, Daal Kuan, College Road, Sahibganj.";
            }

            // 4. PRICE / RATES (Daam, Kitna, Paisa, Charges)
            if (match(input, ['price', 'daam', 'rate', 'kitne', 'kitna', 'cost', 'charge', 'paisa', 'money', 'silai'])) {
                return "💰 Blouse ki stitching ₹120 se shuru hoti hai. Lehenga aur Gown ke rates design ke hisaab se alag ho sakte hain.";
            }

            // 5. SERVICES (Kya banate ho, Blouse, Suit)
            if (match(input, ['blouse', 'suit', 'lehenga', 'gown', 'kurti', 'latkan', 'design', 'banate', 'silte'])) {
                return "👗 Hum Custom Bridal Blouses, Lehengas, Gowns aur Designer Suits banate hain. Aap apna design dikha kar bhi banwa sakte hain!";
            }

            // 6. CONTACT (Number, Call, Phone)
            if (match(input, ['contact', 'number', 'phone', 'call', 'whatsapp', 'baat'])) {
                return "📞 Aap humein Call ya WhatsApp kar sakte hain: +91 7250-47-0009 par.";
            }
            
            // 7. APPRECIATION
            if (match(input, ['thank', 'shukriya', 'good', 'nice', 'mast', 'badhiya'])) {
                return "Pasand karne ke liye shukriya! ❤️ ALiF Ladies Tailor hamesha aapki seva mein hai.";
            }

            // Default Fallback
            return "Maaf kijiye, main abhi seekh raha hun. 😅\nAap 'Price', 'Address', 'Time' ya 'Contact' ke baare mein pooch sakte hain.";
        }

        // HELPER: Multiple words check karne ke liye smart function
        function match(text, words) {
            return words.some(word => text.includes(word));
        }
    }
