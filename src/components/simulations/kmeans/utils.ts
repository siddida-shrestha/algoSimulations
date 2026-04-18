import type { Centroid, Point } from "./types";

export const MIN_COORD = 8;
export const MAX_COORD = 92;
export const MIN_POINT_COUNT = 150;
export const MAX_POINT_COUNT = 500;
export const DEFAULT_POINT_COUNT = 300;

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function euclideanDistance(
  a: Pick<Point, "x" | "y">,
  b: Pick<Point, "x" | "y">,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function generateRandomPoints(count = DEFAULT_POINT_COUNT): Point[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: randomInRange(MIN_COORD, MAX_COORD),
    y: randomInRange(MIN_COORD, MAX_COORD),
  }));
}

export function createRandomCentroids(points: Point[], k: number): Centroid[] {
  // Seed centroids from existing points to keep initial centers in data bounds.
  const shuffled = [...points].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, k);

  return selected.map((point, index) => ({
    id: index,
    x: point.x,
    y: point.y,
  }));
}

export function nearestCentroidIndex(
  point: Point,
  centroids: Centroid[],
): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  centroids.forEach((centroid, index) => {
    const distance = euclideanDistance(point, centroid);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function assignPointsToCentroids(
  points: Point[],
  centroids: Centroid[],
): Point[] {
  return points.map((point) => ({
    ...point,
    cluster: nearestCentroidIndex(point, centroids),
  }));
}

export function recomputeCentroids(
  points: Point[],
  centroids: Centroid[],
): Centroid[] {
  return centroids.map((centroid, centroidIndex) => {
    const assigned = points.filter((point) => point.cluster === centroidIndex);
    if (assigned.length === 0) {
      return centroid;
    }

    const sum = assigned.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 },
    );

    return {
      ...centroid,
      x: sum.x / assigned.length,
      y: sum.y / assigned.length,
    };
  });
}

export function getClusterCounts(points: Point[], k: number): number[] {
  return Array.from({ length: k }, (_, centroidIndex) => {
    return points.filter((point) => point.cluster === centroidIndex).length;
  });
}

export function maxCentroidShift(
  previous: Centroid[],
  next: Centroid[],
): number {
  return next.reduce((maxShift, centroid, index) => {
    const distance = euclideanDistance(centroid, previous[index]);
    return Math.max(maxShift, distance);
  }, 0);
}

export function clusterAssignmentsChanged(
  previous: Point[],
  next: Point[],
): boolean {
  return next.some(
    (point, index) => point.cluster !== previous[index]?.cluster,
  );
}

export function formatCentroid(centroid: Centroid): string {
  return `(${centroid.x.toFixed(1)}, ${centroid.y.toFixed(1)})`;
}
