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
            // Already in cart, do nothing (or change to qty++)
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
    
    // Get total items
    getTotalCount() {
        return Object.keys(this.items).length;
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
            message += `Price: ₹${item.price}\n`;
            // Use window.location.origin to create an absolute URL
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

    /* ==================================================
    ===== 💡 FADE-IN SCRIPT REMOVED ==================
    ================================================== 
    The IntersectionObserver scripts for .fade-in-section
    and .product-card have been removed as they are no
    longer needed with the new CSS.
    */

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
    
    // --- PRODUCT DETAIL PAGE LOGIC ---
    const addToCartBtn = document.getElementById('addToCartBtn');
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
    
    // --- CART PAGE LOGIC ---
    const cartContainer = document.getElementById('cart-items-container');
    if (cartContainer) {
        renderCartPage();
    }
    
    function renderCartPage() {
        const cartItems = cart.items;
        const emptyMsg = document.getElementById('cart-empty-message');
        const cartSummary = document.getElementById('cart-summary');
        
        cartContainer.innerHTML = '';
        
        if (cart.getTotalCount() === 0) {
            emptyMsg.style.display = 'block';
            cartSummary.style.display = 'none';
        } else {
            emptyMsg.style.display = 'none';
            cartSummary.style.display = 'block';
            
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
                    <button class="cart-item-remove-btn" data-remove-id="${id}">Remove</button>
                `;
                cartContainer.appendChild(itemEl);
            }
            
            document.getElementById('cart-total').textContent = `Total: ₹${cart.getTotalPrice()}`;
            
            document.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const removeId = btn.dataset.removeId;
                    cart.remove(removeId);
                    renderCartPage();
                });
            });
            
            document.getElementById('proceedToOrderBtn').addEventListener('click', () => {
                const message = cart.generateWhatsAppMessage();
                window.open(whatsappBaseUrl + message, '_blank');
            });
        }
    }
    
    // Helper function to show a toast message
    function showToast(message) {
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
                body: JSON.stringify({ message: message }) // Changed to 'message' to match your function
            })
            .then(res => res.json())
            .then(data => {
                removeThinking();
                if (data.reply) { // Changed to 'reply' to match your function
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
    
});
