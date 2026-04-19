export interface Point {
  id: number;
  x: number;
  y: number;
  label: number;
}

export interface QueryPoint {
  x: number;
  y: number;
}

export interface Neighbor {
  point: Point;
  distance: number;
  weight: number;
}

export interface WeightedKNNState {
  points: Point[];
  query: QueryPoint;
  mode: "uniform" | "assignment" | "intuitive";
  k: number;
  classCount: number;
  showDistances: boolean;
  showWeights: boolean;
}

export interface WeightResult {
  pointId: number;
  distance: number;
  weight: number;
  contribution: number;
}

export interface ClassContribution {
  class: number;
  totalWeight: number;
  percentage: number;
}

export interface PredictionResult {
  predictedClass: number;
  confidence: number;
  contributions: ClassContribution[];
}
