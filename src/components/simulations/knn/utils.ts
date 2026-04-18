import type { Neighbor, Point, QueryPoint, VoteResult } from "./types";

export const POINT_COUNT = 30;
export const CLASSES = ["A", "B", "C", "D", "E"];
export const COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"];

export function generateRandomPoints(
  count: number = POINT_COUNT,
  classCount: number = 3,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      id: i,
      x: Math.random() * 80 + 10, // 10-90 to leave margins
      y: Math.random() * 80 + 10,
      label: CLASSES[Math.floor(Math.random() * classCount)],
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

export function getKNearestNeighbors(
  points: Point[],
  query: QueryPoint,
  k: number,
): Neighbor[] {
  const neighbors: Neighbor[] = points.map((point) => ({
    point,
    distance: euclideanDistance(query, point),
  }));

  neighbors.sort((a, b) => a.distance - b.distance);
  return neighbors.slice(0, k);
}

export function getAllNeighbors(
  points: Point[],
  query: QueryPoint,
): Neighbor[] {
  return points
    .map((point) => ({
      point,
      distance: euclideanDistance(query, point),
    }))
    .sort((a, b) => a.distance - b.distance);
}

export function majorityVote(neighbors: Neighbor[]): VoteResult[] {
  const votes: Record<string, number> = {};
  neighbors.forEach((neighbor) => {
    votes[neighbor.point.label] = (votes[neighbor.point.label] || 0) + 1;
  });

  return Object.entries(votes)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function getGlobalVote(points: Point[]): VoteResult[] {
  const votes: Record<string, number> = {};
  points.forEach((point) => {
    votes[point.label] = (votes[point.label] || 0) + 1;
  });

  return Object.entries(votes)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function getClassColor(label: string): string {
  const index = CLASSES.indexOf(label);
  return COLORS[index] ?? "#7f7f7f";
}
