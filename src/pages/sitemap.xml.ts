import { getCollection } from 'astro:content';

export async function GET() {
  const siteUrl = 'https://aliflt.netlify.app';
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/services/', priority: '0.9', changefreq: 'weekly' },
    { url: '/products/', priority: '0.9', changefreq: 'daily' },
    { url: '/works/', priority: '0.8', changefreq: 'weekly' },
    { url: '/services-work/', priority: '0.8', changefreq: 'weekly' },
    { url: '/designs/', priority: '0.8', changefreq: 'weekly' },
    { url: '/contact-us/', priority: '0.7', changefreq: 'monthly' },
    { url: '/cart/', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy-policy/', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms-of-service/', priority: '0.3', changefreq: 'yearly' },
    { url: '/return-policy/', priority: '0.3', changefreq: 'yearly' },
  ];

  const services = await getCollection('services');
  const products = await getCollection('products');

  const serviceRoutes = services.map((s) => ({
    url: `/services/${s.id}/`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const productRoutes = products.map((p) => ({
    url: `/products/${p.id}/`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const allUrls = [...staticRoutes, ...serviceRoutes, ...productRoutes];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${siteUrl}${item.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
