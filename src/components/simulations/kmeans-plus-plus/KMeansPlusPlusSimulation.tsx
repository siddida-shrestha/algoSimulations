import { useMemo } from "react";

import { SimulationLayout } from "@/components/simulations/SimulationLayout";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  Centroid,
  Point,
  ProbabilityEntry,
  SimulationPhase,
} from "./types";
import { MAX_POINT_COUNT, MIN_POINT_COUNT, pointLabel } from "./utils";
import { useKMeansPlusPlus } from "./useKMeansPlusPlus";

const CLUSTER_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];
const HIGH_PROBABILITY_COLOR = "#3b82f6";

function getClusterColor(index: number) {
  return (
    CLUSTER_COLORS[index] ??
    `hsl(${(index * 137.508) % 360} 82% ${index % 2 === 0 ? 55 : 48}%)`
  );
}

function mapProbability(
  entries: ProbabilityEntry[],
): Map<number, ProbabilityEntry> {
  return new Map(entries.map((entry) => [entry.pointIndex, entry]));
}

interface ScatterCanvasProps {
  title: string;
  points: Point[];
  centroids: Centroid[];
  phase: SimulationPhase;
  probabilityEntries?: ProbabilityEntry[];
  latestSelectedPointIndex?: number;
  highlightedPointIndices?: number[];
  highlightedPointColorByIndex?: Map<number, string>;
}

