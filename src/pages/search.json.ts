import { getCollection } from 'astro:content';
import { getThumbUrl } from '../utils/imagePerf';

export async function GET() {
  const products = await getCollection('products');
  const services = await getCollection('services');
  const works = await getCollection('works');

  const items = [
    ...services.map((s) => ({
      title: s.data.title,
      category: s.data.category || 'Tailoring Service',
      image: getThumbUrl(s.data.image),
      price: s.data.price ? `${s.data.price}` : '',
      url: `/services/${s.id}/`,
    })),
    ...products.map((p) => ({
      title: p.data.title,
      category: p.data.category || 'Lace & Latkan',
      image: getThumbUrl(p.data.image),
      price: (p.data.offer_price ?? p.data.price) ? `${p.data.offer_price ?? p.data.price}` : '',
      url: `/products/${p.id}/`,
      ideal_for: p.data.ideal_for || '',
      colour: p.data.colour || '',
      fabric: p.data.fabric || '',
      work: p.data.work || '',
      pattern: p.data.pattern || '',
      code: p.data.product_code || '',
    })),
    ...works.map((w) => ({
      title: w.data.title || 'Our Work',
      category: w.data.category || 'Work Portfolio',
      image: getThumbUrl(w.data.image),
      price: w.data.price ? `${w.data.price}` : '',
      url: `/works/`,
    })),
  ];

  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
