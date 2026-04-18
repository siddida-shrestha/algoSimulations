import { useCallback, useEffect, useMemo, useState } from "react";

import type { AssociationRule, Transaction } from "./types";
import {
  generateRandomTransactions,
  getAssociationRules,
  getFrequentItemsets,
  getSupport,
  getSupportCount,
  isSubset,
  parseItemsetInput,
  parseRuleInput,
  sortItemset,
} from "./utils";

const DEFAULT_TRANSACTION_COUNT = 20;
const DEFAULT_MIN_SUPPORT = 0.2;
const DEFAULT_MIN_CONFIDENCE = 0.6;

export function useAssociation() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    generateRandomTransactions(DEFAULT_TRANSACTION_COUNT),
  );
  const [transactionCount, setTransactionCount] = useState(
    DEFAULT_TRANSACTION_COUNT,
  );
  const [itemsetInput, setItemsetInput] = useState("A,B");
  const [ruleInput, setRuleInput] = useState("A -> B");
  const [minSupport, setMinSupport] = useState(DEFAULT_MIN_SUPPORT);
  const [minConfidence, setMinConfidence] = useState(DEFAULT_MIN_CONFIDENCE);
  const [stepMode, setStepMode] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AssociationRule | null>(
    null,
  );

  const regenerateTransactions = useCallback(
    (count: number) => {
      setTransactionCount(count);
      setTransactions(generateRandomTransactions(count));
      setSelectedRule(null);
    },
    [setSelectedRule],
  );

  const resetTransactions = useCallback(() => {
    setTransactions(generateRandomTransactions(transactionCount));
    setSelectedRule(null);
  }, [transactionCount]);

  useEffect(() => {
    setTransactions(generateRandomTransactions(transactionCount));
    setSelectedRule(null);
  }, [transactionCount]);

  const parsedItemset = useMemo(
    () => parseItemsetInput(itemsetInput),
    [itemsetInput],
  );

  const itemsetParseError = useMemo(() => {
    if (itemsetInput.trim() === "") return "";
    if (parsedItemset === null) {
      return "Use letters A–G separated by commas or spaces.";
    }
    return "";
  }, [itemsetInput, parsedItemset]);

  const parsedRule = useMemo(() => parseRuleInput(ruleInput), [ruleInput]);

  const ruleParseError = useMemo(() => {
    if (ruleInput.trim() === "") return "";
    if (parsedRule === null) {
      return "Enter a rule like A -> B or {A, B} -> {C}.";
    }
    return "";
  }, [ruleInput, parsedRule]);

  const itemsetCount = useMemo(
    () =>
      parsedItemset && parsedItemset.length > 0
        ? getSupportCount(transactions, parsedItemset)
        : 0,
    [parsedItemset, transactions],
  );

  const itemsetSupport = useMemo(
    () =>
      parsedItemset && parsedItemset.length > 0
        ? getSupport(transactions, parsedItemset)
        : 0,
    [parsedItemset, transactions],
  );

  const parsedRuleMetrics = useMemo(() => {
    if (!parsedRule) return null;
    const union = sortItemset([
      ...parsedRule.antecedent,
      ...parsedRule.consequent,
    ]);
    const antecedentCount = getSupportCount(
      transactions,
      parsedRule.antecedent,
    );
    const consequentCount = getSupportCount(
      transactions,
      parsedRule.consequent,
    );
    const unionCount = getSupportCount(transactions, union);
    const support =
      transactions.length > 0 ? unionCount / transactions.length : 0;
    const confidence = antecedentCount > 0 ? unionCount / antecedentCount : 0;
    const lift =
      consequentCount > 0
        ? confidence / (consequentCount / transactions.length)
        : 0;

    return {
      antecedent: parsedRule.antecedent,
      consequent: parsedRule.consequent,
      count: unionCount,
      support,
      confidence,
      lift,
      antecedentCount,
      consequentCount,
    };
  }, [parsedRule, transactions]);

  const activeRuleMetrics = selectedRule ?? parsedRuleMetrics;

  const frequentItemsets = useMemo(
    () => getFrequentItemsets(transactions, minSupport, 3),
    [transactions, minSupport],
  );

  const associationRules = useMemo(
    () => getAssociationRules(transactions, frequentItemsets, minConfidence),
    [transactions, frequentItemsets, minConfidence],
  );

  const transactionHighlights = useMemo(() => {
    return transactions.map((transaction) => {
      if (activeRuleMetrics) {
        const union = sortItemset([
          ...activeRuleMetrics.antecedent,
          ...activeRuleMetrics.consequent,
        ]);
        const hasAntecedent = isSubset(
          transaction.items,
          activeRuleMetrics.antecedent,
        );
        const hasBoth = isSubset(transaction.items, union);
        return {
          transaction,
          highlight: hasBoth ? "both" : hasAntecedent ? "antecedent" : "none",
        };
      }

      if (parsedItemset && parsedItemset.length > 0) {
        return {
          transaction,
          highlight: isSubset(transaction.items, parsedItemset)
            ? "itemset"
            : "none",
        };
      }

      return {
        transaction,
        highlight: "none" as const,
      };
    });
  }, [activeRuleMetrics, parsedItemset, transactions]);

  const clearSelectedRule = useCallback(() => {
    setSelectedRule(null);
  }, []);

  const selectRule = useCallback((rule: AssociationRule) => {
    setSelectedRule(rule);
  }, []);

  const toggleStepMode = useCallback(() => {
    setStepMode((prev) => !prev);
  }, []);

  return {
    transactions,
    transactionCount,
    setTransactionCount: regenerateTransactions,
    resetTransactions,
    itemsetInput,
    setItemsetInput,
    ruleInput,
    setRuleInput,
    itemsetParseError,
    ruleParseError,
    parsedItemset,
    parsedRule,
    itemsetCount,
    itemsetSupport,
    activeRuleMetrics,
    frequentItemsets,
    associationRules,
    transactionHighlights,
    minSupport,
    setMinSupport,
    minConfidence,
    setMinConfidence,
    stepMode,
    toggleStepMode,
    selectedRule,
    selectRule,
    clearSelectedRule,
    totalTransactions: transactions.length,
  };
}
