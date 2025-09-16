import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  Panel,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { NodeKinds } from "../constants/nodeKinds";
import IngredientNode from "./nodes/IngredientNode";
import StepNode from "./nodes/StepNode";
import OutputNode from "./nodes/OutputNode";
import PropertyPanel from "./PropertyPanel";
import { uid } from "../utils/uid";
import { validateGraph, simulateExecute, computeNodeNutrition } from "../utils/graphUtils";
import { exportRecipe, importRecipe } from "../utils/recipeIO";
import { runTests } from "../utils/testUtils";

const createNodeTypes = (showMacros) => ({
  [NodeKinds.INGREDIENT]: (props) => <IngredientNode {...props} showMacros={showMacros} />,
  [NodeKinds.STEP]: (props) => <StepNode {...props} showMacros={showMacros} />,
  [NodeKinds.OUTPUT]: (props) => <OutputNode {...props} showMacros={showMacros} />,
});

const MACRO_KEYS = ["calories", "protein", "fat", "carbs"];

function macrosEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return MACRO_KEYS.every((key) => {
    const av = Number(a[key] || 0);
    const bv = Number(b[key] || 0);
    return Math.abs(av - bv) < 1e-6;
  });
}

export default function InnerApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sel, setSel] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rfInstance, setRfInstance] = useState(null);
  const [log, setLog] = useState("");
  const [errors, setErrors] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [showMacros, setShowMacros] = useState(true);
  const findNode = (id) => nodes.find((n) => n.id === id);
  const isValidConnection = useCallback(
    (connection) => {
      const src = connection.source ? findNode(connection.source) : null;
      const tgt = connection.target ? findNode(connection.target) : null;
      if (!src || !tgt) return true;
      if (src.id === tgt.id) return false;
      if (tgt.type === NodeKinds.INGREDIENT) return false;
      if (src.type === NodeKinds.OUTPUT) return false;
      return true;
    },
    [nodes]
  );
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: "bezier", markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );
  const addNode = (type) => {
    const randomViewportPoint = { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 };
    const position = rfInstance && typeof rfInstance.project === "function" ? rfInstance.project(randomViewportPoint) : { x: 250, y: 150 };
    const id = uid(type.slice(0, 3));
    const base = { id, type, position, data: { label: type.charAt(0).toUpperCase() + type.slice(1) } };
    if (type === NodeKinds.INGREDIENT) base.data.amount = "100 g";
    if (type === NodeKinds.OUTPUT) base.data.serves = 2;
    setNodes((ns) => [...ns, base]);
  };
  const onSelectionChange = useCallback(({ nodes }) => {
    setSel(nodes?.[0] || null);
    setSelectedIds(nodes?.map((n) => n.id) || []);
  }, []);
  const updateSelected = (updated) => {
    setNodes((ns) => ns.map((n) => (n.id === updated.id ? { ...n, data: updated.data } : n)));
    setSel(updated);
  };
  const doValidate = () => {
    const errs = validateGraph(nodes, edges);
    setErrors(errs);
  };
  const doExecute = () => {
    try {
      const out = simulateExecute(nodes, edges);
      setLog(out);
    } catch (e) {
      setLog(String(e.message || e));
    }
  };
  const doExport = () => {
    const txt = exportRecipe(nodes, edges);
    navigator.clipboard.writeText(txt).catch(() => {});
    setLog("Exported to clipboard (JSON).\n\n" + txt);
  };
  const doImport = async () => {
    const txt = prompt("Paste recipe JSON:");
    if (!txt) return;
    try {
      const { nodes: n, edges: e } = importRecipe(txt);
      setNodes(n);
      setEdges(e);
      setLog("Imported recipe.");
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  };
  const doDeleteSelected = () => {
    if (!selectedIds.length) return;
    setEdges((e) => e.filter((ed) => !selectedIds.includes(ed.source) && !selectedIds.includes(ed.target)));
    setNodes((ns) => ns.filter((n) => !selectedIds.includes(n.id)));
    setSel(null);
    setSelectedIds([]);
  };
  const doRunTests = () => {
    const result = runTests((t) => setLog(t));
    console.log("Test summary", result);
  };

  useEffect(() => {
    if (!nodes.length) return;
    const macrosMap = computeNodeNutrition(nodes, edges);
    let changed = false;
    const updated = nodes.map((node) => {
      const macros = macrosMap[node.id];
      const existing = node.data?.computedNutrition;
      if (!macros && !existing) return node;
      if (macrosEqual(macros, existing)) return node;
      changed = true;
      const nextData = { ...node.data };
      if (macros) {
        nextData.computedNutrition = macros;
      } else {
        delete nextData.computedNutrition;
      }
      return { ...node, data: nextData };
    });
    if (changed) {
      setNodes(updated);
    }
  }, [nodes, edges, setNodes]);

  return (
    <div className="w-full h-[80vh] grid grid-cols-12 gap-3">
      <div className="col-span-9 rounded-2xl border overflow-hidden">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={createNodeTypes(showMacros)}
            onSelectionChange={onSelectionChange}
            onInit={(instance) => setRfInstance(instance)}
            isValidConnection={isValidConnection}
            connectionLineType="bezier"
            defaultEdgeOptions={{ type: "bezier", markerEnd: { type: MarkerType.ArrowClosed } }}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            {showMap && <MiniMap />}
            <Controls />
            <Panel position="top-left">
              <div className="flex flex-wrap gap-2 bg-white/90 backdrop-blur p-2 rounded-xl shadow">
                <button className="px-3 py-1 rounded-lg border" onClick={() => addNode(NodeKinds.INGREDIENT)}>+ Ingredient</button>
                <button className="px-3 py-1 rounded-lg border" onClick={() => addNode(NodeKinds.STEP)}>+ Step</button>
                <button className="px-3 py-1 rounded-lg border" onClick={() => addNode(NodeKinds.OUTPUT)}>+ Output</button>
                <button className="px-3 py-1 rounded-lg border" onClick={doValidate}>Validate</button>
                <button className="px-3 py-1 rounded-lg border" onClick={doExecute}>Simulate</button>
                <button className="px-3 py-1 rounded-lg border" onClick={doExport}>Export</button>
                <button className="px-3 py-1 rounded-lg border" onClick={doImport}>Import</button>
                <button className="px-3 py-1 rounded-lg border" onClick={doRunTests}>Run Tests</button>
                {selectedIds.length > 0 && (
                  <button className="px-3 py-1 rounded-lg border" onClick={doDeleteSelected}>Delete Selected</button>
                )}
                <button className="px-3 py-1 rounded-lg border" onClick={() => setShowMap((v) => !v)}>Map: {showMap ? "On" : "Off"}</button>
                <button className="px-3 py-1 rounded-lg border" onClick={() => setShowMacros((v) => !v)}>
                  Macros: {showMacros ? "Show" : "Hide"}
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <div className="col-span-3 rounded-2xl border flex flex-col overflow-hidden">
        <div className="border-b p-3 font-semibold">Inspector</div>
        <PropertyPanel selectedNode={sel} onChange={updateSelected} nodes={nodes} edges={edges} setEdges={setEdges} />
        <div className="border-t p-3 text-sm space-y-2">
          <div className="font-semibold">Validation</div>
          {errors.length === 0 ? (
            <div className="opacity-70">No errors. Click Validate to refresh.</div>
          ) : (
            <ul className="list-disc ml-4 space-y-1">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t p-3 text-sm">
          <div className="font-semibold mb-1">Console</div>
          <pre className="text-xs whitespace-pre-wrap max-h-52 overflow-auto">{log}</pre>
        </div>
      </div>
    </div>
  );
}
