alert("JS Connected Successfully!");
console.log("Main.js is loaded");
/* ================================
      GLOBAL VARIABLES & CART
================================ */
// Cart ko bahar rakhte hain taaki console me debug kar sakein
const cart = {
    items: {},

    load() {
        const stored = localStorage.getItem("alifCart");
        if (stored) this.items = JSON.parse(stored);
        // DOM ready hone ke baad icon update karenge
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
        showToast("Added to cart");
    },

    remove(id) {
        delete this.items[id];
        this.save();
        this.updateIcon();
    },

    updateIcon() {
        const cartCount = document.getElementById("cartCount");
        if (!cartCount) return;

        let total = 0;
        for (const id in this.items) total += this.items[id].qty;

        cartCount.textContent = total;
        // Agar mobile badge bhi hai toh usse bhi update karo
        cartCount.style.display = total > 0 ? 'flex' : 'none';
    },

    getTotalPrice() {
        let total = 0;
        for (const id in this.items) {
            const it = this.items[id];
            total += it.price * it.qty;
        }
        return total;
    },

    clear() {
        this.items = {};
        this.save();
        this.updateIcon();
    }
};

// Load cart data immediately from storage
cart.load();

/* ================================
     TOAST NOTIFICATION
================================ */
function showToast(msg) {
    let t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    // Timeout for transition effect
    setTimeout(() => t.classList.add("show"), 100);
    setTimeout(() => {
        t.classList.remove("show");
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

/* ================================
      MAIN INITIALIZATION
================================ */
// Sab kuch iske andar daal diya taaki HTML load hone ke baad chale
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Update Cart Icon on Load
    cart.updateIcon();

    // 2. Navigation Menu
    const navToggle = document.getElementById("navToggleBtn");
    const sidebar = document.getElementById("sidebarMenu");
    const overlay = document.getElementById("sidebarOverlay");
    const closeBtn = document.getElementById("sidebarCloseBtn");

    function openMenu() {
        if(sidebar) sidebar.classList.add("open");
        if(overlay) overlay.classList.add("active");
    }
    function closeMenu() {
        if(sidebar) sidebar.classList.remove("open");
        if(overlay) overlay.classList.remove("active");
    }

    if(navToggle) navToggle.addEventListener("click", openMenu);
    if(closeBtn) closeBtn.addEventListener("click", closeMenu);
    if(overlay) overlay.addEventListener("click", closeMenu);

    // 3. Filter Buttons
    const filterButtons = document.querySelectorAll(".filter-btn");
    const productCards = document.querySelectorAll(".product-card");

    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                // Remove active class from all
                filterButtons.forEach(x => x.classList.remove("active"));
                // Add to clicked
                btn.classList.add("active");

                const values = btn.dataset.filterValues.split(","); // e.g. "lace,fabric"

                productCards.forEach(card => {
                    const cat = card.dataset.category;
                    // Check if 'all' is present or category matches
                    if (values.includes("all") || values.includes(cat)) {
                        card.style.display = "block";
                    } else {
                        card.style.display = "none";
                    }
                });
            });
        });
    }

    // 4. Global Click Listeners (Delegation for Dynamic Content)
    document.addEventListener("click", e => {
        // Add to Cart Button
        if (e.target && e.target.id === "addToCartBtn") {
            let btn = e.target;
            cart.add(
                btn.dataset.productId,
                btn.dataset.title,
                btn.dataset.price,
                btn.dataset.image
            );
        }

        // Buy Now Button (Direct WhatsApp)
        if (e.target && e.target.id === "buyNowBtn") {
            let btn = e.target;
            let msg = `*Hello Alif!* 👋\nI want to buy this item:\n\n*${btn.dataset.title}*\nPrice: ₹${btn.dataset.price}\n\nPlease confirm availability.`;
            window.open(`https://wa.me/7250470009?text=${encodeURIComponent(msg)}`, '_blank');
        }

        // Cart Page: Qty Increase
        if (e.target.classList.contains("qty-btn") && e.target.dataset.action === "inc") {
            const id = e.target.dataset.id;
            cart.items[id].qty++;
            cart.save();
            renderCartPage();
            cart.updateIcon();
        }

        // Cart Page: Qty Decrease
        if (e.target.classList.contains("qty-btn") && e.target.dataset.action === "dec") {
            const id = e.target.dataset.id;
            if (cart.items[id].qty > 1) {
                cart.items[id].qty--;
            }
            cart.save();
            renderCartPage();
            cart.updateIcon();
        }

        // Cart Page: Remove Item
        if (e.target.classList.contains("remove-btn")) {
            cart.remove(e.target.dataset.id);
            renderCartPage();
        }
    });

    // 5. Cart Page Render Logic
    function renderCartPage() {
        const container = document.getElementById("cart-items-container");
        if (!container) return; // Agar cart page par nahi hain toh return

        const empty = document.getElementById("cart-empty-message");
        const actions = document.getElementById("cart-actions");
        const summary = document.getElementById("cart-summary");
        const totalDisplay = document.getElementById("cart-total");

        container.innerHTML = "";
        const itemIds = Object.keys(cart.items);

        if (itemIds.length === 0) {
            if(empty) empty.style.display = "block";
            if(summary) summary.style.display = "none";
            if(actions) actions.style.display = "none";
            return;
        }

        if(empty) empty.style.display = "none";
        if(actions) actions.style.display = "block";
        if(summary) summary.style.display = "block";

        itemIds.forEach(id => {
            const item = cart.items[id];
            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <div class="cart-img-box">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="cart-info">
                    <h4>${item.title}</h4>
                    <p class="price">₹${item.price}</p>
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

        if(totalDisplay) totalDisplay.textContent = "Total: ₹" + cart.getTotalPrice();
    }

    // Initial Render call
    renderCartPage();

    // 6. WhatsApp Order Button (Cart Page)
    const orderBtn = document.getElementById("proceedToOrderBtn");
    if (orderBtn) {
        orderBtn.onclick = () => {
            let text = "*New Order Request* 📦\n\n";
            let total = 0;

            for (let id in cart.items) {
                let it = cart.items[id];
                let itemTotal = it.price * it.qty;
                text += `▪️ ${it.title}\n   Qty: ${it.qty} x ₹${it.price} = ₹${itemTotal}\n`;
                total += itemTotal;
            }
            text += `\n--------------------\n*Grand Total: ₹${total}*`;

            window.open(`https://wa.me/7250470009?text=${encodeURIComponent(text)}`, '_blank');
        };
    }

    // 7. Chatbot Loader
    const chatWidget = document.getElementById("chat-widget");
    if (chatWidget) {
        chatWidget.innerHTML = `<iframe src="/alifqr/index.html" class="chat-iframe" title="Chatbot"></iframe>`;
    }

    // 8. Swapper / Gallery Logic
    function initSwapper(selector) {
        const wrap = document.querySelector(selector);
        if (!wrap) return;

        const items = wrap.querySelectorAll(".swapper-item");
        const prevBtn = wrap.querySelector(".prev-btn");
        const nextBtn = wrap.querySelector(".next-btn");
        
        if(items.length === 0) return;

        let current = 0;

        function show(i) {
            items.forEach(x => x.classList.remove("active"));
            items[i].classList.add("active");
            current = i;
        }

        // Show first item
        show(0);

        if (prevBtn) prevBtn.onclick = (e) => {
            e.preventDefault();
            show((current - 1 + items.length) % items.length);
        };
        if (nextBtn) nextBtn.onclick = (e) => {
            e.preventDefault();
            show((current + 1) % items.length);
        };

        // Touch Swipe Logic
        let startX = 0;
        wrap.addEventListener("touchstart", e => (startX = e.touches[0].clientX), {passive: true});
        wrap.addEventListener("touchend", e => {
            let endX = e.changedTouches[0].clientX;
            if (endX < startX - 50) { // Swiped Left -> Next
                if(nextBtn) nextBtn.click();
                else show((current + 1) % items.length);
            }
            if (endX > startX + 50) { // Swiped Right -> Prev
                if(prevBtn) prevBtn.click();
                else show((current - 1 + items.length) % items.length);
            }
        }, {passive: true});
    }

    // Initialize Swappers
    initSwapper(".product-swapper");
    initSwapper(".banner-swapper");
    initSwapper(".products-panel-gallery");
    initSwapper(".services-panel-gallery");
    initSwapper(".works-panel-gallery");
    initSwapper(".designs-panel-gallery");

}); // End DOMContentLoaded
          
