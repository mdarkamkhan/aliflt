// src/scripts/chatContext.js
// Live Page, Verified Location & Shopping Bag Context Bridge + Bag/Image Helpers

import { getLocationProfile } from './locationStore.js';

export function getPageSlugAndType(pathname) {
    const cleanPath = String(pathname || '/');
    const prodMatch = cleanPath.match(/^\/products\/([^/]+)\/?$/i);
    if (prodMatch) {
        return { type: 'product', slug: prodMatch[1] };
    }
    const servMatch = cleanPath.match(/^\/services\/([^/]+)\/?$/i);
    if (servMatch) {
        return { type: 'service', slug: servMatch[1] };
    }
    if (cleanPath.startsWith('/cart')) return { type: 'cart', slug: '' };
    if (cleanPath.startsWith('/reels')) return { type: 'reels', slug: '' };
    if (cleanPath.startsWith('/designs')) return { type: 'designs', slug: '' };
    return { type: cleanPath === '/' ? 'home' : 'page', slug: '' };
}

export function collectClientChatContext() {
    if (typeof window === 'undefined') {
        return { page: null, location: null, cart: [] };
    }

    const path = window.location.pathname || '/';
    const { type, slug } = getPageSlugAndType(path);

    const headingEl = document.querySelector('h1');
    const rawTitle = headingEl?.textContent?.trim() || document.title?.split('|')?.[0]?.trim() || '';
    const codeEl = document.querySelector('[data-code]');
    const pageCode = codeEl ? codeEl.getAttribute('data-code') || '' : '';

    const locProfile = getLocationProfile();
    const location = locProfile
        ? {
              shared: true,
              city: locProfile.display_city || null,
              in_sahibganj: typeof locProfile.in_sahibganj === 'boolean' ? locProfile.in_sahibganj : null
          }
        : { shared: false, city: null, in_sahibganj: null };

    let cart = [];
    try {
        const rawCart = JSON.parse(localStorage.getItem('alif_cart') || '[]');
        if (Array.isArray(rawCart)) {
            cart = rawCart.slice(0, 10).map((item) => ({
                id: item.id || '',
                code: item.code || '',
                title: item.title || '',
                price: Number(item.price || 0),
                quantity: Number(item.quantity || 1)
            }));
        }
    } catch {
        cart = [];
    }

    return {
        page: {
            path,
            type,
            slug,
            title: rawTitle.slice(0, 120),
            code: pageCode
        },
        location,
        cart
    };
}

export function addCatalogItemToBag(item) {
    if (typeof window === 'undefined' || !item) return false;
    try {
        const itemId =
            item.id ||
            (item.url ? item.url.replace(/^\/products\//, '').replace(/\/$/, '') : '') ||
            item.code ||
            item.title;
        if (!itemId) return false;

        const effectivePrice = Number(
            String(item.offer_price || item.price || 0).replace(/[^0-9.]/g, '')
        ) || 0;

        let cart = JSON.parse(localStorage.getItem('alif_cart') || '[]');
        if (!Array.isArray(cart)) cart = [];

        const existing = cart.find((c) => c.id === itemId);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
            if (item.code && !existing.code) existing.code = item.code;
        } else {
            cart.push({
                id: itemId,
                title: item.title,
                price: effectivePrice,
                image: item.image || '/icons/icon-512x512.png',
                code: item.code || '',
                quantity: 1
            });
        }

        localStorage.setItem('alif_cart', JSON.stringify(cart));

        const count = cart.reduce((sum, entry) => sum + (entry.quantity || 1), 0);
        const b1 = document.getElementById('cartCount');
        const b2 = document.getElementById('cartCountMobile');
        if (b1) b1.innerText = String(count);
        if (b2) b2.innerText = String(count);

        window.dispatchEvent(new CustomEvent('alif:cart-updated', { detail: { count } }));
        return true;
    } catch {
        return false;
    }
}

export function openWhatsAppWithText(messageText) {
    if (typeof window === 'undefined' || !messageText) return;
    const url = `https://wa.me/917250470009?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

export function compressOutfitImage(file, maxDimension = 900, quality = 0.78) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Please select a valid image file.'));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Could not decode image.'));
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width >= height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context unavailable.'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                const base64 = dataUrl.split(',')[1] || '';

                resolve({
                    mimeType: 'image/jpeg',
                    data: base64,
                    previewUrl: dataUrl
                });
            };
            img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
    });
}
