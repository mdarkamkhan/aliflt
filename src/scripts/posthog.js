// src/scripts/posthog.js
// PostHog Integration for alif.
// Features: Session Replay, Visual Heatmaps, Astro ClientRouter Sync, Consent Gating & Exact Reverse-Geocoded Location Bridge
import posthog from 'posthog-js';
import { getLocationProfile, getLocationTelemetryProps } from './locationStore.js';

const POSTHOG_KEY = 'phc_tEXQ3N6KA8G7g4aNrZHGkmic7Z4cqGFnxSYzuLxu5F5F';
const POSTHOG_HOST = 'https://us.i.posthog.com';

function initPostHog() {
    if (window.__alifPostHogInitialized) return;
    window.__alifPostHogInitialized = true;

    const consent = localStorage.getItem('alif_cookie_consent') || 'accepted';
    const isEssentialOnly = consent === 'essential';
    const locProps = getLocationTelemetryProps(getLocationProfile());

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: false, // Handled manually for Astro View Transitions
        capture_pageleave: true,
        autocapture: true,
        persistence: isEssentialOnly ? 'memory' : 'localStorage+cookie',
        disable_session_recording: isEssentialOnly,
        session_recording: {
            maskAllInputs: true,
            maskTextSelector: '.mask-sensitive, input[type="tel"]'
        },
        loaded: (ph) => {
            ph.register({
                ...locProps,
                device: window.innerWidth < 768 ? 'Mobile' : 'Desktop'
            });
            ph.capture('$pageview', locProps);
        }
    });

    window.posthog = posthog;
}

// 1. Astro SPA Navigation Pageview capture
document.addEventListener('astro:page-load', () => {
    if (window.posthog && typeof window.posthog.capture === 'function') {
        const locProps = getLocationTelemetryProps(getLocationProfile());
        window.posthog.capture('$pageview', locProps);
    }
});

// 2. Exact Location Bridge: Stamp all session replays & events with exact GPS/reverse-geocoded details
window.addEventListener('alif:locality-changed', (e) => {
    if (window.posthog && e.detail) {
        const locProps = getLocationTelemetryProps(e.detail);
        window.posthog.register(locProps);
        window.posthog.capture('locality_selected', locProps);
    }
});

// 3. Respect live Cookie Consent changes
window.addEventListener('alif:consent-updated', (e) => {
    if (!window.posthog || !e.detail) return;
    if (e.detail.consent === 'accepted') {
        window.posthog.set_config({
            persistence: 'localStorage+cookie',
            disable_session_recording: false
        });
        window.posthog.startSessionRecording();
    } else if (e.detail.consent === 'essential') {
        window.posthog.stopSessionRecording();
        window.posthog.set_config({
            persistence: 'memory',
            disable_session_recording: true
        });
    }
});

// 4. High-Value Boutique Action Tracking (WhatsApp, Add-to-Cart, Location Checks)
document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target || !target.closest || !window.posthog) return;

    const locProps = getLocationTelemetryProps(getLocationProfile());

    // Track WhatsApp inquiries
    const waLink = target.closest('a[href*="wa.me"]');
    if (waLink) {
        window.posthog.capture('whatsapp_inquiry_clicked', {
            href: waLink.href,
            ...locProps
        });
        return;
    }

    // Track Add-to-Cart clicks
    const cartBtn = target.closest('#addToCartBtn, [data-add-to-cart]');
    if (cartBtn) {
        window.posthog.capture('add_to_cart_clicked', locProps);
        return;
    }

    // Track Locality modal opens
    if (target.closest('#headerLocalityBtn')) {
        window.posthog.capture('locality_selector_opened', locProps);
        return;
    }
}, { passive: true });

// 5. Non-blocking initialization: Defers until main thread is idle to keep LCP instant
if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(initPostHog);
    } else {
        window.addEventListener('load', () => {
            setTimeout(initPostHog, 300);
        }, { once: true });
    }
}
