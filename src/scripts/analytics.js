// src/scripts/analytics.js
// High-Precision Atelier Analytics Engine for alif.
// Tracks: Visits, Active Engagement Seconds, Scroll Depth, Exact Reverse-Geocoded Location & Astro SPA Transitions
import { getLocationProfile, getLocationTelemetryProps } from './locationStore.js';

(function() {
    if (typeof window === 'undefined') return;

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

    let currentPagePath = window.location.pathname;
    let activeSeconds = 0;
    let maxScrollDepth = 0;
    let isVisible = document.visibilityState === 'visible';
    let lastActiveInteractionTime = Date.now();
    let heartbeatTimer = null;
    let activeTicker = null;
    let lastPageEnterAt = 0;
    let lastPageEnterPath = '';

    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'Mobile';
        return 'Desktop';
    }

    function buildPayload(eventType, extra = {}) {
        const locProps = getLocationTelemetryProps(getLocationProfile());
        return {
            event_type: eventType,
            visitor_id: visitorId,
            session_id: sessionId,
            page_path: currentPagePath,
            page_title: document.title,
            active_seconds: activeSeconds,
            scroll_depth: maxScrollDepth,
            device: getDeviceType(),
            timestamp: new Date().toISOString(),
            ...locProps,
            ...extra
        };
    }

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

        // Forward to Google Analytics 4 if gtag is installed
        if (typeof window.gtag === 'function') {
            window.gtag('event', data.event_type || 'alif_telemetry', {
                event_category: 'Atelier Engagement',
                locality: data.locality,
                city: data.city,
                in_sahibganj: data.in_sahibganj,
                active_seconds: data.active_seconds,
                scroll_depth: data.scroll_depth,
                device: data.device
            });
        }
    }

    function updateScrollDepth() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const winHeight = window.innerHeight;
        const docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight
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

    ['scroll', 'click', 'touchstart', 'mousemove', 'keydown'].forEach((evt) => {
        window.addEventListener(
            evt,
            () => {
                lastActiveInteractionTime = Date.now();
            },
            { passive: true }
        );
    });
    window.addEventListener('scroll', updateScrollDepth, { passive: true });

    function startTicker() {
        if (activeTicker) clearInterval(activeTicker);
        activeTicker = setInterval(() => {
            if (document.visibilityState === 'visible' && Date.now() - lastActiveInteractionTime < 45000) {
                activeSeconds += 1;
            }
        }, 1000);
    }

    document.addEventListener('visibilitychange', () => {
        isVisible = document.visibilityState === 'visible';
        if (isVisible) {
            lastActiveInteractionTime = Date.now();
        }
    });

    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
            if (activeSeconds > 0 && isVisible) {
                sendPayload('/.netlify/functions/analytics', buildPayload('heartbeat'));
            }
        }, 20000);
    }

    function handlePageEnter() {
        const nextPath = window.location.pathname;
        const now = Date.now();
        // Prevent duplicate pageview when both DOMContentLoaded and astro:page-load fire at boot
        if (nextPath === lastPageEnterPath && now - lastPageEnterAt < 800) {
            return;
        }
        lastPageEnterPath = nextPath;
        lastPageEnterAt = now;

        currentPagePath = nextPath;
        activeSeconds = 0;
        maxScrollDepth = 0;
        lastActiveInteractionTime = now;

        sendPayload(
            '/.netlify/functions/analytics',
            buildPayload('pageview', { referrer: document.referrer || '' })
        );

        startTicker();
        startHeartbeat();
    }

    function handlePageLeave() {
        if (activeSeconds > 0) {
            sendPayload('/.netlify/functions/analytics', buildPayload('pageleave'));
        }
    }

    // Immediately report exact GPS/manual location verification to telemetry backend
    window.addEventListener('alif:locality-changed', (e) => {
        const locProps = getLocationTelemetryProps(e.detail || getLocationProfile());
        sendPayload('/.netlify/functions/analytics', buildPayload('location_verified', locProps));
    });

    document.addEventListener('astro:page-load', handlePageEnter);
    document.addEventListener('astro:before-swap', handlePageLeave);
    window.addEventListener('pagehide', handlePageLeave);
    window.addEventListener('beforeunload', handlePageLeave);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handlePageEnter);
    } else {
        handlePageEnter();
    }

    window.__alifGetSessionStats = function() {
        return {
            visitor_id: visitorId,
            session_id: sessionId,
            page: currentPagePath,
            active_seconds: activeSeconds,
            scroll_depth: maxScrollDepth,
            ...getLocationTelemetryProps(getLocationProfile()),
            device: getDeviceType()
        };
    };
})();
