import { useCallback, useEffect, useMemo, useState } from "react";

import type { KMeansState, IterationSnapshot } from "./types";
import {
  assignPointsToCentroids,
  clusterAssignmentsChanged,
  createRandomCentroids,
  formatCentroid,
  generateRandomPoints,
  getClusterCounts,
  maxCentroidShift,
  recomputeCentroids,
} from "./utils";

interface UseKMeansOptions {
  initialK?: number;
  initialPointCount?: number;
  initialSpeedMs?: number;
}

interface UseKMeansResult {
  state: KMeansState;
  k: number;
  speedMs: number;
  setK: (nextK: number) => void;
  setSpeedMs: (nextSpeedMs: number) => void;
  step: () => void;
  start: () => void;
  pause: () => void;
  reset: (nextK?: number) => void;
  centroidSummary: string[];
}

const CONVERGENCE_THRESHOLD = 0.001;

export function useKMeans({
  initialK = 3,
  initialPointCount,
  initialSpeedMs = 700,
}: UseKMeansOptions = {}): UseKMeansResult {
  const [k, setK] = useState(initialK);
  const [speedMs, setSpeedMs] = useState(initialSpeedMs);

  const createInitialState = useCallback(
    (targetK: number): KMeansState => {
      const points = generateRandomPoints(initialPointCount);
      const centroids = createRandomCentroids(points, targetK);

      return {
        points,
        centroids,
        iteration: 0,
        converged: false,
        isRunning: false,
        history: [
          {
            iteration: 0,
            centroids,
            clusterCounts: Array.from({ length: targetK }, () => 0),
          },
        ],
      };
    },
    [initialPointCount],
  );

  const [state, setState] = useState<KMeansState>(() =>
    createInitialState(initialK),
  );

  const step = useCallback(() => {
    setState((prevState) => {
      if (prevState.converged) {
        return { ...prevState, isRunning: false };
      }

      const assignedPoints = assignPointsToCentroids(
        prevState.points,
        prevState.centroids,
      );
      const nextCentroids = recomputeCentroids(
        assignedPoints,
        prevState.centroids,
      );
      const movement = maxCentroidShift(prevState.centroids, nextCentroids);
      const assignmentsChanged = clusterAssignmentsChanged(
        prevState.points,
        assignedPoints,
      );
      const nextIteration = prevState.iteration + 1;
      const clusterCounts = getClusterCounts(assignedPoints, k);

      const shouldConverge =
        !assignmentsChanged || movement < CONVERGENCE_THRESHOLD;

      const snapshot: IterationSnapshot = {
        iteration: nextIteration,
        centroids: nextCentroids,
        clusterCounts,
      };

      return {
        ...prevState,
        points: assignedPoints,
        centroids: nextCentroids,
        iteration: nextIteration,
        converged: shouldConverge,
        isRunning: shouldConverge ? false : prevState.isRunning,
        history: [...prevState.history, snapshot],
      };
    });
  }, [k]);

  const start = useCallback(() => {
    setState((prevState) => ({ ...prevState, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prevState) => ({ ...prevState, isRunning: false }));
  }, []);

  const reset = useCallback(
    (nextK = k) => {
      setState(createInitialState(nextK));
    },
    [createInitialState, k],
  );

  useEffect(() => {
    if (!state.isRunning || state.converged) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      step();
    }, speedMs);

    return () => window.clearTimeout(timeoutId);
  }, [speedMs, state.converged, state.isRunning, step]);

  const centroidSummary = useMemo(() => {
    return state.centroids.map((centroid, index) => {
      return `C${index + 1} ${formatCentroid(centroid)}`;
    });
  }, [state.centroids]);

  const updateK = useCallback(
    (nextK: number) => {
      setK(nextK);
      setState(createInitialState(nextK));
    },
    [createInitialState],
  );

  return {
    state,
    k,
    speedMs,
    setK: updateK,
    setSpeedMs,
    step,
    start,
    pause,
    reset,
    centroidSummary,
  };
}
