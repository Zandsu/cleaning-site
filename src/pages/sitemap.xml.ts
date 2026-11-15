import { site } from '../data/config';
export const GET = () =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site.url}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url></urlset>`, { headers: { 'Content-Type': 'application/xml' } });
