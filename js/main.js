/* js/main.js */
/* This file handles all client-side interactivity */

/* ==================================================
===== 💡 E-COMMERCE CART LOGIC ===================
================================================== 
*/
const cart = {
    items: {}, 
    
    load() {
        const storedCart = localStorage.getItem('alifCart');
        if (storedCart) {
            this.items = JSON.parse(storedCart);
        }
        this.updateIcon();
    },
    
    save() {
        localStorage.setItem('alifCart', JSON.stringify(this.items));
        this.updateIcon();
    },
    
    add(id, title, price, image) {
        if (!this.items[id]) {
            this.items[id] = { title, price, image, qty: 1 };
        }
        this.save();
    },
    
    remove(id) {
        if (this.items[id]) {
            delete this.items[id];
        }
        this.save();
    },

    increaseQuantity(id) {
        if (this.items[id]) {
            this.items[id].qty++;
        }
        this.save();
    },

    decreaseQuantity(id) {
        if (this.items[id] && this.items[id].qty > 1) {
            this.items[id].qty--;
        }
        this.save();
    },
    
    getTotalCount() {
        let count = 0;
        for (const id in this.items) {
            count += this.items[id].qty;
        }
        return count;
    },
    
    getTotalPrice() {
        let total = 0;
        for (const id in this.items) {
            total += this.items[id].price * this.items[id].qty;
        }
        return total.toFixed(2);
    },
    
    updateIcon() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.getTotalCount();
        }
    },
    
    generateWhatsAppMessage() {
        let message = "Hi, I want to order these products:\n\n";
        let total = 0;

        for (const id in this.items) {
            const item = this.items[id];
            message += `*${item.title}*\n`;
            message += `Qty: ${item.qty}\n`;
            message += `Price: ₹${item.price} (each)\n`;
            message += `Image: ${window.location.origin}${item.image}\n\n`;
            total += item.price * item.qty;
        }
        
        message += `*Total Price: ₹${total.toFixed(2)}*`;
        return encodeURIComponent(message);
    },
    
    clear() {
        this.items = {};
        this.save();
    }
};

cart.load();


