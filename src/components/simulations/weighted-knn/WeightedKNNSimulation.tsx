import { useState } from "react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimulationLayout } from "@/components/simulations/SimulationLayout";

import type { WeightedKNNState } from "./types";
import {
  getClassColor,
  getDistanceVisualizationProps,
  getWeightVisualizationProps,
} from "./utils";
import { useWeightedKNN } from "./useWeightedKNN";

const MODE_LABELS = {
  uniform: "Uniform KNN",
  assignment: "Weighted (Assignment)",
  intuitive: "Weighted (Intuitive)",
};

const MODE_DESCRIPTIONS = {
  uniform: "Standard KNN with uniform weights (1/k) for k nearest neighbors",
  assignment:
    "K nearest neighbors weighted by distance (farther = higher weight) - intentionally flawed",
  intuitive:
    "K nearest neighbors weighted by inverse distance (closer = higher weight) - correct approach",
};

export function WeightedKNNSimulation() {
  const {
    state,
    setMode,
    setK,
    setPointCount,
    setClassCount,
    setQuery,
    setShowDistances,
    setShowWeights,
    resetPoints,
    addRandomPoint,
    updatePointLabel,
    neighbors,
    weightResults,
    prediction,
  } = useWeightedKNN();

  const [dragging, setDragging] = useState(false);

  const maxK = Math.max(1, state.points.length - 1);
  const maxWeight = Math.max(...neighbors.map((n) => n.weight), 0);
  const maxDistance = Math.max(...neighbors.map((n) => n.distance), 1);

  const handleMouseDown = () => {
    setDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setQuery({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const renderVisualization = () => (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-background p-2">
        <svg
          viewBox="0 0 100 100"
          className="mx-auto aspect-square w-full max-w-140 overflow-visible rounded-lg bg-muted/30 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Distance lines */}
          {state.showDistances &&
            neighbors.map((neighbor) => {
              const distanceProps = getDistanceVisualizationProps(
                neighbor.distance,
                maxDistance,
              );
              return (
                <line
                  key={`line-${neighbor.point.id}`}
                  x1={state.query.x}
                  y1={state.query.y}
                  x2={neighbor.point.x}
                  y2={neighbor.point.y}
                  stroke={getClassColor(neighbor.point.label)}
                  strokeOpacity={distanceProps.opacity}
                  strokeWidth={distanceProps.strokeWidth}
                  style={{ transition: "all 420ms ease" }}
                />
              );
            })}

          {/* Points */}
          {state.points.map((point) => {
            const neighbor = neighbors.find((n) => n.point.id === point.id);
            const isUsed = !!neighbor;
            const weightProps =
              neighbor && state.showWeights
                ? getWeightVisualizationProps(neighbor.weight, maxWeight)
                : { radius: 0.55, opacity: 0.7, strokeWidth: 0 };

            return (
              <circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={
                  isUsed && state.showWeights
                    ? weightProps.radius
                    : isUsed
                      ? 0.55 * 1.15
                      : 0.55
                }
                fill={getClassColor(point.label)}
                fillOpacity={
                  isUsed && state.showWeights ? weightProps.opacity : 0.7
                }
                stroke="none"
                strokeWidth={0}
                style={{
                  transition: "all 320ms ease",
                  cursor: "pointer",
                }}
                onClick={() =>
                  updatePointLabel(
                    point.id,
                    (point.label + 1) % state.classCount,
                  )
                }
              />
            );
          })}

          {/* Query point */}
          <circle
            cx={state.query.x}
            cy={state.query.y}
            r={1}
            fill="#000"
            fillOpacity={0.9}
            stroke="#fff"
            strokeWidth={0.3}
            onMouseDown={handleMouseDown}
            style={{ cursor: "grab" }}
          />
        </svg>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
        <p>
          <strong>Query:</strong> ({state.query.x.toFixed(1)},{" "}
          {state.query.y.toFixed(1)})
        </p>
        <p>
          <strong>Mode:</strong> {MODE_LABELS[state.mode]}
        </p>
        <p>
          <strong>K:</strong> {state.k} nearest neighbors
        </p>
        {prediction && (
          <p>
            <strong>Prediction:</strong> Class {prediction.predictedClass} (
            {prediction.confidence.toFixed(1)}% confidence)
          </p>
        )}
      </div>
    </div>
  );

  const renderControls = () => (
    <div className="space-y-4">
      <Tabs
        value={state.mode}
        onValueChange={(value) => setMode(value as WeightedKNNState["mode"])}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="uniform">Uniform KNN</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="intuitive">Intuitive</TabsTrigger>
        </TabsList>

        <TabsContent value="uniform" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            {MODE_DESCRIPTIONS.uniform}
          </p>
        </TabsContent>

        <TabsContent value="assignment" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            {MODE_DESCRIPTIONS.assignment}
          </p>
          <div className="rounded-md bg-red-50 border border-red-200 p-2">
            <p className="text-xs text-red-800">
              <strong>⚠️ Flawed weighting:</strong> Farther points get higher
              weights, leading to unintuitive results.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="intuitive" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            {MODE_DESCRIPTIONS.intuitive}
          </p>
          <div className="rounded-md bg-green-50 border border-green-200 p-2">
            <p className="text-xs text-green-800">
              <strong>✓ Correct weighting:</strong> Closer points get higher
              weights, more realistic behavior.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">K (neighbors)</p>
          <Badge variant="outline">{state.k}</Badge>
        </div>
        <Slider
          min={1}
          max={maxK}
          step={1}
          value={[state.k]}
          onValueChange={(value) => {
            const nextValue = Array.isArray(value) ? value[0] : value;
            setK(nextValue ?? state.k);
          }}
          aria-label="Number of neighbors"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Data points</p>
          <Badge variant="outline">{state.points.length}</Badge>
        </div>
        <Slider
          min={25}
          max={300}
          step={1}
          value={[state.points.length]}
          onValueChange={(value) => {
            const nextValue = Array.isArray(value) ? value[0] : value;
            setPointCount(nextValue ?? state.points.length);
          }}
          aria-label="Data point count"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Classes</p>
          <Badge variant="outline">{state.classCount}</Badge>
        </div>
        <Slider
          min={2}
          max={5}
          step={1}
          value={[state.classCount]}
          onValueChange={(value) => {
            const nextValue = Array.isArray(value) ? value[0] : value;
            setClassCount(nextValue ?? state.classCount);
          }}
          aria-label="Number of classes"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Show distances</p>
          <Switch
            checked={state.showDistances}
            onCheckedChange={setShowDistances}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Show weights</p>
          <Switch
            checked={state.showWeights}
            onCheckedChange={setShowWeights}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={resetPoints} variant="outline">
          Reset Dataset
        </Button>
        <Button onClick={addRandomPoint} variant="outline">
          Add Point
        </Button>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-3">
      {prediction && (
        <Card size="sm" className="border-y">
          <CardHeader>
            <CardTitle>Prediction Result</CardTitle>
            <CardDescription>
              Weighted voting results for query point
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Predicted Class:</span>
              <Badge
                style={{
                  backgroundColor: getClassColor(prediction.predictedClass),
                }}
              >
                Class {prediction.predictedClass}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Confidence:</span>
              <Badge variant="outline">
                {prediction.confidence.toFixed(1)}%
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Class Contributions:</p>
              {prediction.contributions.map((contrib) => (
                <div
                  key={contrib.class}
                  className="flex items-center justify-between text-sm"
                >
                  <span>Class {contrib.class}:</span>
                  <div className="flex items-center gap-2">
                    <span>{contrib.totalWeight.toFixed(4)}</span>
                    <Badge variant="outline" className="text-xs">
                      {contrib.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card size="sm" className="border-y">
        <CardHeader>
          <CardTitle>Distance & Weight Table</CardTitle>
          <CardDescription>
            {state.mode === "uniform"
              ? `Top ${state.k} nearest neighbors with uniform weights`
              : `Top ${state.k} nearest neighbors with distance-based weights`}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-96 overflow-auto">
          <div className="overflow-x-auto">
            <div className="min-w-[500px] space-y-1">
              <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground border-b border-border pb-1">
                <div>Point</div>
                <div>Class</div>
                <div>Distance</div>
                <div>Weight</div>
                <div>Contribution</div>
              </div>
              {weightResults.map((result) => {
                const point = state.points.find(
                  (p) => p.id === result.pointId,
                )!;
                return (
                  <div
                    key={result.pointId}
                    className="grid grid-cols-5 gap-2 text-xs p-1 rounded bg-background/80"
                  >
                    <div className="font-medium">P{result.pointId}</div>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {point.label}
                      </Badge>
                    </div>
                    <div>{result.distance.toFixed(3)}</div>
                    <div className="font-medium">
                      {result.weight.toFixed(4)}
                    </div>
                    <div>{result.contribution.toFixed(4)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="border-y">
        <CardHeader>
          <CardTitle>Weighting Formula</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          {state.mode === "uniform" && (
            <div>
              <p className="font-medium">Uniform Weights:</p>
              <p>w_i = 1/k for i ∈ 1..k (nearest neighbors)</p>
              <p>w_i = 0 for i &gt; k</p>
            </div>
          )}

          {state.mode === "assignment" && (
            <div>
              <p className="font-medium text-red-600">
                Assignment Weights (Flawed):
              </p>
              <p>w_i = d(t_i, b) / Σ d(t_m, b)</p>
              <p className="text-red-600">
                ⚠️ Farther points get higher weights!
              </p>
            </div>
          )}

          {state.mode === "intuitive" && (
            <div>
              <p className="font-medium text-green-600">
                Inverse Distance Weights (Correct):
              </p>
              <p>w_i = (1/d(t_i, b)) / Σ (1/d(t_m, b))</p>
              <p className="text-green-600">
                ✓ Closer points get higher weights!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <SimulationLayout
      title="Weighted K-Nearest Neighbors Classification"
      controls={renderControls()}
      visualization={renderVisualization()}
      logs={renderLogs()}
    />
  );
}
