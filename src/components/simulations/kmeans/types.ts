export interface Point {
  id: number;
  x: number;
  y: number;
  cluster?: number;
}

export interface Centroid {
  id: number;
  x: number;
  y: number;
}

export interface IterationSnapshot {
  iteration: number;
  centroids: Centroid[];
  clusterCounts: number[];
}

export interface KMeansState {
  points: Point[];
  centroids: Centroid[];
  iteration: number;
  converged: boolean;
  isRunning: boolean;
  stage: "assign" | "move";
  lastMoveShift: number;
  history: IterationSnapshot[];
}
