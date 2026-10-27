import fs from 'node:fs';
import path from 'node:path';

const FALLBACK_ICON = '/icons/icon-512x512.png';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const thumbExistsCache = new Map<string, boolean>();

function hasGeneratedThumb(cleanSrc: string): boolean {
  if (!cleanSrc.startsWith('/uploads/') && !cleanSrc.startsWith('/banner/')) {
    return false;
  }
  const cached = thumbExistsCache.get(cleanSrc);
  if (cached !== undefined) return cached;

  const thumbRel = `/thumbs${cleanSrc}`;
  const fullDiskPath = path.join(PUBLIC_DIR, thumbRel);
  const exists = fs.existsSync(fullDiskPath);
  thumbExistsCache.set(cleanSrc, exists);
  return exists;
}

/**
 * Returns the lightweight 400w WebP thumbnail path if available on disk,
 * otherwise safely falls back to the original image path.
 */
export function getThumbUrl(src?: string | null): string {
  const cleanSrc = (src || '').trim() || FALLBACK_ICON;
  if (hasGeneratedThumb(cleanSrc)) {
    return `/thumbs${cleanSrc}`;
  }
  return cleanSrc;
}

/**
 * Responsive image attributes for product cards, category cards, and carousels.
 * Uses 400w thumbnail as default src and provides 400w + 900w srcset.
 */
export function getCardImageAttrs(
  src?: string | null,
  sizes = '(max-width: 600px) 46vw, (max-width: 1024px) 30vw, 220px'
) {
  const cleanSrc = (src || '').trim() || FALLBACK_ICON;
  if (hasGeneratedThumb(cleanSrc)) {
    const thumb = `/thumbs${cleanSrc}`;
    return {
      src: thumb,
      srcset: `${thumb} 400w, ${cleanSrc} 900w`,
      sizes,
    };
  }
  return {
    src: cleanSrc,
    srcset: undefined,
    sizes: undefined,
  };
}

/**
 * Responsive image attributes for main Product/Service detail hero images.
 * Preserves full-resolution original as default src while offering 400w + 900w srcset.
 */
export function getDetailImageAttrs(
  src?: string | null,
  sizes = '(max-width: 600px) 92vw, 480px'
) {
  const cleanSrc = (src || '').trim() || FALLBACK_ICON;
  if (hasGeneratedThumb(cleanSrc)) {
    const thumb = `/thumbs${cleanSrc}`;
    return {
      src: cleanSrc,
      srcset: `${thumb} 400w, ${cleanSrc} 900w`,
      sizes,
    };
  }
  return {
    src: cleanSrc,
    srcset: undefined,
    sizes: undefined,
  };
}

/**
 * Responsive image attributes for homepage editorial banners (640w mobile, 1080w desktop).
 */
export function getBannerImageAttrs(src: string) {
  const cleanSrc = (src || '').trim();
  if (hasGeneratedThumb(cleanSrc)) {
    const thumb = `/thumbs${cleanSrc}`;
    return {
      src: cleanSrc,
      thumbSrc: thumb,
      srcset: `${thumb} 640w, ${cleanSrc} 1080w`,
      sizes: '(max-width: 600px) 100vw, 580px',
    };
  }
  return {
    src: cleanSrc,
    thumbSrc: cleanSrc,
    srcset: cleanSrc,
    sizes: '(max-width: 600px) 100vw, 580px',
  };
}

/**
 * Optimizes Cloudinary video poster URLs for small blurred grid cells.
 */
export function getCloudinaryPosterThumb(url?: string | null, width = 180): string {
  const cleanUrl = (url || '').trim() || FALLBACK_ICON;
  if (cleanUrl.includes('res.cloudinary.com') && cleanUrl.includes('/upload/')) {
    return cleanUrl.replace(/w_\d+/, `w_${width}`);
  }
  return getThumbUrl(cleanUrl);
}
