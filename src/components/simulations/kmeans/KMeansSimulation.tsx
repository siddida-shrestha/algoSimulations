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
import { SimulationLayout } from "@/components/simulations/SimulationLayout";

import { useKMeans } from "./useKMeans";

const CLUSTER_COLORS = ["#0ea5e9", "#f97316", "#10b981", "#e11d48", "#a855f7"];

export function KMeansSimulation() {
  const {
    state,
    k,
    speedMs,
    setK,
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
      title="K-Means Clustering Simulation"
      description="Observe how K-Means assigns points to the nearest centroid, updates centroid positions, and converges after at least 4 iterations."
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
              Status:{" "}
              {state.converged ? (
                <Badge>Converged</Badge>
              ) : (
                <Badge variant="secondary">Running</Badge>
              )}
            </p>
            <p className="text-muted-foreground">
              Converges when assignments stabilize.
            </p>
          </div>
        </div>
      }
      visualization={
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background p-2">
            <svg
              viewBox="0 0 100 100"
              className="aspect-square w-full overflow-visible rounded-lg bg-muted/30"
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
                      stroke={CLUSTER_COLORS[point.cluster ?? 0]}
                      strokeOpacity={0.25}
                      strokeWidth={0.4}
                      style={{ transition: "all 420ms ease" }}
                    />
                  );
                })}

              {state.points.map((point) => {
                const color = CLUSTER_COLORS[point.cluster ?? 0] ?? "#64748b";
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
                const color = CLUSTER_COLORS[index];
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
                  style={{ backgroundColor: CLUSTER_COLORS[index] }}
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
          <Card size="sm">
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

          <Card size="sm">
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
