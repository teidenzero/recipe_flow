import React from "react";
import { NodeKinds } from "../constants/nodeKinds";

export default function PropertyPanel({ selectedNode, onChange, nodes, edges, setEdges }) {
  if (!selectedNode) return <div className="p-4 text-sm opacity-70">Select a node to edit its properties.</div>;
  const { type, data } = selectedNode;
  const set = (k, v) => onChange({ ...selectedNode, data: { ...data, [k]: v } });
  const incoming = type === NodeKinds.STEP ? edges.filter((e) => e.target === selectedNode.id) : [];
  const getNode = (id) => nodes.find((n) => n.id === id);
  const setEdgeField = (edgeId, k, v) =>
    setEdges((es) => es.map((e) => (e.id === edgeId ? { ...e, data: { ...(e.data || {}), [k]: v } } : e)));
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs uppercase tracking-wide opacity-60">Properties</div>
      <label className="block">
        <span className="text-xs opacity-70">Label</span>
        <input className="w-full border rounded px-2 py-1" value={data?.label || ""} onChange={(e) => set("label", e.target.value)} />
      </label>
      {type === NodeKinds.INGREDIENT && (
        <label className="block">
          <span className="text-xs opacity-70">Amount</span>
          <input className="w-full border rounded px-2 py-1" value={data?.amount || ""} onChange={(e) => set("amount", e.target.value)} />
        </label>
      )}
      {type === NodeKinds.STEP && (
        <>
          <label className="block">
            <span className="text-xs opacity-70">Action</span>
            <input className="w-full border rounded px-2 py-1" value={data?.action || ""} onChange={(e) => set("action", e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Time</span>
            <input className="w-full border rounded px-2 py-1" placeholder="e.g., 30m" value={data?.time || ""} onChange={(e) => set("time", e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs opacity-70">Temperature</span>
            <input className="w-full border rounded px-2 py-1" placeholder="e.g., 220°C" value={data?.temp || ""} onChange={(e) => set("temp", e.target.value)} />
          </label>
          {incoming.length > 0 && (
            <div className="mt-2">
              <div className="text-xs uppercase tracking-wide opacity-60 mb-1">Inputs</div>
              <div className="space-y-2">
                {incoming.map((e) => {
                  const src = getNode(e.source);
                  return (
                    <div key={e.id} className="border rounded-lg p-2">
                      <div className="text-xs opacity-70 mb-1">{src?.data?.label || e.source}</div>
                      <label className="block">
                        <span className="text-xs opacity-70">Use amount</span>
                        <input
                          className="w-full border rounded px-2 py-1"
                          placeholder={src?.data?.amount || "e.g., 0.5 cup"}
                          value={(e.data && e.data.useAmount) || ""}
                          onChange={(ev) => setEdgeField(e.id, "useAmount", ev.target.value)}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {type === NodeKinds.OUTPUT && (
        <label className="block">
          <span className="text-xs opacity-70">Serves</span>
          <input className="w-full border rounded px-2 py-1" value={data?.serves || ""} onChange={(e) => set("serves", e.target.value)} />
        </label>
      )}
    </div>
  );
}
