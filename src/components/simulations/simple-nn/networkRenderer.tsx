import type { Layer } from "./types";
import { formatNumber } from "./utils";

interface NetworkVisualizerProps {
  layers: Layer[];
  activeLayerIndex: number;
  phase?: "forward" | "backward";
}

export function NetworkVisualizer({
  layers,
  activeLayerIndex,
  phase = "forward",
}: NetworkVisualizerProps) {
  const containerWidth = 600;
  const containerHeight = 350;
  const padding = 40;
  const usableWidth = containerWidth - 2 * padding;
  const usableHeight = containerHeight - 2 * padding;

  // Calculate layer spacing
  const layerSpacing = usableWidth / (layers.length - 1 || 1);

  // Calculate max nodes to determine vertical spacing
  const maxNodes = Math.max(...layers.map((l) => l.nodes.length), 4);
  const nodeSpacing = usableHeight / (maxNodes + 1);

  // Render connections between layers
  const connections: React.ReactElement[] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const sourceLayer = layers[i];
    const targetLayer = layers[i + 1];
    const sourceX = padding + i * layerSpacing;
    const targetX = padding + (i + 1) * layerSpacing;

    sourceLayer.nodes.forEach((_sourceNode, sourceIdx) => {
      const sourceY = padding + (sourceIdx + 1) * nodeSpacing;

      targetLayer.nodes.forEach((_targetNode, targetIdx) => {
        const targetY = padding + (targetIdx + 1) * nodeSpacing;
        // Get weight between these neurons
        const inputSize = sourceLayer.nodes.length;
        const weightIndex = targetIdx * inputSize + sourceIdx;
        const weight = targetLayer.weights[weightIndex] ?? 0;
        const normalized = Math.min(Math.abs(weight), 2) / 2; // Normalize to 0-1
        const strokeWidth = 0.5 + normalized * 2;
        const opacity = 0.25 + normalized * 0.35;
        const color = weight > 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";

        connections.push(
          <line
            key={`edge-${i}-${sourceIdx}-${targetIdx}`}
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />,
        );
      });
    });
  }

  // Render nodes
  const nodes: React.ReactElement[] = [];
  layers.forEach((layer, layerIdx) => {
    const x = padding + layerIdx * layerSpacing;
    const isActive = layerIdx === activeLayerIndex;

    layer.nodes.forEach((node, nodeIdx) => {
      const y = padding + (nodeIdx + 1) * nodeSpacing;
      const radius = phase === "backward" && node.delta ? 20 : 18;
      const bgColor = isActive
        ? phase === "backward"
          ? "#ec4899"
          : "#3b82f6"
        : "#e5e7eb";
      const textColor = isActive ? "#ffffff" : "#1f2937";

      nodes.push(
        <g key={`node-${layerIdx}-${nodeIdx}`}>
          <circle
            cx={x}
            cy={y}
            r={radius}
            fill={bgColor}
            stroke={
              isActive
                ? phase === "backward"
                  ? "#be185d"
                  : "#1e40af"
                : "#9ca3af"
            }
            strokeWidth={1.5}
          />
          <title>
            {layerIdx === 0
              ? `${node.id}: ${formatNumber(node.a)}`
              : phase === "backward" && node.delta !== undefined
                ? `delta=${formatNumber(node.delta)}, a=${formatNumber(node.a)}`
                : `z=${formatNumber(node.z)}, a=${formatNumber(node.a)}`}
          </title>
          {layerIdx === 0 ? (
            // Input layer: just show activation
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dy="0.3em"
              fontSize="8"
              fontWeight="600"
              fill={textColor}
            >
              {formatNumber(node.a, 1)}
            </text>
          ) : phase === "backward" && node.delta !== undefined ? (
            // Backward pass: show delta
            <text
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="7"
              fontWeight="600"
              fill={textColor}
            >
              δ:{formatNumber(node.delta, 1)}
            </text>
          ) : (
            // Forward pass: show z and a
            <>
              <text
                x={x}
                y={y - 4}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                fill={textColor}
              >
                z:{formatNumber(node.z, 1)}
              </text>
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                fill={textColor}
              >
                a:{formatNumber(node.a, 1)}
              </text>
            </>
          )}
        </g>,
      );
    });
  });

  // Layer labels
  const labels = layers.map((layer, idx) => {
    const x = padding + idx * layerSpacing;
    const y = padding - 15;
    return (
      <text
        key={`label-${idx}`}
        x={x}
        y={y}
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="#374151"
      >
        {layer.name}
      </text>
    );
  });

  return (
    <div className="flex w-full justify-center overflow-auto">
      <svg
        width={containerWidth}
        height={containerHeight}
        className="border border-gray-200 bg-gray-50"
      >
        {labels}
        {connections}
        {nodes}
      </svg>
    </div>
  );
}
