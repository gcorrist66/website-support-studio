import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string(),
    summary: z.string(),
    category: z.string().default("Announcement"),
    author: z.string().default("Gary Corriston"),
    authorTitle: z.string().default("Founder, Corriston Consulting, LLC"),
    datePublished: z.string(),
    dateModified: z.string().optional(),
    image: z.string().optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
