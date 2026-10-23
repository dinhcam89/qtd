import fs from 'node:fs';
import path from 'node:path';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { siteSchema } from './lib/schemas/site';
import { ratesSchema } from './lib/schemas/rates';
import { contactSchema } from './lib/schemas/contact';
import { scheduleSchema } from './lib/schemas/schedule';
import { leadershipSchema } from './lib/schemas/leadership';
import { newsSchema } from './lib/schemas/news';
import { pageSchema } from './lib/schemas/pages';
import { productsSchema } from './lib/schemas/products';
import { documentsSchema } from './lib/schemas/documents';

const isFixtures = process.env.QTD_FIXTURES === '1';

function getCollectionBase(
  collectionName: string,
  defaultBase: string
): string {
  if (isFixtures) {
    const fixtureDir = path.resolve(
      process.cwd(),
      'src',
      'fixtures',
      collectionName
    );
    if (fs.existsSync(fixtureDir)) {
      return `src/fixtures/${collectionName}`;
    }
  }
  return defaultBase;
}

export const collections = {
  site: defineCollection({
    loader: glob({
      pattern: 'site.yaml',
      base: getCollectionBase('site', 'src/data'),
    }),
    schema: siteSchema,
  }),
  rates: defineCollection({
    loader: glob({
      pattern: 'rates.yaml',
      base: getCollectionBase('rates', 'src/data'),
    }),
    schema: ratesSchema,
  }),
  products: defineCollection({
    loader: glob({ pattern: 'products.yaml', base: 'src/data' }),
    schema: productsSchema,
  }),
  contact: defineCollection({
    loader: glob({
      pattern: 'contact.yaml',
      base: getCollectionBase('contact', 'src/data'),
    }),
    schema: contactSchema,
  }),
  schedule: defineCollection({
    loader: glob({
      pattern: 'schedule.yaml',
      base: getCollectionBase('schedule', 'src/data'),
    }),
    schema: scheduleSchema,
  }),
  leadership: defineCollection({
    loader: glob({ pattern: 'leadership.yaml', base: 'src/data' }),
    schema: leadershipSchema,
  }),
  news: defineCollection({
    loader: glob({
      pattern: '**/*.{md,mdx}',
      base: getCollectionBase('news', 'src/content/news'),
    }),
    schema: newsSchema,
  }),
  pages: defineCollection({
    loader: glob({
      pattern: '**/*.{md,mdx}',
      base: getCollectionBase('pages', 'src/content/pages'),
    }),
    schema: pageSchema,
  }),
  documents: defineCollection({
    loader: glob({
      pattern: '**/*.yaml',
      base: getCollectionBase('documents', 'src/content/documents'),
    }),
    schema: documentsSchema,
  }),
};
