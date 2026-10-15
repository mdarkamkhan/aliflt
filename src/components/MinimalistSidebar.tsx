import React, { useEffect } from 'react';

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface SocialLinkItem {
  label: string;
  url: string;
}

export interface MinimalistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  brandTitle?: string;
  brandSub?: string;
  brandLogoUrl?: string;
  navLinks?: NavLinkItem[];
  socials?: SocialLinkItem[];
}

export const MinimalistSidebar: React.FC<MinimalistSidebarProps> = ({
  isOpen = false,
  onClose = () => {},
  brandTitle = "ALiF",
  brandSub = "ATELIER & STORE",
  brandLogoUrl = "",
  navLinks = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products/" },
    { label: "Services", href: "/services/" },
    { label: "Our Works", href: "/works/" },
    { label: "Designs", href: "/designs/" },
    { label: "Contact", href: "/contact-us/" }
  ],
  socials = [
    { label: "Instagram", url: "https://instagram.com/alif_lstr" },
    { label: "WhatsApp", url: "https://wa.me/7250470009" },
    { label: "Reviews", url: "https://g.page/r/Cf2GRfVJZtFFEAE/review" }
  ]
}) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('sidebar-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open');
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <style>{`
        .arabica-clone-drawer {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background-color: #ffffff;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.35s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.35s ease;
        }

        .arabica-clone-drawer.is-open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        /* Signature Arabica Dotted Box Close Button */
        .drawer-close-btn {
          position: absolute;
          top: 26px;
          right: 26px;
          width: 34px;
          height: 34px;
          border: 1px dotted rgba(0, 0, 0, 0.5);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #000000;
          padding: 0;
          transition: all 0.25s ease;
          z-index: 10;
        }

        .drawer-close-btn:hover {
          border-color: #000000;
          border-style: solid;
          transform: scale(1.08);
        }

        /* Centered Inner Wrapper */
        .drawer-inner {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          box-sizing: border-box;
          text-align: center;
        }

        /* Brand Logo Area */
        .drawer-logo {
          margin-bottom: 38px;
        }

        .drawer-brand-title {
          font-family: var(--font-heading, 'Playfair Display', serif);
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #000000;
          margin: 0 0 6px 0;
          line-height: 1;
        }

        .drawer-brand-sub {
          font-family: var(--font-body, 'Poppins', sans-serif);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #888888;
          display: block;
        }

        .drawer-logo img {
          max-width: 220px;
          width: 70vw;
          height: auto;
          display: block;
          margin: 0 auto;
        }

        /* Navigation Links */
        .drawer-nav {
          width: 100%;
        }

        .drawer-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 22px;
          align-items: center;
        }

        .drawer-nav a {
          font-family: var(--font-body, 'Poppins', sans-serif);
          font-size: 19px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #000000;
          text-decoration: none;
          display: inline-block;
          line-height: 1.2;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .drawer-nav a:hover {
          opacity: 0.55;
          transform: translateY(-2px);
        }

        /* Social / Footer Links */
        .drawer-socials {
          margin-top: 44px;
          display: flex;
          gap: 24px;
          align-items: center;
          justify-content: center;
        }

        .drawer-socials a {
          font-family: var(--font-body, 'Poppins', sans-serif);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #888888;
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .drawer-socials a:hover {
          color: #000000;
          transform: translateY(-2px);
        }
      `}</style>

      <div
        className={`arabica-clone-drawer ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          className="drawer-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        {/* Content Wrapper */}
        <div className="drawer-inner">
          {/* Logo */}
          <div className="drawer-logo">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={brandTitle} />
            ) : (
              <>
                <h2 className="drawer-brand-title">{brandTitle}</h2>
                {brandSub && <span className="drawer-brand-sub">{brandSub}</span>}
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="drawer-nav">
            <ul>
              {navLinks.map((item, index) => (
                <li key={index}>
                  <a href={item.href} onClick={onClose}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Socials */}
          {socials && socials.length > 0 && (
            <div className="drawer-socials">
              {socials.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MinimalistSidebar;