/* ==================================================
===== 🖼️ SWAPPER LOGIC (NOW WITH TOUCH!) =========
================================================== 
*/
function initializeSwapper(swapperSelector, options = {}) {
    const swapper = document.querySelector(swapperSelector);
    if (!swapper) return;
    
    const items = swapper.querySelectorAll('.swapper-item');
    const prevBtn = swapper.querySelector('.prev-btn');
    const nextBtn = swapper.querySelector('.next-btn');
    let currentIndex = 0;
    let autoplayInterval = null;
    
    // Variables to track touch position
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (items.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (options.isBanner) {
            if (items.length === 1) { showItem(0); }
            return;
        }
    }
    
    function showItem(index) { 
        items.forEach((item, i) => { item.classList.toggle('active', i === index); }); 
    }
    
    function next() { 
        currentIndex = (currentIndex < items.length - 1) ? currentIndex + 1 : 0; 
        showItem(currentIndex); 
    }
    
    function prev() { 
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : items.length - 1; 
        showItem(currentIndex); 
    }
    
    // --- Button Listeners ---
    if (prevBtn) { 
        let newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', () => { prev(); if(autoplayInterval) resetAutoplay(); });
    }

    if (nextBtn) { 
        let newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', () => { next(); if (autoplayInterval) resetAutoplay(); }); 
    }
    
    // --- 💡 NEW: TOUCH SWIPE LOGIC ---
    swapper.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    swapper.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        // Calculate difference
        const diff = touchStartX - touchEndX;
        const threshold = 50; // Minimum distance to count as swipe

        if (diff > threshold) {
            // Swiped LEFT -> Next Image
            next();
            if (autoplayInterval) resetAutoplay();
        } 
        
        if (diff < -threshold) {
            // Swiped RIGHT -> Previous Image
            prev();
            if (autoplayInterval) resetAutoplay();
        }
    }
    
    // --- Autoplay Logic ---
    function startAutoplay() { 
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


/* ==================================================
===== Main Execution (On Page Load) ==============
================================================== 
*/
document.addEventListener('DOMContentLoaded', () => {
    
    // Galleries with Autoplay
    initializeSwapper('.banner-swapper', { isBanner: true, autoplay: 5000 }); 
    initializeSwapper('.products-panel-gallery', { autoplay: 4000 });
    initializeSwapper('.works-panel-gallery', { autoplay: 3000 });
    initializeSwapper('.services-panel-gallery', { autoplay: 3500 });
    initializeSwapper('.designs-panel-gallery', { autoplay: 3500 }); 

    // 💡 Product Gallery (Manual Swipe Only - No Autoplay)
    initializeSwapper('.product-swapper'); 

    initializeSwapper('.services-swapper', { autoplay: 4000 });
    initializeSwapper('.works-swapper', { autoplay: 3000 });

    // --- SIDEBAR MENU LOGIC ---
    const navToggleBtn = document.getElementById('navToggleBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar-links a');
    
    const openSidebar = () => {
        sidebarMenu.classList.add('is-open');
        sidebarOverlay.classList.add('is-open');
        document.body.classList.add('sidebar-open');
    };
    const closeSidebar = () => {
        sidebarMenu.classList.remove('is-open');
        sidebarOverlay.classList.remove('is-open');
        document.body.classList.remove('sidebar-open');
    };
    
    if (navToggleBtn && sidebarMenu && sidebarOverlay && sidebarCloseBtn) {
        navToggleBtn.addEventListener('click', () => {
            if (sidebarMenu.classList.contains('is-open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
        sidebarCloseBtn.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
        sidebarLinks.forEach(link => {
            link.addEventListener('click', closeSidebar);
        });
    }
    
    // --- PRODUCT LOGIC ---
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.getElementById('buyNowBtn');
    const whatsappNumber = '7250470009'; 
    const whatsappBaseUrl = `https://wa.me/${whatsappNumber}?text=`;

    if (addToCartBtn) {
        const productId = addToCartBtn.dataset.productId;
        if (cart.items[productId]) {
            addToCartBtn.textContent = 'Go to Cart';
            addToCartBtn.classList.add('btn-buy'); 
            addToCartBtn.classList.remove('btn-cart');
        }
        addToCartBtn.addEventListener('click', () => {
            if (addToCartBtn.textContent === 'Go to Cart') {
                window.location.href = '/cart/';
                return;
            }
            const { title, price, image } = addToCartBtn.dataset;
            cart.add(productId, title, parseFloat(price), image);
            addToCartBtn.textContent = 'Go to Cart';
            addToCartBtn.classList.add('btn-buy');
            addToCartBtn.classList.remove('btn-cart');
            showToast(`${title} added to cart!`);
        });
    }
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            const { title, price, image } = buyNowBtn.dataset;
            const message = `Hi, I want to buy this product:\n\n*${title}*\nPrice: ₹${price}\nImage: ${window.location.origin}${image}`;
            window.open(whatsappBaseUrl + encodeURIComponent(message), '_blank');
        });
    }
    
    // --- CONFIRMATION MODAL ---
    const modal = document.getElementById('confirm-modal');
    const modalMessage = document.getElementById('modal-message');
    let modalCancel = document.getElementById('modal-cancel');
    let modalConfirm = document.getElementById('modal-confirm');

    function showConfirmationModal(message, onConfirm) {
        if (!modal || !modalMessage) return;
        modalMessage.textContent = message;
        modal.style.display = 'flex';
        
        let newCancel = modalCancel.cloneNode(true);
        modalCancel.parentNode.replaceChild(newCancel, modalCancel);
        modalCancel = newCancel;
        let newConfirm = modalConfirm.cloneNode(true);
        modalConfirm.parentNode.replaceChild(newConfirm, modalConfirm);
        modalConfirm = newConfirm;

        modalCancel.addEventListener('click', () => modal.style.display = 'none');
        modalConfirm.addEventListener('click', () => { onConfirm(); modal.style.display = 'none'; });
    }

    // --- CART PAGE LOGIC ---
    const cartContainer = document.getElementById('cart-items-container');
    if (cartContainer) {
        renderCartPage();
    }
    
    function renderCartPage() {
        const cartItems = cart.items;
        const emptyMsg = document.getElementById('cart-empty-message');
        const cartSummary = document.getElementById('cart-summary');
        const cartActions = document.getElementById('cart-actions');
        const deliveryContainer = document.getElementById('delivery-progress-container');
        const deliveryText = document.getElementById('delivery-progress-text');
        const deliveryBarInner = document.getElementById('delivery-progress-bar-inner');

        cartContainer.innerHTML = ''; 
        
        if (Object.keys(cartItems).length === 0) {
            emptyMsg.style.display = 'block';
            if (cartSummary) cartSummary.style.display = 'none';
            if (cartActions) cartActions.style.display = 'none';
            if (deliveryContainer) deliveryContainer.style.display = 'none';
        } else {
            emptyMsg.style.display = 'none';
            if (cartSummary) cartSummary.style.display = 'block';
            if (cartActions) cartActions.style.display = 'block';
            
            for (const id in cartItems) {
                const item = cartItems[id];
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-image"><img src="${item.image}" alt="${item.title}"></div>
                    <div class="cart-item-info"><h4>${item.title}</h4><p>₹${item.price}</p></div>
                    <div class="cart-item-controls">
                        <div class="cart-item-quantity">
                            <button class="cart-item-qty-btn" data-id="${id}" data-action="decrease">[-]</button>
                            <span class="cart-item-qty-text">Qty: ${item.qty}</span>
                            <button class="cart-item-qty-btn" data-id="${id}" data-action="increase">[+]</button>
                        </div>
                    </div>
                `;
                cartContainer.appendChild(itemEl);
            }
            
            const currentTotal = parseFloat(cart.getTotalPrice());
            const totalEl = document.getElementById('cart-total');
            if(totalEl) totalEl.textContent = `Total: ₹${currentTotal.toFixed(2)}`;
            
            const freeDeliveryThreshold = 199;
            if (deliveryContainer && deliveryText && deliveryBarInner) {
                deliveryContainer.style.display = 'block';
                if (currentTotal >= freeDeliveryThreshold) {
                    deliveryContainer.classList.add('is-unlocked');
                    deliveryText.textContent = "You’ve unlocked FREE delivery!";
                    deliveryBarInner.style.width = '100%';
                } else {
                    deliveryContainer.classList.remove('is-unlocked');
                    const remaining = freeDeliveryThreshold - currentTotal;
                    deliveryText.textContent = `Add ₹${remaining.toFixed(2)} more for FREE delivery!`;
                    const progressPercent = (currentTotal / freeDeliveryThreshold) * 100;
                    deliveryBarInner.style.width = `${progressPercent}%`;
                }
            }

            document.querySelectorAll('.cart-item-qty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const action = btn.dataset.action;
                    if (action === 'increase') {
                        cart.increaseQuantity(id);
                        renderCartPage();
                    } else if (action === 'decrease') {
                        const item = cart.items[id];
                        if (item.qty > 1) {
                            cart.decreaseQuantity(id);
                            renderCartPage();
                        } else {
                            showConfirmationModal(`Remove "${item.title}"?`, () => {
                                cart.remove(id);
                                renderCartPage();
                            });
                        }
                    }
                });
            });
            
            const proceedBtn = document.getElementById('proceedToOrderBtn');
            if(proceedBtn) {
                proceedBtn.addEventListener('click', () => {
                    const message = cart.generateWhatsAppMessage();
                    window.open(whatsappBaseUrl + message, '_blank');
                });
            }
        }
    }
    
    // Helper Toast
    function showToast(message) {
        let toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 500);
        }, 3000);
    }
    
    // Chatbot
    const chatButton = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatButton && chatWindow) {
        chatButton.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            chatWindow.classList.toggle('visible');
            if (chatWindow.classList.contains('visible')) chatInput.focus();
        });
        closeChat.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
            chatWindow.classList.remove('visible');
        });
        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (!message) return;
            appendMessage(message, 'user-message');
            chatInput.value = '';
            appendMessage('...', 'ai-message thinking-message');
            scrollToBottom();
            fetch('/.netlify/functions/ask-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            })
            .then(res => res.json())
            .then(data => {
                removeThinking();
                appendMessage(data.reply || 'Sorry, error occurred.', 'ai-message');
                scrollToBottom();
            })
            .catch(error => {
                removeThinking();
                appendMessage('Network error.', 'ai-message');
                                                 
