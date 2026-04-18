import type {
  Centroid,
  KMeansRunState,
  Point,
  ProbabilityEntry,
} from "./types";

export const MIN_COORD = 8;
export const MAX_COORD = 92;
export const MIN_POINT_COUNT = 150;
export const MAX_POINT_COUNT = 500;
export const DEFAULT_POINT_COUNT = 200;
export const MIN_CLUSTER_ITERATIONS = 4;

export function euclidean(
  a: Pick<Point, "x" | "y">,
  b: Pick<Point, "x" | "y">,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generateRandomPoints(count = DEFAULT_POINT_COUNT): Point[] {
  return Array.from({ length: count }, () => ({
    x: randomInRange(MIN_COORD, MAX_COORD),
    y: randomInRange(MIN_COORD, MAX_COORD),
  }));
}

export function pointLabel(index: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letter = alphabet[index % alphabet.length] ?? "A";
  const suffix = Math.floor(index / alphabet.length);
  return suffix === 0 ? letter : `${letter}${suffix}`;
}

export function assignPointsToNearestCentroid(
  points: Point[],
  centroids: Centroid[],
): { points: Point[]; changedAssignments: number } {
  let changedAssignments = 0;

  const assignedPoints = points.map((point) => {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    centroids.forEach((centroid, index) => {
      const distance = euclidean(point, centroid);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (point.cluster !== nearestIndex) {
      changedAssignments += 1;
    }

    return {
      ...point,
      cluster: nearestIndex,
    };
  });

  return { points: assignedPoints, changedAssignments };
}

export function clusterAssignmentsChanged(
  previous: Point[],
  next: Point[],
): boolean {
  return next.some(
    (point, index) => point.cluster !== previous[index]?.cluster,
  );
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
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y,
      }),
      { x: 0, y: 0 },
    );

    return {
      ...centroid,
      x: sum.x / assigned.length,
      y: sum.y / assigned.length,
      sourcePointIndex: undefined,
    };
  });
}

export function centroidShift(previous: Centroid[], next: Centroid[]): number {
  return next.reduce((maxShift, centroid, index) => {
    const shift = euclidean(centroid, previous[index] ?? centroid);
    return Math.max(maxShift, shift);
  }, 0);
}

export function createCentroidFromPoint(
  points: Point[],
  pointIndex: number,
  id: number,
): Centroid {
  const point = points[pointIndex];
  return {
    id,
    x: point?.x ?? 0,
    y: point?.y ?? 0,
    sourcePointIndex: pointIndex,
  };
}

export function createRandomCentroids(points: Point[], k: number): Centroid[] {
  const shuffledIndices = points
    .map((_, index) => index)
    .sort(() => Math.random() - 0.5);
  const selected = shuffledIndices.slice(0, k);

  return selected.map((pointIndex, centroidIndex) =>
    createCentroidFromPoint(points, pointIndex, centroidIndex),
  );
}

export function buildProbabilityEntries(
  points: Point[],
  centroids: Centroid[],
): ProbabilityEntry[] {
  const selectedIndices = new Set(
    centroids
      .map((centroid) => centroid.sourcePointIndex)
      .filter((index): index is number => typeof index === "number"),
  );

  const entries = points.map((point, pointIndex) => {
    const distances = centroids.map((centroid) => euclidean(point, centroid));
    const nearestDistance = distances.length > 0 ? Math.min(...distances) : 0;
    const dSquared = selectedIndices.has(pointIndex) ? 0 : nearestDistance ** 2;

    return {
      pointIndex,
      point,
      distancesToCentroids: distances,
      nearestDistance,
      dSquared,
      probability: 0,
      selectedAsCentroid: selectedIndices.has(pointIndex),
    };
  });

  const dSquaredSum = entries.reduce((sum, entry) => sum + entry.dSquared, 0);

  return entries.map((entry) => ({
    ...entry,
    probability: dSquaredSum > 0 ? entry.dSquared / dSquaredSum : 0,
  }));
}

export function selectWeightedPoint(entries: ProbabilityEntry[]): {
  pointIndex: number;
  randomRoll: number;
} {
  const weightedEntries = entries.filter((entry) => entry.probability > 0);

  if (weightedEntries.length === 0) {
    const fallback =
      entries.find((entry) => !entry.selectedAsCentroid) ?? entries[0];
    return { pointIndex: fallback?.pointIndex ?? 0, randomRoll: 0 };
  }

  const roll = Math.random();
  let cumulative = 0;

  for (const entry of weightedEntries) {
    cumulative += entry.probability;
    if (roll <= cumulative) {
      return { pointIndex: entry.pointIndex, randomRoll: roll };
    }
  }

  const last = weightedEntries[weightedEntries.length - 1];
  return { pointIndex: last?.pointIndex ?? 0, randomRoll: roll };
}

export function stepKMeans(
  current: KMeansRunState,
  minIterations = MIN_CLUSTER_ITERATIONS,
): {
  next: KMeansRunState;
  changedAssignments: number;
  maxShift: number;
} {
  const assigned = assignPointsToNearestCentroid(
    current.points,
    current.centroids,
  );
  const nextCentroids = recomputeCentroids(assigned.points, current.centroids);
  const maxShift = centroidShift(current.centroids, nextCentroids);
  const nextIteration = current.iteration + 1;

  const converged =
    nextIteration >= minIterations &&
    (assigned.changedAssignments === 0 || maxShift < 0.0001);

  return {
    next: {
      points: assigned.points,
      centroids: nextCentroids,
      iteration: nextIteration,
      converged,
    },
    changedAssignments: assigned.changedAssignments,
    maxShift,
  };
}

export function calculateInertia(
  points: Point[],
  centroids: Centroid[],
): number {
  return points.reduce((sum, point) => {
    if (point.cluster === undefined) return sum;
    const centroid = centroids[point.cluster];
    const distance = euclidean(point, centroid);
    return sum + distance * distance;
  }, 0);
}

export function calculateDunnIndex(
  points: Point[],
  centroids: Centroid[],
): number {
  if (centroids.length < 2) return 0;

  // Calculate intra-cluster distances (max distance within each cluster)
  const intraDistances = centroids.map((_, clusterIndex) => {
    const clusterPoints = points.filter((p) => p.cluster === clusterIndex);
    if (clusterPoints.length < 2) return 0;

    let maxDist = 0;
    for (let i = 0; i < clusterPoints.length; i++) {
      for (let j = i + 1; j < clusterPoints.length; j++) {
        const dist = euclidean(clusterPoints[i], clusterPoints[j]);
        maxDist = Math.max(maxDist, dist);
      }
    }
    return maxDist;
  });

  const maxIntraDistance = Math.max(...intraDistances);

  // Calculate inter-cluster distances (min distance between centroids)
  let minInterDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < centroids.length; i++) {
    for (let j = i + 1; j < centroids.length; j++) {
      const dist = euclidean(centroids[i], centroids[j]);
      minInterDistance = Math.min(minInterDistance, dist);
    }
  }

  return maxIntraDistance > 0 ? minInterDistance / maxIntraDistance : 0;
}
