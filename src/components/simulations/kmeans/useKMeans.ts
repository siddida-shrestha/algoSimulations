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
  stepMode: "assign" | "move";
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
  const [stepMode, setStepMode] = useState<"assign" | "move">("assign");
  const [lastMoveShift, setLastMoveShift] = useState(Number.POSITIVE_INFINITY);

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
        stage: "assign",
        lastMoveShift: Number.POSITIVE_INFINITY,
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

      if (stepMode === "assign") {
        const assignedPoints = assignPointsToCentroids(
          prevState.points,
          prevState.centroids,
        );
        const assignmentsChanged = clusterAssignmentsChanged(
          prevState.points,
          assignedPoints,
        );
        const shouldConverge =
          !assignmentsChanged && lastMoveShift < CONVERGENCE_THRESHOLD;

        setStepMode("move");

        return {
          ...prevState,
          points: assignedPoints,
          converged: shouldConverge,
          isRunning: shouldConverge ? false : prevState.isRunning,
          stage: "move",
        };
      }

      const nextCentroids = recomputeCentroids(
        prevState.points,
        prevState.centroids,
      );
      const movement = maxCentroidShift(prevState.centroids, nextCentroids);
      const nextIteration = prevState.iteration + 1;
      const clusterCounts = getClusterCounts(prevState.points, k);

      const snapshot: IterationSnapshot = {
        iteration: nextIteration,
        centroids: nextCentroids,
        clusterCounts,
      };

      setLastMoveShift(movement);
      setStepMode("assign");

      return {
        ...prevState,
        centroids: nextCentroids,
        iteration: nextIteration,
        converged: false,
        isRunning: prevState.isRunning,
        lastMoveShift: movement,
        stage: "assign",
        history: [...prevState.history, snapshot],
      };
    });
  }, [k, lastMoveShift, stepMode]);

  const start = useCallback(() => {
    setState((prevState) => ({ ...prevState, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prevState) => ({ ...prevState, isRunning: false }));
  }, []);

  const reset = useCallback(
    (nextK = k, nextPointCount = pointCount) => {
      setStepMode("assign");
      setLastMoveShift(Number.POSITIVE_INFINITY);
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
      setStepMode("assign");
      setLastMoveShift(Number.POSITIVE_INFINITY);
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
      setStepMode("assign");
      setLastMoveShift(Number.POSITIVE_INFINITY);
      setState(createInitialState(k, boundedPointCount));
    },
    [createInitialState, k],
  );

  return {
    state,
    k,
    pointCount,
    speedMs,
    stepMode,
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
