import type {
  AssociationRule,
  FrequentItemset,
  Item,
  ParsedRule,
  Transaction,
} from "./types";
import { ITEM_LABELS } from "./types";

export function sortItemset(items: Item[]): Item[] {
  return [...new Set(items)].sort() as Item[];
}

export function sortTransactionItems(transaction: Transaction): Transaction {
  return {
    ...transaction,
    items: sortItemset(transaction.items),
  };
}

export function compareItemArrays(a: Item[], b: Item[]) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return a.length - b.length;
}

export function itemsetKey(items: Item[]) {
  return sortItemset(items).join(",");
}

export function sortTransactionsLexicographically(transactions: Transaction[]) {
  return [...transactions]
    .map(sortTransactionItems)
    .sort((a, b) => compareItemArrays(a.items, b.items));
}

export function getDistinctItems(transactions: Transaction[]) {
  const set = new Set<Item>();
  transactions.forEach((transaction) => {
    transaction.items.forEach((item) => set.add(item));
  });
  return Array.from(set).sort() as Item[];
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffleItems<T>(items: ReadonlyArray<T>) {
  const result = [...items] as T[];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateRandomTransactions(
  count: number,
  maxSize: number = 4,
): Transaction[] {
  return sortTransactionsLexicographically(
    Array.from({ length: count }, (_, index) => {
      const size = randomInt(1, maxSize);
      const items = shuffleItems(ITEM_LABELS).slice(0, size) as Item[];
      return {
        id: index + 1,
        items: sortItemset(items),
      };
    }),
  );
}

export function isSubset(transaction: Item[], itemset: Item[]) {
  return itemset.every((item) => transaction.includes(item));
}

export function getSupportCount(transactions: Transaction[], itemset: Item[]) {
  return transactions.reduce(
    (count, transaction) =>
      isSubset(transaction.items, itemset) ? count + 1 : count,
    0,
  );
}

export function getSupport(transactions: Transaction[], itemset: Item[]) {
  const total = transactions.length;
  if (total === 0) return 0;
  return getSupportCount(transactions, itemset) / total;
}

export function getConfidence(
  transactions: Transaction[],
  antecedent: Item[],
  consequent: Item[],
) {
  const union = sortItemset([...antecedent, ...consequent]);
  const supportUnion = getSupport(transactions, union);
  const supportAntecedent = getSupport(transactions, antecedent);
  return supportAntecedent > 0 ? supportUnion / supportAntecedent : 0;
}

export function getLift(
  transactions: Transaction[],
  antecedent: Item[],
  consequent: Item[],
) {
  const confidence = getConfidence(transactions, antecedent, consequent);
  const supportConsequent = getSupport(transactions, consequent);
  return supportConsequent > 0 ? confidence / supportConsequent : 0;
}

export function parseItemsetInput(value: string): Item[] | null {
  const cleaned = value.trim().replace(/[{}]/g, "").replace(/\s+/g, " ").trim();

  if (cleaned === "") {
    return [];
  }

  const tokens = cleaned
    .split(/[,\s]+/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  const invalid = tokens.some((token) => !ITEM_LABELS.includes(token as Item));
  if (invalid) {
    return null;
  }

  return sortItemset(tokens as Item[]);
}

export function parseRuleInput(value: string): ParsedRule | null {
  const arrow = value.match(/->|=>|→|→/);
  if (!arrow) {
    return null;
  }

  const [left, right] = value.split(/->|=>|→|→/);
  if (!left || !right) {
    return null;
  }

  const antecedent = parseItemsetInput(left);
  const consequent = parseItemsetInput(right);
  if (!antecedent || !consequent) {
    return null;
  }
  if (antecedent.length === 0 || consequent.length === 0) {
    return null;
  }

  const overlap = antecedent.some((item) => consequent.includes(item));
  if (overlap) {
    return null;
  }

  return {
    antecedent,
    consequent,
  };
}

export function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];

  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((combo) => [
    first,
    ...combo,
  ]);
  const withoutFirst = combinations(rest, size);

  return [...withFirst, ...withoutFirst];
}

export function getFrequentItemsets(
  transactions: Transaction[],
  minSupport: number,
  maxSize: number = 3,
): FrequentItemset[] {
  const total = transactions.length;
  const itemLabels = getDistinctItems(transactions);
  const itemsets: FrequentItemset[] = [];

  for (let size = 1; size <= maxSize; size += 1) {
    combinations(itemLabels, size).forEach((items) => {
      const sorted = sortItemset(items as Item[]);
      const count = getSupportCount(transactions, sorted);
      const support = total > 0 ? count / total : 0;
      if (support >= minSupport && count > 0) {
        itemsets.push({ items: sorted, count, support });
      }
    });
  }

  return itemsets.sort((a, b) => {
    if (b.support !== a.support) return b.support - a.support;
    if (a.items.length !== b.items.length)
      return a.items.length - b.items.length;
    return compareItemArrays(a.items, b.items);
  });
}

export function getNonEmptyProperSubsets(items: Item[]): Item[][] {
  const subsets: Item[][] = [];
  const total = items.length;

  for (let size = 1; size < total; size += 1) {
    subsets.push(
      ...combinations(items, size).map((subset) =>
        sortItemset(subset as Item[]),
      ),
    );
  }

  return subsets;
}

export function getAssociationRules(
  transactions: Transaction[],
  frequentItemsets: FrequentItemset[],
  minConfidence: number,
): AssociationRule[] {
  const supportMap = new Map<string, FrequentItemset>();
  frequentItemsets.forEach((itemset) => {
    supportMap.set(itemsetKey(itemset.items), itemset);
  });

  const rules: AssociationRule[] = [];
  frequentItemsets.forEach((itemset) => {
    if (itemset.items.length < 2) return;

    const subsets = getNonEmptyProperSubsets(itemset.items);
    subsets.forEach((antecedent) => {
      const consequent = itemset.items.filter(
        (item) => !antecedent.includes(item),
      );
      if (consequent.length === 0) return;

      const antecedentKey = itemsetKey(antecedent);
      const consequentKey = itemsetKey(consequent);
      const antecedentSupport =
        supportMap.get(antecedentKey)?.support ??
        getSupport(transactions, antecedent);
      const consequentSupport =
        supportMap.get(consequentKey)?.support ??
        getSupport(transactions, consequent);
      const confidence =
        antecedentSupport > 0 ? itemset.support / antecedentSupport : 0;
      const lift = consequentSupport > 0 ? confidence / consequentSupport : 0;

      if (confidence >= minConfidence) {
        rules.push({
          antecedent,
          consequent,
          count: itemset.count,
          support: itemset.support,
          confidence,
          lift,
          antecedentCount:
            supportMap.get(antecedentKey)?.count ??
            getSupportCount(transactions, antecedent),
          consequentCount:
            supportMap.get(consequentKey)?.count ??
            getSupportCount(transactions, consequent),
        });
      }
    });
  });

  return rules.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    if (b.lift !== a.lift) return b.lift - a.lift;
    return (
      compareItemArrays(a.antecedent, b.antecedent) ||
      compareItemArrays(a.consequent, b.consequent)
    );
  });
}

export function formatItemset(items: Item[]) {
  return `{${items.join(", ")}}`;
}

export function formatRule(rule: { antecedent: Item[]; consequent: Item[] }) {
  return `${formatItemset(rule.antecedent)} → ${formatItemset(rule.consequent)}`;
}
