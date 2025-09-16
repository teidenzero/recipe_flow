import React from "react";
import { Handle, Position, useReactFlow } from "reactflow";

const baseNodeStyle = "node step-node";
const macroMetrics = [
  { key: "calories", label: "Calories", suffix: "kcal" },
  { key: "protein", label: "Protein", suffix: "g" },
  { key: "fat", label: "Fat", suffix: "g" },
  { key: "carbs", label: "Carbs", suffix: "g" },
];

function formatNumeric(value) {
  if (value == null || value === "") return "?";
  const num = Number(value);
  if (!Number.isFinite(num)) return "?";
  if (Math.abs(num) >= 100) return num.toFixed(0);
  if (Math.abs(num - Math.round(num)) < 0.01) return Math.round(num).toString();
  return num.toFixed(2).replace(/\.0+$|0+$/g, "");
}

function hasMacros(macros) {
  if (!macros) return false;
  return macroMetrics.some((metric) => Number(macros[metric.key] || 0) > 0);
}

export default function StepNode({ data, id, showMacros = true }) {
  const { getEdges, getNodes } = useReactFlow();
  const macros = data?.computedNutrition;
  
  // Get incoming edges and their amounts
  const incomingEdges = getEdges().filter((e) => e.target === id);
  const inputs = incomingEdges
    .map((edge) => {
      const sourceNode = getNodes().find((n) => n.id === edge.source);
      return {
        label: sourceNode?.data?.label || edge.source,
        amount: edge.data?.useAmount,
      };
    })
    .filter((input) => input.amount);

  return (
    <div className={`${baseNodeStyle} relative`}>
      <div className="text-xs uppercase tracking-wide opacity-70">Step</div>
      <div className="text-lg font-semibold">{data?.label || "Step"}</div>
      <div className="text-sm opacity-80">{data?.action || ""}</div>
      {inputs.length > 0 && (
        <div className="mt-2 space-y-1">
          {inputs.map((input, i) => (
            <div key={i} className="text-xs opacity-70 bg-white/50 px-2 py-1 rounded">
              {input.label}: {input.amount}
            </div>
          ))}
        </div>
      )}
      {showMacros && hasMacros(macros) && (
        <div className="mt-2 rounded bg-white/60 px-2 py-1 text-[11px] leading-relaxed text-gray-700">
          <div className="font-semibold">Macros</div>
          <div className="mt-1 space-y-1">
            {macroMetrics.map((metric) => (
              <div key={metric.key}>
                {metric.label}: {formatNumeric(macros?.[metric.key])}
                {metric.suffix ? ` ${metric.suffix}` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
      {data?.time && <div className="text-sm">⏱ {data.time}</div>}
      {data?.temp && <div className="text-sm">🌡 {data.temp}</div>}
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
