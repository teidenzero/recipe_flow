import React from "react";
import { Handle, Position } from "reactflow";

const baseNodeStyle = "node ingredient-node";

const nutritionMetrics = [
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

function describeAmount(entry) {
  if (!entry) return null;
  const num = Number(entry.quantity);
  const quantity = Number.isFinite(num)
    ? (Math.abs(num - Math.round(num)) < 0.01 ? Math.round(num).toString() : num.toFixed(2).replace(/\.0+$|0+$/g, ""))
    : String(entry.quantity || "");
  const unit = entry.displayUnit || entry.unit || "";
  return `${quantity}${unit ? ` ${unit}` : ""}`.trim();
}

export default function IngredientNode({ data }) {
  const nutrition = data?.nutrition;
  const amountLabel = nutrition?.perAmount
    ? describeAmount(nutrition.perAmount)
    : nutrition?.perReference
    ? describeAmount(nutrition.perReference)
    : null;

  return (
    <div className={`${baseNodeStyle} relative`}>
      <div className="text-xs uppercase tracking-wide opacity-70">Ingredient</div>
      <div className="text-lg font-semibold">{data?.label || "Ingredient"}</div>
      <div className="text-sm opacity-80">{data?.amount || ""}</div>
      {nutrition && nutrition.values && (
        <div className="mt-2 rounded bg-white/60 px-2 py-1 text-[11px] leading-relaxed text-gray-700">
          <div className="font-semibold">
            Nutrition{amountLabel ? ` (${amountLabel})` : ""}
          </div>
          {nutrition.warning && <div className="mt-1 text-[10px] text-amber-700">{nutrition.warning}</div>}
          <div className="mt-1 space-y-1">
            {nutritionMetrics.map((metric) => (
              <div key={metric.key}>
                {metric.label}: {formatNumeric(nutrition.values[metric.key])}
                {metric.suffix ? ` ${metric.suffix}` : ""}
              </div>
            ))}
          </div>
          {nutrition.perAmount && nutrition.perReference && (
            <div className="mt-1 text-[10px] text-gray-600">
              Ref: {describeAmount(nutrition.perReference)}
            </div>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
