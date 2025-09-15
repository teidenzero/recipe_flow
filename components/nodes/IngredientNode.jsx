import React from "react";
import { Handle, Position } from "reactflow";

const baseNodeStyle = "node ingredient-node";

export default function IngredientNode({ data }) {
  const nutrition = data?.nutrition;
  return (
    <div className={`${baseNodeStyle} relative`}>
      <div className="text-xs uppercase tracking-wide opacity-70">Ingredient</div>
      <div className="text-lg font-semibold">{data?.label || "Ingredient"}</div>
      <div className="text-sm opacity-80">{data?.amount || ""}</div>
      {nutrition && (
        <div className="mt-2 rounded bg-white/60 px-2 py-1 text-[11px] leading-relaxed text-gray-700">
          <div className="font-semibold">Nutrition / 100g</div>
          <div>Calories: {nutrition.calories ?? "?"}</div>
          <div>Protein: {nutrition.protein ?? "?"} g</div>
          <div>Fat: {nutrition.fat ?? "?"} g</div>
          <div>Carbs: {nutrition.carbs ?? "?"} g</div>
        </div>
      )}
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
