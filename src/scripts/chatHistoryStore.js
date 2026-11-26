// src/scripts/chatHistoryStore.js
// Zero-Cost Browser Multi-Thread Chat Persistence (IndexedDB + LocalStorage Active Pointer)

const DB_NAME = 'alif_ai_db';
const DB_VERSION = 1;
const STORE_NAME = 'threads';
const ACTIVE_THREAD_KEY = 'alif_ai_active_thread_id';
const FALLBACK_THREADS_KEY = 'alif_ai_threads_fallback';
const MAX_STORED_THREADS = 30;

function openDb() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
    });
}

function readFallbackThreads() {
    try {
        const parsed = JSON.parse(localStorage.getItem(FALLBACK_THREADS_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeFallbackThreads(threads) {
    try {
        localStorage.setItem(FALLBACK_THREADS_KEY, JSON.stringify(threads.slice(0, MAX_STORED_THREADS)));
    } catch {
        // Storage quota safely ignored
    }
}

export function createNewThreadId() {
    return 'thr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

export function generateThreadTitle(firstUserText, hasImage = false) {
    const cleaned = String(firstUserText || '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/[?!.]+$/g, '')
        .trim();

    if (!cleaned) {
        return hasImage ? 'Outfit Photo Match' : 'New Styling Inquiry';
    }

    const words = cleaned.split(/\s+/).slice(0, 6).join(' ');
    return words.length > 42 ? words.slice(0, 40).trimEnd() + '...' : words;
}

export function getActiveThreadId() {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(ACTIVE_THREAD_KEY) || null;
    } catch {
        return null;
    }
}

export function setActiveThreadId(threadId) {
    if (typeof window === 'undefined') return;
    try {
        if (threadId) {
            localStorage.setItem(ACTIVE_THREAD_KEY, threadId);
        } else {
            localStorage.removeItem(ACTIVE_THREAD_KEY);
        }
    } catch {
        // Ignore storage errors
    }
}

export async function getAllThreads() {
    try {
        const db = await openDb();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => {
                const list = Array.isArray(req.result) ? req.result : [];
                list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                resolve(list);
            };
            req.onerror = () => reject(req.error);
        });
    } catch {
        return readFallbackThreads().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
}

export async function getThreadById(id) {
    if (!id) return null;
    try {
        const db = await openDb();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return readFallbackThreads().find((t) => t.id === id) || null;
    }
}

export async function saveThread(thread) {
    if (!thread || !thread.id) return;
    try {
        const db = await openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(thread);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        // Trim oldest threads beyond MAX_STORED_THREADS
        const all = await getAllThreads();
        if (all.length > MAX_STORED_THREADS) {
            const excess = all.slice(MAX_STORED_THREADS);
            const trimTx = db.transaction(STORE_NAME, 'readwrite');
            const store = trimTx.objectStore(STORE_NAME);
            for (const old of excess) {
                store.delete(old.id);
            }
        }
    } catch {
        const list = readFallbackThreads().filter((t) => t.id !== thread.id);
        list.unshift(thread);
        writeFallbackThreads(list);
    }
}

export async function deleteThreadById(id) {
    if (!id) return;
    try {
        const db = await openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch {
        writeFallbackThreads(readFallbackThreads().filter((t) => t.id !== id));
    }
}

export function groupThreadsByDate(threads) {
    const groups = { today: [], yesterday: [], previous: [] };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    for (const thr of threads) {
        const ts = thr.updatedAt || thr.createdAt || 0;
        if (ts >= startOfToday) {
            groups.today.push(thr);
        } else if (ts >= startOfYesterday) {
            groups.yesterday.push(thr);
        } else {
            groups.previous.push(thr);
        }
    }
    return groups;
}

export function buildShortlistWhatsAppMessage(messages, locationInfo) {
    const catalogMap = new Map();
    const userRequests = [];

    for (const msg of messages || []) {
        if (msg.role === 'user' && msg.text) {
            userRequests.push(msg.text.trim());
        }
        if (Array.isArray(msg.catalog)) {
            for (const item of msg.catalog) {
                const key = item.code || item.url || item.title;
                if (!catalogMap.has(key)) {
                    catalogMap.set(key, item);
                }
            }
        }
    }

    const lines = ['*alif.ai CHAT SHORTLIST & INQUIRY*', ''];

    if (catalogMap.size > 0) {
        lines.push('*Recommended Pieces:*');
        for (const item of catalogMap.values()) {
            const codePart = item.code ? ` [${item.code}]` : '';
            const pricePart = item.offer_price || item.price ? ` - ₹${item.offer_price || item.price}` : '';
            lines.push(`- ${item.title}${codePart}${pricePart}`);
        }
        lines.push('');
    }

    if (userRequests.length > 0) {
        lines.push(`*Inquiry Notes:* ${userRequests.slice(-2).join(' | ')}`);
    }

    if (locationInfo?.shared && locationInfo?.city) {
        lines.push(`*Customer City:* ${locationInfo.city}`);
    }

    lines.push('Please share availability and confirmation.');
    return lines.join('\n');
}
