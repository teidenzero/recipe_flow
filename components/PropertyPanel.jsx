import React, { useEffect, useState } from "react";
import { NodeKinds } from "../constants/nodeKinds";
import { fetchNutrition, fetchNutritionByBarcode } from "../utils/nutritionProvider";

export default function PropertyPanel({ selectedNode, onChange, nodes, edges, setEdges }) {
  if (!selectedNode) return <div className="p-4 text-sm opacity-70">Select a node to edit its properties.</div>;
  const { type, data } = selectedNode;
  const [nutritionQuery, setNutritionQuery] = useState(data?.label || "");
  const [barcodeQuery, setBarcodeQuery] = useState(data?.nutrition?.barcode || "");
  const [nutritionStatus, setNutritionStatus] = useState("");
  const [nutritionLoading, setNutritionLoading] = useState(false);

  useEffect(() => {
    setNutritionQuery(selectedNode?.data?.label || "");
    setBarcodeQuery(selectedNode?.data?.nutrition?.barcode || "");
    setNutritionStatus("");
    setNutritionLoading(false);
  }, [selectedNode?.id]);

  const set = (k, v) => onChange({ ...selectedNode, data: { ...data, [k]: v } });
  const incoming = type === NodeKinds.STEP ? edges.filter((e) => e.target === selectedNode.id) : [];
  const getNode = (id) => nodes.find((n) => n.id === id);
  const setEdgeField = (edgeId, k, v) =>
    setEdges((es) => es.map((e) => (e.id === edgeId ? { ...e, data: { ...(e.data || {}), [k]: v } } : e)));

  const runLookup = async (mode) => {
    const trimmedName = (nutritionQuery || data?.label || "").trim();
    const trimmedBarcode = barcodeQuery.trim();
    if (mode === "barcode" && !trimmedBarcode) {
      setNutritionStatus("Enter a barcode to search.");
      return;
    }
    if (mode === "name" && !trimmedName) {
      setNutritionStatus("Enter a product name to search.");
      return;
    }
    try {
      setNutritionLoading(true);
      setNutritionStatus("Looking up nutrition data...");
      const info =
        mode === "barcode"
          ? await fetchNutritionByBarcode(trimmedBarcode)
          : await fetchNutrition(trimmedName);
      onChange({ ...selectedNode, data: { ...data, nutrition: info } });
      if (info.barcode) setBarcodeQuery(info.barcode);
      if (info.productName && !nutritionQuery) setNutritionQuery(info.productName);
      setNutritionStatus(`Nutrition loaded${info.productName ? ` for ${info.productName}` : ""}.`);
    } catch (err) {
      const fallbackMsg = mode === "barcode" ? "Enter a valid barcode." : "Check the ingredient name.";
      setNutritionStatus(err?.message || `Lookup failed. ${fallbackMsg}`);
    } finally {
      setNutritionLoading(false);
    }
  };

  const clearNutrition = () => {
    const nextData = { ...data };
    delete nextData.nutrition;
    onChange({ ...selectedNode, data: nextData });
    setNutritionStatus("Nutrition cleared.");
  };

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs uppercase tracking-wide opacity-60">Properties</div>
      <label className="block">
        <span className="text-xs opacity-70">Label</span>
        <input className="w-full border rounded px-2 py-1" value={data?.label || ""} onChange={(e) => set("label", e.target.value)} />
      </label>
      {type === NodeKinds.INGREDIENT && (
        <>
          <label className="block">
            <span className="text-xs opacity-70">Amount</span>
            <input className="w-full border rounded px-2 py-1" value={data?.amount || ""} onChange={(e) => set("amount", e.target.value)} />
          </label>
          <div className="rounded border bg-white/50 p-3">
            <div className="text-xs uppercase tracking-wide opacity-60">Nutrition Lookup</div>
            <label className="mt-2 block text-xs opacity-70">
              Search term
              <input
                className="mt-1 w-full rounded border px-2 py-1"
                placeholder="e.g., Tomato sauce"
                value={nutritionQuery}
                onChange={(e) => setNutritionQuery(e.target.value)}
              />
            </label>
            <button
              className="mt-2 w-full rounded bg-gray-900 px-2 py-1 text-sm text-white disabled:opacity-60"
              disabled={nutritionLoading}
              onClick={() => runLookup("name")}
            >
              {nutritionLoading ? "Fetching..." : "Fetch by name"}
            </button>
            <label className="mt-3 block text-xs opacity-70">
              Barcode
              <input
                className="mt-1 w-full rounded border px-2 py-1"
                placeholder="e.g., 737628064502"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
              />
            </label>
            <button
              className="mt-2 w-full rounded border px-2 py-1 text-sm disabled:opacity-60"
              disabled={nutritionLoading}
              onClick={() => runLookup("barcode")}
            >
              {nutritionLoading ? "Fetching..." : "Fetch by barcode"}
            </button>
            {data?.nutrition && (
              <button className="mt-2 w-full rounded border px-2 py-1 text-sm" onClick={clearNutrition}>
                Clear nutrition data
              </button>
            )}
            {nutritionStatus && <div className="mt-2 text-xs text-gray-600">{nutritionStatus}</div>}
          </div>
        </>
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
            <input className="w-full border rounded px-2 py-1" placeholder="e.g., 220 C" value={data?.temp || ""} onChange={(e) => set("temp", e.target.value)} />
          </label>
          {incoming.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs uppercase tracking-wide opacity-60">Inputs</div>
              <div className="space-y-2">
                {incoming.map((e) => {
                  const src = getNode(e.source);
                  return (
                    <div key={e.id} className="rounded-lg border p-2">
                      <div className="mb-1 text-xs opacity-70">{src?.data?.label || e.source}</div>
                      <label className="block">
                        <span className="text-xs opacity-70">Use amount</span>
                        <input
                          className="w-full rounded border px-2 py-1"
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
