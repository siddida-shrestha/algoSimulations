import { useCallback, useMemo, useState } from "react";

import type {
  ClassContribution,
  Neighbor,
  Point,
  PredictionResult,
  QueryPoint,
  WeightedKNNState,
  WeightResult,
} from "./types";
import {
  calculateAssignmentWeights,
  calculateInverseDistanceWeights,
  calculateUniformWeights,
  generateRandomPoints,
  getKNearestNeighbors,
} from "./utils";

interface UseWeightedKNNResult {
  state: WeightedKNNState;
  setMode: (mode: WeightedKNNState["mode"]) => void;
  setK: (k: number) => void;
  setPointCount: (count: number) => void;
  setClassCount: (count: number) => void;
  setQuery: (query: QueryPoint) => void;
  setShowDistances: (show: boolean) => void;
  setShowWeights: (show: boolean) => void;
  resetPoints: () => void;
  addRandomPoint: () => void;
  addPoint: (point: Omit<Point, "id">) => void;
  removePoint: (id: number) => void;
  updatePointLabel: (id: number, label: number) => void;
  neighbors: Neighbor[];
  weightResults: WeightResult[];
  prediction: PredictionResult | null;
}

export function useWeightedKNN(): UseWeightedKNNResult {
  const [state, setState] = useState<WeightedKNNState>(() => ({
    points: generateRandomPoints(30), // Start with 30 points
    query: { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }, // Random initial position
    mode: "uniform",
    k: 5,
    classCount: 2,
    showDistances: true,
    showWeights: true,
  }));

  const setMode = useCallback((mode: WeightedKNNState["mode"]) => {
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
    const clampedCount = Math.max(25, Math.min(300, count));
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

  const setShowDistances = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showDistances: show }));
  }, []);

  const setShowWeights = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showWeights: show }));
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
        label: Math.floor(Math.random() * prev.classCount),
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

  const updatePointLabel = useCallback((id: number, label: number) => {
    setState((prev) => ({
      ...prev,
      points: prev.points.map((p) => (p.id === id ? { ...p, label } : p)),
    }));
  }, []);

  // Calculate neighbors and weights based on current mode
  const neighbors = useMemo(() => {
    let baseNeighbors: Neighbor[];

    if (state.mode === "uniform") {
      baseNeighbors = getKNearestNeighbors(state.points, state.query, state.k);
      return calculateUniformWeights(baseNeighbors, state.k);
    } else {
      // For weighted KNN, first get K nearest neighbors, then apply weighting
      baseNeighbors = getKNearestNeighbors(state.points, state.query, state.k);

      if (state.mode === "assignment") {
        return calculateAssignmentWeights(baseNeighbors);
      } else if (state.mode === "intuitive") {
        return calculateInverseDistanceWeights(baseNeighbors);
      }
    }

    return baseNeighbors;
  }, [state.points, state.query, state.mode, state.k]);

  // Calculate weight results for display
  const weightResults = useMemo(() => {
    return neighbors.map((neighbor) => ({
      pointId: neighbor.point.id,
      distance: neighbor.distance,
      weight: neighbor.weight,
      contribution: neighbor.weight, // For now, contribution equals weight
    }));
  }, [neighbors]);

  // Calculate prediction
  const prediction = useMemo((): PredictionResult | null => {
    if (neighbors.length === 0) return null;

    const contributions: Record<number, number> = {};
    for (let i = 0; i < state.classCount; i++) {
      contributions[i] = 0;
    }

    neighbors.forEach((neighbor) => {
      contributions[neighbor.point.label] += neighbor.weight;
    });

    const classContributions: ClassContribution[] = [
      {
        class: 0 as 0 | 1,
        totalWeight: contributions[0],
        percentage:
          (contributions[0] / (contributions[0] + contributions[1])) * 100,
      },
      {
        class: 1 as 0 | 1,
        totalWeight: contributions[1],
        percentage:
          (contributions[1] / (contributions[0] + contributions[1])) * 100,
      },
    ].sort((a, b) => b.totalWeight - a.totalWeight);

    const predictedClass = classContributions[0].class;
    const confidence = classContributions[0].percentage;

    return {
      predictedClass,
      confidence,
      contributions: classContributions,
    };
  }, [neighbors]);

  return {
    state,
    setMode,
    setK,
    setPointCount,
    setClassCount,
    setQuery,
    setShowDistances,
    setShowWeights,
    resetPoints,
    addRandomPoint,
    addPoint,
    removePoint,
    updatePointLabel,
    neighbors,
    weightResults,
    prediction,
  };
}
