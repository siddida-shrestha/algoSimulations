import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  Centroid,
  InitializationStep,
  IterationLog,
  KMeansRunState,
  ProbabilityEntry,
  SimulationPhase,
} from "./types";
import {
  DEFAULT_POINT_COUNT,
  MAX_POINT_COUNT,
  MIN_POINT_COUNT,
  MIN_CLUSTER_ITERATIONS,
  buildProbabilityEntries,
  createCentroidFromPoint,
  createRandomCentroids,
  generateRandomPoints,
  pointLabel,
  selectWeightedPoint,
  stepKMeans,
} from "./utils";

interface UseKMeansPlusPlusOptions {
  initialK?: number;
  initialPointCount?: number;
  initialSpeedMs?: number;
}

interface UseKMeansPlusPlusResult {
  points: KMeansRunState["points"];
  centroids: Centroid[];
  randomRun: KMeansRunState;
  phase: SimulationPhase;
  initializationStep: InitializationStep;
  probabilityEntries: ProbabilityEntry[];
  topProbabilityEntries: ProbabilityEntry[];
  latestSelectedPointIndex?: number;
  logs: IterationLog[];
  clusterIteration: number;
  k: number;
  pointCount: number;
  speedMs: number;
  compareEnabled: boolean;
  autoPlay: boolean;
  setK: (value: number) => void;
  setPointCount: (value: number) => void;
  setSpeedMs: (value: number) => void;
  setCompareEnabled: (enabled: boolean) => void;
  startInitialization: () => void;
  nextStep: () => void;
  toggleAutoPlay: () => void;
  reset: () => void;
}

let logCounter = 0;

function makeLog(title: string, detail: string): IterationLog {
  logCounter += 1;
  return {
    id: logCounter,
    title,
    detail,
  };
}

function createInitialRun(
  pointCount: number,
  k: number,
): {
  points: KMeansRunState["points"];
  randomRun: KMeansRunState;
} {
  const points = generateRandomPoints(pointCount);

  return {
    points,
    randomRun: {
      points: points.map((point) => ({ ...point })),
      centroids: createRandomCentroids(points, k),
      iteration: 0,
      converged: false,
    },
  };
}

