/* js/main.js */
/* This file handles all client-side interactivity */

/* ==================================================
===== Swapper and Gallery Logic ==================
================================================== 
*/
function initializeSwapper(swapperSelector, options = {}) {
     const swapper = document.querySelector(swapperSelector);
    if (!swapper) return; // Exit if this gallery isn't on the current page

    const items = swapper.querySelectorAll('.swapper-item');
    const prevBtn = swapper.querySelector('.prev-btn');
    const nextBtn = swapper.querySelector('.next-btn');
    let currentIndex = 0;
    let autoplayInterval = null;

    if (items.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        
        if (options.isBanner) {
            if (items.length === 1) {
                showItem(0);
            }
            return;
        }
    }

    function showItem(index) {
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }

    function next() {
        currentIndex = (currentIndex < items.length - 1) ? currentIndex + 1 : 0;
        showItem(currentIndex);
    }
    
    function prev() {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : items.length - 1;
        showItem(currentIndex);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prev();
            if (autoplayInterval) resetAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            next();
            if (autoplayInterval) resetAutoplay();
        });
    }

    function startAutoplay() {
        if (options.autoplay && items.length > 1) { 
            autoplayInterval = setInterval(next, options.autoplay);
        }
    }

    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }
    
    showItem(currentIndex); // Show the first item
    startAutoplay(); // Start the slideshow
}


/* ==================================================
===== Main Execution (On Page Load) ==============
================================================== 
*/
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Initialize Galleries ---
    // 💡 BANNER SWAPPER REMOVED
    initializeSwapper('.products-panel-gallery', { autoplay: 4000 });
    initializeSwapper('.works-panel-gallery', { autoplay: 3000 });
    initializeSwapper('.services-panel-gallery', { autoplay: 3500 });
    initializeSwapper('.product-swapper', { autoplay: 4000 }); // For products page
    initializeSwapper('.services-swapper', { autoplay: 4000 }); // For services page
    initializeSwapper('.works-swapper', { autoplay: 3000 }); // For services page

    // --- 💡 Banner close button logic REMOVED ---

    // --- SCROLL ANIMATION LOGIC (for .fade-in-section) ---
    const sectionsToFade = document.querySelectorAll('.fade-in-section');
    if (sectionsToFade.length > 0) {
        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); 
                }
            });
        }, { threshold: 0.1 });
        sectionsToFade.forEach(section => {
            sectionObserver.observe(section);
        });
    }

    // --- "INFINITE SCROLL" for Product Grid ---
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length > 0) {
        const cardObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, 100 * (index % 10));
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px' }); 
        productCards.forEach(card => {
            cardObserver.observe(card);
        });
    }

    // --- 💡 UPDATED SIDEBAR MENU LOGIC ---
    const navToggleBtn = document.getElementById('navToggleBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar-links a');

    const openSidebar = () => {
        sidebarMenu.classList.add('is-open');
        sidebarOverlay.classList.add('is-open');
        document.body.classList.add('sidebar-open'); // For hamburger animation
    };

    const closeSidebar = () => {
        sidebarMenu.classList.remove('is-open');
        sidebarOverlay.classList.remove('is-open');
        document.body.classList.remove('sidebar-open'); // For hamburger animation
    };

    if (navToggleBtn && sidebarMenu && sidebarOverlay && sidebarCloseBtn) {
        navToggleBtn.addEventListener('click', () => {
            // Check if it's already open, then close it. Otherwise open.
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
        });

        closeChat.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
            chatWindow.classList.remove('visible');
        });

        sendButton.addEventListener('click', () => {
            sendMessage();
        });

        chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });

        function addMessage(message, sender) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
            messageElement.textContent = message;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
        }

        async function sendMessage() {
            const message = chatInput.value.trim();
            if (message === '') return;

            addMessage(message, 'user');
            chatInput.value = '';

            // Add thinking indicator
            const thinkingElement = document.createElement('div');
            thinkingElement.classList.add('message', 'ai-message', 'thinking-message');
            thinkingElement.textContent = '...';
            chatMessages.appendChild(thinkingElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                // Send to Netlify function
                const response = await fetch('/.netlify/functions/ask-ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: message })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                
                // Remove thinking indicator
                chatMessages.removeChild(thinkingElement);
                
                if (data.text) {
                    addMessage(data.text, 'ai');
                } else {
                    addMessage('Sorry, I had trouble thinking. Please try again.', 'ai');
                }

            } catch (error) {
                console.error('Error fetching from AI:', error);
                // Remove thinking indicator and show error
                if (chatMessages.contains(thinkingElement)) {
                    chatMessages.removeChild(thinkingElement);
                }
                addMessage('Sorry, I couldn\'t connect to Alif AI. Please check your connection.', 'ai');
            }
        }
    }
});
