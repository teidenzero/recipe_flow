import React from "react";
import { Handle, Position } from "reactflow";

const baseNodeStyle = "node output-node";
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

export default function OutputNode({ data }) {
  const macros = data?.computedNutrition;
  return (
    <div className={`${baseNodeStyle} relative`}>
      <div className="text-xs uppercase tracking-wide opacity-70">Output</div>
      <div className="text-lg font-semibold">{data?.label || "Dish"}</div>
      <div className="text-sm opacity-80">{data?.serves ? `Serves ${data.serves}` : ""}</div>
      {hasMacros(macros) && (
        <div className="mt-2 rounded bg-white/60 px-2 py-1 text-[11px] leading-relaxed text-gray-700">
          <div className="font-semibold">Total Macros</div>
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
      <Handle type="target" position={Position.Left} id="in" />
    </div>
  );
}
