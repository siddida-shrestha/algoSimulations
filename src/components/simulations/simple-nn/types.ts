export type ActivationType = "relu" | "sigmoid" | "tanh";

export interface Node {
  id: string;
  z: number; // weighted sum
  a: number; // activation output
  inputs: number[]; // input values to this node
  delta?: number; // error gradient for backward pass
}

export interface Layer {
  name: string;
  nodes: Node[];
  weights: number[]; // flat array: weights[j * inputSize + i] for connection from node i to node j
  biases: number[]; // bias for each node
}

export interface NetworkState {
  config: {
    activationType: ActivationType;
    hiddenNeurons: number;
    numHiddenLayers: number;
    mode: "single" | "multi";
  };
  layers: Layer[];
  currentStep: number;
  maxSteps: number;
  isRunning: boolean;
  history: StepSnapshot[];
}

export interface StepSnapshot {
  step: number;
  activeLayerIndex: number;
  layers: Layer[];
  inputVector: number[];
  output?: number;
  phase?: "forward" | "backward"; // Track which phase we're in
  loss?: number; // Loss value for backward pass
  prediction?: string;
}

export interface NeuronCalculation {
  neuronIndex: number;
  inputs: number[];
  weights: number[];
  bias: number;
  z: number;
  a: number;
}
