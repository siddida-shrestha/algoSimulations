export interface Point {
  id: number;
  x: number;
  y: number;
  label: string;
}

export interface QueryPoint {
  x: number;
  y: number;
}

export interface Neighbor {
  point: Point;
  distance: number;
}

export interface KNNState {
  points: Point[];
  query: QueryPoint;
  mode: "1nn" | "knn" | "nn";
  k: number;
  classCount: number;
}

export interface VoteResult {
  label: string;
  count: number;
}
