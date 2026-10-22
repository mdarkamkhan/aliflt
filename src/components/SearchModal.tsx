import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';

interface SearchItem {
  title: string;
  category: string;
  image: string;
  price: string;
  url: string;
  description?: string;
  ideal_for?: string;
  colour?: string;
  fabric?: string;
  work?: string;
  pattern?: string;
  code?: string;
}

const TYPEWRITER_WORDS = [
  'Lace...',
  'Latkan...',
  'Velvet...',
  'Blouse...',
  'Net...',
  'Diamond Work...',
];

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [placeholder, setPlaceholder] = useState('Search...');
  const [catalog, setCatalog] = useState<SearchItem[]>([]);
  const fuseRef = useRef<Fuse<SearchItem> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFetchingRef = useRef(false);
  const loadSearchIndex = () => {
    if (fuseRef.current || isFetchingRef.current) return;
    isFetchingRef.current = true;
    fetch('/search.json')
      .then((res) => res.json())
      .then((data: SearchItem[]) => {
        setCatalog(data);
        fuseRef.current = new Fuse(data, {
          keys: [
            { name: 'code', weight: 0.5 },
            { name: 'title', weight: 0.3 },
            { name: 'category', weight: 0.15 },
            { name: 'colour', weight: 0.15 },
            { name: 'fabric', weight: 0.1 },
            { name: 'ideal_for', weight: 0.05 },
            { name: 'work', weight: 0.05 },
          ],
          threshold: 0.4,
          ignoreLocation: true,
        });
      })
      .catch((err) => {
        isFetchingRef.current = false;
        console.warn('Could not load search index:', err);
      });
  };

  // Load search index when opened
  useEffect(() => {
    if (isOpen) {
      loadSearchIndex();
    }
  }, [isOpen]);

  // Connect to navbar search button #open-search
  useEffect(() => {
    const handleOpenBtn = () => {
      loadSearchIndex();
      setIsOpen(true);
    };

    const handleMouseEnter = () => {
      loadSearchIndex();
    };

    const openBtn = document.getElementById('open-search');
    if (openBtn) {
      openBtn.addEventListener('click', handleOpenBtn);
      openBtn.addEventListener('mouseenter', handleMouseEnter, { once: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (openBtn) openBtn.removeEventListener('click', handleOpenBtn);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Typewriter placeholder effect (only runs when modal is open to prevent idle background re-renders)
  useEffect(() => {
    if (!isOpen) return;

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      const currentWord = TYPEWRITER_WORDS[wordIndex];

      if (isDeleting) {
        setPlaceholder(currentWord.substring(0, charIndex - 1));
        charIndex--;
        if (charIndex <= 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % TYPEWRITER_WORDS.length;
          timeoutId = setTimeout(tick, 300);
          return;
        }
      } else {
        setPlaceholder(currentWord.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex === currentWord.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, 2000);
          return;
        }
      }

      timeoutId = setTimeout(tick, isDeleting ? 50 : 100);
    };

    timeoutId = setTimeout(tick, 300);
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  // Search execution
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim().length < 2) {
      setResults([]);
      return;
    }

    if (fuseRef.current) {
      const searchResults = fuseRef.current.search(val);
      setResults(searchResults.map((r) => r.item));
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div id="search-overlay" className={isOpen ? 'active' : ''}>
      <div className="search-header">
        <input
          type="text"
          id="search-input"
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={handleInput}
          autoComplete="off"
        />
        <button
          id="close-search"
          onClick={handleClose}
          aria-label="Close search"
        >
          &times;
        </button>
      </div>

      <div id="search-results">
        {results.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            className="search-item"
            onClick={handleClose}
          >
            <img
              src={item.image || '/icons/icon-512x512.png'}
              alt={item.title}
              loading="lazy"
            />
            <div>
              <h4>{item.title}</h4>
              <span>{item.code ? `${item.code} · ${item.category}` : item.category}</span>
            </div>
            <span className="s-arrow">&rarr;</span>
          </a>
        ))}

        {query.trim().length >= 2 && results.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
            No results found.
          </p>
        )}

        {query.trim().length < 2 && (
          <div className="search-hint" style={{ marginTop: '30px' }}>
            Type at least 2 characters to search boutique laces, fabrics & tailoring services.
          </div>
        )}
      </div>
    </div>
  );
}
