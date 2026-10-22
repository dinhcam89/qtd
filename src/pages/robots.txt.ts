import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '../lib/seo';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site ? site.toString() : 'https://qtd.pages.dev';
  const robotsTxt = buildRobotsTxt(siteUrl);

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
