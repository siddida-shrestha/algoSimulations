import type { ActivationType } from "./types";

// Activation functions
export function relu(x: number): number {
  return Math.max(0, x);
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function tanh(x: number): number {
  return Math.tanh(x);
}

export function activate(x: number, type: ActivationType): number {
  switch (type) {
    case "relu":
      return relu(x);
    case "sigmoid":
      return sigmoid(x);
    case "tanh":
      return tanh(x);
    default:
      return x;
  }
}

// Activation derivatives
export function reluDerivative(x: number): number {
  return x > 0 ? 1 : 0;
}

export function sigmoidDerivative(a: number): number {
  return a * (1 - a); // derivative in terms of output
}

export function tanhDerivative(a: number): number {
  return 1 - a * a; // derivative in terms of output
}

export function activationDerivative(a: number, type: ActivationType): number {
  switch (type) {
    case "relu":
      // We need z value for relu, but we'll use approximation
      return a > 0 ? 1 : 0;
    case "sigmoid":
      return sigmoidDerivative(a);
    case "tanh":
      return tanhDerivative(a);
    default:
      return 1;
  }
}

// Network initialization
export function initializeWeights(
  inputSize: number,
  outputSize: number,
): number[] {
  try {
    // Defensive safety checks - handle NaN, Infinity, non-numbers
    let validInputSize = Number.isFinite(inputSize) ? Math.floor(inputSize) : 1;
    let validOutputSize = Number.isFinite(outputSize)
      ? Math.floor(outputSize)
      : 1;
    validInputSize = Math.max(1, validInputSize);
    validOutputSize = Math.max(1, validOutputSize);

    // Xavier initialization for better numerical properties
    const limit = Math.sqrt(6 / (validInputSize + validOutputSize));
    const weights: number[] = [];
    for (let i = 0; i < validInputSize * validOutputSize; i++) {
      weights.push(Math.random() * 2 * limit - limit);
    }
    return weights;
  } catch (error) {
    console.error(
      "[initializeWeights] Caught exception:",
      error,
      "inputSize=",
      inputSize,
      "outputSize=",
      outputSize,
    );
    return [0]; // Fallback
  }
}

export function initializeBiases(outputSize: number): number[] {
  try {
    // Defensive safety checks - handle NaN, Infinity, non-numbers, edge cases
    console.debug(
      "[initializeBiases] input outputSize:",
      outputSize,
      "type:",
      typeof outputSize,
    );

    if (!Number.isFinite(outputSize) || outputSize < 1) {
      console.warn("[initializeBiases] Invalid outputSize, using default: 1");
      outputSize = 1;
    }
    const validOutputSize = Math.max(1, Math.floor(Math.abs(outputSize)));
    console.debug(
      "[initializeBiases] validOutputSize after validation:",
      validOutputSize,
    );

    if (
      !Number.isFinite(validOutputSize) ||
      validOutputSize < 1 ||
      validOutputSize > 1000
    ) {
      console.error(
        "[initializeBiases] Still invalid after validation! Returning default. validOutputSize=",
        validOutputSize,
      );
      return [0];
    }

    const result = Array(validOutputSize)
      .fill(0)
      .map(() => Math.random() * 0.1 - 0.05);
    console.debug(
      "[initializeBiases] Successfully created array of size:",
      result.length,
    );
    return result;
  } catch (error) {
    console.error(
      "[initializeBiases] Caught exception:",
      error,
      "outputSize=",
      outputSize,
    );
    return [0]; // Absolute fallback
  }
}

// Forward pass computation
export function computeLayerOutput(
  inputs: number[],
  weights: number[],
  biases: number[],
  activationType: ActivationType,
): { z: number[]; a: number[] } {
  const outputSize = biases.length;
  const inputSize = inputs.length;
  const z: number[] = [];
  const a: number[] = [];

  for (let i = 0; i < outputSize; i++) {
    let sum = biases[i];
    for (let j = 0; j < inputSize; j++) {
      sum += inputs[j] * weights[i * inputSize + j];
    }
    z.push(sum);
    a.push(activate(sum, activationType));
  }

  return { z, a };
}

// Backward pass computation
export function computeLoss(predicted: number, target: number): number {
  // Mean squared error
  return 0.5 * (predicted - target) ** 2;
}

export function computeOutputLayerDeltas(
  outputs: number[],
  targets: number[],
  activationType: ActivationType,
): number[] {
  // dL/da = (a - y), then multiply by activation derivative
  return outputs.map((a, i) => {
    const dLda = a - targets[i];
    const dadz = activationDerivative(a, activationType);
    return dLda * dadz;
  });
}

export function computeHiddenLayerDeltas(
  nextLayerDeltas: number[],
  nextLayerWeights: number[],
  currentLayerOutputs: number[],
  activationType: ActivationType,
): number[] {
  const currentSize = currentLayerOutputs.length;
  const nextSize = nextLayerDeltas.length;

  const deltas: number[] = [];

  for (let i = 0; i < currentSize; i++) {
    let weightedDeltaSum = 0;
    // Sum contributions from next layer
    for (let j = 0; j < nextSize; j++) {
      const weightIndex = j * currentSize + i;
      const weight = nextLayerWeights[weightIndex];
      weightedDeltaSum += weight * nextLayerDeltas[j];
    }

    const dadz = activationDerivative(currentLayerOutputs[i], activationType);
    deltas.push(weightedDeltaSum * dadz);
  }

  return deltas;
}

// Format numbers for display
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

// Sample input data
export function generateSampleInput(): number[] {
  // [GPA, Attendance, LMS, Language]
  // Normalized values
  return [
    Math.random() * 0.5 + 0.5, // GPA: 0.5-1.0
    Math.random() * 0.5 + 0.5, // Attendance: 0.5-1.0
    Math.random() * 0.5 + 0.5, // LMS: 0.5-1.0
    Math.random() * 0.5 + 0.5, // Language: 0.5-1.0
  ];
}

export const SAMPLE_INPUT_LABELS = ["GPA", "Attendance", "LMS", "Language"];

// Layer naming
export function getLayerName(layerIndex: number, totalLayers: number): string {
  if (layerIndex === 0) return "Input Layer";
  if (layerIndex === totalLayers - 1) return "Output Layer";
  return `Hidden Layer ${layerIndex}`;
}

// Prediction helper
export function makePrediction(output: number): string {
  return output > 0.5 ? "At Risk (1)" : "Not At Risk (0)";
}
