import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SimulationLayout } from "@/components/simulations/SimulationLayout";

import { useAssociation } from "./useAssociation";
import { formatItemset, formatRule } from "./utils";

function getLiftBadgeClass(lift: number) {
  if (lift >= 1.2) return "bg-emerald-500 text-white";
  if (lift >= 0.9) return "bg-amber-400 text-slate-900";
  return "bg-red-500 text-white";
}

function prettyPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function AssociationAnalysisSimulation() {
  const {
    transactions,
    transactionCount,
    setTransactionCount,
    resetTransactions,
    itemsetInput,
    setItemsetInput,
    ruleInput,
    setRuleInput,
    itemsetParseError,
    ruleParseError,
    parsedItemset,
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
    totalTransactions,
  } = useAssociation();

  const activeRuleLabel = useMemo(() => {
    if (!activeRuleMetrics) return "";
    return formatRule(activeRuleMetrics);
  }, [activeRuleMetrics]);

  const highlightLegend = useMemo(() => {
    if (activeRuleMetrics) {
      return [
        {
          label: "Antecedent only",
          className: "bg-amber-50 border-amber-200 text-amber-900",
        },
        {
          label: "Antecedent + consequent",
          className: "bg-emerald-50 border-emerald-200 text-emerald-900",
        },
      ];
    }

    if (parsedItemset && parsedItemset.length > 0) {
      return [
        {
          label: "Itemset match",
          className: "bg-sky-50 border-sky-200 text-sky-900",
        },
      ];
    }

    return [];
  }, [activeRuleMetrics, parsedItemset]);

  const stepStatus = useMemo(() => {
    const hasItemset = parsedItemset && parsedItemset.length > 0;
    const hasRule = ruleInput.trim().length > 0 && !ruleParseError;
    const hasData = transactions.length > 0;

    return [
      { label: "Generate a dataset", done: hasData },
      { label: "Enter an itemset or rule", done: hasItemset || hasRule },
      { label: "Review matching transactions", done: hasItemset || hasRule },
      {
        label: "Compute support, confidence, lift",
        done: Boolean(activeRuleMetrics) || hasItemset,
      },
      {
        label: "Inspect frequent itemsets and rules",
        done: frequentItemsets.length > 0,
      },
    ];
  }, [
    transactions.length,
    parsedItemset,
    ruleInput,
    ruleParseError,
    activeRuleMetrics,
    frequentItemsets.length,
  ]);

  return (
    <SimulationLayout
      title="Association Analysis"
      controls={
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Transactions</p>
              <Badge variant="outline">{transactionCount}</Badge>
            </div>
            <Slider
              min={10}
              max={50}
              step={1}
              value={[transactionCount]}
              onValueChange={(value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                setTransactionCount(nextValue ?? transactionCount);
              }}
              aria-label="Number of transactions"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="itemset-input">
              Itemset input
            </label>
            <input
              id="itemset-input"
              value={itemsetInput}
              onChange={(event) => {
                setItemsetInput(event.target.value);
                clearSelectedRule();
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="A,B or A C"
            />
            {itemsetParseError ? (
              <p className="text-xs text-red-500">{itemsetParseError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select items to highlight matching transactions.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="rule-input">
              Rule input
            </label>
            <input
              id="rule-input"
              value={ruleInput}
              onChange={(event) => setRuleInput(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="A -> B or {A,B} -> C"
            />
            {ruleParseError ? (
              <p className="text-xs text-red-500">{ruleParseError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter an association rule for confidence and lift analysis.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Min support</p>
              <Badge variant="outline">{prettyPercent(minSupport)}</Badge>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[minSupport]}
              onValueChange={(value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                setMinSupport(nextValue ?? minSupport);
              }}
              aria-label="Minimum support"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Min confidence</p>
              <Badge variant="outline">{prettyPercent(minConfidence)}</Badge>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[minConfidence]}
              onValueChange={(value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                setMinConfidence(nextValue ?? minConfidence);
              }}
              aria-label="Minimum confidence"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Step mode</p>
              <Switch checked={stepMode} onCheckedChange={toggleStepMode} />
            </div>
            {stepMode && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-2">
                {stepStatus.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        step.done
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-300 text-slate-700"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={
                        step.done ? "text-slate-900" : "text-muted-foreground"
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={resetTransactions} variant="outline">
              Regenerate
            </Button>
            <Button
              onClick={() => {
                setItemsetInput("");
                setRuleInput("");
                clearSelectedRule();
              }}
              variant="outline"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      }
      visualization={
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="border-border border-y bg-slate-50/80">
              <CardHeader>
                <CardTitle>Transaction dataset</CardTitle>
                <CardDescription>
                  Sorted lexicographically and displayed with matching
                  highlights.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Highlight legend</div>
                  <div className="text-right">Matched count</div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {highlightLegend.map((legend) => (
                    <div
                      key={legend.label}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${legend.className}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-current" />
                      {legend.label}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="space-y-2">
                    {transactionHighlights.map(({ transaction, highlight }) => {
                      const rowClass =
                        highlight === "both"
                          ? "bg-emerald-50 border-emerald-200"
                          : highlight === "antecedent"
                            ? "bg-amber-50 border-amber-200"
                            : highlight === "itemset"
                              ? "bg-sky-50 border-sky-200"
                              : "bg-background/80 border-border";

                      return (
                        <div
                          key={transaction.id}
                          className={`grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg border px-3 py-3 ${rowClass}`}
                        >
                          <div className="text-xs font-medium text-muted-foreground">
                            T{transaction.id}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {transaction.items.map((item) => (
                              <Badge key={item} variant="outline">
                                {item}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {highlight === "both"
                              ? "Antecedent + consequent"
                              : highlight === "antecedent"
                                ? "Antecedent only"
                                : highlight === "itemset"
                                  ? "Itemset match"
                                  : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border border-y bg-slate-50/80">
              <CardHeader>
                <CardTitle>Support indicators</CardTitle>
                <CardDescription>
                  Highlight counts and support percentages for selected queries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-medium">Itemset support</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {parsedItemset && parsedItemset.length > 0
                      ? formatItemset(parsedItemset)
                      : "No itemset selected"}
                  </p>
                  <div className="text-sm font-semibold">
                    {itemsetCount} / {totalTransactions}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-sky-500"
                      style={{
                        width: `${Math.min(100, itemsetSupport * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Support: {prettyPercent(itemsetSupport)}
                  </div>
                </div>

                {activeRuleMetrics && (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-sm font-medium">Rule metrics</p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {activeRuleLabel}
                    </p>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          Support count
                        </span>
                        <span>
                          {activeRuleMetrics.count} / {totalTransactions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Support</span>
                        <span>{prettyPercent(activeRuleMetrics.support)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          Confidence
                        </span>
                        <span>
                          {prettyPercent(activeRuleMetrics.confidence)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Lift</span>
                        <span>{activeRuleMetrics.lift.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      }
      logs={
        <div className="space-y-4">
          <Card size="sm" className="border-y">
            <CardHeader>
              <CardTitle>Frequent itemsets</CardTitle>
              <CardDescription>
                Frequent itemsets up to size 3 using the current support
                threshold.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 overflow-auto">
              {frequentItemsets.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No itemsets meet the minimum support threshold.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {frequentItemsets.slice(0, 12).map((itemset) => (
                    <div
                      key={itemset.items.join(",")}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/80 px-3 py-2"
                    >
                      <div>{formatItemset(itemset.items)}</div>
                      <div className="text-xs text-muted-foreground">
                        {prettyPercent(itemset.support)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card size="sm" className="border-y">
            <CardHeader>
              <CardTitle>Generated rules</CardTitle>
              <CardDescription>
                Click a rule to highlight its contributing transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 overflow-auto">
              {associationRules.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No rules satisfy the current confidence threshold.
                </p>
              ) : (
                <div className="space-y-2">
                  {associationRules.slice(0, 12).map((rule) => (
                    <button
                      type="button"
                      key={`${rule.antecedent.join(",")}->${rule.consequent.join(",")}`}
                      onClick={() => selectRule(rule)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        selectedRule === rule
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{formatRule(rule)}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getLiftBadgeClass(rule.lift)}`}
                        >
                          Lift {rule.lift.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Conf {prettyPercent(rule.confidence)}</span>
                        <span>Sup {prettyPercent(rule.support)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card size="sm" className="border-y">
            <CardHeader>
              <CardTitle>Interpretation</CardTitle>
              <CardDescription>
                Learn how support, confidence, and lift describe association
                strength.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-border bg-background/80 p-3">
                <p className="font-medium">Lift &gt; 1</p>
                <p className="text-xs text-muted-foreground">
                  Positive correlation: items occur together more often than
                  expected.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/80 p-3">
                <p className="font-medium">Lift = 1</p>
                <p className="text-xs text-muted-foreground">
                  Independent items: knowing antecedent does not change
                  likelihood of consequent.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/80 p-3">
                <p className="font-medium">Lift &lt; 1</p>
                <p className="text-xs text-muted-foreground">
                  Negative correlation: items occur together less often than
                  expected.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
