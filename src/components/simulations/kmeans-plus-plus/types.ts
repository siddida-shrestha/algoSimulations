export type Point = {
  x: number;
  y: number;
  cluster?: number;
};

export type Centroid = {
  id: number;
  x: number;
  y: number;
  sourcePointIndex?: number;
};

export type SimulationPhase =
  | "idle"
  | "initializing"
  | "clustering"
  | "converged";

export type InitializationStep =
  | "pick-first-centroid"
  | "compute-probabilities"
  | "pick-weighted-centroid"
  | "complete";

export type ProbabilityEntry = {
  pointIndex: number;
  point: Point;
  distancesToCentroids: number[];
  nearestDistance: number;
  dSquared: number;
  probability: number;
  cumulativeProbability?: number;
  selectedAsCentroid: boolean;
};

export type IterationLog = {
  id: number;
  title: string;
  detail: string;
};

export type KMeansRunState = {
  points: Point[];
  centroids: Centroid[];
  iteration: number;
  converged: boolean;
};
