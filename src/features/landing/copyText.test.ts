import { afterEach, describe, expect, it, vi } from 'vitest';

import { mailtoHref } from './content';
import { copyText } from './copyText';

afterEach(() => vi.unstubAllGlobals());

describe('copyText', () => {
  it('uses the clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(copyText('hi@example.com')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hi@example.com');
  });

  it('falls back without throwing when the clipboard rejects', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    await expect(copyText('hi@example.com')).resolves.toBe(false);
  });

  it('falls back when there is no clipboard API', async () => {
    vi.stubGlobal('navigator', {});
    await expect(copyText('hi@example.com')).resolves.toBe(false);
  });
});

describe('mailtoHref', () => {
  it('builds a mailto link with an encoded subject', () => {
    expect(mailtoHref('Reserve lifetime access')).toBe(
      'mailto:contact@example.com?subject=Reserve%20lifetime%20access',
    );
  });
});
