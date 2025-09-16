import React, { useEffect, useState } from "react";
import { NodeKinds } from "../constants/nodeKinds";
import {
  adjustNutritionForAmount,
  fetchNutrition,
  fetchNutritionByBarcode,
  searchNutritionCandidates,
} from "../utils/nutritionProvider";

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

function formatQuantity(quantity) {
  if (quantity == null) return "?";
  const num = Number(quantity);
  if (!Number.isFinite(num)) return String(quantity);
  if (Math.abs(num - Math.round(num)) < 0.01) return Math.round(num).toString();
  return num.toFixed(2).replace(/\.0+$|0+$/g, "");
}

function describeAmount(entry) {
  if (!entry) return null;
  const qty = formatQuantity(entry.quantity);
  const unit = entry.displayUnit || entry.unit || "";
  return `${qty}${unit ? ` ${unit}` : ""}`.trim();
}

function summarizeMetrics(values) {
  if (!values) return "";
  return nutritionMetrics
    .map((metric) => {
      const value = formatNumeric(values[metric.key]);
      if (value === "?") return null;
      return `${metric.label.toLowerCase()} ${value}${metric.suffix ? ` ${metric.suffix}` : ""}`;
    })
    .filter(Boolean)
    .join(", ");
}

function buildNutritionStatus(nutrition) {
  if (!nutrition) return "";
  if (nutrition.warning) return nutrition.warning;
  if (nutrition.perAmount) {
    const label = describeAmount(nutrition.perAmount);
    return label ? `Nutrition scaled for ${label}.` : "Nutrition scaled for ingredient amount.";
  }
  if (nutrition.perReference) {
    const label = describeAmount(nutrition.perReference);
    return label ? `Showing reference nutrition per ${label}.` : "Showing reference nutrition.";
  }
  return "";
}

function buildResultOptionLabel(result) {
  if (!result) return "";
  const name = result.productName || "Unknown product";
  const brand = result.brand ? ` (${result.brand})` : "";
  const refLabelRaw = describeAmount(result.nutrition?.perReference);
  const refLabel = refLabelRaw && refLabelRaw !== "?" ? refLabelRaw : "reference";
  const calories = formatNumeric(result.nutrition?.perReference?.values?.calories);
  return `${name}${brand} — ${calories} kcal per ${refLabel}`;
}

