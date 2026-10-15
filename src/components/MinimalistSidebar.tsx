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
        /* Doodle Social Section in Drawer */
        .drawer-doodle-social-wrapper {
          margin-top: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .drawer-social-heading {
          font-family: var(--font-body, 'Poppins', sans-serif);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #888888;
          margin-bottom: 14px;
          display: block;
        }

        .drawer-doodle-container {
          margin: 0 auto;
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

          {/* Doodle Notebook Social Icons (Same as Footer) */}
          <div className="drawer-doodle-social-wrapper">
            <span className="drawer-social-heading">CONNECT WITH US</span>
            <ul className="doodle-container drawer-doodle-container">
              {/* Instagram */}
              <li className="doodle-icon-content">
                <button type="button" aria-label="Instagram (@alif_lstr)" className="doodle-link link-instagram">
                  <svg className="doodle-svg" version="1.1" viewBox="0 0 100 100">
                    <path className="doodle-path" d="M60 45a15 15 0 1 0 -4.395 10.61A14.4 14.4 0 0 0 60 45.225l-0.004 -0.237zm8.1 0a23.006 23.006 0 1 1 -6.738 -16.347 22.2 22.2 0 0 1 6.742 15.96l-0.004 0.41v-0.02zm6.327 -24.022v0.008a5.4 5.4 0 1 1 -1.582 -3.818 5.177 5.177 0 0 1 1.556 3.705v0.11zm-29.4 -12.9 -4.482 -0.03q-4.072 -0.03 -6.184 0t-5.655 0.176a47.143 47.143 0 0 0 -6.312 0.638l0.273 -0.038a23.571 23.571 0 0 0 -4.362 1.136l0.16 -0.052a15.446 15.446 0 0 0 -8.52 8.452l-0.038 0.102a22.543 22.543 0 0 0 -1.065 4.062l-0.02 0.138a45 45 0 0 0 -0.597 5.96l-0.004 0.08q-0.147 3.548 -0.176 5.655t0 6.184 0.03 4.482 -0.03 4.482 0 6.184 0.176 5.655c0.075 2.193 0.292 4.275 0.638 6.312l-0.038 -0.273a23.571 23.571 0 0 0 1.136 4.362l-0.052 -0.16a15.446 15.446 0 0 0 8.452 8.52l0.102 0.038c1.192 0.446 2.606 0.82 4.062 1.065l0.138 0.02c1.758 0.308 3.84 0.525 5.955 0.597l0.08 0.004q3.548 0.147 5.655 0.176t6.184 0l4.455 -0.09 4.482 0.03q4.072 0.03 6.184 0t5.655 -0.176a47.143 47.143 0 0 0 6.312 -0.638l-0.273 0.038a23.571 23.571 0 0 0 4.362 -1.136l-0.16 0.052a15.446 15.446 0 0 0 8.52 -8.452l0.038 -0.102c0.446 -1.192 0.82 -2.606 1.065 -4.062l0.02 -0.138c0.308 -1.758 0.525 -3.84 0.597 -5.955l0.004 -0.08q0.147 -3.548 0.176 -5.655t0 -6.184 -0.03 -4.482 0.03 -4.482 0 -6.184 -0.176 -5.655a47.143 47.143 0 0 0 -0.638 -6.312l0.038 0.273a23.743 23.743 0 0 0 -1.136 -4.362l0.052 0.16a15.446 15.446 0 0 0 -8.452 -8.52l-0.102 -0.038a22.543 22.543 0 0 0 -4.062 -1.065l-0.138 -0.02a45 45 0 0 0 -5.955 -0.597l-0.08 -0.004q-3.548 -0.147 -5.655 -0.176t-6.184 0zM90 45q0 13.418 -0.3 18.574a24.9 24.9 0 0 1 -26.194 26.13l0.06 0.004q-5.157 0.3 -18.574 0.3t-18.574 -0.3A24.9 24.9 0 0 1 0.286 63.514l-0.004 0.06q-0.3 -5.157 -0.3 -18.574t0.3 -18.574A24.9 24.9 0 0 1 26.478 0.297l-0.058 -0.005q5.157 -0.3 18.574 -0.3t18.574 0.3a24.9 24.9 0 0 1 26.13 26.194l0.004 -0.06Q90 31.578 90 45" />
                  </svg>
                </button>
                <a href="https://instagram.com/alif_lstr" target="_blank" rel="noopener noreferrer" className="doodle-tooltip tooltip-instagram" title="Open @alif_lstr on Instagram">
                  @alif_lstr <span className="doodle-tooltip-arrow">↗</span>
                </a>
              </li>

              {/* Facebook */}
              <li className="doodle-icon-content">
                <button type="button" aria-label="Facebook (@alifladiestailor)" className="doodle-link link-facebook">
                  <svg className="doodle-svg doodle-svg-fb" viewBox="0 0 24 24" width="22" height="22" fill="#ffffff">
                    <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.5-.14-2.75-.14-2.76 0-4.75 1.68-4.75 4.75v2.75H7v4h3v10h4v-10z" />
                  </svg>
                </button>
                <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="doodle-tooltip tooltip-facebook" title="Open @alifladiestailor on Facebook">
                  @alifladiestailor <span className="doodle-tooltip-arrow">↗</span>
                </a>
              </li>

              {/* WhatsApp */}
              <li className="doodle-icon-content">
                <button type="button" aria-label="WhatsApp (+91 72504 70009)" className="doodle-link link-whatsapp">
                  <svg className="doodle-svg" viewBox="0 0 24 24" fill="none" stroke="#1e1e24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </button>
                <a href="https://wa.me/7250470009" target="_blank" rel="noopener noreferrer" className="doodle-tooltip tooltip-whatsapp" title="Chat on WhatsApp (+91 72504 70009)">
                  +91 72504 70009 <span className="doodle-tooltip-arrow">↗</span>
                </a>
              </li>

              {/* Email */}
              <li className="doodle-icon-content">
                <button type="button" aria-label="Email (alifladiestailor@gmail.com)" className="doodle-link link-mail">
                  <svg className="doodle-svg" version="1.1" viewBox="0 0 100 100">
                    <path className="doodle-path" d="M20 80A12 12 0 0 1 8 68v-40A12 12 0 0 1 20 16h56A12 12 0 0 1 88 28v40A12 12 0 0 1 76 80zm10.5 -47.12a4 4 0 1 0 -5.001 6.24l15.001 12.004a12 12 0 0 0 15.001 0l15.001 -12a4 4 0 1 0 -5.001 -6.247l-15.001 12a4 4 0 0 1 -5.001 0z" />
                  </svg>
                </button>
                <a href="mailto:alifladiestailor@gmail.com" target="_blank" rel="noopener noreferrer" className="doodle-tooltip tooltip-mail" title="Send Email to alifladiestailor@gmail.com">
                  alifladiestailor@gmail.com <span className="doodle-tooltip-arrow">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default MinimalistSidebar;
