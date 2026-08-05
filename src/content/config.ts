import { defineCollection, z } from 'astro:content';

const proposalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    client: z.string(),
    date: z.date(),
    validUntil: z.date(),
    draft: z.boolean().default(true),
  }),
});

export const collections = {
  'proposals': proposalCollection,
};
