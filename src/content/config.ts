import { defineCollection, z } from 'astro:content';

const proposalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Meta
    title: z.string(),
    client: z.string(),
    date: z.date(),
    validUntil: z.date(),
    draft: z.boolean().default(true),
    
    // Hero
    tagline: z.string(),
    heroDescription: z.string(),
    
    // Pricing Structure
    pricingModel: z.enum(['performance', 'fixed', 'hybrid']),
    
    // Performance Model (optional)
    performance: z.object({
      setupFee: z.string(),
      monthlyFee: z.string(),
      performanceFee: z.string(),
      feeTiers: z.array(z.object({
        range: z.string(),
        rate: z.string(),
        condition: z.string(),
      })),
      minimumCommitment: z.string(),
      reviewPoint: z.string(),
    }).optional(),
    
    // Fixed Model (optional)
    fixed: z.object({
      packageName: z.string(),
      totalPrice: z.string(),
      duration: z.string(),
      billing: z.string(),
      includes: z.array(z.object({
        phase: z.string(),
        items: z.array(z.string()),
      })),
    }).optional(),
    
    // Scope
    phases: z.array(z.object({
      name: z.string(),
      duration: z.string(),
      items: z.array(z.string()),
    })),
    
    // Metrics
    metrics: z.array(z.object({
      metric: z.string(),
      month1: z.string(),
      month2: z.string(),
      month3: z.string(),
      month6: z.string(),
    })),
    
    // Add-ons
    addons: z.array(z.object({
      name: z.string(),
      description: z.string(),
      price: z.string(),
    })),
    
    // Recommendation
    recommendedModel: z.enum(['performance', 'fixed']),
    recommendationReasons: z.array(z.string()),
    
    // Next Steps
    nextSteps: z.array(z.string()),
    
    // Contact
    contact: z.object({
      name: z.string(),
      role: z.string(),
      email: z.string(),
      phone: z.string(),
      website: z.string(),
    }),
  }),
});

export const collections = {
  'proposals': proposalCollection,
};
