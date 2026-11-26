import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  collectClientChatContext,
  addCatalogItemToBag,
  openWhatsAppWithText,
  compressOutfitImage,
} from '../scripts/chatContext.js';
import {
  createNewThreadId,
  generateThreadTitle,
  getActiveThreadId,
  setActiveThreadId,
  getAllThreads,
  getThreadById,
  saveThread,
  deleteThreadById,
  groupThreadsByDate,
  buildShortlistWhatsAppMessage,
} from '../scripts/chatHistoryStore.js';

interface CatalogItem {
  id?: string;
  type?: string;
  title: string;
  category: string;
  image: string;
  price: string;
  orig_price?: string;
  offer_price?: string;
  offer_end_date?: string;
  discount_percent?: number | null;
  url: string;
  code?: string;
  colour?: string;
  fabric?: string;
  description?: string;
}

interface WhatsAppBooking {
  type?: string;
  title: string;
  items?: string[];
  notes?: string;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  imagePreview?: string;
  catalog?: CatalogItem[];
  booking?: WhatsAppBooking;
}

interface GeminiPart {
  text: string;
}

interface GeminiHistoryItem {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface StoredThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  geminiHistory: GeminiHistoryItem[];
  shortlistedCodes?: string[];
}

interface AttachedImage {
  mimeType: string;
  data: string;
  previewUrl: string;
}

const PROMPT_SUGGESTIONS = [
  {
    id: 'deals',
    label: 'Active offers & curated sets',
    msg: 'Abhi kaunse curated sets aur products par discount chal raha hai?',
    icon: 'tag',
  },
  {
    id: 'loc',
    label: 'Shop location & timings',
    msg: 'Shop location aur timings bataiye',
    icon: 'pin',
  },
  {
    id: 'rates',
    label: 'Stitching & blouse rates',
    msg: 'Blouse aur Suit stitching rates kya hain?',
    icon: 'scissors',
  },
  {
    id: 'laces',
    label: 'Browse laces & latkans',
    msg: 'Laces aur Latkans collection dikhao',
    icon: 'layers',
  },
];

function PromptIcon({ type }: { type: string }) {
  if (type === 'tag') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    );
  }
  if (type === 'pin') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }
  if (type === 'scissors') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function getTodayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resolveDisplayPricing(item: CatalogItem) {
  const todayISO = getTodayLocalISO();
  const hasOfferPrice = Boolean(item.offer_price && item.orig_price && Number(item.offer_price) < Number(item.orig_price));
  const notExpired = !item.offer_end_date || item.offer_end_date.slice(0, 10) >= todayISO;
  const isActiveOffer = hasOfferPrice && notExpired;

  const displayPrice = isActiveOffer
    ? String(item.offer_price).replace(/^₹/, '')
    : String(item.orig_price || item.price || '').replace(/^₹/, '');

  const mrpPrice = isActiveOffer ? String(item.orig_price || '').replace(/^₹/, '') : '';
  const discountPct = isActiveOffer && item.discount_percent ? item.discount_percent : null;

  return { displayPrice, mrpPrice, discountPct };
}

