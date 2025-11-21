document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ JS Loaded & DOM Ready");

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
            showToast("Added to cart!");
        },
        remove(id) {
            delete this.items[id];
            this.save();
            this.updateIcon();
        },
        updateIcon() {
            const cartCount = document.getElementById("cartCount");
            if (cartCount) {
                let total = 0;
                for (const id in this.items) total += this.items[id].qty;
                cartCount.textContent = total;
                cartCount.style.display = total > 0 ? "flex" : "none";
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
    function showToast(msg) {
        const t = document.createElement("div");
        t.className = "toast";
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add("show"), 100);
        setTimeout(() => {
            t.classList.remove("show");
            setTimeout(() => t.remove(), 300);
        }, 3000);
    }

    /* ================================
         3. NAVIGATION MENU (FIXED FOR YOUR CSS)
    ================================ */
    const navToggle = document.getElementById("navToggleBtn");
    const sidebar = document.getElementById("sidebarMenu");
    const overlay = document.getElementById("sidebarOverlay");
    const closeBtn = document.getElementById("sidebarCloseBtn");
    const body = document.body; // CSS me body.sidebar-open use hua hai

    if (navToggle && sidebar && overlay) {
        
        // Menu Kholne ka Function
        const openMenu = () => {
            sidebar.classList.add("is-open");   // CSS line 508 se match kiya
            overlay.classList.add("is-open");   // CSS line 491 se match kiya
            body.classList.add("sidebar-open"); // CSS line 28 & 481 (Hamburger animation ke liye)
        };

        // Menu Band Karne ka Function
        const closeMenu = () => {
            sidebar.classList.remove("is-open");
            overlay.classList.remove("is-open");
            body.classList.remove("sidebar-open");
        };

        // Event Listeners
        navToggle.addEventListener("click", openMenu);
        if (closeBtn) closeBtn.addEventListener("click", closeMenu);
        overlay.addEventListener("click", closeMenu);
        
    } else {
        console.warn("⚠️ Navigation Elements not found (Check IDs)");
    }

    /* ================================
         4. CLICK HANDLING (Add to Cart / Buy)
    ================================ */
    document.addEventListener("click", (e) => {
        const target = e.target;

        // Add To Cart
        if (target.id === "addToCartBtn") {
            cart.add(
                target.dataset.productId,
                target.dataset.title,
                target.dataset.price,
                target.dataset.image
            );
        }

        // Buy Now (WhatsApp)
        if (target.id === "buyNowBtn") {
            const msg = `*Hi Alif!* I want to buy:\n*${target.dataset.title}*\nPrice: ₹${target.dataset.price}`;
            window.open(`https://wa.me/7250470009?text=${encodeURIComponent(msg)}`, '_blank');
        }

        // Cart Logic: Increment
        if (target.classList.contains("qty-btn") && target.dataset.action === "inc") {
            cart.items[target.dataset.id].qty++;
            cart.save();
            renderCartPage();
            cart.updateIcon();
        }

        // Cart Logic: Decrement
        if (target.classList.contains("qty-btn") && target.dataset.action === "dec") {
            const id = target.dataset.id;
            if (cart.items[id].qty > 1) cart.items[id].qty--;
            cart.save();
            renderCartPage();
            cart.updateIcon();
        }

        // Cart Logic: Remove
        if (target.classList.contains("remove-btn")) {
            cart.remove(target.dataset.id);
            renderCartPage();
        }
    });

    /* ================================
         5. RENDER CART PAGE
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
                    <p>₹${item.price}</p>
                    <div class="qty-controls">
                        <button class="qty-btn" data-id="${id}" data-action="dec">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" data-id="${id}" data-action="inc">+</button>
                    </div>
                </div>
                <button class="remove-btn" data-id="${id}">&times;</button>
            `;
            container.appendChild(div);
        });

        if (totalDisplay) totalDisplay.textContent = "Total: ₹" + cart.getTotalPrice();
    }

    // Initial Render
    renderCartPage();
    
    /* ================================
         6. WHATSAPP ORDER BUTTON
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
});
