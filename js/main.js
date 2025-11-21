/* ================================
      GLOBAL VARIABLES
================================ */
const body = document.body;

/* ================================
      CART LOGIC
================================ */
const cart = {
    items: {},

    load() {
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

cart.load();

/* ================================
     TOAST NOTIFICATION
================================ */
function showToast(msg) {
    let t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 50);
    setTimeout(() => t.remove(), 2500);
}

/* ================================
      SWAPPER (WITH TOUCH)
================================ */
function initSwapper(selector) {
    const wrap = document.querySelector(selector);
    if (!wrap) return;

    const items = wrap.querySelectorAll(".swapper-item");
    const prevBtn = wrap.querySelector(".prev-btn");
    const nextBtn = wrap.querySelector(".next-btn");
    let current = 0;

    function show(i) {
        items.forEach(x => x.classList.remove("active"));
        items[i].classList.add("active");
        current = i;
    }

    show(0);

    if (prevBtn) prevBtn.onclick = () => {
        show((current - 1 + items.length) % items.length);
    };
    if (nextBtn) nextBtn.onclick = () => {
        show((current + 1) % items.length);
    };

    // Touch Swipe
    let startX = 0;
    wrap.addEventListener("touchstart", e => (startX = e.touches[0].clientX));
    wrap.addEventListener("touchend", e => {
        let endX = e.changedTouches[0].clientX;
        if (endX < startX - 40) nextBtn?.click();
        if (endX > startX + 40) prevBtn?.click();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initSwapper(".product-swapper");
    initSwapper(".banner-swapper");
    initSwapper(".products-panel-gallery");
    initSwapper(".services-panel-gallery");
    initSwapper(".works-panel-gallery");
    initSwapper(".designs-panel-gallery");
});

/* ================================
       NAVIGATION MENU
================================ */
const navToggle = document.getElementById("navToggleBtn");
const sidebar = document.getElementById("sidebarMenu");
const overlay = document.getElementById("sidebarOverlay");
const closeBtn = document.getElementById("sidebarCloseBtn");

function openMenu() {
    sidebar.classList.add("open");
    overlay.classList.add("active");
}
function closeMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
}

navToggle?.addEventListener("click", openMenu);
closeBtn?.addEventListener("click", closeMenu);
overlay?.addEventListener("click", closeMenu);

/* ================================
       FILTER BUTTONS
================================ */
const filterButtons = document.querySelectorAll(".filter-btn");
const productCards = document.querySelectorAll(".product-card");

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        filterButtons.forEach(x => x.classList.remove("active"));
        btn.classList.add("active");

        const values = btn.dataset.filterValues.split(",");

        productCards.forEach(card => {
            const cat = card.dataset.category;
            if (values.includes("all") || values.includes(cat)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
});

/* ================================
    PRODUCT PAGE BUTTONS
================================ */
document.addEventListener("click", e => {
    if (e.target.id === "addToCartBtn") {
        let btn = e.target;
        cart.add(
            btn.dataset.productId,
            btn.dataset.title,
            btn.dataset.price,
            btn.dataset.image
        );
    }

    if (e.target.id === "buyNowBtn") {
        let btn = e.target;
        let msg = `Hello, I want to buy:\n${btn.dataset.title}\nPrice: ₹${btn.dataset.price}`;
        window.open(`https://wa.me/7250470009?text=${encodeURIComponent(msg)}`);
    }
});

/* ================================
        CART PAGE RENDER
================================ */
function renderCartPage() {
    const container = document.getElementById("cart-items-container");
    if (!container) return;

    const empty = document.getElementById("cart-empty-message");
    const actions = document.getElementById("cart-actions");
    const summary = document.getElementById("cart-summary");

    container.innerHTML = "";

    const itemIds = Object.keys(cart.items);

    if (itemIds.length === 0) {
        empty.style.display = "block";
        summary.style.display = "none";
        actions.style.display = "none";
        return;
    }

    empty.style.display = "none";
    actions.style.display = "block";
    summary.style.display = "block";

    itemIds.forEach(id => {
        const item = cart.items[id];

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <img src="${item.image}" class="cart-item-img">
            <div class="cart-info">
                <h3>${item.title}</h3>
                <p>₹${item.price}</p>
                <div class="cart-qty">
                    <button class="qty-btn" data-id="${id}" data-action="dec">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" data-id="${id}" data-action="inc">+</button>
                </div>
                <button class="remove-btn" data-id="${id}">Remove</button>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById("cart-total").textContent =
        "Total: ₹" + cart.getTotalPrice();
}

renderCartPage();

document.addEventListener("click", e => {
    // Qty buttons
    if (e.target.classList.contains("qty-btn")) {
        const id = e.target.dataset.id;
        const action = e.target.dataset.action;
        if (action === "inc") cart.items[id].qty++;
        if (action === "dec" && cart.items[id].qty > 1) cart.items[id].qty--;
        cart.save();
        renderCartPage();
        cart.updateIcon();
    }

    // Remove
    if (e.target.classList.contains("remove-btn")) {
        cart.remove(e.target.dataset.id);
        renderCartPage();
    }
});

/* ================================
     WHATSAPP ORDER BUTTON
================================ */
const orderBtn = document.getElementById("proceedToOrderBtn");
if (orderBtn) {
    orderBtn.onclick = () => {
        let text = "Hello, I want to order:\n\n";

        for (let id in cart.items) {
            let it = cart.items[id];
            text += `${it.title}\nQty: ${it.qty}\nPrice: ₹${it.price}\n\n`;
        }
        text += `Total: ₹${cart.getTotalPrice()}`;

        window.open(`https://wa.me/7250470009?text=${encodeURIComponent(text)}`);
    };
}

/* ================================
     CHATBOT
================================ */
(function () {
    const chatWidget = document.getElementById("chat-widget");
    if (!chatWidget) return;

    chatWidget.innerHTML = `
        <iframe src="/alifqr/index.html" class="chat-iframe"></iframe>
    `;
