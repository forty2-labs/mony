import { describe, expect, it } from 'vitest';

import {
  injectSiteUrl,
  PLACEHOLDER_SITE_URL,
  resolveSiteUrl,
  robotsTxt,
  sitemapXml,
  siteUrlFromEnv,
} from './seo';

describe('resolveSiteUrl', () => {
  it('uses the configured address without a trailing slash', () => {
    expect(resolveSiteUrl('https://mony.app/')).toEqual({
      url: 'https://mony.app',
      placeholder: false,
    });
    expect(resolveSiteUrl('  https://mony.app  ')).toEqual({
      url: 'https://mony.app',
      placeholder: false,
    });
  });

  it('falls back to the placeholder when unset or blank', () => {
    expect(resolveSiteUrl(undefined)).toEqual({ url: PLACEHOLDER_SITE_URL, placeholder: true });
    expect(resolveSiteUrl('   ')).toEqual({ url: PLACEHOLDER_SITE_URL, placeholder: true });
  });

  it('rejects something that is not an http(s) address', () => {
    expect(() => resolveSiteUrl('mony.app')).toThrow(/SITE_URL/);
    expect(() => resolveSiteUrl('ftp://mony.app')).toThrow(/SITE_URL/);
  });
});

describe('siteUrlFromEnv', () => {
  it('prefers an explicit SITE_URL', () => {
    expect(
      siteUrlFromEnv({
        SITE_URL: 'https://mony.app',
        VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app',
      }),
    ).toBe('https://mony.app');
  });

  it("falls back to Vercel's production domain, which Vercel sets without a scheme", () => {
    expect(siteUrlFromEnv({ VERCEL_PROJECT_PRODUCTION_URL: 'mony-gray.vercel.app' })).toBe(
      'https://mony-gray.vercel.app',
    );
  });

  it('is undefined when neither is set, so the placeholder applies', () => {
    expect(siteUrlFromEnv({})).toBeUndefined();
    expect(siteUrlFromEnv({ SITE_URL: ' ', VERCEL_PROJECT_PRODUCTION_URL: '' })).toBeUndefined();
  });
});

describe('injectSiteUrl', () => {
  it('replaces every token so share tags carry absolute URLs', () => {
    const html =
      '<meta property="og:image" content="__SITE_URL__/og-image.png"><link rel="canonical" href="__SITE_URL__/">';
    const out = injectSiteUrl(html, 'https://mony.app');
    expect(out).not.toContain('__SITE_URL__');
    expect(out).toContain('content="https://mony.app/og-image.png"');
    expect(out).toContain('href="https://mony.app/"');
  });
});

describe('robotsTxt and sitemapXml', () => {
  it('lets crawlers in, keeps them out of the signed-in app, and points to the sitemap', () => {
    const robots = robotsTxt('https://mony.app');
    expect(robots).toContain('Allow: /\n');
    expect(robots).toContain('Disallow: /login');
    expect(robots).toContain('Sitemap: https://mony.app/sitemap.xml');
  });

  it('lists the public home page', () => {
    const xml = sitemapXml('https://mony.app', '2026-11-22');
    expect(xml).toContain('<loc>https://mony.app/</loc>');
    expect(xml).toContain('<lastmod>2026-11-22</lastmod>');
  });
});
