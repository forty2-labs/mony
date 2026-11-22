import type { Plugin } from 'vite';

/**
 * Build-time SEO: link previews (Open Graph, Twitter/X) and crawlers read the
 * raw HTML without running JavaScript, and they need absolute URLs, so the
 * site's public address is baked into index.html at build time and used to
 * emit robots.txt and sitemap.xml.
 *
 * Set SITE_URL (e.g. `SITE_URL=https://mony.app npm run build`). It is public
 * but build-only, so it is not a VITE_ variable and never reaches the bundle.
 * Until a domain is chosen, the reserved placeholder below is used and the
 * build warns that previews won't show an image.
 */
export const PLACEHOLDER_SITE_URL = 'https://mony.example';

const TOKEN = /__SITE_URL__/g;

/**
 * The address to build with: SITE_URL if set, else the production domain
 * Vercel exposes to builds (VERCEL_PROJECT_PRODUCTION_URL, no scheme), so
 * Vercel deploys get working previews without extra config.
 */
export function siteUrlFromEnv(env: Record<string, string | undefined>): string | undefined {
  const explicit = env.SITE_URL?.trim();
  if (explicit) return explicit;
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : undefined;
}

export function resolveSiteUrl(raw: string | undefined): { url: string; placeholder: boolean } {
  const value = raw?.trim();
  if (!value) return { url: PLACEHOLDER_SITE_URL, placeholder: true };
  if (!/^https?:\/\/[^\s/]+/i.test(value)) {
    throw new Error(
      `SITE_URL must be a full http(s) address like https://mony.app (got "${value}")`,
    );
  }
  return { url: value.replace(/\/+$/, ''), placeholder: false };
}

export function injectSiteUrl(html: string, url: string): string {
  return html.replace(TOKEN, url);
}

/** Crawl the public landing page; the signed-in app behind it has nothing to index. */
export function robotsTxt(url: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /login',
    'Disallow: /reset-password',
    '',
    `Sitemap: ${url}/sitemap.xml`,
    '',
  ].join('\n');
}

export function sitemapXml(url: string, lastmod: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${url}/</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    '</urlset>',
    '',
  ].join('\n');
}

/** Vite plugin: fills __SITE_URL__ in index.html and emits robots.txt + sitemap.xml. */
export function seoPlugin(raw: string | undefined): Plugin {
  const { url, placeholder } = resolveSiteUrl(raw);
  return {
    name: 'mony-seo',
    transformIndexHtml: (html) => injectSiteUrl(html, url),
    buildStart() {
      if (placeholder) {
        this.warn(
          `SITE_URL is not set; share tags use ${PLACEHOLDER_SITE_URL}, so link previews won't show an image. Set SITE_URL when deploying.`,
        );
      }
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(url) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(url, today) });
    },
  };
}
