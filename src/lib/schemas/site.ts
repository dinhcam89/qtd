import { z } from 'astro/zod';

export const siteStatsSchema = z.object({
  as_of: z.string().nullable(),
  members_count: z.number().nullable(),
  charter_capital: z.number().nullable(),
  total_assets: z.number().nullable(),
  total_deposits: z.number().nullable(),
  total_loans: z.number().nullable(),
});

export const officialDomainSchema = z
  .string()
  .refine(
    (val) => {
      if (
        val.includes('://') ||
        val.includes('/') ||
        val.includes(' ') ||
        val.includes(':')
      ) {
        return false;
      }
      return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(
        val
      );
    },
    {
      message:
        'official_domain phải là hostname hợp lệ, không chứa protocol hoặc đường dẫn',
    }
  )
  .nullable()
  .optional();

export const siteSchema = z.object({
  name: z.string(),
  short_name: z.string().nullable(),
  license_number: z.string().nullable(),
  established_year: z.number().nullable(),
  operating_area: z.string().nullable(),
  description: z.string().nullable(),
  official_domain: officialDomainSchema.default(null),
  stats: siteStatsSchema,
});

export type SiteStats = z.infer<typeof siteStatsSchema>;
export type SiteData = z.infer<typeof siteSchema>;
