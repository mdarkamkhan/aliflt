import { getCollection } from 'astro:content';

export async function GET() {
  const products = await getCollection('products');
  const services = await getCollection('services');
  const works = await getCollection('works');
  const designs = await getCollection('designs');

  const items = [
    ...services.map((s) => ({
      title: s.data.title,
      category: s.data.category || 'Tailoring Service',
      image: s.data.image || '/icons/icon-512x512.png',
      price: s.data.price ? `${s.data.price}` : '',
      url: `/services/${s.id}/`,
      description: s.data.description || '',
    })),
    ...products.map((p) => ({
      title: p.data.title,
      category: p.data.category || 'Lace & Latkan',
      image: p.data.image || '/icons/icon-512x512.png',
      price: (p.data.offer_price ?? p.data.price) ? `${p.data.offer_price ?? p.data.price}` : '',
      url: `/products/${p.id}/`,
      description: p.data.description || '',
      ideal_for: p.data.ideal_for || '',
      colour: p.data.colour || '',
      fabric: p.data.fabric || '',
      work: p.data.work || '',
      pattern: p.data.pattern || '',
    })),
    ...works.map((w) => ({
      title: w.data.title || 'Our Work',
      category: w.data.category || 'Work Portfolio',
      image: w.data.image || '/icons/icon-512x512.png',
      price: w.data.price ? `${w.data.price}` : '',
      url: `/works/`,
      description: w.data.description || '',
    })),
  ];

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
}
