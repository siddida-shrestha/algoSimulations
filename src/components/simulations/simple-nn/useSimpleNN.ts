import { useCallback, useState } from "react";

import type {
  ActivationType,
  Layer,
  NetworkState,
  StepSnapshot,
} from "./types";
import {
  computeLayerOutput,
  computeOutputLayerDeltas,
  computeHiddenLayerDeltas,
  computeLoss,
  generateSampleInput,
  initializeBiases,
  initializeWeights,
  makePrediction,
} from "./utils";

// Limits
export const LIMITS = {
  MIN_NEURONS: 1,
  MAX_NEURONS: 16,
  MIN_LAYERS: 1,
  MAX_LAYERS: 4,
} as const;

interface UseSimpleNNOptions {
  initialMode?: "single" | "multi";
  initialHiddenNeurons?: number;
  initialNumHiddenLayers?: number;
  initialActivationType?: ActivationType;
}

interface UseSimpleNNResult {
  state: NetworkState;
  setActivationType: (type: ActivationType) => void;
  setHiddenNeurons: (count: number) => void;
  setNumHiddenLayers: (count: number) => void;
  setMode: (mode: "single" | "multi") => void;
  start: () => void;
  nextStep: () => void;
  reset: () => void;
}

export function useSimpleNN({
  initialMode = "single",
  initialHiddenNeurons = 4,
  initialNumHiddenLayers = 1,
  initialActivationType = "relu",
}: UseSimpleNNOptions = {}): UseSimpleNNResult {
  const createInitialState = useCallback(
    (
      mode: "single" | "multi",
      hiddenNeurons: number,
      numHiddenLayers: number,
      activationType: ActivationType,
    ): NetworkState => {
      // Defensive validation - handle NaN, Infinity, non-numbers
      let safeHiddenNeurons = Number.isFinite(hiddenNeurons)
        ? Math.floor(hiddenNeurons)
        : 4;
      let safeNumHiddenLayers = Number.isFinite(numHiddenLayers)
        ? Math.floor(numHiddenLayers)
        : 1;

      // Apply limits to ensure valid values
      const validHiddenNeurons = Math.max(
        LIMITS.MIN_NEURONS,
        Math.min(LIMITS.MAX_NEURONS, Math.max(1, safeHiddenNeurons)),
      );
      const validNumHiddenLayers = Math.max(
        LIMITS.MIN_LAYERS,
        Math.min(LIMITS.MAX_LAYERS, Math.max(1, safeNumHiddenLayers)),
      );

      const inputSize = 4; // [GPA, Attendance, LMS, Language]
      const outputSize = 1; // Binary classification

      const layers: Layer[] = [];

      // Input layer (no computation, just data)
      const inputVector = generateSampleInput();
      const inputLayer: Layer = {
        name: "Input Layer",
        nodes: inputVector.map((val, i) => ({
          id: `input-${i}`,
          z: val,
          a: val,
          inputs: [val],
          delta: 0,
        })),
        weights: [],
        biases: [],
      };
      layers.push(inputLayer);

      // Hidden layers
      let prevSize = inputSize;
      const numLayers = mode === "single" ? 1 : validNumHiddenLayers;

      for (let i = 0; i < numLayers; i++) {
        const weights = initializeWeights(prevSize, validHiddenNeurons);
        const biases = initializeBiases(validHiddenNeurons);

        const layer: Layer = {
          name: `Hidden Layer ${i + 1}`,
          nodes: Array(validHiddenNeurons)
            .fill(0)
            .map((_, j) => ({
              id: `hidden-${i}-${j}`,
              z: 0,
              a: 0,
              inputs: [],
              delta: 0,
            })),
          weights,
          biases,
        };

        layers.push(layer);
        prevSize = validHiddenNeurons;
      }

      // Output layer
      const outputWeights = initializeWeights(prevSize, outputSize);
      const outputBiases = initializeBiases(outputSize);

      const outputLayer: Layer = {
        name: "Output Layer",
        nodes: Array(outputSize)
          .fill(0)
          .map((_, j) => ({
            id: `output-${j}`,
            z: 0,
            a: 0,
            inputs: [],
            delta: 0,
          })),
        weights: outputWeights,
        biases: outputBiases,
      };

      layers.push(outputLayer);

      // Total steps: forward pass (layers-1) + backward pass (layers-1)
      const forwardSteps = layers.length - 1;
      const maxSteps = forwardSteps * 2;

      return {
        config: {
          activationType,
          hiddenNeurons: validHiddenNeurons,
          numHiddenLayers: validNumHiddenLayers,
          mode,
        },
        layers,
        currentStep: 0,
        maxSteps,
        isRunning: false,
        history: [
          {
            step: 0,
            activeLayerIndex: 0,
            layers: JSON.parse(JSON.stringify(layers)),
            inputVector,
            phase: "forward",
          },
        ],
      };
    },
    [],
  );

  const [state, setState] = useState<NetworkState>(() =>
    createInitialState(
      initialMode,
      initialHiddenNeurons,
      initialNumHiddenLayers,
      initialActivationType,
    ),
  );

  const nextStep = useCallback(() => {
    setState((prevState) => {
      if (prevState.currentStep >= prevState.maxSteps) {
        return prevState;
      }

      const nextStepNum = prevState.currentStep + 1;
      const forwardSteps = prevState.layers.length - 1;
      const isForwardPhase = nextStepNum <= forwardSteps;

      const updatedLayers = JSON.parse(JSON.stringify(prevState.layers));
      let snapshot: StepSnapshot;
      let output: number | undefined;
      let prediction: string | undefined;
      let loss: number | undefined;

      if (isForwardPhase) {
        // Forward pass
        const nextLayerIndex = nextStepNum;
        const inputLayer = prevState.layers[nextLayerIndex - 1];
        const inputs = inputLayer.nodes.map((node) => node.a);
        const targetLayer = prevState.layers[nextLayerIndex];

        const { z, a } = computeLayerOutput(
          inputs,
          targetLayer.weights,
          targetLayer.biases,
          prevState.config.activationType,
        );

        updatedLayers[nextLayerIndex].nodes = updatedLayers[
          nextLayerIndex
        ].nodes.map((node: any, i: number) => ({
          ...node,
          z: z[i],
          a: a[i],
          inputs,
        }));

        output =
          nextLayerIndex === updatedLayers.length - 1
            ? updatedLayers[nextLayerIndex].nodes[0].a
            : undefined;
        prediction =
          nextLayerIndex === updatedLayers.length - 1
            ? makePrediction(output!)
            : undefined;

        // Calculate loss if output layer
        if (nextLayerIndex === updatedLayers.length - 1) {
          const target = output! > 0.5 ? 1 : 0; // Use prediction as pseudo-target for visualization
          loss = computeLoss(output!, target);
        }

        snapshot = {
          step: nextStepNum,
          activeLayerIndex: nextLayerIndex,
          layers: updatedLayers,
          inputVector: prevState.history[0].inputVector,
          output,
          prediction,
          phase: "forward",
          loss,
        };
      } else {
        // Backward pass
        const backwardStep = nextStepNum - forwardSteps;
        const backwardLayerIndex = forwardSteps - backwardStep + 1;

        // Start from output layer and propagate backward
        if (backwardLayerIndex === forwardSteps) {
          // Output layer - compute initial deltas
          const outputLayer = updatedLayers[forwardSteps];
          const outputValues = outputLayer.nodes.map((n: any) => n.a);
          // Use prediction as target (simplified: if predicted > 0.5, target = 1, else 0)
          const target = outputValues[0] > 0.5 ? 1 : 0;
          const targets = [target];

          const deltas = computeOutputLayerDeltas(
            outputValues,
            targets,
            prevState.config.activationType,
          );

          outputLayer.nodes = outputLayer.nodes.map((node: any, i: number) => ({
            ...node,
            delta: deltas[i],
          }));
        } else {
          // Hidden layers - propagate deltas backward
          const currentLayer = updatedLayers[backwardLayerIndex];
          const nextLayer = updatedLayers[backwardLayerIndex + 1];
          const nextLayerDeltas = nextLayer.nodes.map((n: any) => n.delta);
          const currentLayerOutputs = currentLayer.nodes.map((n: any) => n.a);

          const deltas = computeHiddenLayerDeltas(
            nextLayerDeltas,
            nextLayer.weights,
            currentLayerOutputs,
            prevState.config.activationType,
          );

          currentLayer.nodes = currentLayer.nodes.map(
            (node: any, i: number) => ({
              ...node,
              delta: deltas[i],
            }),
          );
        }

        snapshot = {
          step: nextStepNum,
          activeLayerIndex: backwardLayerIndex,
          layers: updatedLayers,
          inputVector: prevState.history[0].inputVector,
          phase: "backward",
        };
      }

      return {
        ...prevState,
        layers: updatedLayers,
        currentStep: nextStepNum,
        isRunning: true,
        history: [...prevState.history, snapshot],
      };
    });
  }, []);

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) =>
      createInitialState(
        prev.config.mode,
        prev.config.hiddenNeurons,
        prev.config.numHiddenLayers,
        prev.config.activationType,
      ),
    );
  }, [createInitialState]);

  const setActivationType = useCallback(
    (type: ActivationType) => {
      setState((prev) =>
        createInitialState(
          prev.config.mode,
          prev.config.hiddenNeurons,
          prev.config.numHiddenLayers,
          type,
        ),
      );
    },
    [createInitialState],
  );

  const setHiddenNeurons = useCallback(
    (count: number) => {
      // Defensive validation
      if (!Number.isFinite(count)) {
        console.warn(
          "[setHiddenNeurons] Invalid count:",
          count,
          "using default",
        );
        count = LIMITS.MIN_NEURONS;
      }
      // Apply limits
      const limitedCount = Math.max(
        LIMITS.MIN_NEURONS,
        Math.min(LIMITS.MAX_NEURONS, Math.floor(count)),
      );
      setState((prev) =>
        createInitialState(
          prev.config.mode,
          limitedCount,
          prev.config.numHiddenLayers,
          prev.config.activationType,
        ),
      );
    },
    [createInitialState],
  );

  const setNumHiddenLayers = useCallback(
    (count: number) => {
      // Defensive validation
      if (!Number.isFinite(count)) {
        console.warn(
          "[setNumHiddenLayers] Invalid count:",
          count,
          "using default",
        );
        count = LIMITS.MIN_LAYERS;
      }
      // Apply limits
      const limitedCount = Math.max(
        LIMITS.MIN_LAYERS,
        Math.min(LIMITS.MAX_LAYERS, Math.floor(count)),
      );
      setState((prev) =>
        createInitialState(
          prev.config.mode,
          prev.config.hiddenNeurons,
          limitedCount,
          prev.config.activationType,
        ),
      );
    },
    [createInitialState],
  );

  const setMode = useCallback(
    (mode: "single" | "multi") => {
      setState((prev) =>
        createInitialState(
          mode,
          prev.config.hiddenNeurons,
          prev.config.numHiddenLayers,
          prev.config.activationType,
        ),
      );
    },
    [createInitialState],
  );

  return {
    state,
    setActivationType,
    setHiddenNeurons,
    setNumHiddenLayers,
    setMode,
    start,
    nextStep,
    reset,
  };
}
