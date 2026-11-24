// src/scripts/analytics.js
// High-Precision Atelier Analytics Engine for alif.
// Tracks: Visits, Active Engagement Seconds, Scroll Depth, Sahibganj Locality & Astro SPA Transitions

(function() {
    if (typeof window === 'undefined') return;

    // Generate or restore anonymous persistent Visitor ID & Session ID
    function getUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'alif_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    }

    let visitorId = localStorage.getItem('alif_vid');
    if (!visitorId) {
        visitorId = getUUID();
        localStorage.setItem('alif_vid', visitorId);
    }

    let sessionId = sessionStorage.getItem('alif_sid');
    if (!sessionId) {
        sessionId = getUUID();
        sessionStorage.setItem('alif_sid', sessionId);
    }

    // State for current page
    let currentPagePath = window.location.pathname;
    let pageEnterTimestamp = Date.now();
    let activeSeconds = 0;
    let maxScrollDepth = 0;
    let isVisible = document.visibilityState === 'visible';
    let lastActiveInteractionTime = Date.now();
    let heartbeatTimer = null;
    let activeTicker = null;

    function getConsent() {
        return localStorage.getItem('alif_cookie_consent') || 'accepted';
    }

    function getUserLocality() {
        return localStorage.getItem('alif_user_locality') || 'Sahibganj (Unselected)';
    }

    function getUserCoords() {
        try {
            const raw = localStorage.getItem('alif_user_coords');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    // Send payload via navigator.sendBeacon or fallback fetch
    function sendPayload(endpoint, data) {
        const payload = JSON.stringify(data);
        const url = endpoint || '/.netlify/functions/analytics';

        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
        } else {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(() => {});
        }

        // Also push to Google Analytics 4 if gtag is installed
        if (typeof window.gtag === 'function') {
            window.gtag('event', data.event_type || 'alif_telemetry', {
                event_category: 'Atelier Engagement',
                locality: data.locality,
                active_seconds: data.active_seconds,
                scroll_depth: data.scroll_depth,
                device: data.device
            });
        }
    }

    // Track scroll depth
    function updateScrollDepth() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const winHeight = window.innerHeight;
        const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight
        );
        const totalScrollable = docHeight - winHeight;
        if (totalScrollable > 0) {
            const currentPct = Math.round((scrollTop / totalScrollable) * 100);
            if (currentPct > maxScrollDepth) {
                maxScrollDepth = Math.min(100, currentPct);
            }
        }
        lastActiveInteractionTime = Date.now();
    }

    // Active interaction listeners
    ['scroll', 'click', 'touchstart', 'mousemove', 'keydown'].forEach(evt => {
        window.addEventListener(evt, () => {
            lastActiveInteractionTime = Date.now();
        }, { passive: true });
    });
    window.addEventListener('scroll', updateScrollDepth, { passive: true });

    // Active seconds ticker (increments every second only if tab is visible and active in last 45s)
    function startTicker() {
        if (activeTicker) clearInterval(activeTicker);
        activeTicker = setInterval(() => {
            if (document.visibilityState === 'visible' && (Date.now() - lastActiveInteractionTime < 45000)) {
                activeSeconds += 1;
            }
        }, 1000);
    }

    // Visibility change handler (pauses timer immediately when phone locked or tab changed)
    document.addEventListener('visibilitychange', () => {
        isVisible = document.visibilityState === 'visible';
        if (isVisible) {
            lastActiveInteractionTime = Date.now();
        }
    });

    // Send heartbeat every 20 seconds
    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
            if (activeSeconds > 0 && isVisible) {
                const data = {
                    event_type: 'heartbeat',
                    visitor_id: visitorId,
                    session_id: sessionId,
                    page_path: currentPagePath,
                    page_title: document.title,
                    active_seconds: activeSeconds,
                    scroll_depth: maxScrollDepth,
                    locality: getUserLocality(),
                    coords: getUserCoords(),
                    device: getDeviceType(),
                    timestamp: new Date().toISOString()
                };
                sendPayload('/.netlify/functions/analytics', data);
            }
        }, 20000);
    }

    // Page view and leave tracking
    function handlePageEnter() {
        currentPagePath = window.location.pathname;
        pageEnterTimestamp = Date.now();
        activeSeconds = 0;
        maxScrollDepth = 0;
        lastActiveInteractionTime = Date.now();

        const data = {
            event_type: 'pageview',
            visitor_id: visitorId,
            session_id: sessionId,
            page_path: currentPagePath,
            page_title: document.title,
            referrer: document.referrer || '',
            locality: getUserLocality(),
            coords: getUserCoords(),
            device: getDeviceType(),
            timestamp: new Date().toISOString()
        };
        sendPayload('/.netlify/functions/analytics', data);

        startTicker();
        startHeartbeat();
    }

    function handlePageLeave() {
        if (activeSeconds > 0) {
            const data = {
                event_type: 'pageleave',
                visitor_id: visitorId,
                session_id: sessionId,
                page_path: currentPagePath,
                active_seconds: activeSeconds,
                scroll_depth: maxScrollDepth,
                locality: getUserLocality(),
                device: getDeviceType(),
                timestamp: new Date().toISOString()
            };
            sendPayload('/.netlify/functions/analytics', data);
        }
    }

    // Listen to Astro View Transitions
    document.addEventListener('astro:page-load', handlePageEnter);
    document.addEventListener('astro:before-swap', handlePageLeave);
    window.addEventListener('pagehide', handlePageLeave);
    window.addEventListener('beforeunload', handlePageLeave);

    // Initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handlePageEnter);
    } else {
        handlePageEnter();
    }

    // Expose client telemetry inspector for owner
    window.__alifGetSessionStats = function() {
        return {
            visitor_id: visitorId,
            session_id: sessionId,
            page: currentPagePath,
            active_seconds: activeSeconds,
            scroll_depth: maxScrollDepth,
            locality: getUserLocality(),
            device: getDeviceType()
        };
    };
})();
