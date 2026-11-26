// src/scripts/chatDrag.js
// Drag-anywhere Floating Chat Trigger Controller (Supports Touch & Mouse + LocalStorage Persistence)

const CHAT_POS_KEY = 'alif_chat_btn_pos';

function clampPosition(left, top, btn) {
    const w = btn.offsetWidth || 52;
    const h = btn.offsetHeight || 52;
    const padX = 12;
    const minTop = 74; // Keep below fixed top navbar
    const bottomReserve = window.innerWidth <= 768 ? 78 : 18; // Keep clear of mobile bottom nav
    const maxLeft = Math.max(padX, window.innerWidth - w - padX);
    const maxTop = Math.max(minTop, window.innerHeight - h - bottomReserve);

    return {
        left: Math.round(Math.min(Math.max(left, padX), maxLeft)),
        top: Math.round(Math.min(Math.max(top, minTop), maxTop))
    };
}

export function applySavedChatPosition() {
    const btn = document.getElementById('chat-button');
    if (!btn) return;
    try {
        const raw = localStorage.getItem(CHAT_POS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.left !== 'number' || typeof parsed?.top !== 'number') return;

        const clamped = clampPosition(parsed.left, parsed.top, btn);
        btn.style.left = `${clamped.left}px`;
        btn.style.top = `${clamped.top}px`;
        btn.style.right = 'auto';
        btn.style.bottom = 'auto';
    } catch {
        // Ignore invalid stored coordinates
    }
}

export function initDraggableChatButton() {
    if (typeof window === 'undefined' || window.__alifChatDragBound) return;
    window.__alifChatDragBound = true;

    let dragState = null;

    applySavedChatPosition();
    document.addEventListener('astro:page-load', applySavedChatPosition);
    window.addEventListener('resize', applySavedChatPosition, { passive: true });

    // Re-apply saved coordinates seamlessly when React hydrates AIChatWidget inside #ai-chat-root
    const chatRoot = document.getElementById('ai-chat-root');
    if (chatRoot && typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
            applySavedChatPosition();
        });
        observer.observe(chatRoot, { childList: true, subtree: true });
    }

    document.addEventListener('pointerdown', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('#chat-button') : null;
        if (!btn) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        const rect = btn.getBoundingClientRect();
        dragState = {
            btn,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            originLeft: rect.left,
            originTop: rect.top,
            hasMoved: false
        };

        try {
            btn.setPointerCapture(e.pointerId);
        } catch {
            // Safari fallback safely ignored
        }
    });

    document.addEventListener('pointermove', (e) => {
        if (!dragState || e.pointerId !== dragState.pointerId) return;

        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        if (!dragState.hasMoved && Math.hypot(dx, dy) >= 6) {
            dragState.hasMoved = true;
            dragState.btn.classList.add('is-dragging');
        }

        if (dragState.hasMoved) {
            const next = clampPosition(
                dragState.originLeft + dx,
                dragState.originTop + dy,
                dragState.btn
            );
            dragState.btn.style.left = `${next.left}px`;
            dragState.btn.style.top = `${next.top}px`;
            dragState.btn.style.right = 'auto';
            dragState.btn.style.bottom = 'auto';
        }
    });

    function finishDrag(e) {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        const { btn, hasMoved, pointerId } = dragState;
        dragState = null;

        try {
            btn.releasePointerCapture(pointerId);
        } catch {
            // Safe cleanup
        }
        btn.classList.remove('is-dragging');

        if (hasMoved) {
            const rect = btn.getBoundingClientRect();
            const clamped = clampPosition(rect.left, rect.top, btn);
            btn.style.left = `${clamped.left}px`;
            btn.style.top = `${clamped.top}px`;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';

            try {
                localStorage.setItem(CHAT_POS_KEY, JSON.stringify(clamped));
            } catch {
                // Storage quota ignored
            }

            window.__alifSuppressChatClick = true;
            setTimeout(() => {
                window.__alifSuppressChatClick = false;
            }, 150);
        }
    }

    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', finishDrag);

    // Block accidental click open when releasing a drag
    document.addEventListener(
        'click',
        (e) => {
            const target = e.target;
            if (window.__alifSuppressChatClick && target && target.closest && target.closest('#chat-button')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                window.__alifSuppressChatClick = false;
            }
        },
        true
    );
}