function extractTagsFromReply(rawReply: string, catalog: CatalogItem[]) {
  let text = rawReply || '';
  let matchedItems: CatalogItem[] = [];
  let booking: WhatsAppBooking | undefined = undefined;

  // 1. Parse [BOOK_WHATSAPP: {...}]
  const bookMatch = text.match(/\[BOOK_WHATSAPP:\s*(\{[\s\S]*?\})\s*\]/i);
  if (bookMatch) {
    text = text.replace(bookMatch[0], '').trim();
    try {
      const parsed = JSON.parse(bookMatch[1]);
      if (parsed && typeof parsed.title === 'string') {
        booking = {
          type: parsed.type || 'tailoring',
          title: parsed.title,
          items: Array.isArray(parsed.items) ? parsed.items.map(String) : [],
          notes: typeof parsed.notes === 'string' ? parsed.notes : '',
        };
      }
    } catch {
      // Malformed booking tag safely ignored
    }
  }

  // 2. Parse [SHOW_ITEMS: slug1, slug2, ...]
  const itemsMatch = text.match(/\[SHOW_ITEMS:\s*([^\]]+)\]/i);
  if (itemsMatch) {
    const requestedTokens = itemsMatch[1]
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    text = text.replace(/\[SHOW_ITEMS:\s*[^\]]+\]/gi, '').trim();

    if (catalog.length > 0 && requestedTokens.length > 0) {
      const seen = new Set<string>();
      for (const tok of requestedTokens) {
        const cleanTok = tok.replace(/^\/?(products|services)\//, '').replace(/\/$/, '');
        const found = catalog.find((item) => {
          const idL = (item.id || '').toLowerCase();
          const urlL = (item.url || '').toLowerCase();
          const codeL = (item.code || '').toLowerCase();
          return (
            idL === cleanTok ||
            codeL === cleanTok ||
            urlL.includes(`/${cleanTok}/`) ||
            urlL.endsWith(`/${cleanTok}`)
          );
        });
        if (found && !seen.has(found.url)) {
          seen.add(found.url);
          matchedItems.push(found);
        }
        if (matchedItems.length >= 4) break;
      }
    }
  }

  // 3. Fallback [SHOW_CATALOG: category]
  const catMatch = text.match(/\[SHOW_CATALOG:?\s*(\w*)\]/i);
  if (catMatch) {
    const categoryTag = (catMatch[1] || 'all').toLowerCase();
    text = text.replace(/\[SHOW_CATALOG:?\s*\w*\]/gi, '').trim();

    if (matchedItems.length === 0 && catalog.length > 0) {
      matchedItems = catalog
        .filter((item) => {
          if (categoryTag === 'all') return true;
          const c = (item.category || '').toLowerCase();
          const t = (item.title || '').toLowerCase();
          return c.includes(categoryTag) || t.includes(categoryTag);
        })
        .slice(0, 4);
    }
  }

  if (!text && (matchedItems.length > 0 || booking)) {
    text = 'Here are the best matching selections from alif.:';
  }

  return {
    cleanText: text,
    matchedItems: matchedItems.length > 0 ? matchedItems : undefined,
    booking,
  };
}

function hydrateThreadCatalogPrices(msgs: Message[], liveCatalog: CatalogItem[]): Message[] {
  if (!liveCatalog || liveCatalog.length === 0) return msgs;
  const byUrl = new Map<string, CatalogItem>();
  const byCode = new Map<string, CatalogItem>();
  for (const item of liveCatalog) {
    if (item.url) byUrl.set(item.url, item);
    if (item.code) byCode.set(item.code.toLowerCase(), item);
  }

  return msgs.map((msg) => {
    if (!Array.isArray(msg.catalog) || msg.catalog.length === 0) return msg;
    const updated = msg.catalog.map((oldItem) => {
      const live =
        (oldItem.url && byUrl.get(oldItem.url)) ||
        (oldItem.code && byCode.get(oldItem.code.toLowerCase()));
      return live || oldItem;
    });
    return { ...msg, catalog: updated };
  });
}

