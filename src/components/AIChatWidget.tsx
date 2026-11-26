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

const PROMPT_SUGGESTIONS = [
  {
    id: 'loc',
    label: 'Shop location & timings',
    msg: 'Shop location aur timings bataiye',
    icon: 'pin',
  },
  {
    id: 'rates',
    label: 'Stitching & blouse rates',
    msg: 'Stitching rates kya hain?',
    icon: 'scissors',
  },
  {
    id: 'laces',
    label: 'Browse laces & latkans',
    msg: 'Laces aur Latkans dikhao',
    icon: 'layers',
  },
  {
    id: 'wa',
    label: 'WhatsApp booking support',
    msg: 'WhatsApp contact number kya hai?',
    icon: 'message',
  },
];

function PromptIcon({ type }: { type: string }) {
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
  if (type === 'layers') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
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

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-active');
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.classList.remove('chat-active');
      setShowQuickDrawer(false);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleResetChat = () => {
    setMessages([]);
    historyRef.current = [];
    setShowQuickDrawer(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) return;

    setShowQuickDrawer(false);
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
            catalog:
              matchedCatalogItems && matchedCatalogItems.length > 0
                ? matchedCatalogItems
                : undefined,
          },
        ]);

        historyRef.current.push({ role: 'model', parts: [{ text: replyText }] });
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
    if (input.trim().length >= 1) {
      sendMessage(input);
    }
  };

  const isSendActive = input.trim().length >= 1;
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
                      <div className="message user-message">{msg.text}</div>
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
                                      {item.price
                                        ? `₹${item.price.replace(/^₹/, '')}`
                                        : 'View Item'}
                                    </span>
                                  </div>
                                </a>
                              ))}
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

          {/* Optional Quick Prompts Popover triggered by + button */}
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

          {/* ChatGPT-Style Floating Rounded Composer */}
          <form id="chat-input-area" onSubmit={handleSubmit}>
            <div className="gpt-composer-pill">
              <input
                type="text"
                id="chat-input"
                ref={inputRef}
                placeholder="Ask alif.ai"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
              />
              <div className="gpt-composer-controls">
                <button
                  type="button"
                  className={`gpt-plus-btn ${showQuickDrawer ? 'is-active' : ''}`}
                  onClick={() => {
                    if (isEmptyWelcome) {
                      inputRef.current?.focus();
                    } else {
                      setShowQuickDrawer((v) => !v);
                    }
                  }}
                  title="Quick questions"
                  aria-label="Quick questions"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

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
          </form>
        </div>
      </div>
    </>
  );
}
