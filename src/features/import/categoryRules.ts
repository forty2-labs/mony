import type { CategoryRow } from '@/shared/types/database';

import rulesData from './categoryRules.json';
import type { DraftTransaction, TxnType } from './parsers/types';

/**
 * One keyword rule. `category` (and `aliases`) are matched against the user's
 * own category names — nothing here creates categories, so a rule pointing at a
 * category the user doesn't have is simply skipped.
 */
export interface CategoryRule {
  category: string;
  kind: TxnType;
  priority?: number;
  aliases?: string[];
  keywords?: string[];
  patterns?: string[];
}

export interface RuleMatch {
  /** Canonical category name from the rule set. */
  category: string;
  kind: TxnType;
  /** The keyword or pattern that fired, for explaining the suggestion. */
  matched: string;
  priority: number;
}

export const CATEGORY_RULES = (rulesData as { rules: CategoryRule[] }).rules;

const DEFAULT_PRIORITY = 50;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a boundary-aware matcher for one keyword. A plain `includes()` would
 * match "bp" inside "bpost" and "rent" inside "different", so the keyword must
 * start at a non-alphanumeric boundary and end at one — with an optional
 * trailing "s"/"'s" so "sainsbury" still matches "Sainsburys".
 * Internal spaces match any whitespace run.
 */
function keywordRegExp(keyword: string): RegExp {
  const body = escapeRegExp(keyword.trim().toLowerCase()).replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|[^a-z0-9])(${body})(?:'?s)?(?![a-z0-9])`, 'i');
}

/** Compiled once per keyword — the rule set is static, so this never invalidates. */
const keywordCache = new Map<string, RegExp>();
function cachedKeyword(keyword: string): RegExp {
  let re = keywordCache.get(keyword);
  if (!re) {
    re = keywordRegExp(keyword);
    keywordCache.set(keyword, re);
  }
  return re;
}

const patternCache = new Map<string, RegExp>();
function cachedPattern(pattern: string): RegExp | null {
  if (patternCache.has(pattern)) return patternCache.get(pattern) ?? null;
  let re: RegExp | null = null;
  try {
    re = new RegExp(pattern, 'i');
  } catch {
    re = null; // a malformed pattern disables that one rule, never the import
  }
  patternCache.set(pattern, re as RegExp);
  return re;
}

/** Lower-case and collapse whitespace so keywords match consistently. */
export function normaliseText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Best rule for a piece of statement text. Highest `priority` wins; ties break
 * toward the longer match, on the theory that "pizza express" is a more
 * specific signal than "pizza". Returns null when nothing matches.
 */
export function matchCategoryRule(text: string, kind: TxnType): RuleMatch | null {
  const hay = normaliseText(text);
  if (!hay) return null;

  let best: RuleMatch | null = null;

  for (const rule of CATEGORY_RULES) {
    if (rule.kind !== kind) continue;
    const priority = rule.priority ?? DEFAULT_PRIORITY;

    let matched: string | null = null;

    for (const keyword of rule.keywords ?? []) {
      const hit = cachedKeyword(keyword).exec(hay);
      if (hit && (!matched || hit[1].length > matched.length)) matched = hit[1];
    }
    for (const pattern of rule.patterns ?? []) {
      const re = cachedPattern(pattern);
      const hit = re?.exec(hay);
      if (hit && (!matched || hit[0].length > matched.length)) matched = hit[0];
    }

    if (!matched) continue;
    if (
      !best ||
      priority > best.priority ||
      (priority === best.priority && matched.length > best.matched.length)
    ) {
      best = { category: rule.category, kind: rule.kind, matched, priority };
    }
  }

  return best;
}

/**
 * The text a rule is matched against: the description (the "notes"), the
 * counterparty (the recipient) and the bank's own category text, which is a
 * useful hint even when it doesn't name one of the user's categories.
 */
export function haystackFor(draft: DraftTransaction): string {
  return [draft.description, draft.counterparty, draft.suggestedCategory].filter(Boolean).join(' ');
}

/**
 * Resolve rule category names to the user's actual categories. A rule matches a
 * category when the name equals the rule's `category` or any of its `aliases`,
 * case-insensitively, with the same kind.
 */
function buildCategoryIndex(categories: CategoryRow[]): Map<string, string> {
  const byName = new Map<string, string>();
  for (const c of categories) {
    byName.set(`${c.kind}|${c.name.trim().toLowerCase()}`, c.id);
  }

  const index = new Map<string, string>();
  for (const rule of CATEGORY_RULES) {
    const names = [rule.category, ...(rule.aliases ?? [])];
    for (const name of names) {
      const id = byName.get(`${rule.kind}|${name.trim().toLowerCase()}`);
      if (id) {
        index.set(`${rule.kind}|${rule.category.toLowerCase()}`, id);
        break; // first name that exists wins
      }
    }
  }
  return index;
}

/**
 * Auto-categorise a batch of drafts. Only fills rows that don't already have a
 * category, so the bank's own category text (matched earlier) and any manual
 * choice both take precedence. Rows whose matched category doesn't exist in the
 * user's account are left uncategorised.
 */
export function applyCategoryRules(
  drafts: DraftTransaction[],
  categories: CategoryRow[],
): DraftTransaction[] {
  if (!categories.length) return drafts;
  const index = buildCategoryIndex(categories);
  if (index.size === 0) return drafts;

  return drafts.map((d) => {
    if (d.categoryId) return d;
    const match = matchCategoryRule(haystackFor(d), d.type);
    if (!match) return d;
    const id = index.get(`${match.kind}|${match.category.toLowerCase()}`);
    return id ? { ...d, categoryId: id } : d;
  });
}