export default function AIChatWidget({
  initialOpen = false,
  initialMessage = '',
}: {
  initialOpen?: boolean;
  initialMessage?: string;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickDrawer, setShowQuickDrawer] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [threads, setThreads] = useState<StoredThread[]>([]);
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(null);
  const [searchCatalog, setSearchCatalog] = useState<CatalogItem[]>([]);
  const [pendingImage, setPendingImage] = useState<AttachedImage | null>(null);
  const [addedFeedbackMap, setAddedFeedbackMap] = useState<Record<string, boolean>>({});
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const historyRef = useRef<GeminiHistoryItem[]>([]);
  const threadMetaRef = useRef<{ id: string; createdAt: number; title: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isFetchingCatalogRef = useRef(false);

  const loadCatalog = () => {
    if (searchCatalog.length > 0 || isFetchingCatalogRef.current) return;
    isFetchingCatalogRef.current = true;
    fetch('/search.json')
      .then((res) => res.json())
      .then((data: CatalogItem[]) => {
        setSearchCatalog(data);
        setMessages((prev) => hydrateThreadCatalogPrices(prev, data));
      })
      .catch((err) => {
        isFetchingCatalogRef.current = false;
        console.warn('Could not load catalog index:', err);
      });
  };

  const refreshThreadsList = async () => {
    const list = await getAllThreads();
    setThreads(list);
  };

  // Restore last active conversation on mount & check browser Voice Speech support
  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechSupported(true);
    }

    if (!initialOpen || !initialMessage) {
      const savedId = getActiveThreadId();
      if (savedId) {
        getThreadById(savedId).then((thr: StoredThread | null) => {
          if (thr && Array.isArray(thr.messages) && thr.messages.length > 0) {
            threadMetaRef.current = {
              id: thr.id,
              createdAt: thr.createdAt,
              title: thr.title,
            };
            setActiveThreadIdState(thr.id);
            setMessages(thr.messages);
            historyRef.current = Array.isArray(thr.geminiHistory) ? thr.geminiHistory : [];
          }
        });
      }
    }
    refreshThreadsList();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      refreshThreadsList();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-active');
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.classList.remove('chat-active');
      setShowQuickDrawer(false);
      setShowPlusMenu(false);
      setShowHistoryDrawer(false);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showHistoryDrawer) {
          setShowHistoryDrawer(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('chat-active');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showHistoryDrawer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const persistThreadState = async (
    updatedMessages: Message[],
    updatedHistory: GeminiHistoryItem[],
    firstQueryText: string,
    hadImage: boolean
  ) => {
    if (updatedMessages.length === 0) return;

    const now = Date.now();
    if (!threadMetaRef.current) {
      const newId = createNewThreadId();
      threadMetaRef.current = {
        id: newId,
        createdAt: now,
        title: generateThreadTitle(firstQueryText, hadImage),
      };
      setActiveThreadId(newId);
      setActiveThreadIdState(newId);
    }

    const shortlistedCodes: string[] = [];
    for (const m of updatedMessages) {
      if (Array.isArray(m.catalog)) {
        for (const item of m.catalog) {
          if (item.code && !shortlistedCodes.includes(item.code)) {
            shortlistedCodes.push(item.code);
          }
        }
      }
    }

    // Store lightweight copy in IndexedDB without holding giant raw base64 beyond preview
    await saveThread({
      id: threadMetaRef.current.id,
      title: threadMetaRef.current.title,
      createdAt: threadMetaRef.current.createdAt,
      updatedAt: now,
      messages: updatedMessages,
      geminiHistory: updatedHistory.slice(-14),
      shortlistedCodes,
    });
    refreshThreadsList();
  };

  const handleOpen = (e?: React.MouseEvent) => {
    if ((window as any).__alifSuppressChatClick) {
      e?.preventDefault();
      return;
    }
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleResetChat = () => {
    setMessages([]);
    historyRef.current = [];
    threadMetaRef.current = null;
    setActiveThreadId(null);
    setActiveThreadIdState(null);
    setPendingImage(null);
    setShowQuickDrawer(false);
    setShowPlusMenu(false);
    setShowHistoryDrawer(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleResumeThread = (thr: StoredThread) => {
    threadMetaRef.current = {
      id: thr.id,
      createdAt: thr.createdAt,
      title: thr.title,
    };
    setActiveThreadId(thr.id);
    setActiveThreadIdState(thr.id);
    const refreshedMsgs = hydrateThreadCatalogPrices(thr.messages || [], searchCatalog);
    setMessages(refreshedMsgs);
    historyRef.current = Array.isArray(thr.geminiHistory) ? thr.geminiHistory : [];
    setShowHistoryDrawer(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    await deleteThreadById(threadId);
    if (threadMetaRef.current?.id === threadId) {
      handleResetChat();
    }
    refreshThreadsList();
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    const attached = pendingImage;
    if ((!text && !attached) || isLoading) return;

    setShowQuickDrawer(false);
    setShowPlusMenu(false);
    setPendingImage(null);

    const userMsgId = 'msg-' + Date.now();
    const displayUserText = text || 'Matching outfit/design suggestions for this photo';
    const nextUserMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: displayUserText,
      imagePreview: attached?.previewUrl,
    };

    const nextMessages = [...messages, nextUserMsg];
    setMessages(nextMessages);

    const historyText = text || '[Uploaded outfit/design photo for boutique styling match]';
    const nextHistory: GeminiHistoryItem[] = [
      ...historyRef.current,
      { role: 'user', parts: [{ text: historyText }] },
    ];
    historyRef.current = nextHistory;

    setInput('');
    setIsLoading(true);

    const clientContext = collectClientChatContext();

    try {
      const response = await fetch('/.netlify/functions/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextHistory,
          image: attached ? { mimeType: attached.mimeType, data: attached.data } : null,
          context: clientContext,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { cleanText, matchedItems, booking } = extractTagsFromReply(
          data.reply || '',
          searchCatalog
        );

        const aiMsgId = 'ai-' + Date.now();
        const aiMsg: Message = {
          id: aiMsgId,
          role: 'ai',
          text: cleanText,
          catalog: matchedItems,
          booking,
        };

        const finalMessages = [...nextMessages, aiMsg];
        const finalHistory: GeminiHistoryItem[] = [
          ...nextHistory,
          { role: 'model', parts: [{ text: cleanText }] },
        ];

        setMessages(finalMessages);
        historyRef.current = finalHistory;
        await persistThreadState(finalMessages, finalHistory, text, Boolean(attached));

        // Anonymized PostHog demand telemetry (strictly zero PII / zero raw text stored)
        try {
          if ((window as any).posthog && typeof (window as any).posthog.capture === 'function') {
            (window as any).posthog.capture('alif_ai_query', {
              page_path: clientContext.page?.path || '/',
              page_type: clientContext.page?.type || 'home',
              has_image: Boolean(attached),
              matched_items_count: matchedItems?.length || 0,
              has_booking_card: Boolean(booking),
              in_sahibganj: clientContext.location?.in_sahibganj ?? null,
              cart_items_count: clientContext.cart?.length || 0,
            });
          }
        } catch {
          // Ignore telemetry issues
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'ai',
            text: data.error || 'Server down. Please call us directly at 7250470009.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'ai',
          text: 'Connection issue right now. Please try again in a moment.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageRef = useRef<(rawText: string) => Promise<void>>(sendMessage);
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    const triggerOpen = (msg?: string, autoSend: boolean = false) => {
      setIsOpen(true);
      if (msg && msg.trim()) {
        const text = msg.trim();
        if (autoSend) {
          handleResetChat();
          setTimeout(() => {
            sendMessageRef.current?.(text);
          }, 150);
        } else {
          setInput(text);
          setTimeout(() => inputRef.current?.focus(), 150);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ message?: string; autoSend?: boolean }>;
      triggerOpen(customEvt.detail?.message, customEvt.detail?.autoSend ?? false);
    };

    (window as any).openALiFChat = triggerOpen;
    window.addEventListener('open-alif-chat', handleCustomEvent);

    if (initialOpen && initialMessage) {
      triggerOpen(initialMessage, true);
    }

    return () => {
      window.removeEventListener('open-alif-chat', handleCustomEvent);
      if ((window as any).openALiFChat === triggerOpen) {
        delete (window as any).openALiFChat;
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length >= 1 || pendingImage) {
      sendMessage(input);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setShowPlusMenu(false);
    if (!file) return;

    try {
      const compressed = await compressOutfitImage(file);
      setPendingImage(compressed);
      setTimeout(() => inputRef.current?.focus(), 80);
    } catch (err) {
      console.warn('Image upload error:', err);
    }
  };

  const handleCardAddToBag = (e: React.MouseEvent, item: CatalogItem) => {
    e.preventDefault();
    e.stopPropagation();
    const pricing = resolveDisplayPricing(item);
    const added = addCatalogItemToBag({
      ...item,
      price: pricing.displayPrice || item.price,
    });
    if (added) {
      const key = item.url || item.title;
      setAddedFeedbackMap((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setAddedFeedbackMap((prev) => ({ ...prev, [key]: false }));
      }, 1800);
    }
  };

  const handleBookingWhatsApp = (booking: WhatsAppBooking) => {
    const ctx = collectClientChatContext();
    const lines = [
      `*alif.ai BOOKING REQUEST — ${booking.title}*`,
      booking.items && booking.items.length > 0 ? `*Items / Codes:* ${booking.items.join(', ')}` : '',
      booking.notes ? `*Requirements:* ${booking.notes}` : '',
      ctx.location?.shared && ctx.location.city ? `*Customer City:* ${ctx.location.city}` : '',
      'Please share confirmation and next steps.',
    ].filter(Boolean);
    openWhatsAppWithText(lines.join('\n'));
  };

  const handleShareShortlist = () => {
    const ctx = collectClientChatContext();
    const msg = buildShortlistWhatsAppMessage(messages, ctx.location);
    openWhatsAppWithText(msg);
  };

  const toggleVoiceInput = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (evt: any) => {
        const transcript = evt.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setTimeout(() => inputRef.current?.focus(), 60);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const groupedThreads = useMemo(() => groupThreadsByDate(threads), [threads]);
  const isSendActive = input.trim().length >= 1 || pendingImage !== null;
  const isEmptyWelcome = messages.length === 0 && !isLoading;

  return (
    <>
      {/* Backdrop Blur Overlay */}
      <div
        id="chat-backdrop"
        className={isOpen ? 'is-open' : ''}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Floating Chat Container */}
      <div id="chat-widget">
        {/* Draggable Executive AI Floating Trigger */}
        <button
          id="chat-button"
          onClick={handleOpen}
          title="Chat with alif.ai"
          aria-label="Open Chat"
          style={{ display: isOpen ? 'none' : 'flex' }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 3C6.9 3 3 6.55 3 11.1c0 2.05.84 3.92 2.24 5.34-.18 1.32-.66 2.55-1.24 3.46 1.58-.2 3.16-.73 4.46-1.45 1.12.35 2.31.55 3.54.55 5.1 0 9-3.55 9-7.9C21 6.55 17.1 3 12 3z"
              stroke="currentColor"
              strokeWidth="1.65"
              strokeLinejoin="round"
            />
            <path
              d="M12 7.4l.85 2.75 2.75.85-2.75.85L12 14.6l-.85-2.75-2.75-.85 2.75-.85L12 7.4z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* ChatGPT-Style Minimalist alif. Window */}
        <div
          id="chat-window"
          className={`mono-chat-window alif-gpt-window ${isOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-label="alif. AI Assistant"
        >
          {/* Minimalist ChatGPT Header */}
          <div id="chat-header">
            <div className="gpt-header-left">
              <button
                type="button"
                id="history-toggle-btn"
                className="gpt-icon-btn"
                onClick={() => setShowHistoryDrawer((v) => !v)}
                title="Chat history"
                aria-label="Chat history"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="18" x2="18" y2="18" />
                </svg>
              </button>
              <button
                type="button"
                id="new-chat-btn"
                className="gpt-icon-btn"
                onClick={handleResetChat}
                title="New conversation"
                aria-label="New conversation"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </div>

            <div className="chat-header-title">
              <span className="brand-title">alif.ai</span>
            </div>

            <button
              type="button"
              id="close-chat"
              className="gpt-icon-btn"
              onClick={handleClose}
              aria-label="Close Chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Slide-In Chat History Drawer (IndexedDB Multi-Thread Store) */}
          {showHistoryDrawer && (
            <>
              <div
                className="history-drawer-backdrop"
                onClick={() => setShowHistoryDrawer(false)}
                aria-hidden="true"
              />
              <aside className="alif-history-drawer" aria-label="Saved Conversations">
                <div className="history-drawer-top">
                  <span className="history-drawer-heading">Chat History</span>
                  <button
                    type="button"
                    className="gpt-icon-btn"
                    onClick={() => setShowHistoryDrawer(false)}
                    aria-label="Close History"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="history-drawer-list">
                  {threads.length === 0 ? (
                    <p className="history-empty-note">No saved conversations yet. Start chatting to save threads automatically.</p>
                  ) : (
                    [
                      { label: 'Today', items: groupedThreads.today },
                      { label: 'Yesterday', items: groupedThreads.yesterday },
                      { label: 'Earlier', items: groupedThreads.previous },
                    ].map(
                      (grp) =>
                        grp.items.length > 0 && (
                          <div key={grp.label} className="history-group">
                            <div className="history-group-label">{grp.label}</div>
                            {grp.items.map((thr) => (
                              <div
                                key={thr.id}
                                role="button"
                                tabIndex={0}
                                className={`history-thread-row ${activeThreadId === thr.id ? 'is-active' : ''}`}
                                onClick={() => handleResumeThread(thr)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') handleResumeThread(thr);
                                }}
                              >
                                <span className="history-thread-title">{thr.title}</span>
                                <button
                                  type="button"
                                  className="history-delete-btn"
                                  onClick={(e) => handleDeleteThread(e, thr.id)}
                                  title="Delete conversation"
                                  aria-label="Delete conversation"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                    )
                  )}
                </div>

                {messages.length > 0 && (
                  <div className="history-drawer-footer">
                    <button
                      type="button"
                      className="history-whatsapp-btn"
                      onClick={handleShareShortlist}
                    >
                      Send Shortlist to WhatsApp
                    </button>
                  </div>
                )}
              </aside>
            </>
          )}

          {/* Messages / Empty Welcome Canvas */}
          <div id="chat-messages" className={isEmptyWelcome ? 'is-empty-state' : ''}>
            {isEmptyWelcome ? (
              <div className="gpt-welcome-stage">
                <div className="gpt-welcome-hero">
                  <img
                    src="/favicon.svg"
                    alt="alif"
                    className="gpt-welcome-logo"
                    width={54}
                    height={54}
                  />
                  <h2 className="gpt-welcome-heading">How can alif help today?</h2>
                </div>

                <div className="gpt-prompt-list">
                  {PROMPT_SUGGESTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="gpt-prompt-row"
                      onClick={() => sendMessage(item.msg)}
                    >
                      <span className="gpt-prompt-icon">
                        <PromptIcon type={item.icon} />
                      </span>
                      <span className="gpt-prompt-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <React.Fragment key={msg.id}>
                    {msg.role === 'user' ? (
                      <div className="message user-message">
                        {msg.imagePreview && (
                          <img
                            src={msg.imagePreview}
                            alt="Uploaded outfit"
                            className="chat-user-img"
                          />
                        )}
                        {msg.text && <span>{msg.text}</span>}
                      </div>
                    ) : (
                      <div className="gpt-ai-turn">
                        <img
                          src="/favicon.svg"
                          alt="alif"
                          className="gpt-ai-avatar-img"
                          width={28}
                          height={28}
                        />
                        <div className="gpt-ai-content">
                          <div className="message ai-message">{msg.text}</div>

                          {msg.catalog && msg.catalog.length > 0 && (
                            <div className="chat-catalog-slider">
                              {msg.catalog.map((item, cIdx) => {
                                const pricing = resolveDisplayPricing(item);
                                const itemKey = item.url || item.title;
                                const isAdded = Boolean(addedFeedbackMap[itemKey]);
                                const isProduct = !item.url.startsWith('/services/') && item.url !== '/works/';
                                return (
                                  <div key={cIdx} className="chat-catalog-item">
                                    <a href={item.url} className="chat-catalog-link" target="_self">
                                      <div className="chat-catalog-img">
                                        {pricing.discountPct && (
                                          <span className="chat-discount-pill">-{pricing.discountPct}%</span>
                                        )}
                                        <img
                                          src={item.image || '/icons/icon-512x512.png'}
                                          alt={item.title}
                                          width={105}
                                          height={140}
                                          loading="lazy"
                                          decoding="async"
                                        />
                                      </div>
                                      <div className="chat-catalog-info">
                                        <span className="chat-catalog-title">{item.title}</span>
                                        <div className="chat-catalog-price-row">
                                          <span className="chat-catalog-price">
                                            {pricing.displayPrice ? `₹${pricing.displayPrice}` : 'View Item'}
                                          </span>
                                          {pricing.mrpPrice && (
                                            <del className="chat-catalog-mrp">₹{pricing.mrpPrice}</del>
                                          )}
                                        </div>
                                      </div>
                                    </a>
                                    {isProduct && (
                                      <button
                                        type="button"
                                        className={`chat-card-add-btn ${isAdded ? 'is-added' : ''}`}
                                        onClick={(e) => handleCardAddToBag(e, item)}
                                      >
                                        {isAdded ? 'Added' : '+ Add to Bag'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {msg.booking && (
                            <div className="chat-booking-card">
                              <div className="chat-booking-kicker">
                                {msg.booking.type === 'product' ? 'ORDER SUMMARY' : 'TAILORING BOOKING'}
                              </div>
                              <div className="chat-booking-title">{msg.booking.title}</div>
                              {msg.booking.items && msg.booking.items.length > 0 && (
                                <div className="chat-booking-codes">
                                  {msg.booking.items.join(' • ')}
                                </div>
                              )}
                              {msg.booking.notes && (
                                <div className="chat-booking-notes">{msg.booking.notes}</div>
                              )}
                              <button
                                type="button"
                                className="chat-booking-btn"
                                onClick={() => handleBookingWhatsApp(msg.booking!)}
                              >
                                Confirm on WhatsApp
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {isLoading && (
                  <div className="gpt-ai-turn">
                    <img
                      src="/favicon.svg"
                      alt="alif"
                      className="gpt-ai-avatar-img"
                      width={28}
                      height={28}
                    />
                    <div className="message ai-message typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Optional Quick Prompts Popover */}
          {showQuickDrawer && !isEmptyWelcome && (
            <div className="gpt-quick-drawer">
              {PROMPT_SUGGESTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="chat-chip"
                  onClick={() => sendMessage(item.msg)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Hidden Image File Picker for Photo Match */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageFileChange}
          />

          {/* ChatGPT-Style Floating Rounded Composer */}
          <form id="chat-input-area" onSubmit={handleSubmit}>
            {pendingImage && (
              <div className="gpt-composer-attachment">
                <img src={pendingImage.previewUrl} alt="Selected outfit" />
                <span>Photo attached — ask what matches</span>
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  aria-label="Remove attached photo"
                >
                  Remove
                </button>
              </div>
            )}

            {showPlusMenu && (
              <div className="gpt-plus-menu">
                <button
                  type="button"
                  className="gpt-plus-menu-item"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Upload Outfit / Design Photo</span>
                </button>
                <button
                  type="button"
                  className="gpt-plus-menu-item"
                  onClick={() => {
                    setShowPlusMenu(false);
                    if (isEmptyWelcome) {
                      inputRef.current?.focus();
                    } else {
                      setShowQuickDrawer((v) => !v);
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Quick Boutique Questions</span>
                </button>
              </div>
            )}

            <div className="gpt-composer-pill">
              <input
                type="text"
                id="chat-input"
                ref={inputRef}
                placeholder={isListening ? 'Listening in Hinglish...' : 'Ask alif.ai'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
              />
              <div className="gpt-composer-controls">
                <button
                  type="button"
                  className={`gpt-plus-btn ${showPlusMenu ? 'is-active' : ''}`}
                  onClick={() => setShowPlusMenu((v) => !v)}
                  title="Attach photo or quick questions"
                  aria-label="Attach photo or quick questions"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                <div className="gpt-composer-right">
                  {speechSupported && (
                    <button
                      type="button"
                      className={`gpt-mic-btn ${isListening ? 'is-listening' : ''}`}
                      onClick={toggleVoiceInput}
                      title={isListening ? 'Stop listening' : 'Voice search (Hinglish)'}
                      aria-label="Voice input"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </button>
                  )}

                  <button
                    type="submit"
                    id="chat-send"
                    aria-label="Send Message"
                    disabled={!isSendActive || isLoading}
                    className={isSendActive ? 'is-active' : ''}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="17"
                      height="17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
