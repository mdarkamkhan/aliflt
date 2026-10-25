// --- 1. GLOBAL PWA DEFERRED PROMPT (Captured immediately at earliest execution) ---
        window._alifDeferredPrompt = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window._alifDeferredPrompt = e;
            window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
        });

        // Track standalone PWA install status
        window.addEventListener('appinstalled', () => {
            window._alifDeferredPrompt = null;
            const pwaBtn = document.getElementById('drawerInstallPwaBtn');
            if (pwaBtn) {
                pwaBtn.style.opacity = '0.5';
                pwaBtn.innerText = 'INSTALLED';
            }
        });

        // --- 2. PWA LAUNCH SPLASH (Smooth luxury transition when opening installed app) ---
        function checkPwaLaunchSplash() {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                                 window.navigator.standalone === true ||
                                 document.referrer.includes('android-app://');
            const splash = document.getElementById('pwaAppLaunchSplash');
            if (!splash) return;

            if (isStandalone && !sessionStorage.getItem('alif_splash_shown')) {
                splash.classList.add('is-active');
                sessionStorage.setItem('alif_splash_shown', 'true');
                setTimeout(() => {
                    splash.classList.add('is-fadeout');
                    setTimeout(() => {
                        splash.classList.remove('is-active', 'is-fadeout');
                        splash.style.display = 'none';
                    }, 350);
                }, 600);
            } else {
                splash.style.display = 'none';
            }
        }

        // --- 3. ROBUST SIDEBAR DRAWER CONTROLLER (Global Event Delegation) ---
        function openSidebar(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const drawer = document.getElementById('sidebarMenu');
            const toggleBtn = document.getElementById('navToggleBtn');
            if (drawer) {
                drawer.classList.add('is-open');
                drawer.setAttribute('aria-hidden', 'false');
                document.body.classList.add('sidebar-open');
                document.body.style.overflow = 'hidden';
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
            }
        }

        function closeSidebar(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const drawer = document.getElementById('sidebarMenu');
            const toggleBtn = document.getElementById('navToggleBtn');
            if (drawer) {
                drawer.classList.remove('is-open');
                drawer.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('sidebar-open');
                document.body.style.overflow = '';
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            }
        }

        // Persistent click delegation for sidebar actions across Astro navigations
        if (!window._sidebarDelegated) {
            window._sidebarDelegated = true;

            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!target) return;

                // 1. Hamburger Toggle Button click
                if (target.closest('#navToggleBtn')) {
                    openSidebar(e);
                    return;
                }

                // 2. Sidebar Close Button click
                if (target.closest('#sidebarCloseBtn')) {
                    closeSidebar(e);
                    return;
                }

                // 3. Navigation link click inside drawer -> close drawer smoothly
                if (target.closest('.drawer-nav a')) {
                    closeSidebar();
                    return;
                }

                // 4. Group Accordion Button inside drawer (PRODUCT / SERVICES)
                const groupBtn = target.closest('.drawer-group-btn');
                if (groupBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const group = groupBtn.closest('.drawer-nav-group');
                    if (group) {
                        const isOpen = group.classList.toggle('is-open');
                        groupBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                    }
                    return;
                }

                // 5. Drawer Install Button click -> Open PWA flow
                if (target.closest('#drawerInstallPwaBtn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSidebar();
                    openPwaInstallModal();
                    return;
                }

                // 6. Close PWA modal buttons
                if (target.closest('#closePwaModalBtn') || target.closest('#pwaDismissIosBtn') || target.closest('#pwaDismissAndroidBtn')) {
                    closePwaInstallModal();
                    return;
                }

                // 7. Click outside PWA modal card to dismiss
                if (target.classList && target.classList.contains('pwa-modal-backdrop')) {
                    closePwaInstallModal();
                    return;
                }

                // 8. Trigger native install prompt from modal button
                if (target.closest('#pwaTriggerNativePromptBtn')) {
                    e.preventDefault();
                    if (window._alifDeferredPrompt) {
                        window._alifDeferredPrompt.prompt();
                        window._alifDeferredPrompt.userChoice.then((choiceResult) => {
                            if (choiceResult.outcome === 'accepted') {
                                const pwaBtn = document.getElementById('drawerInstallPwaBtn');
                                if (pwaBtn) {
                                    pwaBtn.style.opacity = '0.5';
                                    pwaBtn.innerText = 'INSTALLED';
                                }
                            }
                            window._alifDeferredPrompt = null;
                            closePwaInstallModal();
                        });
                    }
                    return;
                }
            }, { passive: false });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeSidebar();
                    closePwaInstallModal();
                }
            });
        }

        // --- 4. PWA INSTALL MODAL CONTROLLER ---
        function openPwaInstallModal() {
            const modal = document.getElementById('pwaInstallModal');
            if (!modal) return;

            const promptSec = document.getElementById('pwaModalPromptSection');
            const iosSec = document.getElementById('pwaModalIosGuide');
            const androidSec = document.getElementById('pwaModalAndroidGuide');

            if (promptSec) promptSec.style.display = 'none';
            if (iosSec) iosSec.style.display = 'none';
            if (androidSec) androidSec.style.display = 'none';

            // Check if native prompt is available
            if (window._alifDeferredPrompt) {
                if (promptSec) promptSec.style.display = 'block';
            } else {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if (isIOS) {
                    if (iosSec) iosSec.style.display = 'block';
                } else {
                    if (androidSec) androidSec.style.display = 'block';
                }
            }

            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closePwaInstallModal() {
            const modal = document.getElementById('pwaInstallModal');
            if (modal) {
                modal.classList.remove('is-open');
                modal.setAttribute('aria-hidden', 'true');
                if (!document.body.classList.contains('sidebar-open')) {
                    document.body.style.overflow = '';
                }
            }
        }

        // Interactive Doodle Social Icons: click icon to wiggle, click speech bubble tooltip to open link
        function initDoodleSocial() {
            const doodleButtons = document.querySelectorAll('.doodle-link');
            if (!doodleButtons.length) return;

            doodleButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const isWiggling = this.classList.contains('is-wiggling');
                    const parent = this.closest('.doodle-icon-content');

                    // Reset any other icon
                    doodleButtons.forEach(other => {
                        other.classList.remove('is-wiggling');
                        const otherParent = other.closest('.doodle-icon-content');
                        if (otherParent) otherParent.classList.remove('is-wiggling');
                    });

                    if (!isWiggling) {
                        // Activate wiggle on this icon & display its speech bubble tooltip
                        this.classList.add('is-wiggling');
                        if (parent) parent.classList.add('is-wiggling');
                    } else {
                        // Toggle off if clicked again
                        this.classList.remove('is-wiggling');
                        if (parent) parent.classList.remove('is-wiggling');
                    }
                });
            });

            // Prevent tooltip clicks from bubbling to container or closing early
            const tooltips = document.querySelectorAll('.doodle-tooltip');
            tooltips.forEach(tooltip => {
                tooltip.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            });

            // Dismiss wiggling when clicking anywhere outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.doodle-container')) {
                    doodleButtons.forEach(btn => {
                        btn.classList.remove('is-wiggling');
                        const parent = btn.closest('.doodle-icon-content');
                        if (parent) parent.classList.remove('is-wiggling');
                    });
                }
            });
        }

        function updateBottomNavActive() {
            const currentPath = window.location.pathname;
            const bNavItems = document.querySelectorAll('.b-nav-item');
            bNavItems.forEach(item => {
                const href = item.getAttribute('href');
                if (!href) return;
                const isHome = href === '/' && (currentPath === '/' || currentPath === '');
                const isSub = href !== '/' && currentPath.startsWith(href);
                if (isHome || isSub) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        function updateCartBadges() {
            try {
                const savedCart = JSON.parse(localStorage.getItem('alif_cart') || '[]');
                const count = savedCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                const badge1 = document.getElementById('cartCount');
                const badge2 = document.getElementById('cartCountMobile');
                if (badge1) badge1.innerText = count;
                if (badge2) badge2.innerText = count;
            } catch(e) {}
        }

        // --- ULTRA-FAST MOBILE PAGE NAVIGATION ACCELERATOR ---
        if (!window._mobileNavAcceleratorBound) {
            window._mobileNavAcceleratorBound = true;

            // 1. Instant Touch Feedback & Network Prefetch on touchstart
            document.addEventListener('touchstart', (e) => {
                const link = e.target.closest('a[href]');
                if (!link) return;
                const href = link.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

                // Instant bottom nav visual reaction on touch (0ms latency feedback)
                const bNavItem = link.closest('.b-nav-item');
                if (bNavItem) {
                    document.querySelectorAll('.b-nav-item').forEach(el => el.classList.remove('active'));
                    bNavItem.classList.add('active');
                }

                // Give network fetch a 150-300ms head start before click fires
                if (!link._prefetched) {
                    link._prefetched = true;
                    const prefetchEl = document.createElement('link');
                    prefetchEl.rel = 'prefetch';
                    prefetchEl.href = href;
                    prefetchEl.as = 'document';
                    document.head.appendChild(prefetchEl);
                }
            }, { passive: true, capture: true });

            // 2. Also prefetch on pointerdown for any interactive links
            document.addEventListener('pointerdown', (e) => {
                const link = e.target.closest('a[href]');
                if (!link) return;
                const href = link.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
                if (!link._prefetched) {
                    link._prefetched = true;
                    const prefetchEl = document.createElement('link');
                    prefetchEl.rel = 'prefetch';
                    prefetchEl.href = href;
                    prefetchEl.as = 'document';
                    document.head.appendChild(prefetchEl);
                }
            }, { passive: true, capture: true });
        }

        // Instagram-Style Minimalist Floating Edge Swipe Navigation (Home <-> Reels)
        function initInstagramSwipeNavigation() {
            if (window._instaSwipeBound) return;
            window._instaSwipeBound = true;

            let touchStartX = 0;
            let touchStartY = 0;
            let touchCurrentX = 0;
            let touchCurrentY = 0;
            let isTrackingSwipe = false;
            let swipeDirection = null; // 'to-reels' or 'to-home'
            let indicatorEl = null;

            function getOrCreateIndicator() {
                let el = document.getElementById('instaSwipeIndicator');
                if (!el) {
                    el = document.createElement('div');
                    el.id = 'instaSwipeIndicator';
                    el.className = 'insta-swipe-indicator';
                    el.innerHTML = `
                        <div class="indicator-reels-box" style="display:none; align-items:center; gap:7px;">
                            <span class="swipe-text">REELS</span>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="none" stroke="currentColor" stroke-width="2"/>
                                <polygon points="10 9 15 12 10 15" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="indicator-home-box" style="display:none; align-items:center; gap:7px;">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            <span class="swipe-text">HOME</span>
                        </div>
                    `;
                    document.body.appendChild(el);
                }
                return el;
            }

            function isCarouselOrInteractive(target) {
                if (!target) return false;
                return Boolean(target.closest(
                    '#top-banner, .banner-carousel, .reels-cards-track, .reels-cards-viewport, ' +
                    '.collection-cards-track, .collection-cards-viewport, .fc-grid, ' +
                    '.arabica-clone-drawer, #sidebarMenu, #chat-widget, #searchModal, ' +
                    'input, textarea, select, button, a'
                ));
            }

            window.addEventListener('touchstart', (e) => {
                if (!e.touches || e.touches.length !== 1) return;
                const touch = e.touches[0];
                const target = e.target;

                if (isCarouselOrInteractive(target)) {
                    isTrackingSwipe = false;
                    return;
                }

                const rawPath = window.location.pathname.replace(/\/$/, '') || '/';
                const isHome = rawPath === '/' || rawPath === '';
                const isReels = rawPath === '/reels';

                if (!isHome && !isReels) {
                    isTrackingSwipe = false;
                    return;
                }

                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                touchCurrentX = touch.clientX;
                touchCurrentY = touch.clientY;

                // STRICT EDGE DETECTION: Only activate on far edges (within 45px) so middle 90% is 100% native
                if (isHome) {
                    if (touchStartX >= window.innerWidth - 45) {
                        isTrackingSwipe = true;
                        swipeDirection = 'to-reels';
                    } else {
                        isTrackingSwipe = false;
                    }
                } else if (isReels) {
                    if (touchStartX <= 45) {
                        isTrackingSwipe = true;
                        swipeDirection = 'to-home';
                    } else {
                        isTrackingSwipe = false;
                    }
                }
            }, { passive: true });

            window.addEventListener('touchmove', (e) => {
                if (!isTrackingSwipe || !e.touches || e.touches.length !== 1) return;
                const touch = e.touches[0];
                touchCurrentX = touch.clientX;
                touchCurrentY = touch.clientY;

                const diffX = touchCurrentX - touchStartX;
                const diffY = touchCurrentY - touchStartY;

                // Cancel if vertical scroll is dominant
                if (Math.abs(diffY) > 20 && Math.abs(diffY) > Math.abs(diffX)) {
                    isTrackingSwipe = false;
                    if (indicatorEl) indicatorEl.classList.remove('visible');
                    return;
                }

                // Home -> Reels (dragging from right edge towards left)
                if (swipeDirection === 'to-reels' && diffX < -15) {
                    const pull = Math.min(Math.abs(diffX), 120);
                    indicatorEl = getOrCreateIndicator();
                    indicatorEl.className = 'insta-swipe-indicator right-edge visible';
                    const reelsBox = indicatorEl.querySelector('.indicator-reels-box');
                    const homeBox = indicatorEl.querySelector('.indicator-home-box');
                    if (reelsBox) reelsBox.style.display = 'inline-flex';
                    if (homeBox) homeBox.style.display = 'none';
                    const opacity = Math.min(pull / 65, 1);
                    indicatorEl.style.transform = `translateY(-50%) translateX(${Math.max(60 - pull * 0.7, 0)}px)`;
                    indicatorEl.style.opacity = opacity;
                }
                // Reels -> Home (dragging from left edge towards right)
                else if (swipeDirection === 'to-home' && diffX > 15) {
                    const pull = Math.min(diffX, 120);
                    indicatorEl = getOrCreateIndicator();
                    indicatorEl.className = 'insta-swipe-indicator left-edge visible';
                    const reelsBox = indicatorEl.querySelector('.indicator-reels-box');
                    const homeBox = indicatorEl.querySelector('.indicator-home-box');
                    if (reelsBox) reelsBox.style.display = 'none';
                    if (homeBox) homeBox.style.display = 'inline-flex';
                    const opacity = Math.min(pull / 65, 1);
                    indicatorEl.style.transform = `translateY(-50%) translateX(${Math.min(-60 + pull * 0.7, 0)}px)`;
                    indicatorEl.style.opacity = opacity;
                }
            }, { passive: true });

            window.addEventListener('touchend', () => {
                if (!isTrackingSwipe) return;
                isTrackingSwipe = false;

                const diffX = touchCurrentX - touchStartX;
                const diffY = touchCurrentY - touchStartY;
                const isHorizontal = Math.abs(diffX) > Math.abs(diffY) * 1.3;

                if (indicatorEl) {
                    indicatorEl.classList.remove('visible');
                    indicatorEl.style.opacity = '0';
                }

                // Trigger threshold: 50px horizontal swipe
                if (isHorizontal) {
                    if (swipeDirection === 'to-reels' && diffX < -50) {
                        if (navigator.vibrate) {
                            try { navigator.vibrate(15); } catch(_) {}
                        }
                        const reelsBtn = document.getElementById('bNavReels');
                        if (reelsBtn) {
                            reelsBtn.click();
                        } else {
                            window.location.assign('/reels/');
                        }
                    } else if (swipeDirection === 'to-home' && diffX > 50) {
                        if (navigator.vibrate) {
                            try { navigator.vibrate(15); } catch(_) {}
                        }
                        const homeBtn = document.getElementById('bNavHome');
                        if (homeBtn) {
                            homeBtn.click();
                        } else {
                            window.location.assign('/');
                        }
                    }
                }
            }, { passive: true });
        }

        function runPageInit() {
            checkPwaLaunchSplash();
            initDoodleSocial();
            updateBottomNavActive();
            updateCartBadges();
            initInstagramSwipeNavigation();
        }

        // Run on Astro SPA navigations
        document.addEventListener('astro:page-load', runPageInit);

        // ALSO run immediately on first hard page load
        // (astro:page-load doesn't fire on initial visit)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runPageInit);
        } else {
            runPageInit();
        }

        document.addEventListener('astro:before-swap', () => {
            const drawer = document.getElementById('sidebarMenu') || document.getElementById('minimalistSidebar');
            if (drawer) {
                drawer.classList.remove('is-open');
                drawer.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('sidebar-open');
                document.body.style.overflow = '';
            }
        });

        // Service Worker Registration & Cache Busting
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(reg => {
                reg.update();
            }).catch(() => {});
        }

        // --- DYNAMIC ON-DEMAND HYDRATION FOR REACT ISLANDS ---
        let searchLoaded = false;
        async function loadSearch(initialOpen = true) {
            if (searchLoaded) return;
            searchLoaded = true;
            try {
                const [{ default: React }, { createRoot }, { default: SearchModal }] = await Promise.all([
                    import('react'),
                    import('react-dom/client'),
                    import('../components/SearchModal.tsx')
                ]);
                const rootEl = document.getElementById('search-modal-root');
                if (rootEl) {
                    const root = createRoot(rootEl);
                    root.render(React.createElement(SearchModal, { initialOpen }));
                }
            } catch (err) {
                console.error('Failed to load SearchModal:', err);
                searchLoaded = false;
            }
        }

        let chatLoaded = false;
        async function loadChat(initialOpen = true, initialMessage = '') {
            if (chatLoaded) return;
            chatLoaded = true;
            try {
                const [{ default: React }, { createRoot }, { default: AIChatWidget }] = await Promise.all([
                    import('react'),
                    import('react-dom/client'),
                    import('../components/AIChatWidget.tsx')
                ]);
                const rootEl = document.getElementById('ai-chat-root');
                if (rootEl) {
                    const root = createRoot(rootEl);
                    root.render(React.createElement(AIChatWidget, { initialOpen, initialMessage }));
                }
            } catch (err) {
                console.error('Failed to load AIChatWidget:', err);
                chatLoaded = false;
            }
        }

        function prefetchSearch() {
            import('../components/SearchModal.tsx').catch(() => {});
        }
        function prefetchChat() {
            import('../components/AIChatWidget.tsx').catch(() => {});
        }

        window.openALiFChat = (msg) => {
            loadChat(true, typeof msg === 'string' ? msg : '');
        };
        window.addEventListener('open-alif-chat', (e) => {
            const detail = e.detail || {};
            loadChat(true, detail.message || '');
        });

        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!target) return;
            if (target.closest && target.closest('#open-search')) {
                e.preventDefault();
                loadSearch(true);
            }
            if (target.closest && target.closest('#chat-button') && !chatLoaded) {
                e.preventDefault();
                loadChat(true);
            }
        });

        document.addEventListener('pointerenter', (e) => {
            const target = e.target;
            if (!target) return;
            if (target.closest && target.closest('#open-search')) prefetchSearch();
            if (target.closest && target.closest('#chat-button')) prefetchChat();
        }, { passive: true, capture: true });