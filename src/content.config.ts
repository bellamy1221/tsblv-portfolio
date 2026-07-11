import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({
    base: './src/content/work',
    pattern: '**/*.{md,mdx}',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      shortTitle: z.string().optional(),
      category: z.string(),
      year: z.number().int(),
      summary: z.string(),
      description: z.string().optional(),
      cover: image(),
      coverAlt: z.string(),
      featured: z.boolean().default(false),
      order: z.number().default(100),
      draft: z.boolean().default(false),
      services: z.array(z.string()),
      roles: z.array(z.string()),
      client: z.string().optional(),
      duration: z.string().optional(),
      website: z.string().url().optional(),
      tone: z.enum(['dark', 'light', 'warm', 'neutral']).default('neutral'),
    }),
});

export const collections = { work };