function ScatterCanvas({
  title,
  points,
  centroids,
  phase,
  probabilityEntries = [],
  latestSelectedPointIndex,
  highlightedPointIndices = [],
}: ScatterCanvasProps) {
  const probabilityMap = useMemo(
    () => mapProbability(probabilityEntries),
    [probabilityEntries],
  );
  const highlightedPointIndexSet = useMemo(
    () => new Set(highlightedPointIndices),
    [highlightedPointIndices],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="outline">{points.length} points</Badge>
      </div>

      <div className="rounded-xl border border-border bg-background p-2">
        <svg
          viewBox="0 0 100 100"
          className="mx-auto aspect-square w-full max-w-140 rounded-lg bg-muted/30"
        >
          {(phase === "clustering" || phase === "converged") &&
            points
              .filter((point) => point.cluster !== undefined)
              .map((point, pointIndex) => {
                const centroid = centroids[point.cluster ?? 0];
                const color = getClusterColor(point.cluster ?? 0);

                return (
                  <line
                    key={`line-${title}-${pointIndex}`}
                    x1={point.x}
                    y1={point.y}
                    x2={centroid?.x}
                    y2={centroid?.y}
                    stroke={color}
                    strokeOpacity={0.22}
                    strokeWidth={0.3}
                    style={{ transition: "all 360ms ease" }}
                  />
                );
              })}

          {points.map((point, pointIndex) => {
            const probabilityEntry = probabilityMap.get(pointIndex);
            const probabilityBoost = probabilityEntry
              ? probabilityEntry.probability
              : 0;
            const isLatestSelected = latestSelectedPointIndex === pointIndex;
            const isHighlighted = highlightedPointIndexSet.has(pointIndex);
            const clusterColor =
              point.cluster !== undefined
                ? getClusterColor(point.cluster)
                : undefined;
            const fillColor = isLatestSelected
              ? "#f43f5e"
              : (clusterColor ?? "#64748b");

            const radius =
              phase === "initializing" && probabilityEntry
                ? Math.min(1.3, 0.55 + probabilityBoost * 4.5)
                : 0.55;
            const opacity =
              phase === "initializing" && probabilityEntry
                ? Math.min(1, 0.28 + probabilityBoost * 3.8)
                : 0.9;

            const effectiveRadius = isHighlighted ? radius * 1.15 : radius;

            return (
              <g key={`point-${title}-${pointIndex}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={effectiveRadius}
                  fill={fillColor}
                  fillOpacity={opacity}
                  stroke={isLatestSelected ? "white" : "none"}
                  strokeWidth={isLatestSelected ? 0.25 : 0}
                  style={{
                    transition:
                      "fill 300ms ease, fill-opacity 300ms ease, r 300ms ease, cx 360ms ease, cy 360ms ease",
                  }}
                />
              </g>
            );
          })}

          {centroids.map((centroid, index) => {
            const color = getClusterColor(index);
            const isLatest =
              centroid.sourcePointIndex === latestSelectedPointIndex;

            return (
              <g
                key={`centroid-${title}-${centroid.id}`}
                transform={`translate(${centroid.x} ${centroid.y})`}
                style={{ transition: "transform 360ms ease" }}
              >
                <circle
                  r={isLatest ? 2.1 : 1.8}
                  fill="none"
                  stroke={color}
                  strokeOpacity={isLatest ? 0.65 : 0.4}
                  strokeWidth={0.35}
                />
                <circle
                  r={1.15}
                  fill={color}
                  stroke="white"
                  strokeWidth={0.2}
                  style={{
                    filter: `drop-shadow(0 0 2px ${color})`,
                  }}
                />
                <circle
                  cx={-0.25}
                  cy={-0.25}
                  r={0.2}
                  fill="white"
                  fillOpacity={0.85}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function KMeansPlusPlusSimulation() {
  const {
    points,
    centroids,
    randomRun,
    phase,
    initializationStep,
    clusterStep,
    probabilityEntries,
    latestSelectedPointIndex,
    selectionRoll,
    logs,
    clusterIteration,
    k,
    pointCount,
    speedMs,
    compareEnabled,
    autoPlay,
    setK,
    setPointCount,
    setSpeedMs,
    setCompareEnabled,
    startInitialization,
    nextStep,
    toggleAutoPlay,
    reset,
  } = useKMeansPlusPlus();

  const plusPlusConverged = phase === "converged";
  const highlightActive = phase === "initializing";
  const sortedProbabilityEntries = useMemo(
    () => [...probabilityEntries].sort((a, b) => b.probability - a.probability),
    [probabilityEntries],
  );

  const highlightedPointIndices = useMemo(
    () =>
      highlightActive
        ? sortedProbabilityEntries.map((entry) => entry.pointIndex)
        : [],
    [highlightActive, sortedProbabilityEntries],
  );
  const highlightedPointColorByIndex = useMemo(() => {
    const colorMap = new Map<number, string>();
    const midpoint = Math.ceil(sortedProbabilityEntries.length / 2);

    const topHalf = sortedProbabilityEntries.slice(0, midpoint);
    const bottomHalf = sortedProbabilityEntries.slice(midpoint);

    topHalf.forEach((entry) => {
      colorMap.set(entry.pointIndex, HIGH_PROBABILITY_COLOR);
    });

    bottomHalf.forEach((entry) => {
      colorMap.set(entry.pointIndex, "#eab308");
    });

    return colorMap;
  }, [probabilityEntries]);

  return (
    <SimulationLayout
      title="K-Means++ Seeding + K-Means Clustering"
      controls={
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Clusters (k)</p>
              <Badge variant="outline">{k}</Badge>
            </div>
            <Slider
              min={2}
              max={20}
              step={1}
              value={[k]}
              onValueChange={(value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                setK(nextValue ?? k);
              }}
              aria-label="Number of clusters"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Data points</p>
              <Badge variant="outline">{pointCount}</Badge>
            </div>
            <Slider
              min={MIN_POINT_COUNT}
              max={MAX_POINT_COUNT}
              step={10}
              value={[pointCount]}
              onValueChange={(value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                setPointCount(nextValue ?? pointCount);
              }}
              aria-label="Data point count"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Speed</p>
              <Badge variant="outline">{speedMs} ms</Badge>
            </div>
            <Slider
              min={150}
              max={1600}
              step={50}
              value={[speedMs]}
              onValueChange={(value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                setSpeedMs(nextValue ?? 700);
              }}
              aria-label="Auto play speed"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={startInitialization} disabled={phase !== "idle"}>
              Start Initialization
            </Button>
            <Button onClick={nextStep} variant="secondary">
              Next Step
            </Button>
            <Button
              onClick={toggleAutoPlay}
              variant={autoPlay ? "default" : "outline"}
            >
              {autoPlay ? "Stop Auto" : "Auto Play"}
            </Button>
            <Button onClick={reset} variant="outline">
              Reset
            </Button>
          </div>

          <Button
            onClick={() => setCompareEnabled(!compareEnabled)}
            variant={compareEnabled ? "default" : "outline"}
            className="w-full"
          >
            {compareEnabled
              ? "Disable Compare Mode"
              : "Compare with Random Initialization"}
          </Button>

          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p>
              Phase: <span className="font-medium capitalize">{phase}</span>
            </p>
            {phase === "clustering" && (
              <p>
                Next step:{" "}
                <span className="font-medium capitalize">
                  {clusterStep === "assign"
                    ? "assign points"
                    : "move centroids"}
                </span>
              </p>
            )}
            <p>
              Init step:{" "}
              <span className="font-medium">{initializationStep}</span>
            </p>
            <p>
              Cluster iteration:{" "}
              <span className="font-medium">{clusterIteration}</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant={plusPlusConverged ? "default" : "secondary"}>
                K-Means++{" "}
                {plusPlusConverged ? "Converged" : `Iter ${clusterIteration}`}
              </Badge>
              {compareEnabled && (
                <Badge variant={randomRun.converged ? "default" : "outline"}>
                  Random{" "}
                  {randomRun.converged
                    ? "Converged"
                    : `Iter ${randomRun.iteration}`}
                </Badge>
              )}
            </div>
          </div>
        </div>
      }
      visualization={
        <div className="space-y-3">
          {compareEnabled ? (
            <Tabs defaultValue="side-by-side" className="w-full">
              <TabsList variant="default" className="w-full">
                <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                <TabsTrigger value="focus">K-Means++ Focus</TabsTrigger>
              </TabsList>

              <TabsContent value="side-by-side" className="mt-3">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <ScatterCanvas
                    title="Random Initialization"
                    points={randomRun.points}
                    centroids={randomRun.centroids}
                    phase={phase === "converged" ? "converged" : "clustering"}
                  />
                  <ScatterCanvas
                    title="K-Means++"
                    points={points}
                    centroids={centroids}
                    phase={phase}
                    probabilityEntries={probabilityEntries}
                    latestSelectedPointIndex={latestSelectedPointIndex}
                    highlightedPointIndices={highlightedPointIndices}
                    highlightedPointColorByIndex={highlightedPointColorByIndex}
                  />
                </div>
              </TabsContent>

              <TabsContent value="focus" className="mt-3">
                <ScatterCanvas
                  title="K-Means++"
                  points={points}
                  centroids={centroids}
                  phase={phase}
                  probabilityEntries={probabilityEntries}
                  latestSelectedPointIndex={latestSelectedPointIndex}
                  highlightedPointIndices={highlightedPointIndices}
                  highlightedPointColorByIndex={highlightedPointColorByIndex}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <ScatterCanvas
              title="K-Means++"
              points={points}
              centroids={centroids}
              phase={phase}
              probabilityEntries={probabilityEntries}
              latestSelectedPointIndex={latestSelectedPointIndex}
              highlightedPointIndices={highlightedPointIndices}
              highlightedPointColorByIndex={highlightedPointColorByIndex}
            />
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
            Probability weighting during initialization: P(x) = D(x)^2 / Σ
            D(x)^2. Points are sorted by probability with cumulative values
            shown. The selection roll determines which point is chosen based on
            cumulative probability ranges.
          </div>
        </div>
      }
      logs={
        <div className="space-y-3">
          <Card size="sm" className="border-y">
            <CardHeader>
              <CardTitle>Step / Iteration Logs</CardTitle>
              <CardDescription>
                Initialization decisions and centroid movement summaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-64 space-y-2 overflow-auto text-xs">
              {logs.slice(0, 18).map((log) => (
                <div
                  key={log.id}
                  className="rounded-md border border-border/70 bg-background/80 p-2"
                >
                  <p className="font-medium">{log.title}</p>
                  <p>{log.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card size="sm" className="border-y">
            <CardHeader>
              <CardTitle>Probability Distribution</CardTitle>
              <CardDescription>
                D(x)^2 values, probabilities, and cumulative probabilities for
                weighted selection.
                {selectionRoll !== undefined && (
                  <span className="block font-medium text-foreground">
                    Selection roll: {selectionRoll.toFixed(3)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
              {probabilityEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Compute probabilities during initialization to populate this
                  table.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[700px] space-y-1">
                    <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground border-b border-border pb-1">
                      <div>Point</div>
                      <div>D(x)</div>
                      <div>D(x)²</div>
                      <div>P(x)</div>
                      <div>Cumulative</div>
                      <div>Roll Range</div>
                    </div>
                    {sortedProbabilityEntries.map((entry, index) => {
                      const prevCumulative =
                        index === 0
                          ? 0
                          : sortedProbabilityEntries
                              .slice(0, index)
                              .reduce((sum, e) => sum + e.probability, 0);

                      const isSelected =
                        latestSelectedPointIndex === entry.pointIndex;
                      const isInRollRange =
                        selectionRoll !== undefined &&
                        entry.cumulativeProbability !== undefined &&
                        selectionRoll >= prevCumulative &&
                        selectionRoll < entry.cumulativeProbability;

                      return (
                        <div
                          key={`prob-${entry.pointIndex}`}
                          className={`grid grid-cols-6 gap-2 text-xs p-1 rounded ${
                            isSelected
                              ? "bg-red-50 border border-red-200"
                              : isInRollRange
                                ? "bg-blue-50 border border-blue-200"
                                : "bg-background/80"
                          }`}
                        >
                          <div className="font-medium">
                            {pointLabel(entry.pointIndex)}
                            {isSelected && (
                              <span className="ml-1 text-red-600">✓</span>
                            )}
                          </div>
                          <div>{entry.nearestDistance.toFixed(3)}</div>
                          <div>{entry.dSquared.toFixed(3)}</div>
                          <div className="font-medium">
                            {entry.probability.toFixed(4)}
                          </div>
                          <div>
                            {entry.cumulativeProbability?.toFixed(4) ??
                              "0.0000"}
                          </div>
                          <div>
                            [{prevCumulative.toFixed(3)},{" "}
                            {entry.cumulativeProbability?.toFixed(3) ?? "0.000"}
                            )
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
