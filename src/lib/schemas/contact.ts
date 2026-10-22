import { z } from 'astro/zod';

export const addressSchema = z.object({
  street: z.string().nullable().optional(),
  ward: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  full: z.string(),
});

export const branchSchema = z.object({
  name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  working_hours: z.string().nullable().optional(),
});

export const contactSchema = z.object({
  address: addressSchema,
  phone: z.string(),
  hotline: z.string().nullable().optional(),
  email: z.string(),
  facebook: z.string().nullable().optional(),
  zalo: z.string().nullable().optional(),
  map_embed_url: z.string().nullable().optional(),
  branches: z.array(branchSchema).default([]),
});

export type Address = z.infer<typeof addressSchema>;
export type Branch = z.infer<typeof branchSchema>;
export type ContactData = z.infer<typeof contactSchema>;
