import React, { useState, useEffect, useRef } from 'react';

interface CatalogItem {
  title: string;
  category: string;
  image: string;
  price: string;
  url: string;
  description?: string;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  catalog?: CatalogItem[];
}

interface GeminiPart {
  text: string;
}

interface GeminiHistoryItem {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

const QUICK_CHIPS = [
  { label: 'Location & Timings', msg: 'Shop location aur timings bataiye' },
  { label: 'Stitching Rates', msg: 'Stitching rates kya hain?' },
  { label: 'Laces & Latkans', msg: 'Laces aur Latkans dikhao' },
  { label: 'WhatsApp Support', msg: 'WhatsApp contact number kya hai?' },
];

export default function AIChatWidget({ initialOpen = false, initialMessage = '' }: { initialOpen?: boolean; initialMessage?: string }) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'ai',
      text: 'Hello! Welcome to alif. ladies tailor & Boutique. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchCatalog, setSearchCatalog] = useState<CatalogItem[]>([]);
  const historyRef = useRef<GeminiHistoryItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFetchingCatalogRef = useRef(false);

  const loadCatalog = () => {
    if (searchCatalog.length > 0 || isFetchingCatalogRef.current) return;
    isFetchingCatalogRef.current = true;
    fetch('/search.json')
      .then((res) => res.json())
      .then((data: CatalogItem[]) => setSearchCatalog(data))
      .catch((err) => {
        isFetchingCatalogRef.current = false;
        console.warn('Could not load catalog index:', err);
      });
  };

  // Pre-fetch search index only when chat widget is opened
  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen]);

  // Handle body scroll locking and backdrop blur
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-active');
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.classList.remove('chat-active');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('chat-active');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto-scroll messages container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) return;

    // 1. Add User Message
    const userMsgId = 'msg-' + Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text }]);
    historyRef.current.push({ role: 'user', parts: [{ text }] });

    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/.netlify/functions/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyRef.current,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        let replyText = data.reply || '';
        let matchedCatalogItems: CatalogItem[] | undefined = undefined;

        // Parse [SHOW_CATALOG: category]
        const catalogMatch = replyText.match(/\[SHOW_CATALOG:?\s*(\w*)\]/i);
        if (catalogMatch) {
          const categoryTag = (catalogMatch[1] || 'all').toLowerCase();
          replyText = replyText.replace(/\[SHOW_CATALOG:?\s*\w*\]/gi, '').trim();

          if (searchCatalog.length > 0) {
            matchedCatalogItems = searchCatalog
              .filter((item) => {
                if (categoryTag === 'all') return true;
                const c = (item.category || '').toLowerCase();
                const t = (item.title || '').toLowerCase();
                return c.includes(categoryTag) || t.includes(categoryTag);
              })
              .slice(0, 4);
          }
        }

        const aiMsgId = 'ai-' + Date.now();
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'ai',
            text: replyText,
            catalog: matchedCatalogItems && matchedCatalogItems.length > 0 ? matchedCatalogItems : undefined,
          },
        ]);

        historyRef.current.push({ role: 'model', parts: [{ text: replyText }] });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'ai',
            text: data.error || 'Server down. Please call us directly.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'ai',
          text: 'Oops! My AI brain is offline right now.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageRef = useRef<(rawText: string) => Promise<void>>(sendMessage);
  sendMessageRef.current = sendMessage;

  // External trigger listener (for contact page, navigation, or anywhere across the site)
  useEffect(() => {
    const triggerOpen = (msg?: string, autoSend: boolean = false) => {
      setIsOpen(true);
      if (msg && msg.trim()) {
        const text = msg.trim();
        if (autoSend) {
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
    if (input.trim().length >= 4) {
      sendMessage(input);
    }
  };

  const isSendActive = input.trim().length >= 4;

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
        {/* Floating Round Trigger Button */}
        <button
          id="chat-button"
          onClick={handleOpen}
          title="Chat with alif. AI"
          aria-label="Open Chat"
          style={{ display: isOpen ? 'none' : 'flex' }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        {/* Minimalist Sharp Window */}
        <div
          id="chat-window"
          className={`mono-chat-window ${isOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-label="alif. AI Assistant"
        >
          {/* Header */}
          <div id="chat-header">
            <div className="chat-header-title">
              <span className="brand-title">alif.</span>
              <span className="brand-sub">ASSISTANT</span>
            </div>
            <button
              id="close-chat"
              onClick={handleClose}
              aria-label="Close Chat"
            >
              &times;
            </button>
          </div>

          {/* Messages Container */}
          <div id="chat-messages">
            {messages.map((msg, idx) => (
              <React.Fragment key={msg.id}>
                <div
                  className={`message ${msg.role === 'ai' ? 'ai-message' : 'user-message'}`}
                >
                  {msg.text}
                </div>

                {/* Show Quick Chips below initial AI welcome message */}
                {idx === 0 && (
                  <div className="chat-chips-container">
                    {QUICK_CHIPS.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        className="chat-chip"
                        onClick={() => sendMessage(chip.msg)}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* In-Chat Catalog Carousel */}
                {msg.catalog && msg.catalog.length > 0 && (
                  <div className="chat-catalog-slider">
                    {msg.catalog.map((item, cIdx) => (
                      <a
                        key={cIdx}
                        href={item.url}
                        className="chat-catalog-item"
                        target="_self"
                      >
                        <div className="chat-catalog-img">
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
                          <span className="chat-catalog-price">
                            {item.price ? `₹${item.price.replace(/^₹/, '')}` : 'View Item'}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* AI Typing Indicator */}
            {isLoading && (
              <div className="message ai-message typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form id="chat-input-area" onSubmit={handleSubmit}>
            <input
              type="text"
              id="chat-input"
              ref={inputRef}
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              id="chat-send"
              aria-label="Send Message"
              disabled={!isSendActive || isLoading}
              className={isSendActive ? 'is-active' : ''}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
