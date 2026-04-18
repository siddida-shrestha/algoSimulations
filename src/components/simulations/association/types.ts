export const ITEM_LABELS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type Item = (typeof ITEM_LABELS)[number];

export interface Transaction {
  id: number;
  items: Item[];
}

export interface ParsedRule {
  antecedent: Item[];
  consequent: Item[];
}

export interface FrequentItemset {
  items: Item[];
  count: number;
  support: number;
}

export interface AssociationRule {
  antecedent: Item[];
  consequent: Item[];
  count: number;
  support: number;
  confidence: number;
  lift: number;
  antecedentCount: number;
  consequentCount: number;
}

export type HighlightType = "none" | "itemset" | "antecedent" | "both";

export interface TransactionHighlight {
  transaction: Transaction;
  highlight: HighlightType;
}
