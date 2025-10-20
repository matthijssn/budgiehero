// apps/api/src/lib/categorize.ts
export type Tx = { description?: string; amount: number };

const rules: { pattern: RegExp; category: string }[] = [
  { pattern: /(albert\s*heijn|ah|jumbo|lidl|aldi)/i, category: 'Groceries' },
  { pattern: /(ns|train|trein|gvb|ret|ov\-chip)/i, category: 'Transport' },
  { pattern: /(bol\.com|amazon|mediamarkt)/i, category: 'Shopping' },
  { pattern: /(huur|rent|hypotheek|mortgage)/i, category: 'Housing' },
  { pattern: /(vodafone|kpn|ziggo|t\-mobile)/i, category: 'Telecom' },
  { pattern: /(netflix|spotify|disney\+|apple\s*tv)/i, category: 'Subscriptions' },
  { pattern: /(restaurant|cafe|bar|mcdonald|burger king|kfc)/i, category: 'Dining' },
];

export function categorize(tx: Tx): { category: string; confidence: number } {
  const desc = tx.description || '';
  for (const r of rules) {
    if (r.pattern.test(desc)) return { category: r.category, confidence: 0.9 };
  }
  if (tx.amount > 0) return { category: 'Income', confidence: 0.6 };
  return { category: 'Uncategorized', confidence: 0.2 };
}