import { useCallback, useEffect, useMemo, useState } from "react";

import type { KMeansState, IterationSnapshot } from "./types";
import {
  DEFAULT_POINT_COUNT,
  MAX_POINT_COUNT,
  MIN_POINT_COUNT,
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
  pointCount: number;
  speedMs: number;
  setK: (nextK: number) => void;
  setPointCount: (nextPointCount: number) => void;
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
  initialPointCount = DEFAULT_POINT_COUNT,
  initialSpeedMs = 700,
}: UseKMeansOptions = {}): UseKMeansResult {
  const normalizedInitialPointCount = Math.min(
    MAX_POINT_COUNT,
    Math.max(MIN_POINT_COUNT, initialPointCount),
  );

  const [k, setK] = useState(initialK);
  const [pointCount, setPointCount] = useState(normalizedInitialPointCount);
  const [speedMs, setSpeedMs] = useState(initialSpeedMs);

  const createInitialState = useCallback(
    (targetK: number, targetPointCount: number): KMeansState => {
      const points = generateRandomPoints(targetPointCount);
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
    [],
  );

  const [state, setState] = useState<KMeansState>(() =>
    createInitialState(initialK, normalizedInitialPointCount),
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
    (nextK = k, nextPointCount = pointCount) => {
      setState(createInitialState(nextK, nextPointCount));
    },
    [createInitialState, k, pointCount],
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
      setState(createInitialState(nextK, pointCount));
    },
    [createInitialState, pointCount],
  );

  const updatePointCount = useCallback(
    (nextPointCount: number) => {
      const boundedPointCount = Math.min(
        MAX_POINT_COUNT,
        Math.max(MIN_POINT_COUNT, nextPointCount),
      );

      setPointCount(boundedPointCount);
      setState(createInitialState(k, boundedPointCount));
    },
    [createInitialState, k],
  );

  return {
    state,
    k,
    pointCount,
    speedMs,
    setK: updateK,
    setPointCount: updatePointCount,
    setSpeedMs,
    step,
    start,
    pause,
    reset,
    centroidSummary,
  };
}
