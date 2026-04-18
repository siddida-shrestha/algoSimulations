import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimulationLayout } from "@/components/simulations/SimulationLayout";

import { useKNN } from "./useKNN";
import { CLASSES, getClassColor } from "./utils";

export function KNNComparisonSimulation() {
  const {
    state,
    setMode,
    setK,
    setPointCount,
    setClassCount,
    setQuery,
    updatePointLabel,
    neighbors,
    votes,
    prediction,
  } = useKNN();

  const maxK = Math.max(1, state.points.length - 1);
  const [dragging, setDragging] = useState(false);

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
          {neighbors.map((neighbor) => (
            <line
              key={`line-${neighbor.point.id}`}
              x1={state.query.x}
              y1={state.query.y}
              x2={neighbor.point.x}
              y2={neighbor.point.y}
              stroke={getClassColor(neighbor.point.label)}
              strokeOpacity={0.22}
              strokeWidth={0.3}
              style={{ transition: "all 420ms ease" }}
            />
          ))}

          {/* Points */}
          {state.points.map((point) => {
            const isNeighbor = neighbors.some((n) => n.point.id === point.id);
            const nextLabel =
              CLASSES[(CLASSES.indexOf(point.label) + 1) % state.classCount];
            return (
              <circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={isNeighbor ? 0.55 * 1.15 : 0.55}
                fill={getClassColor(point.label)}
                fillOpacity={isNeighbor ? 1 : 0.7}
                stroke="none"
                style={{
                  transition: "fill 320ms ease, cx 420ms ease, cy 420ms ease",
                  cursor: "pointer",
                }}
                onClick={() => updatePointLabel(point.id, nextLabel)}
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
    </div>
  );

  const renderExplanation = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Query Point</h4>
        <p className="text-sm text-muted-foreground">
          ({state.query.x.toFixed(1)}, {state.query.y.toFixed(1)})
        </p>
      </div>

      {state.mode !== "nn" && (
        <div>
          <h4 className="font-medium">Neighbors</h4>
          <div className="space-y-1">
            {neighbors
              .slice(0, state.mode === "knn" ? state.k : neighbors.length)
              .map((neighbor, index) => (
                <div
                  key={neighbor.point.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {index + 1}. {neighbor.point.label}
                  </span>
                  <Badge variant="outline">
                    {neighbor.distance.toFixed(2)}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium">Votes</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Count of each class (
          {state.mode === "nn" ? "all points" : "selected neighbors"})
        </p>
        <div className="space-y-1">
          {votes.map((vote) => (
            <div
              key={vote.label}
              className="flex items-center justify-between text-sm"
            >
              <span style={{ color: getClassColor(vote.label) }}>
                {vote.label}
              </span>
              <Badge variant="outline">{vote.count}</Badge>
            </div>
          ))}
        </div>
      </div>

      {prediction && (
        <div>
          <h4 className="font-medium">Prediction</h4>
          <Badge style={{ backgroundColor: getClassColor(prediction) }}>
            {prediction}
          </Badge>
        </div>
      )}
    </div>
  );

  return (
    <SimulationLayout
      title="K-Nearest Neighbors Classification"
      controls={
        <Tabs
          value={state.mode}
          onValueChange={(value) => setMode(value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1nn">1-NN</TabsTrigger>
            <TabsTrigger value="knn">K-NN</TabsTrigger>
            <TabsTrigger value="nn">n-NN</TabsTrigger>
          </TabsList>

          <TabsContent value="1nn" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Classify using the nearest neighbor.
            </p>
          </TabsContent>

          <TabsContent value="knn" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">K</p>
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
            <p className="text-sm text-muted-foreground">
              Classify using majority vote of {state.k} nearest neighbors.
            </p>
          </TabsContent>

          <TabsContent value="nn" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Classify using global majority vote of all {state.points.length}{" "}
              points.
            </p>
          </TabsContent>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Data Points</p>
                <Badge variant="outline">{state.points.length}</Badge>
              </div>
              <Slider
                min={50}
                max={100}
                step={5}
                value={[state.points.length]}
                onValueChange={(value) => {
                  const nextValue = Array.isArray(value) ? value[0] : value;
                  setPointCount(nextValue ?? state.points.length);
                }}
                aria-label="Number of data points"
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

            <Button
              onClick={() =>
                setQuery({
                  x: Math.random() * 80 + 10,
                  y: Math.random() * 80 + 10,
                })
              }
              variant="outline"
              className="w-full"
            >
              Randomize Query Point
            </Button>
          </div>
        </Tabs>
      }
      visualization={renderVisualization()}
      logs={renderExplanation()}
    />
  );
}
