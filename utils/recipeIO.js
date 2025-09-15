import { MarkerType } from "reactflow";
import { NodeKinds } from "../constants/nodeKinds";
import { uid } from "./uid";

export function exportRecipe(nodes, edges) {
  return JSON.stringify(
    {
      version: 1,
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges,
    },
    null,
    2
  );
}

export function importRecipe(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    const s = text.indexOf("{");
    const t = text.lastIndexOf("}");
    if (s !== -1 && t !== -1 && t > s) {
      raw = JSON.parse(text.slice(s, t + 1));
    } else {
      throw e;
    }
  }
  if (!raw.nodes || !raw.edges) throw new Error("Invalid recipe file.");
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const nodes = rawNodes
    .map((n, i) => ({
      id: String(n.id ?? uid("nd")),
      type: n.type,
      position:
        n.position && typeof n.position.x === "number" && typeof n.position.y === "number"
          ? n.position
          : { x: 100 + i * 60, y: 100 + i * 40 },
      data: n.data || {},
    }))
    .map((n) => {
      if (n.type !== NodeKinds.INGREDIENT && n.type !== NodeKinds.STEP && n.type !== NodeKinds.OUTPUT) {
        throw new Error(`Unknown node type: ${n.type}`);
      }
      return n;
    });
  const idset = new Set(nodes.map((n) => n.id));
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];
  const edges = rawEdges
    .map((e) => ({
      id: String(e.id ?? uid("e")),
      source: String(e.source),
      target: String(e.target),
      data: e.data || {},
      type: e.type || "bezier",
      markerEnd: e.markerEnd || { type: MarkerType.ArrowClosed },
    }))
    .filter((e) => idset.has(e.source) && idset.has(e.target) && e.source !== e.target);
  return { nodes, edges };
}
