// src/scripts/posthog.js
// Next-Level PostHog Integration for alif.
// Features: Session Replay, Visual Heatmaps, Astro ClientRouter Sync & Sahibganj Locality Bridge
import posthog from 'posthog-js';

const POSTHOG_KEY = 'phc_tEXQ3N6KA8G7g4aNrZHGkmic7Z4cqGFnxSYzuLxu5F5F';
const POSTHOG_HOST = 'https://us.i.posthog.com';

function initPostHog() {
    if (window.__alifPostHogInitialized) return;
    window.__alifPostHogInitialized = true;

    const savedLocality = localStorage.getItem('alif_user_locality') || 'Sahibganj (Unselected)';

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: false, // Handled manually for Astro View Transitions
        capture_pageleave: true,
        autocapture: true,
        session_recording: {
            maskAllInputs: true,
            maskTextSelector: '.mask-sensitive, input[type="tel"]'
        },
        loaded: (ph) => {
            ph.register({
                locality: savedLocality,
                device: window.innerWidth < 768 ? 'Mobile' : 'Desktop'
            });
            ph.capture('$pageview', {
                locality: savedLocality
            });
        }
    });

    window.posthog = posthog;
}

// 1. Astro SPA Navigation Pageview capture
document.addEventListener('astro:page-load', () => {
    if (window.posthog && typeof window.posthog.capture === 'function') {
        const loc = localStorage.getItem('alif_user_locality') || 'Sahibganj (Unselected)';
        window.posthog.capture('$pageview', {
            locality: loc
        });
    }
});

// 2. Sahibganj Locality Bridge: Stamp all session replays with selected neighborhood
window.addEventListener('alif:locality-changed', (e) => {
    if (window.posthog && e.detail) {
        window.posthog.register({ locality: e.detail.locality });
        window.posthog.capture('locality_selected', {
            locality: e.detail.locality,
            method: e.detail.method
        });
    }
});

// 3. High-Value Boutique Action Tracking (WhatsApp, Add-to-Cart, Reels)
document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target || !target.closest || !window.posthog) return;

    // Track WhatsApp inquiries
    const waLink = target.closest('a[href*="wa.me"]');
    if (waLink) {
        window.posthog.capture('whatsapp_inquiry_clicked', {
            href: waLink.href,
            locality: localStorage.getItem('alif_user_locality') || 'Sahibganj (Unselected)'
        });
        return;
    }

    // Track Add-to-Cart clicks
    const cartBtn = target.closest('#addToCartBtn, [data-add-to-cart]');
    if (cartBtn) {
        window.posthog.capture('add_to_cart_clicked', {
            locality: localStorage.getItem('alif_user_locality') || 'Sahibganj (Unselected)'
        });
        return;
    }

    // Track Locality modal opens
    if (target.closest('#headerLocalityBtn')) {
        window.posthog.capture('locality_selector_opened');
        return;
    }
}, { passive: true });

// 4. Non-blocking initialization: Defers until main thread is idle to keep LCP instant
if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(initPostHog);
    } else {
        window.addEventListener('load', () => {
            setTimeout(initPostHog, 300);
        }, { once: true });
    }
}
