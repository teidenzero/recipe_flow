import React from "react";
import { Handle, Position } from "reactflow";

const baseNodeStyle = "node step-node";

export default function StepNode({ data }) {
  return (
    <div className={`${baseNodeStyle} relative`}>
      <div className="text-xs uppercase tracking-wide opacity-70">Step</div>
      <div className="text-lg font-semibold">{data?.label || "Step"}</div>
      <div className="text-sm opacity-80">{data?.action || ""}</div>
      {data?.time && <div className="text-sm">⏱ {data.time}</div>}
      {data?.temp && <div className="text-sm">🌡 {data.temp}</div>}
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
