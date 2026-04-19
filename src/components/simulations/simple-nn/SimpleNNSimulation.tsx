import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimulationLayout } from "@/components/simulations/SimulationLayout";

import { useSimpleNN, LIMITS } from "./useSimpleNN";
import { NetworkVisualizer } from "./networkRenderer";
import { formatNumber, SAMPLE_INPUT_LABELS } from "./utils";

const ACTIVATION_TYPES = ["relu", "sigmoid", "tanh"] as const;

export function SimpleNNSimulation() {
  const {
    state,
    setActivationType,
    setHiddenNeurons,
    setNumHiddenLayers,
    setMode,
    start,
    nextStep,
    reset,
  } = useSimpleNN({
    initialMode: "single",
    initialHiddenNeurons: 4,
    initialNumHiddenLayers: 1,
    initialActivationType: "relu",
  });

  const currentSnapshot = state.history[state.currentStep];
  const currentLayer =
    state.currentStep > 0
      ? state.layers[currentSnapshot.activeLayerIndex]
      : null;
  const isBackwardPhase = currentSnapshot.phase === "backward";

  // Prepare log data
  const logLines: string[] = [];
  if (state.currentStep === 0) {
    logLines.push("Step 1: Input Layer");
    logLines.push("");
    logLines.push("Input Vector:");
    const inputLabels = SAMPLE_INPUT_LABELS;
    const values = state.layers[0].nodes.map((n) => formatNumber(n.a, 2));
    logLines.push(
      `[${inputLabels.map((l, i) => `${l}=${values[i]}`).join(", ")}]`,
    );
  } else if (isBackwardPhase) {
    const activeLayerIdx = currentSnapshot.activeLayerIndex;
    const activeLayer = state.layers[activeLayerIdx];
    const nextLayer = state.layers[activeLayerIdx + 1];

    logLines.push(
      `Step ${state.currentStep + 1}: ${activeLayer.name} (BACKWARD PASS)`,
    );
    logLines.push("");

    if (activeLayerIdx === state.layers.length - 1) {
      logLines.push("=== Output Layer Error Computation ===");
      logLines.push("");
      const output = activeLayer.nodes[0].a;
      const target = output > 0.5 ? 1 : 0;
      logLines.push(`Output: ${formatNumber(output, 3)}`);
      logLines.push(`Target: ${target}`);
      logLines.push(`Error (a - y): ${formatNumber(output - target, 3)}`);
      logLines.push("");
      logLines.push("Delta Computation (dL/dz = (a - y) * σ'(z)):");
      activeLayer.nodes.forEach((node, idx) => {
        logLines.push(`  δ${idx} = ${formatNumber(node.delta ?? 0, 3)}`);
      });
    } else {
      logLines.push("=== Hidden Layer Error Backpropagation ===");
      logLines.push("");
      logLines.push("Incoming deltas from next layer:");
      const nextLayerDeltas = nextLayer.nodes.map((n) =>
        formatNumber(n.delta ?? 0, 3),
      );
      logLines.push(`  [${nextLayerDeltas.join(", ")}]`);
      logLines.push("");
      logLines.push("Weights from this layer:");
      const inputSize = activeLayer.nodes.length;
      for (let i = 0; i < inputSize; i++) {
        const row = [];
        for (let j = 0; j < nextLayer.nodes.length; j++) {
          const idx = j * inputSize + i;
          row.push(formatNumber(nextLayer.weights[idx], 2));
        }
        logLines.push(`  [${row.join(", ")}]`);
      }
      logLines.push("");
      logLines.push("Computed deltas:");
      activeLayer.nodes.forEach((node, idx) => {
        logLines.push(`  δ${idx} = ${formatNumber(node.delta ?? 0, 3)}`);
      });
    }
  } else {
    // Forward pass
    const activeLayerIdx = currentSnapshot.activeLayerIndex;
    const activeLayer = state.layers[activeLayerIdx];
    const prevLayer = state.layers[activeLayerIdx - 1];

    logLines.push(`Step ${state.currentStep + 1}: ${activeLayer.name}`);
    logLines.push("");
    logLines.push("Inputs from previous layer:");
    const inputs = prevLayer.nodes.map((n) => n.a);
    logLines.push(`[${inputs.map((v) => formatNumber(v, 2)).join(", ")}]`);
    logLines.push("");

    logLines.push("Weights (W):");
    for (let i = 0; i < inputs.length; i++) {
      const row = [];
      for (let j = 0; j < activeLayer.nodes.length; j++) {
        const idx = j * inputs.length + i;
        row.push(formatNumber(activeLayer.weights[idx], 2));
      }
      logLines.push(`  [${row.join(", ")}]`);
    }
    logLines.push("");

    logLines.push("Biases (b):");
    logLines.push(
      `  [${activeLayer.biases.map((b) => formatNumber(b, 2)).join(", ")}]`,
    );
    logLines.push("");

    logLines.push("Computation (z = W·x + b):");
    activeLayer.nodes.forEach((node, idx) => {
      logLines.push(`  n${idx}: z = ${formatNumber(node.z, 3)}`);
    });
    logLines.push("");

    logLines.push(
      `Activation (${state.config.activationType.toUpperCase()}(z)):`,
    );
    activeLayer.nodes.forEach((node, idx) => {
      logLines.push(`  n${idx}: a = ${formatNumber(node.a, 3)}`);
    });

    if (activeLayerIdx === state.layers.length - 1) {
      logLines.push("");
      logLines.push("=== FINAL OUTPUT ===");
      const output = activeLayer.nodes[0].a;
      logLines.push(`Output: ${formatNumber(output, 3)}`);
      logLines.push(
        `Loss (MSE): ${formatNumber(currentSnapshot.loss ?? 0, 4)}`,
      );
      logLines.push(
        `Prediction: ${output > 0.5 ? "At Risk (1)" : "Not At Risk (0)"}`,
      );
    }
  }

  // Calculation table data
  const tableData = currentLayer
    ? currentLayer.nodes.map((node, idx) => ({
        neuronId: `n${idx}`,
        z: formatNumber(node.z, 3),
        a: formatNumber(node.a, 3),
        delta: formatNumber(node.delta ?? 0, 3),
      }))
    : [];

  const controls = (
    <div className="space-y-4">
      <Tabs
        value={state.config.mode}
        onValueChange={(val) => setMode(val as "single" | "multi")}
      >
        <TabsList className="w-full">
          <TabsTrigger value="single" className="flex-1">
            Single Layer
          </TabsTrigger>
          <TabsTrigger value="multi" className="flex-1">
            Multi Layer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Activation Function</p>
              <Badge variant="outline">{state.config.activationType}</Badge>
            </div>
            <div className="flex gap-2">
              {ACTIVATION_TYPES.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={
                    state.config.activationType === type ? "default" : "outline"
                  }
                  onClick={() => setActivationType(type)}
                >
                  {type.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Hidden Neurons</p>
              <Badge variant="outline">
                {state.config.hiddenNeurons} ({LIMITS.MAX_NEURONS} max)
              </Badge>
            </div>
            <Slider
              min={LIMITS.MIN_NEURONS}
              max={LIMITS.MAX_NEURONS}
              step={1}
              value={[state.config.hiddenNeurons]}
              onValueChange={(val) =>
                setHiddenNeurons(Array.isArray(val) ? val[0] : val)
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="multi" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Activation Function</p>
              <Badge variant="outline">{state.config.activationType}</Badge>
            </div>
            <div className="flex gap-2">
              {ACTIVATION_TYPES.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={
                    state.config.activationType === type ? "default" : "outline"
                  }
                  onClick={() => setActivationType(type)}
                >
                  {type.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Hidden Neurons per Layer</p>
              <Badge variant="outline">
                {state.config.hiddenNeurons} ({LIMITS.MAX_NEURONS} max)
              </Badge>
            </div>
            <Slider
              min={LIMITS.MIN_NEURONS}
              max={LIMITS.MAX_NEURONS}
              step={1}
              value={[state.config.hiddenNeurons]}
              onValueChange={(val) =>
                setHiddenNeurons(Array.isArray(val) ? val[0] : val)
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Number of Hidden Layers</p>
              <Badge variant="outline">
                {state.config.numHiddenLayers} ({LIMITS.MAX_LAYERS} max)
              </Badge>
            </div>
            <Slider
              min={LIMITS.MIN_LAYERS}
              max={LIMITS.MAX_LAYERS}
              step={1}
              value={[state.config.numHiddenLayers]}
              onValueChange={(val) =>
                setNumHiddenLayers(Array.isArray(val) ? val[0] : val)
              }
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2 border-t pt-4">
        <p className="text-xs font-medium text-muted-foreground">Simulation</p>
        <div className="flex flex-col gap-2">
          <Button onClick={start} variant="default" className="w-full">
            Start
          </Button>
          <Button
            onClick={nextStep}
            variant="outline"
            className="w-full"
            disabled={state.currentStep >= state.maxSteps}
          >
            Next Step ({state.currentStep}/{state.maxSteps})
          </Button>
          <Button onClick={reset} variant="secondary" className="w-full">
            Reset
          </Button>
        </div>
        <p className="text-xs text-gray-600 text-center pt-2">
          Phase:{" "}
          <span
            className={`font-semibold ${isBackwardPhase ? "text-pink-600" : "text-blue-600"}`}
          >
            {isBackwardPhase ? "BACKWARD" : "FORWARD"}
          </span>
        </p>
      </div>
    </div>
  );

  const visualization = (
    <div className="space-y-3 h-full flex flex-col">
      <div className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 flex-1">
        <NetworkVisualizer
          layers={state.layers}
          activeLayerIndex={currentSnapshot.activeLayerIndex}
          phase={currentSnapshot.phase}
        />
      </div>

      {currentLayer && tableData.length > 0 && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Neuron Calculations</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left font-medium">Neuron</th>
                    {!isBackwardPhase && (
                      <>
                        <th className="px-2 py-1 text-left font-medium">z</th>
                        <th className="px-2 py-1 text-left font-medium">a</th>
                      </>
                    )}
                    {isBackwardPhase && (
                      <th className="px-2 py-1 text-left font-medium">δ</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-white">
                      <td className="px-2 py-1 font-medium">{row.neuronId}</td>
                      {!isBackwardPhase && (
                        <>
                          <td className="px-2 py-1 font-mono text-gray-700">
                            {row.z}
                          </td>
                          <td className="px-2 py-1 font-mono text-gray-700">
                            {row.a}
                          </td>
                        </>
                      )}
                      {isBackwardPhase && (
                        <td className="px-2 py-1 font-mono text-pink-700">
                          {row.delta}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const logs = (
    <div className="space-y-3 overflow-auto">
      <Card className="bg-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Step Log</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <pre className="whitespace-pre-wrap text-xs font-mono leading-tight text-gray-700 max-h-96 overflow-y-auto">
            {logLines.join("\n")}
          </pre>
        </CardContent>
      </Card>

      {state.currentStep > 0 && currentLayer && (
        <Card className={isBackwardPhase ? "bg-pink-50" : "bg-blue-50"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">
              {isBackwardPhase ? "Gradient Info" : "Network Info"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs pt-2">
            <div>
              <p className="font-medium text-gray-700">
                {isBackwardPhase ? "Deltas:" : "Shape:"}
              </p>
              <p className="text-gray-600">
                {isBackwardPhase
                  ? `[${currentLayer.nodes.map((n) => formatNumber(n.delta ?? 0, 2)).join(", ")}]`
                  : `${state.layers[currentSnapshot.activeLayerIndex - 1].nodes.length} → ${currentLayer.nodes.length}`}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Active:</p>
              <p className="text-gray-600">{currentLayer.name}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <SimulationLayout
      title="Neural Network (Forward + Backward Pass)"
      controls={controls}
      visualization={visualization}
      logs={logs}
    />
  );
}
