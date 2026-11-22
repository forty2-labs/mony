/**
 * Copy text to the clipboard. Where the Clipboard API is missing or refuses
 * (older browsers, embedded webviews, no permission), select the text in
 * `fallbackEl` so the visitor can copy it themselves. Resolves `true` only when
 * the clipboard write succeeded; never throws.
 */
export async function copyText(text: string, fallbackEl?: HTMLElement | null): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to selecting the text.
  }
  selectContents(fallbackEl);
  return false;
}

function selectContents(el?: HTMLElement | null): void {
  if (!el || typeof window === 'undefined') return;
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
}
