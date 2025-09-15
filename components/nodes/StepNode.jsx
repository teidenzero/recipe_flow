import React from "react";
import { Handle, Position, useReactFlow } from "reactflow";

const baseNodeStyle = "node step-node";

export default function StepNode({ data, id }) {
  const { getEdges, getNodes } = useReactFlow();
  
  // Get incoming edges and their amounts
  const incomingEdges = getEdges().filter(e => e.target === id);
  const inputs = incomingEdges.map(edge => {
    const sourceNode = getNodes().find(n => n.id === edge.source);
    return {
      label: sourceNode?.data?.label || edge.source,
      amount: edge.data?.useAmount
    };
  }).filter(input => input.amount);

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
      {data?.time && <div className="text-sm">? {data.time}</div>}
      {data?.temp && <div className="text-sm">?? {data.temp}</div>}
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
