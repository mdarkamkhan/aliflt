import fs from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';
import { getThumbUrl } from './imagePerf';

export interface CatalogPricing {
  price: number | null;
  offer_price: number | null;
  final_price: number | null;
  discount_percent: number | null;
  offer_end_date: string | null;
}

export function toNumericPrice(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(String(val).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function normalizeCatalogPrice(
  rawPrice: unknown,
  rawOfferPrice: unknown,
  offerEndDate?: string | null
): CatalogPricing {
  const price = toNumericPrice(rawPrice);
  const parsedOffer = toNumericPrice(rawOfferPrice);
  const validOffer =
    parsedOffer !== null && (price === null || parsedOffer < price)
      ? parsedOffer
      : null;

  const discount_percent =
    price !== null && validOffer !== null && price > 0
      ? Math.round(((price - validOffer) * 100) / price)
      : null;

  return {
    price,
    offer_price: validOffer,
    final_price: validOffer ?? price,
    discount_percent,
    offer_end_date: offerEndDate || null,
  };
}

function summarizeServiceInfo(infoText?: string): string {
  if (!infoText) return '';
  return infoText
    .split('\n')
    .map((line) => line.replace(/[✔✓•*#]/g, '').trim())
    .filter(Boolean)
    .slice(0, 12)
    .join(' | ');
}

function buildComboSummary(
  comboProducts: unknown,
  comboItems: unknown,
  productTitleMap: Map<string, string>
): string {
  if (Array.isArray(comboProducts) && comboProducts.length > 0) {
    return comboProducts
      .map((entry: any) => {
        const pid = typeof entry === 'string' ? entry : entry?.id || entry?.slug || '';
        const title = productTitleMap.get(pid) || pid;
        const meters = entry?.meters ? `${entry.meters}${entry.unit ? ` ${entry.unit}` : 'm'}` : '';
        return meters ? `${title} (${meters})` : title;
      })
      .filter(Boolean)
      .join(' + ');
  }
  if (Array.isArray(comboItems) && comboItems.length > 0) {
    return comboItems
      .map((ci: any) => ci?.name || '')
      .filter(Boolean)
      .join(' + ');
  }
  return '';
}

export async function buildSearchItems() {
  const [products, services, works] = await Promise.all([
    getCollection('products'),
    getCollection('services'),
    getCollection('works'),
  ]);

  return [
    ...services.map((s) => {
      const p = normalizeCatalogPrice(s.data.price, null, null);
      return {
        id: s.id,
        type: 'service',
        title: s.data.title,
        category: s.data.category || 'Tailoring Service',
        image: getThumbUrl(s.data.image),
        price: p.final_price !== null ? `${p.final_price}` : '',
        orig_price: p.price !== null ? `${p.price}` : '',
        offer_price: '',
        offer_end_date: '',
        discount_percent: null,
        url: `/services/${s.id}/`,
      };
    }),
    ...products.map((p) => {
      const pricing = normalizeCatalogPrice(
        p.data.price,
        p.data.offer_price,
        p.data.offer_end_date
      );
      return {
        id: p.id,
        type: 'product',
        title: p.data.title,
        category: p.data.category || 'Lace & Latkan',
        image: getThumbUrl(p.data.image),
        price: pricing.final_price !== null ? `${pricing.final_price}` : '',
        orig_price: pricing.price !== null ? `${pricing.price}` : '',
        offer_price: pricing.offer_price !== null ? `${pricing.offer_price}` : '',
        offer_end_date: pricing.offer_end_date || '',
        discount_percent: pricing.discount_percent,
        url: `/products/${p.id}/`,
        ideal_for: p.data.ideal_for || '',
        colour: p.data.colour || '',
        fabric: p.data.fabric || '',
        work: p.data.work || '',
        pattern: p.data.pattern || '',
        code: p.data.product_code || '',
      };
    }),
    ...works.map((w) => {
      const p = normalizeCatalogPrice(w.data.price, null, null);
      return {
        id: w.id,
        type: 'work',
        title: w.data.title || 'Our Work',
        category: w.data.category || 'Work Portfolio',
        image: getThumbUrl(w.data.image),
        price: p.final_price !== null ? `${p.final_price}` : '',
        orig_price: p.price !== null ? `${p.price}` : '',
        offer_price: '',
        offer_end_date: '',
        discount_percent: null,
        url: '/works/',
      };
    }),
  ];
}

export async function buildAiContextPayload() {
  const [products, services, offers, designs] = await Promise.all([
    getCollection('products'),
    getCollection('services'),
    getCollection('offers'),
    getCollection('designs'),
  ]);

  const productTitleMap = new Map<string, string>();
  for (const p of products) {
    productTitleMap.set(p.id, p.data.title);
  }

  let alifInfo = '';
  try {
    alifInfo = fs.readFileSync(path.join(process.cwd(), 'src/data/ALIF-info'), 'utf8').trim();
  } catch {
    alifInfo = '';
  }

  const productRecords = products.map((p) => {
    const pricing = normalizeCatalogPrice(
      p.data.price,
      p.data.offer_price,
      p.data.offer_end_date
    );
    const comboSummary = buildComboSummary(
      (p.data as any).combo_products,
      (p.data as any).combo_items,
      productTitleMap
    );

    return {
      slug: p.id,
      code: p.data.product_code || `ALIF-${p.id.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`,
      title: p.data.title,
      category: p.data.category || 'Lace & Latkan',
      price: pricing.price,
      offer_price: pricing.offer_price,
      final_price: pricing.final_price,
      discount_pct: pricing.discount_percent,
      offer_end_date: pricing.offer_end_date,
      colour: p.data.colour || '',
      fabric: p.data.fabric || '',
      work: p.data.work || '',
      pattern: p.data.pattern || '',
      ideal_for: p.data.ideal_for || '',
      size: p.data.size || '',
      delivery: p.data.delivery_charges || '',
      combo_summary: comboSummary,
      url: `/products/${p.id}/`,
      image: getThumbUrl(p.data.image),
    };
  });

  const serviceRecords = services.map((s) => {
    const pricing = normalizeCatalogPrice(s.data.price, null, null);
    return {
      slug: s.id,
      title: s.data.title,
      category: s.data.category || 'Tailoring Service',
      starting_price: pricing.price,
      description: s.data.description || '',
      details: summarizeServiceInfo(s.data.service_information),
      url: `/services/${s.id}/`,
      image: getThumbUrl(s.data.image),
    };
  });

  const offerRecords = offers.map((o) => ({
    slug: o.id,
    title: o.data.title || 'Boutique Offer',
    date: o.data.date ? String(o.data.date) : '',
    image: getThumbUrl(o.data.image),
  }));

  const designCategories: Record<string, number> = {};
  for (const d of designs) {
    const cat = d.data.category || 'Boutique Design';
    designCategories[cat] = (designCategories[cat] || 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      products: productRecords.length,
      services: serviceRecords.length,
      offers: offerRecords.length,
      designs: designs.length,
    },
    products: productRecords,
    services: serviceRecords,
    offers: offerRecords,
    designSummary: {
      total: designs.length,
      categories: designCategories,
      url: '/designs/',
    },
    knowledge: alifInfo,
  };
}
