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
    initializeSwapper('.banner-swapper', { isBanner: true, autoplay: 5000 });
    initializeSwapper('.products-panel-gallery', { autoplay: 4000 });
    initializeSwapper('.works-panel-gallery', { autoplay: 3000 });
    initializeSwapper('.services-panel-gallery', { autoplay: 3500 });
    initializeSwapper('.product-swapper', { autoplay: 4000 }); // For products page
    initializeSwapper('.services-swapper', { autoplay: 4000 }); // For services page
    initializeSwapper('.works-swapper', { autoplay: 3000 }); // For services page


    // --- Close banner button ---
    const closeBtn = document.querySelector('.close-banner-btn');
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            const banner = document.getElementById('top-banner');
            if (banner) banner.style.display = 'none';
        });
    }

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
        navToggleBtn.addEventListener('click', openSidebar);
        sidebarCloseBtn.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
        
        sidebarLinks.forEach(link => {
            link.addEventListener('click', closeSidebar);
        });
    }

    // --- 💡 NEW CHATBOT LOGIC ---
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

            // 1. Display user message
            appendMessage(message, 'user-message');
            chatInput.value = '';

            // 2. Show thinking indicator
            appendMessage('...', 'ai-message thinking-message');
            scrollToBottom();

            // 3. Send to Netlify function
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
                appendMessage('Sorry, I couldn't connect. Please check your internet.', 'ai-message');
                scrollToBottom();
            });
        }
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent new line on Enter
                sendMessage();
            }
        });

        function appendMessage(text, className) {
            const div = document.createElement('div');
            div.className = `message ${className}`;
            div.textContent = text; // Use textContent to prevent HTML injection
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
    // --- END CHATBOT LOGIC ---

});
