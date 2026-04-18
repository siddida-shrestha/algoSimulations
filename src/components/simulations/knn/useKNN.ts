import { useCallback, useState } from "react";

import type {
  KNNState,
  Neighbor,
  Point,
  QueryPoint,
  VoteResult,
} from "./types";
import {
  CLASSES,
  generateRandomPoints,
  getAllNeighbors,
  getGlobalVote,
  getKNearestNeighbors,
  majorityVote,
} from "./utils";

interface UseKNNResult {
  state: KNNState;
  setMode: (mode: KNNState["mode"]) => void;
  setK: (k: number) => void;
  setPointCount: (count: number) => void;
  setClassCount: (count: number) => void;
  setQuery: (query: QueryPoint) => void;
  resetPoints: () => void;
  addRandomPoint: () => void;
  addPoint: (point: Omit<Point, "id">) => void;
  removePoint: (id: number) => void;
  updatePointLabel: (id: number, label: string) => void;
  neighbors: Neighbor[];
  votes: VoteResult[];
  prediction: string | null;
}

export function useKNN(): UseKNNResult {
  const [state, setState] = useState<KNNState>({
    points: generateRandomPoints(75), // Start with 75 points
    query: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }, // Random initial position
    mode: "1nn",
    k: 5,
    classCount: 3,
  });

  const setMode = useCallback((mode: KNNState["mode"]) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setK = useCallback((k: number) => {
    setState((prev) => {
      const maxK = Math.max(1, prev.points.length - 1);
      return {
        ...prev,
        k: Math.max(1, Math.min(maxK, k)),
      };
    });
  }, []);

  const setPointCount = useCallback((count: number) => {
    const clampedCount = Math.max(50, Math.min(100, count));
    setState((prev) => {
      const nextPointCount = clampedCount;
      const adjustedK = Math.min(prev.k, Math.max(1, nextPointCount - 1));
      return {
        ...prev,
        points: generateRandomPoints(nextPointCount, prev.classCount),
        query: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }, // Randomize query point when dataset changes
        k: adjustedK,
      };
    });
  }, []);

  const setClassCount = useCallback((count: number) => {
    const clampedCount = Math.max(2, Math.min(5, count));
    setState((prev) => ({
      ...prev,
      classCount: clampedCount,
      points: generateRandomPoints(prev.points.length, clampedCount),
      query: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }, // Randomize query point when classes change
    }));
  }, []);

  const setQuery = useCallback((query: QueryPoint) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const resetPoints = useCallback(() => {
    setState((prev) => ({
      ...prev,
      points: generateRandomPoints(state.points.length, prev.classCount),
      query: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }, // Randomize query point too
    }));
  }, [state.points.length]);

  const addPoint = useCallback((point: Omit<Point, "id">) => {
    setState((prev) => ({
      ...prev,
      points: [
        ...prev.points,
        { ...point, id: Math.max(...prev.points.map((p) => p.id)) + 1 },
      ],
    }));
  }, []);

  const addRandomPoint = useCallback(() => {
    setState((prev) => {
      const newPoint = {
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        label: CLASSES[Math.floor(Math.random() * prev.classCount)],
      };
      return {
        ...prev,
        points: [
          ...prev.points,
          { ...newPoint, id: Math.max(...prev.points.map((p) => p.id)) + 1 },
        ],
      };
    });
  }, []);

  const removePoint = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      points: prev.points.filter((p) => p.id !== id),
    }));
  }, []);

  const updatePointLabel = useCallback((id: number, label: string) => {
    setState((prev) => ({
      ...prev,
      points: prev.points.map((p) => (p.id === id ? { ...p, label } : p)),
    }));
  }, []);

  const neighbors =
    state.mode === "nn"
      ? getAllNeighbors(state.points, state.query)
      : getKNearestNeighbors(
          state.points,
          state.query,
          state.mode === "1nn" ? 1 : state.k,
        );

  const votes =
    state.mode === "nn" ? getGlobalVote(state.points) : majorityVote(neighbors);

  const prediction = votes.length > 0 ? votes[0].label : null;

  return {
    state,
    setMode,
    setK,
    setPointCount,
    setClassCount,
    setQuery,
    resetPoints,
    addRandomPoint,
    addPoint,
    removePoint,
    updatePointLabel,
    neighbors,
    votes,
    prediction,
  };
}
