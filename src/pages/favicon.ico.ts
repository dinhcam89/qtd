import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Content-Type': 'image/x-icon',
    },
  });
};
