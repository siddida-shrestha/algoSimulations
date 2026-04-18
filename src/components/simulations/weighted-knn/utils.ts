import type { Neighbor, Point, QueryPoint } from "./types";

export const POINT_COUNT = 30;
export const CLASSES: number[] = [0, 1, 2, 3, 4];
export const COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"];

export function generateRandomPoints(
  count: number = POINT_COUNT,
  classCount: number = 2,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      id: i,
      x: Math.random() * 80 + 10, // 10-90 to leave margins
      y: Math.random() * 80 + 10,
      label: Math.floor(Math.random() * classCount),
    });
  }
  return points;
}

export function euclideanDistance(
  a: Point | QueryPoint,
  b: Point | QueryPoint,
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function getAllNeighbors(
  points: Point[],
  query: QueryPoint,
): Neighbor[] {
  return points
    .map((point) => ({
      point,
      distance: euclideanDistance(query, point),
      weight: 0, // Will be calculated based on mode
    }))
    .sort((a, b) => a.distance - b.distance);
}

export function getKNearestNeighbors(
  points: Point[],
  query: QueryPoint,
  k: number,
): Neighbor[] {
  const neighbors = getAllNeighbors(points, query);
  return neighbors.slice(0, k);
}

// Assignment weighting: w_i = |t_i - b| / Σ |t_m - b|
// This gives larger weights to FARTHER points (intentionally flawed)
export function calculateAssignmentWeights(neighbors: Neighbor[]): Neighbor[] {
  const totalDistance = neighbors.reduce((sum, n) => sum + n.distance, 0);

  return neighbors.map((neighbor) => ({
    ...neighbor,
    weight: totalDistance > 0 ? neighbor.distance / totalDistance : 0,
  }));
}

// Intuitive weighting: w_i = 1/d(t_i,b) / Σ 1/d(t_m,b)
// This gives larger weights to CLOSER points
export function calculateInverseDistanceWeights(
  neighbors: Neighbor[],
): Neighbor[] {
  const totalInverseDistance = neighbors.reduce(
    (sum, n) => sum + (n.distance > 0 ? 1 / n.distance : 0),
    0,
  );

  return neighbors.map((neighbor) => ({
    ...neighbor,
    weight:
      totalInverseDistance > 0 && neighbor.distance > 0
        ? 1 / neighbor.distance / totalInverseDistance
        : 0,
  }));
}

// Uniform weights for standard KNN
export function calculateUniformWeights(
  neighbors: Neighbor[],
  k: number,
): Neighbor[] {
  const uniformWeight = 1 / k;

  return neighbors.map((neighbor, index) => ({
    ...neighbor,
    weight: index < k ? uniformWeight : 0,
  }));
}

export function getClassColor(label: number): string {
  return COLORS[label] ?? "#7f7f7f";
}

export function getWeightVisualizationProps(weight: number, maxWeight: number) {
  const normalizedWeight = maxWeight > 0 ? weight / maxWeight : 0;

  return {
    radius: 0.45 + normalizedWeight * 0.55, // 0.45 to 1.0
    opacity: 0.7 + normalizedWeight * 0.25, // 0.7 to 0.95
    strokeWidth: normalizedWeight * 0.18, // 0 to 0.18
  };
}

export function getDistanceVisualizationProps(
  distance: number,
  maxDistance: number,
) {
  const normalizedDistance = maxDistance > 0 ? distance / maxDistance : 0;

  return {
    opacity: Math.max(0.1, 1 - normalizedDistance * 0.8), // 0.1 to 1.0
    strokeWidth: 0.2 + normalizedDistance * 0.2, // 0.2 to 0.4
  };
}