export function useKMeansPlusPlus({
  initialK = 3,
  initialPointCount = DEFAULT_POINT_COUNT,
  initialSpeedMs = 700,
}: UseKMeansPlusPlusOptions = {}): UseKMeansPlusPlusResult {
  const normalizedInitialPointCount = Math.min(
    MAX_POINT_COUNT,
    Math.max(MIN_POINT_COUNT, initialPointCount),
  );

  const [k, setK] = useState(initialK);
  const [pointCount, setPointCount] = useState(normalizedInitialPointCount);
  const [speedMs, setSpeedMs] = useState(initialSpeedMs);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const initial = useMemo(
    () => createInitialRun(normalizedInitialPointCount, initialK),
    [initialK, normalizedInitialPointCount],
  );

  const [points, setPoints] = useState(initial.points);
  const [centroids, setCentroids] = useState<Centroid[]>([]);
  const [randomRun, setRandomRun] = useState<KMeansRunState>(initial.randomRun);
  const [phase, setPhase] = useState<SimulationPhase>("idle");
  const [initializationStep, setInitializationStep] =
    useState<InitializationStep>("pick-first-centroid");
  const [probabilityEntries, setProbabilityEntries] = useState<
    ProbabilityEntry[]
  >([]);
  const [latestSelectedPointIndex, setLatestSelectedPointIndex] =
    useState<number>();
  const [clusterIteration, setClusterIteration] = useState(0);
  const [logs, setLogs] = useState<IterationLog[]>([
    makeLog(
      "Ready",
      "Press Start Initialization to begin K-Means++ centroid selection.",
    ),
  ]);

  const reset = useCallback(() => {
    const next = createInitialRun(pointCount, k);

    setPoints(next.points);
    setCentroids([]);
    setRandomRun(next.randomRun);
    setPhase("idle");
    setInitializationStep("pick-first-centroid");
    setProbabilityEntries([]);
    setLatestSelectedPointIndex(undefined);
    setClusterIteration(0);
    setAutoPlay(false);
    setLogs([
      makeLog(
        "Reset",
        "Dataset regenerated. Start initialization to pick the first centroid.",
      ),
    ]);
  }, [k, pointCount]);

  const setKAndReset = useCallback(
    (value: number) => {
      setK(value);

      const next = createInitialRun(pointCount, value);
      setPoints(next.points);
      setCentroids([]);
      setRandomRun(next.randomRun);
      setPhase("idle");
      setInitializationStep("pick-first-centroid");
      setProbabilityEntries([]);
      setLatestSelectedPointIndex(undefined);
      setClusterIteration(0);
      setAutoPlay(false);
      setLogs([
        makeLog(
          "k Updated",
          `k set to ${value}. Dataset reset for a fresh initialization run.`,
        ),
      ]);
    },
    [pointCount],
  );

  const setPointCountAndReset = useCallback(
    (value: number) => {
      const boundedPointCount = Math.min(
        MAX_POINT_COUNT,
        Math.max(MIN_POINT_COUNT, value),
      );

      setPointCount(boundedPointCount);

      const next = createInitialRun(boundedPointCount, k);
      setPoints(next.points);
      setCentroids([]);
      setRandomRun(next.randomRun);
      setPhase("idle");
      setInitializationStep("pick-first-centroid");
      setProbabilityEntries([]);
      setLatestSelectedPointIndex(undefined);
      setClusterIteration(0);
      setAutoPlay(false);
      setLogs([
        makeLog(
          "Point Count Updated",
          `Point count set to ${boundedPointCount}. Dataset reset for both Random and K-Means++ runs.`,
        ),
      ]);
    },
    [k],
  );

  const startInitialization = useCallback(() => {
    if (phase !== "idle") {
      return;
    }

    const firstPointIndex = Math.floor(Math.random() * points.length);
    const firstCentroid = createCentroidFromPoint(points, firstPointIndex, 0);

    setCentroids([firstCentroid]);
    setLatestSelectedPointIndex(firstPointIndex);
    setPhase("initializing");
    setInitializationStep("compute-probabilities");
    setLogs((prev) => [
      makeLog(
        "Initialization Step 1",
        `Selected first centroid at Point ${pointLabel(firstPointIndex)} (${firstCentroid.x.toFixed(1)}, ${firstCentroid.y.toFixed(1)}).`,
      ),
      ...prev,
    ]);
  }, [phase, points]);

  const stepRandomIfNeeded = useCallback(() => {
    setRandomRun((prev) => {
      if (prev.converged) {
        return prev;
      }

      const stepped = stepKMeans(prev, MIN_CLUSTER_ITERATIONS);
      return stepped.next;
    });
  }, []);

  const nextStep = useCallback(() => {
    if (phase === "idle") {
      startInitialization();
      return;
    }

    if (phase === "initializing") {
      if (centroids.length >= k) {
        setPhase("clustering");
        setInitializationStep("complete");
        setLogs((prev) => [
          makeLog(
            "Initialization Complete",
            `Selected ${k} centroids. Transitioning to standard K-Means iterations.`,
          ),
          ...prev,
        ]);
        return;
      }

      if (initializationStep === "compute-probabilities") {
        const entries = buildProbabilityEntries(points, centroids);
        const best = [...entries].sort(
          (a, b) => b.probability - a.probability,
        )[0];

        setProbabilityEntries(entries);
        setInitializationStep("pick-weighted-centroid");
        setLogs((prev) => [
          makeLog(
            "Initialization Step 2",
            best
              ? `Computed D(x)^2 and P(x). Highest probability region near Point ${pointLabel(best.pointIndex)} with P=${best.probability.toFixed(3)}.`
              : "Computed D(x)^2 and P(x) for all points.",
          ),
          ...prev,
        ]);
        return;
      }

      if (initializationStep === "pick-weighted-centroid") {
        const selection = selectWeightedPoint(probabilityEntries);
        const nextCentroid = createCentroidFromPoint(
          points,
          selection.pointIndex,
          centroids.length,
        );

        setCentroids((prev) => [...prev, nextCentroid]);
        setLatestSelectedPointIndex(selection.pointIndex);
        setInitializationStep("compute-probabilities");
        setLogs((prev) => [
          makeLog(
            "Initialization Step 4",
            `Weighted selection chose Point ${pointLabel(selection.pointIndex)} (roll=${selection.randomRoll.toFixed(3)}).`,
          ),
          ...prev,
        ]);

        if (centroids.length + 1 >= k) {
          setPhase("clustering");
          setInitializationStep("complete");
          setLogs((prev) => [
            makeLog(
              "Initialization Step 5",
              `k centroids selected (${k}). Ready for cluster assignment and centroid updates.`,
            ),
            ...prev,
          ]);
        }
        return;
      }

      return;
    }

    if (phase === "clustering") {
      const current: KMeansRunState = {
        points,
        centroids,
        iteration: clusterIteration,
        converged: false,
      };
      const stepped = stepKMeans(current, MIN_CLUSTER_ITERATIONS);

      setPoints(stepped.next.points);
      setCentroids(stepped.next.centroids);
      setClusterIteration(stepped.next.iteration);

      if (compareEnabled) {
        stepRandomIfNeeded();
      }

      const movementSummary = stepped.next.centroids
        .map((centroid, index) => {
          const previous = current.centroids[index] ?? centroid;
          return `C${index + 1} (${previous.x.toFixed(1)}, ${previous.y.toFixed(1)}) -> (${centroid.x.toFixed(1)}, ${centroid.y.toFixed(1)})`;
        })
        .join(" | ");

      setLogs((prev) => [
        makeLog(
          `Iteration ${stepped.next.iteration}`,
          `${movementSummary}. Assignment changes: ${stepped.changedAssignments}.`,
        ),
        ...prev,
      ]);

      if (stepped.next.converged) {
        setPhase("converged");
        setAutoPlay(false);
        setLogs((prev) => [
          makeLog(
            "Converged",
            `Converged after ${stepped.next.iteration} iterations with minimum ${MIN_CLUSTER_ITERATIONS} iterations enforced.`,
          ),
          ...prev,
        ]);
      }

      return;
    }

    if (phase === "converged") {
      setAutoPlay(false);
    }
  }, [
    centroids,
    clusterIteration,
    compareEnabled,
    initializationStep,
    k,
    phase,
    points,
    probabilityEntries,
    startInitialization,
    stepRandomIfNeeded,
  ]);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!autoPlay) {
      return;
    }

    if (phase === "converged") {
      setAutoPlay(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      nextStep();
    }, speedMs);

    return () => window.clearTimeout(timeout);
  }, [autoPlay, nextStep, phase, speedMs]);

  const topProbabilityEntries = useMemo(() => {
    return [...probabilityEntries]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10);
  }, [probabilityEntries]);

  return {
    points,
    centroids,
    randomRun,
    phase,
    initializationStep,
    probabilityEntries,
    topProbabilityEntries,
    latestSelectedPointIndex,
    logs,
    clusterIteration,
    k,
    pointCount,
    speedMs,
    compareEnabled,
    autoPlay,
    setK: setKAndReset,
    setPointCount: setPointCountAndReset,
    setSpeedMs,
    setCompareEnabled,
    startInitialization,
    nextStep,
    toggleAutoPlay,
    reset,
  };
}
