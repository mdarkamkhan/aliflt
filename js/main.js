/* js/main.js */
/* This file handles all client-side interactivity */

/* ==================================================
===== 💡 E-COMMERCE CART LOGIC ===================
================================================== 
*/
const cart = {
    items: {}, // e.g., { 'product-slug': { title: '...', price: 100, image: '...', qty: 1 } }
    
    // Load cart from localStorage
    load() {
        const storedCart = localStorage.getItem('alifCart');
        if (storedCart) {
            this.items = JSON.parse(storedCart);
        }
        this.updateIcon();
    },
    
    // Save cart to localStorage
    save() {
        localStorage.setItem('alifCart', JSON.stringify(this.items));
        this.updateIcon();
    },
    
    // Add an item
    add(id, title, price, image) {
        if (this.items[id]) {
            // Already in cart, do nothing (product page logic handles this)
        } else {
            this.items[id] = { title, price, image, qty: 1 };
        }
        this.save();
    },
    
    // Remove an item
    remove(id) {
        if (this.items[id]) {
            delete this.items[id];
        }
        this.save();
    },

    // Increase quantity
    increaseQuantity(id) {
        if (this.items[id]) {
            this.items[id].qty++;
        }
        this.save();
    },

    // Decrease quantity
    decreaseQuantity(id) {
        if (this.items[id] && this.items[id].qty > 1) {
            this.items[id].qty--;
        }
        this.save();
    },
    
    // Get total items
    getTotalCount() {
        let count = 0;
        for (const id in this.items) {
            count += this.items[id].qty;
        }
        return count;
    },
    
    // Get total price
    getTotalPrice() {
        let total = 0;
        for (const id in this.items) {
            total += this.items[id].price * this.items[id].qty;
        }
        return total.toFixed(2);
    },
    
    // Update the cart icon in the nav
    updateIcon() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.getTotalCount();
        }
    },
    
    // Generate the WhatsApp message
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
    
    // Clear the cart
    clear() {
        this.items = {};
        this.save();
    }
};

// Initialize the cart on every page load
cart.load();


/* ==================================================
===== Swapper and Gallery Logic ==================
================================================== 
*/
function initializeSwapper(swapperSelector, options = {}) {
    // ... (This function is unchanged)
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
        if (options.isBanner) {
            if (items.length === 1) { showItem(0); }
            return;
        }
    }
    function showItem(index) { items.forEach((item, i) => { item.classList.toggle('active', i === index); }); }
    function next() { currentIndex = (currentIndex < items.length - 1) ? currentIndex + 1 : 0; showItem(currentIndex); }
    function prev() { currentIndex = (currentIndex > 0) ? currentIndex - 1 : items.length - 1; showItem(currentIndex); }
    if (prevBtn) { prevBtn.addEventListener('click', () => { prev(); if (autoplayInterval) resetAutoplay(); }); }
    if (nextBtn) { nextBtn.addEventListener('click', () => { next(); if (autoplayInterval) resetAutoplay(); }); }
    function startAutoplay() { if (options.autoplay && items.length > 1) { autoplayInterval = setInterval(next, options.autoplay); } }
    function resetAutoplay() { clearInterval(autoplayInterval); startAutoplay(); }
    showItem(currentIndex);
    startAutoplay();
}


