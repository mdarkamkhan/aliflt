import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.date()]).optional(),
    layout: z.string().optional(),
    tags: z.any().optional(),
    image: z.string().optional(),
    is_ad: z.boolean().optional(),
    price: z.union([z.number(), z.string()]).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    service_information: z.string().optional(),
    permalink: z.any().optional(),
  }).passthrough(),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.date()]).optional(),
    image: z.string().optional(),
    price: z.union([z.number(), z.string()]).nullable().optional(),
    offer_price: z.union([z.number(), z.string()]).nullable().optional(),
    offer_end_date: z.string().nullable().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    is_ad: z.boolean().optional(),
    size: z.string().optional(),
    colour: z.string().optional(),
    fabric: z.string().optional(),
    work: z.string().optional(),
    pattern: z.string().optional(),
    ideal_for: z.string().optional(),
    delivery_charges: z.string().optional(),
    return_policy: z.string().optional(),
    product_code: z.string().optional(),
  }).passthrough(),
});

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.union([z.string(), z.date()]).optional(),
    image: z.string().optional(),
    category: z.string().optional(),
    price: z.union([z.number(), z.string()]).optional(),
    description: z.string().optional(),
  }).passthrough(),
});

const offers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/offers' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.union([z.string(), z.date()]).optional(),
    image: z.string().optional(),
  }).passthrough(),
});

const designs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/designs' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.union([z.string(), z.date()]).optional(),
    image: z.string().optional(),
    price: z.union([z.number(), z.string()]).optional(),
    category: z.string().optional(),
    is_ad: z.boolean().optional(),
  }).passthrough(),
});

export const collections = {
  services,
  products,
  works,
  offers,
  designs,
};
