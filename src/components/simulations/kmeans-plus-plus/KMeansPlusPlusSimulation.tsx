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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type {
  Centroid,
  Point,
  ProbabilityEntry,
  SimulationPhase,
} from "./types";
import { pointLabel } from "./utils";
import { useKMeansPlusPlus } from "./useKMeansPlusPlus";

const CLUSTER_COLORS = ["#0ea5e9", "#f97316", "#10b981", "#e11d48", "#a855f7"];

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
}

function ScatterCanvas({
  title,
  points,
  centroids,
  phase,
  probabilityEntries = [],
  latestSelectedPointIndex,
}: ScatterCanvasProps) {
  const probabilityMap = useMemo(
    () => mapProbability(probabilityEntries),
    [probabilityEntries],
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
          className="aspect-square w-full rounded-lg bg-muted/30"
        >
          {(phase === "clustering" || phase === "converged") &&
            points
              .filter((point) => point.cluster !== undefined)
              .map((point, pointIndex) => {
                const centroid = centroids[point.cluster ?? 0];
                const color = CLUSTER_COLORS[point.cluster ?? 0] ?? "#64748b";

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
            const clusterColor =
              point.cluster !== undefined
                ? CLUSTER_COLORS[point.cluster]
                : undefined;
            const fillColor = isLatestSelected
              ? "#f43f5e"
              : (clusterColor ?? "#64748b");

            const radius =
              phase === "initializing" && probabilityEntry
                ? Math.min(2.1, 0.9 + probabilityBoost * 12)
                : 1.1;
            const opacity =
              phase === "initializing" && probabilityEntry
                ? Math.min(1, 0.28 + probabilityBoost * 3.8)
                : 0.9;

            return (
              <circle
                key={`point-${title}-${pointIndex}`}
                cx={point.x}
                cy={point.y}
                r={radius}
                fill={fillColor}
                fillOpacity={opacity}
                stroke={isLatestSelected ? "white" : "none"}
                strokeWidth={isLatestSelected ? 0.25 : 0}
                style={{
                  transition:
                    "fill 300ms ease, fill-opacity 300ms ease, r 300ms ease, cx 360ms ease, cy 360ms ease",
                }}
              />
            );
          })}

          {centroids.map((centroid, index) => {
            const color = CLUSTER_COLORS[index] ?? "#334155";
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
    probabilityEntries,
    topProbabilityEntries,
    latestSelectedPointIndex,
    logs,
    clusterIteration,
    k,
    speedMs,
    compareEnabled,
    autoPlay,
    setK,
    setSpeedMs,
    setCompareEnabled,
    startInitialization,
    nextStep,
    toggleAutoPlay,
    reset,
  } = useKMeansPlusPlus();

  const plusPlusConverged = phase === "converged";

  return (
    <SimulationLayout
      title="K-Means++ Initialization + Clustering"
      description="Step through K-Means++ centroid seeding (D(x)^2 weighted sampling), then run standard K-Means. Compare against random initialization on the same dataset."
      controls={
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Clusters (k)</p>
            <Select
              value={String(k)}
              onValueChange={(value) => setK(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select k" />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} clusters
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            />
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
            Probability weighting during initialization: P(x) = D(x)^2 / Σ
            D(x)^2
          </div>
        </div>
      }
      logs={
        <div className="space-y-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Top 10 Probability Points</CardTitle>
              <CardDescription>
                D(x), per-centroid distances, and weighted selection
                probabilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-72 space-y-2 overflow-auto text-xs">
              {topProbabilityEntries.length === 0 ? (
                <p className="text-muted-foreground">
                  Compute probabilities during initialization to populate this
                  table.
                </p>
              ) : (
                topProbabilityEntries.map((entry) => (
                  <div
                    key={`prob-${entry.pointIndex}`}
                    className="rounded-md border border-border/70 bg-background/80 p-2"
                  >
                    <p className="font-medium">
                      Point {pointLabel(entry.pointIndex)} (
                      {entry.point.x.toFixed(1)}, {entry.point.y.toFixed(1)})
                    </p>
                    <p>D(x) = {entry.nearestDistance.toFixed(3)}</p>
                    <p>D(x)^2 = {entry.dSquared.toFixed(3)}</p>
                    <p>
                      Distances:{" "}
                      {entry.distancesToCentroids
                        .map(
                          (distance, index) =>
                            `d(C${index + 1})=${distance.toFixed(3)}`,
                        )
                        .join(", ")}
                    </p>
                    <p className="font-medium">
                      P(x) = {entry.probability.toFixed(4)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card size="sm">
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
        </div>
      }
    />
  );
}
