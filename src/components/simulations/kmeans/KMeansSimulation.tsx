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
import { SimulationLayout } from "@/components/simulations/SimulationLayout";

import { useKMeans } from "./useKMeans";
import { MAX_POINT_COUNT, MIN_POINT_COUNT } from "./utils";

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

function getClusterColor(index: number) {
  return (
    CLUSTER_COLORS[index] ??
    `hsl(${(index * 137.508) % 360} 82% ${index % 2 === 0 ? 55 : 48}%)`
  );
}

export function KMeansSimulation() {
  const {
    state,
    k,
    pointCount,
    speedMs,
    stepMode,
    setK,
    setPointCount,
    setSpeedMs,
    step,
    start,
    pause,
    reset,
    centroidSummary,
  } = useKMeans({ initialK: 3 });

  const latestLog = state.history[state.history.length - 1];

  return (
    <SimulationLayout
      title="K-Means Clustering"
      controls={
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Clusters (k)</p>
              <Badge variant="outline">{k}</Badge>
            </div>
            <Slider
              min={2}
              max={pointCount}
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
              <p className="text-sm font-medium">Auto-play speed</p>
              <Badge variant="outline">{speedMs} ms</Badge>
            </div>
            <Slider
              min={200}
              max={2000}
              step={100}
              value={[speedMs]}
              onValueChange={(value) => {
                const nextValue = Array.isArray(value) ? value[0] : value;
                setSpeedMs(nextValue ?? 700);
              }}
              aria-label="Speed slider"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={state.isRunning ? pause : start}
              disabled={state.converged}
            >
              {state.isRunning ? "Pause" : "Start"}
            </Button>
            <Button
              variant="secondary"
              onClick={step}
              disabled={state.converged || state.isRunning}
            >
              Next Step
            </Button>
            <Button
              variant="outline"
              className="col-span-2"
              onClick={() => reset()}
            >
              Reset Dataset
            </Button>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p>
              Iteration: <span className="font-medium">{state.iteration}</span>
            </p>
            <p>
              Next step:{" "}
              <span className="font-medium capitalize">
                {stepMode === "assign" ? "assign points" : "move centroids"}
              </span>
            </p>
            <p>
              Status:{" "}
              {state.converged ? (
                <Badge>Converged</Badge>
              ) : (
                <Badge variant="secondary">Running</Badge>
              )}
            </p>
            <p className="text-muted-foreground">
              Click once to assign points, then again to move centroids.
            </p>
          </div>
        </div>
      }
      visualization={
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background p-2">
            <svg
              viewBox="0 0 100 100"
              className="mx-auto aspect-square w-full max-w-140 overflow-visible rounded-lg bg-muted/30"
            >
              {state.points
                .filter((point) => point.cluster !== undefined)
                .map((point) => {
                  const centroid = state.centroids[point.cluster ?? 0];
                  return (
                    <line
                      key={`line-${point.id}`}
                      x1={point.x}
                      y1={point.y}
                      x2={centroid?.x}
                      y2={centroid?.y}
                      stroke={getClusterColor(point.cluster ?? 0)}
                      strokeOpacity={0.22}
                      strokeWidth={0.3}
                      style={{ transition: "all 420ms ease" }}
                    />
                  );
                })}

              {state.points.map((point) => {
                const color = getClusterColor(point.cluster ?? 0);
                return (
                  <circle
                    key={point.id}
                    cx={point.x}
                    cy={point.y}
                    r={0.55}
                    fill={color}
                    fillOpacity={0.95}
                    style={{
                      transition:
                        "fill 320ms ease, cx 420ms ease, cy 420ms ease",
                    }}
                  />
                );
              })}

              {state.centroids.map((centroid, index) => {
                const color = getClusterColor(index);
                return (
                  <g
                    key={centroid.id}
                    transform={`translate(${centroid.x} ${centroid.y})`}
                    style={{ transition: "transform 420ms ease" }}
                  >
                    <circle
                      r={1.55}
                      fill="none"
                      stroke={color}
                      strokeOpacity={0.42}
                      strokeWidth={0.22}
                    />
                    <circle
                      r={0.9}
                      fill={color}
                      fillOpacity={1}
                      stroke="white"
                      strokeWidth={0.2}
                      style={{
                        filter: `drop-shadow(0 0 1.5px ${color}) drop-shadow(0 0 0.75px ${color})`,
                      }}
                    />
                    <circle
                      cx={-0.24}
                      cy={-0.24}
                      r={0.18}
                      fill="white"
                      fillOpacity={0.86}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
            {centroidSummary.map((label, index) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: getClusterColor(index) }}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      }
      logs={
        <div className="space-y-3">
          <Card size="sm" className="border-y">
            <CardHeader>
              <CardTitle>Current Iteration</CardTitle>
              <CardDescription>Iteration {latestLog.iteration}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              {latestLog.centroids.map((centroid, index) => (
                <p key={`${latestLog.iteration}-${centroid.id}`}>
                  Centroid {index + 1} {"->"} ({centroid.x.toFixed(1)},{" "}
                  {centroid.y.toFixed(1)})
                </p>
              ))}
            </CardContent>
          </Card>

          <Card size="sm" className="border-y">
            <CardHeader>
              <CardTitle>Cluster Summary</CardTitle>
              <CardDescription>Points assigned this iteration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              {latestLog.clusterCounts.map((count, index) => (
                <p key={`${latestLog.iteration}-count-${index}`}>
                  Cluster {index + 1}: {count} points
                </p>
              ))}
            </CardContent>
          </Card>

          <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-border bg-muted/25 p-2 text-xs">
            {state.history
              .slice()
              .reverse()
              .map((snapshot) => (
                <div
                  key={`snapshot-${snapshot.iteration}`}
                  className="rounded-md border border-border/70 bg-background/80 p-2"
                >
                  <p className="font-medium">Iteration {snapshot.iteration}</p>
                  {snapshot.centroids.map((centroid, centroidIndex) => (
                    <p key={`history-${snapshot.iteration}-${centroid.id}`}>
                      C{centroidIndex + 1} {"->"} ({centroid.x.toFixed(1)},{" "}
                      {centroid.y.toFixed(1)})
                    </p>
                  ))}
                </div>
              ))}
          </div>
        </div>
      }
    />
  );
}
