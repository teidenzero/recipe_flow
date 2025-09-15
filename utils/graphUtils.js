import { NodeKinds } from "../constants/nodeKinds";

export function topologicalSort(nodes, edges) {
  const incoming = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of edges) incoming.set(e.target, (incoming.get(e.target) || 0) + 1);
  const q = [...nodes.filter((n) => (incoming.get(n.id) || 0) === 0)];
  const order = [];
  while (q.length) {
    const n = q.shift();
    order.push(n);
    for (const e of edges.filter((e) => e.source === n.id)) {
      const v = (incoming.get(e.target) || 0) - 1;
      incoming.set(e.target, v);
      if (v === 0) q.push(nodes.find((x) => x.id === e.target));
    }
  }
  if (order.length !== nodes.length) {
    const remaining = nodes.filter((n) => !order.find((o) => o.id === n.id)).map((n) => n.id);
    return { order, hasCycle: true, remaining };
  }
  return { order, hasCycle: false, remaining: [] };
}

export function validateGraph(nodes, edges) {
  const errs = [];
  for (const n of nodes) {
    if (n.type === NodeKinds.OUTPUT) {
      const incoming = edges.filter((e) => e.target === n.id);
      if (incoming.length === 0) errs.push(`Output "${n.data?.label}" has no inputs.`);
    }
  }
  for (const n of nodes) {
    if (n.type === NodeKinds.INGREDIENT) {
      const incoming = edges.filter((e) => e.target === n.id);
      if (incoming.length) errs.push(`Ingredient "${n.data?.label}" cannot have inputs.`);
    }
  }
  for (const n of nodes) {
    if (n.type === NodeKinds.STEP) {
      const incoming = edges.filter((e) => e.target === n.id);
      if (incoming.length === 0) errs.push(`Step "${n.data?.label}" has no inputs.`);
    }
  }
  const { hasCycle, remaining } = topologicalSort(nodes, edges);
  if (hasCycle) errs.push(`Cycle detected among nodes: ${remaining.join(", ")}`);
  return errs;
}

export function simulateExecute(nodes, edges) {
  const { order, hasCycle } = topologicalSort(nodes, edges);
  if (hasCycle) throw new Error("Cannot execute: graph has a cycle.");
  const incomingEdgesOf = (id) => edges.filter((e) => e.target === id);
  const values = new Map();
  const logs = [];
  const joinReadable = (arr) => {
    if (arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return arr[0] + " and " + arr[1];
    return arr.slice(0, -1).join(", ") + ", and " + arr[arr.length - 1];
  };
  for (const n of order) {
    if (n.type === NodeKinds.INGREDIENT) {
      values.set(n.id, { type: "ingredient", name: n.data?.label, amount: n.data?.amount });
      logs.push(`🧂 ${n.data?.label} (${n.data?.amount || ""})`);
    } else if (n.type === NodeKinds.STEP) {
      const inEdges = incomingEdgesOf(n.id);
      const items = inEdges.map((edge) => {
        const src = values.get(edge.source);
        const baseName = src?.type === "ingredient" ? src?.name : src?.step || src?.name || "previous step";
        const name = src?.type === "ingredient" ? baseName : `the result of ${baseName}`;
        const used = (edge.data && edge.data.useAmount) || src?.amount || "";
        return used ? `${used} of ${name}` : name;
      });
      const verb = n.data?.action || n.data?.label || "Step";
      const sentence = `${verb} ${joinReadable(items)}`.trim();
      values.set(n.id, { type: "mix", step: n.data?.label, action: n.data?.action, description: sentence });
      logs.push(`👩‍🍳 ${n.data?.label} — ${sentence}`);
    } else if (n.type === NodeKinds.OUTPUT) {
      const inEdges = incomingEdgesOf(n.id);
      const inputs = inEdges.map((edge) => values.get(edge.source));
      values.set(n.id, { type: "dish", name: n.data?.label, serves: n.data?.serves, inputs });
      logs.push(`🍽️ Output: ${n.data?.label} (serves ${n.data?.serves || "?"})`);
    }
  }
  return logs.join("\n");
}
