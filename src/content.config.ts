import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Journal: de contentmotor van de site. Elk verhaal is een eigen
 * indexeerbare URL met Article-schema; hier komt het organische
 * verkeer van een heritage-merk vandaan.
 */
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(180),
    date: z.coerce.date(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { journal };
