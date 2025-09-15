import React from "react";
import { Handle, Position } from "reactflow";

const baseNodeStyle = "node output-node";

export default function OutputNode({ data }) {
  return (
    <div className={`${baseNodeStyle} relative`}>
      <div className="text-xs uppercase tracking-wide opacity-70">Output</div>
      <div className="text-lg font-semibold">{data?.label || "Dish"}</div>
      <div className="text-sm opacity-80">{data?.serves ? `Serves ${data.serves}` : ""}</div>
      <Handle type="target" position={Position.Left} id="in" />
    </div>
  );
}
