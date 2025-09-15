import React from "react";
import { Handle, Position } from "reactflow";

const baseNodeStyle = "node ingredient-node";

export default function IngredientNode({ data }) {
  return (
    <div className={`${baseNodeStyle} relative`}>
      <div className="text-xs uppercase tracking-wide opacity-70">Ingredient</div>
      <div className="text-lg font-semibold">{data?.label || "Ingredient"}</div>
      <div className="text-sm opacity-80">{data?.amount || ""}</div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
