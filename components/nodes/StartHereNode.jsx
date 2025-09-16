import React from "react";
import { Handle, Position } from "reactflow";

const baseNodeStyle = "node start-node";

export default function StartHereNode({ data }) {
  return (
    <div className={`${baseNodeStyle} relative flex items-center justify-center`}>
      <div className="flex flex-col items-center text-center">
        <div className="text-xs uppercase tracking-wide opacity-70">Start Here</div>
        <div className="mt-1 h-8 w-8 flex items-center justify-center rounded-full bg-green-500 text-white shadow">
          ▶
        </div>
        {data?.label && <div className="mt-1 text-xs opacity-70">{data.label}</div>}
      </div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