/* ==================================================
===== Main Execution (On Page Load) ==============
================================================== 
*/
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Initialize Galleries ---
    initializeSwapper('.banner-swapper', { isBanner: true, autoplay: 5000 }); 
    initializeSwapper('.products-panel-gallery', { autoplay: 4000 });
    initializeSwapper('.works-panel-gallery', { autoplay: 3000 });
    initializeSwapper('.services-panel-gallery', { autoplay: 3500 });
    initializeSwapper('.product-swapper', { autoplay: 4000 });
    initializeSwapper('.services-swapper', { autoplay: 4000 });
    initializeSwapper('.works-swapper', { autoplay: 3000 });

    // --- SIDEBAR MENU LOGIC ---
    const navToggleBtn = document.getElementById('navToggleBtn');
    // ... (This section is unchanged)
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
    
    // --- PRODUCT DETAIL PAGE LOGIC ---
    const addToCartBtn = document.getElementById('addToCartBtn');
    // ... (This section is unchanged)
    const buyNowBtn = document.getElementById('buyNowBtn');
    const whatsappNumber = '7488611845'; // Your WhatsApp number
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
            const tempCart = {
                items: {
                    'temp': { title, price: parseFloat(price), image, qty: 1 }
                },
                generateWhatsAppMessage: cart.generateWhatsAppMessage
            };
            const message = tempCart.generateWhatsAppMessage();
            window.open(whatsappBaseUrl + message, '_blank');
        });
    }
    
    // --- Confirmation Modal Logic ---
    const modal = document.getElementById('confirm-modal');
    const modalMessage = document.getElementById('modal-message');
    let modalCancel = document.getElementById('modal-cancel');
    let modalConfirm = document.getElementById('modal-confirm');

    function showConfirmationModal(message, onConfirm) {
        if (!modal || !modalMessage) return;

        modalMessage.textContent = message;
        modal.style.display = 'flex';
        
        // --- This is crucial to prevent multiple listeners ---
        let newCancel = modalCancel.cloneNode(true);
        modalCancel.parentNode.replaceChild(newCancel, modalCancel);
        modalCancel = newCancel;
        
        let newConfirm = modalConfirm.cloneNode(true);
        modalConfirm.parentNode.replaceChild(newConfirm, modalConfirm);
        modalConfirm = newConfirm;
        // --- End of listener cleanup ---

        modalCancel.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modalConfirm.addEventListener('click', () => {
            onConfirm(); // Run the remove action
            modal.style.display = 'none';
        });
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

        cartContainer.innerHTML = ''; // Clear the cart display
        
        if (Object.keys(cartItems).length === 0) {
            emptyMsg.style.display = 'block';
            cartSummary.style.display = 'none';
            cartActions.style.display = 'none';
            if (deliveryContainer) deliveryContainer.style.display = 'none';
        } else {
            emptyMsg.style.display = 'none';
            cartSummary.style.display = 'block';
            cartActions.style.display = 'block';
            
            for (const id in cartItems) {
                const item = cartItems[id];
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                
                itemEl.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.title}</h4>
                        <p>₹${item.price}</p>
                    </div>
                    <div class="cart-item-controls">
                        <div class="cart-item-quantity">
                            <button class="cart-item-qty-btn" data-id="${id}" data-action="decrease" aria-label="Decrease quantity">[-]</button>
                            <span class="cart-item-qty-text">Qty: ${item.qty}</span>
                            <button class="cart-item-qty-btn" data-id="${id}" data-action="increase" aria-label="Increase quantity">[+]</button>
                        </div>
                    </div>
                `;
                cartContainer.appendChild(itemEl);
            }
            
            // Update total price
            const currentTotal = parseFloat(cart.getTotalPrice());
            document.getElementById('cart-total').textContent = `Total: ₹${currentTotal.toFixed(2)}`;
            
            // Update Delivery Progress Logic
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

            // Add listeners for INCREASE/DECREASE buttons
            document.querySelectorAll('.cart-item-qty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const action = btn.dataset.action;

                    if (action === 'increase') {
                        cart.increaseQuantity(id);
                        renderCartPage(); // Re-render
                    } else if (action === 'decrease') {
                        const item = cart.items[id];
                        if (item.qty > 1) {
                            cart.decreaseQuantity(id);
                            renderCartPage(); // Re-render
                        } else {
                            // If quantity is 1, show confirmation
                            showConfirmationModal(`Do you want to remove "${item.title}" from the cart?`, () => {
                                cart.remove(id);
                                renderCartPage(); // Re-render after removal
                            });
                        }
                    }
                });
            });
            
            // Add listener for Proceed to Order button
            document.getElementById('proceedToOrderBtn').addEventListener('click', () => {
                const message = cart.generateWhatsAppMessage();
                window.open(whatsappBaseUrl + message, '_blank');
            });
        }
    }
    
    // Helper function to show a toast message
    function showToast(message) {
        // ... (This function is unchanged)
        let toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 500);
        }, 3000);
    }
    
    // --- CHATBOT LOGIC ---
    const chatButton = document.getElementById('chat-button');
    // ... (This whole chat logic section is unchanged)
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatButton && chatWindow && closeChat && sendButton && chatInput && chatMessages) {
        
        chatButton.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            chatWindow.classList.toggle('visible');
            if (chatWindow.classList.contains('visible')) {
                chatInput.focus();
            }
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
                if (data.reply) {
                    appendMessage(data.reply, 'ai-message');
                } else {
                    appendMessage('Sorry, I had a problem. Please try again.', 'ai-message');
                }
                scrollToBottom();
            })
            .catch(error => {
                removeThinking();
                console.error('Chatbot error:', error);
                appendMessage('Sorry, I couldn\'t connect. Please check your internet.', 'ai-message');
                scrollToBottom();
            });
        }
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        function appendMessage(text, className) {
            const div = document.createElement('div');
            div.className = `message ${className}`;
            div.textContent = text;
            chatMessages.appendChild(div);
            scrollToBottom();
        }
        function removeThinking() {
            const thinking = chatMessages.querySelector('.thinking-message');
            if (thinking) {
                thinking.remove();
            }
        }
        function scrollToBottom() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Add CSS for the toast
    const toastStyle = document.createElement('style');
    toastStyle.textContent = `
        .toast-message {
            position: fixed;
            bottom: -100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 10001;
            font-size: 1rem;
            transition: bottom 0.5s ease;
        }
        .toast-message.show {
            bottom: 30px;
        }
    `;
    document.head.appendChild(toastStyle);
    

    // --- PWA Install Prompt Logic ---
    let deferredPrompt;
    const installButton = document.getElementById('install-pwa-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the browser's default mini-infobar
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Show our custom install button
        if (installButton) {
            installButton.style.display = 'block';
        }
    });

    if (installButton) {
        installButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Hide our button
            installButton.style.display = 'none';
            // Show the browser's install prompt
            if (deferredPrompt) {
                deferredPrompt.prompt();
      