export default function PropertyPanel({ selectedNode, onChange, nodes, edges, setEdges }) {
  if (!selectedNode) return <div className="p-4 text-sm opacity-70">Select a node to edit its properties.</div>;
  const { type, data } = selectedNode;
  const [nutritionQuery, setNutritionQuery] = useState(data?.label || "");
  const [barcodeQuery, setBarcodeQuery] = useState(data?.nutrition?.barcode || "");
  const [nutritionStatus, setNutritionStatus] = useState(buildNutritionStatus(data?.nutrition));
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionResults, setNutritionResults] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState("");

  useEffect(() => {
    setNutritionQuery(selectedNode?.data?.label || "");
    setBarcodeQuery(selectedNode?.data?.nutrition?.barcode || "");
    setNutritionStatus(buildNutritionStatus(selectedNode?.data?.nutrition));
    setNutritionLoading(false);
    setNutritionResults([]);
    setSelectedResultId("");
  }, [selectedNode?.id]);

  const set = (k, v) => {
    const nextData = { ...data, [k]: v };
    if (k === "amount" && data?.nutrition) {
      const adjusted = adjustNutritionForAmount(data.nutrition, v);
      nextData.nutrition = adjusted;
      setNutritionStatus(buildNutritionStatus(adjusted));
    }
    onChange({ ...selectedNode, data: nextData });
  };

  const incoming = type === NodeKinds.STEP ? edges.filter((e) => e.target === selectedNode.id) : [];
  const getNode = (id) => nodes.find((n) => n.id === id);
  const setEdgeField = (edgeId, k, v) =>
    setEdges((es) => es.map((e) => (e.id === edgeId ? { ...e, data: { ...(e.data || {}), [k]: v } } : e)));

  const applySelectedResult = (explicitResult) => {
    const candidate = explicitResult || nutritionResults.find((res) => res.id === selectedResultId);
    if (!candidate) {
      setNutritionStatus("Select a product from the list to apply its nutrition data.");
      return;
    }
    const adjusted = adjustNutritionForAmount(candidate.nutrition, data?.amount || "");
    const nextData = { ...data, nutrition: adjusted };
    onChange({ ...selectedNode, data: nextData });
    if (candidate.productName) {
      setNutritionQuery(candidate.productName);
    }
    setNutritionStatus(buildNutritionStatus(adjusted) || `Nutrition loaded for ${candidate.productName || "selected product"}.`);
  };

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
      if (mode === "name") {
        setNutritionStatus("Searching for nutrition data...");
        const candidates = await searchNutritionCandidates(trimmedName, 50);
        setNutritionResults(candidates);
        if (!candidates.length) {
          setSelectedResultId("");
          setNutritionStatus(`No results found for "${trimmedName}".`);
          return;
        }
        setSelectedResultId(candidates[0].id);
        setNutritionStatus(`Select the closest match below (${candidates.length} result${candidates.length === 1 ? "" : "s"}).`);
        if (candidates.length === 1) {
          applySelectedResult(candidates[0]);
        }
        return;
      }

      setNutritionStatus("Looking up nutrition data...");
      const info = await fetchNutritionByBarcode(trimmedBarcode);
      const adjusted = adjustNutritionForAmount(info, data?.amount || "");
      const nextData = { ...data, nutrition: adjusted };
      onChange({ ...selectedNode, data: nextData });
      setNutritionResults([]);
      setSelectedResultId("");
      if (adjusted.barcode) setBarcodeQuery(adjusted.barcode);
      if (adjusted.productName && !nutritionQuery) setNutritionQuery(adjusted.productName);
      setNutritionStatus(buildNutritionStatus(adjusted) || `Nutrition loaded${adjusted.productName ? ` for ${adjusted.productName}` : ""}.`);
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
    setNutritionResults([]);
    setSelectedResultId("");
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
          <div className="rounded border bg-white/50 p-3 space-y-3">
            <div className="text-xs uppercase tracking-wide opacity-60">Nutrition Lookup</div>
            <label className="block text-xs opacity-70">
              Search term
              <input
                className="mt-1 w-full rounded border px-2 py-1"
                placeholder="e.g., Tomato sauce"
                value={nutritionQuery}
                onChange={(e) => setNutritionQuery(e.target.value)}
              />
            </label>
            <button
              className="w-full rounded bg-gray-900 px-2 py-1 text-sm text-white disabled:opacity-60"
              disabled={nutritionLoading}
              onClick={() => runLookup("name")}
            >
              {nutritionLoading ? "Searching..." : "Search by name"}
            </button>
            <label className="block text-xs opacity-70">
              Barcode
              <input
                className="mt-1 w-full rounded border px-2 py-1"
                placeholder="e.g., 737628064502"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
              />
            </label>
            <button
              className="w-full rounded border px-2 py-1 text-sm disabled:opacity-60"
              disabled={nutritionLoading}
              onClick={() => runLookup("barcode")}
            >
              {nutritionLoading ? "Fetching..." : "Fetch by barcode"}
            </button>
            {nutritionResults.length > 0 && (
              <div className="rounded border bg-white/70 p-2 text-xs space-y-2">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wide opacity-70">Matches</span>
                  <select
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    value={selectedResultId}
                    onChange={(e) => setSelectedResultId(e.target.value)}
                  >
                    {nutritionResults.map((result) => (
                      <option key={result.id} value={result.id}>
                        {buildResultOptionLabel(result)}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="w-full rounded border px-2 py-1 text-sm" onClick={() => applySelectedResult()}>
                  Use selected result
                </button>
                <div className="text-[10px] text-gray-500">
                  Showing {nutritionResults.length} option{nutritionResults.length === 1 ? "" : "s"}. Pick the closest match.
                </div>
              </div>
            )}
            {data?.nutrition && (
              <button className="w-full rounded border px-2 py-1 text-sm" onClick={clearNutrition}>
                Clear nutrition data
              </button>
            )}
            {nutritionStatus && <div className="text-xs text-gray-600">{nutritionStatus}</div>}
            {data?.nutrition && (
              <div className="rounded border bg-white/70 p-2 text-xs">
                <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Nutrition Summary</div>
                <div className="mt-1">
                  {data.nutrition.perAmount
                    ? `For ${describeAmount(data.nutrition.perAmount)}`
                    : data.nutrition.perReference
                    ? `Per ${describeAmount(data.nutrition.perReference)}`
                    : "Nutrition values"}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-y-1 gap-x-3">
                  {nutritionMetrics.map((metric) => (
                    <div key={metric.key}>
                      <span className="font-semibold">{metric.label}:</span> {formatNumeric(data.nutrition.values?.[metric.key])}
                      {metric.suffix ? ` ${metric.suffix}` : ""}
                    </div>
                  ))}
                </div>
                {data.nutrition.perAmount && data.nutrition.perReference && (
                  <div className="mt-2 text-[10px] text-gray-500">
                    Reference {describeAmount(data.nutrition.perReference)} &rarr; {summarizeMetrics(data.nutrition.perReference.values)}
                  </div>
                )}
                {data.nutrition.warning && <div className="mt-2 text-[10px] text-amber-700">{data.nutrition.warning}</div>}
                {data.nutrition.sourceUrl && (
                  <div className="mt-2 text-[10px]">
                    <a className="text-blue-600 hover:underline" href={data.nutrition.sourceUrl} target="_blank" rel="noreferrer">
                      View on Open Food Facts
                    </a>
                  </div>
                )}
              </div>
            )}
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
