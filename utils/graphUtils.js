import { NodeKinds } from "../constants/nodeKinds";
import { convertToBase, parseQuantityAndUnit, normalizeUnit } from "./unitConversion";

const MACRO_KEYS = ["calories", "protein", "fat", "carbs"];

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
      logs.push(`?? ${n.data?.label} (${n.data?.amount || ""})`);
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
      logs.push(`????? ${n.data?.label} - ${sentence}`);
    } else if (n.type === NodeKinds.OUTPUT) {
      const inEdges = incomingEdgesOf(n.id);
      const inputs = inEdges.map((edge) => values.get(edge.source));
      values.set(n.id, { type: "dish", name: n.data?.label, serves: n.data?.serves, inputs });
      logs.push(`??? Output: ${n.data?.label} (serves ${n.data?.serves || "?"})`);
    }
  }
  return logs.join("\n");
}

export function computeNodeNutrition(nodes, edges) {
  if (!nodes || nodes.length === 0) return {};
  const { order, hasCycle } = topologicalSort(nodes, edges);
  if (hasCycle) return {};
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const incomingByTarget = new Map();
  for (const edge of edges) {
    const list = incomingByTarget.get(edge.target) || [];
    list.push(edge);
    incomingByTarget.set(edge.target, list);
  }
  const macrosById = {};
  for (const node of order) {
    let macros;
    if (node.type === NodeKinds.INGREDIENT) {
      macros = extractIngredientMacros(node);
    } else if (node.type === NodeKinds.STEP || node.type === NodeKinds.OUTPUT) {
      const incoming = incomingByTarget.get(node.id) || [];
      macros = createZeroMacros();
      for (const edge of incoming) {
        const sourceNode = nodeMap.get(edge.source);
        const sourceMacros = macrosById[edge.source] || createZeroMacros();
        const contribution = computeEdgeContribution(edge, sourceNode, sourceMacros);
        macros = addMacroTotals(macros, contribution);
      }
    } else {
      macros = createZeroMacros();
    }
    macrosById[node.id] = macros;
  }
  return macrosById;
}

function extractIngredientMacros(node) {
  const nutrition = node?.data?.nutrition;
  if (!nutrition) return createZeroMacros();
  const values = nutrition.values || nutrition.perAmount?.values || nutrition.perReference?.values;
  if (!values) return createZeroMacros();
  return normalizeMacros(values);
}

function computeEdgeContribution(edge, sourceNode, sourceMacros) {
  if (!sourceNode) return createZeroMacros();

  if (!edge?.data?.useAmount) {
    return sourceMacros;
  }

  const parsedUse = parseQuantityAndUnit(edge.data.useAmount);
  if (!parsedUse) {
    return sourceMacros;
  }

  if (sourceNode.type === NodeKinds.INGREDIENT) {
    const nutrition = sourceNode.data?.nutrition || {};
    const useBase = convertToBase(parsedUse.quantity, parsedUse.unit);
    if (!isFiniteNumber(useBase)) {
      return sourceMacros;
    }

    const amountRatio = computeRatioFromText(sourceNode.data?.amount, parsedUse);
    if (amountRatio != null) {
      return scaleMacros(sourceMacros, amountRatio);
    }

    const perAmountRatio = computeRatioFromNutrition(nutrition.perAmount, parsedUse, sourceMacros);
    if (perAmountRatio != null) {
      return perAmountRatio;
    }

    const perReferenceRatio = computeRatioFromNutrition(nutrition.perReference, parsedUse, nutrition.perReference?.values);
    if (perReferenceRatio != null) {
      return perReferenceRatio;
    }

    return sourceMacros;
  }

  return sourceMacros;
}

function computeRatioFromText(amountText, parsedUse) {
  if (!amountText) return null;
  const parsedSource = parseQuantityAndUnit(amountText);
  if (!parsedSource) return null;
  if (parsedSource.type && parsedUse.type && parsedSource.type !== parsedUse.type) return null;
  const sourceBase = convertToBase(parsedSource.quantity, parsedSource.unit);
  const useBase = convertToBase(parsedUse.quantity, parsedUse.unit);
  if (!isFiniteNumber(sourceBase) || !isFiniteNumber(useBase) || sourceBase <= 0) return null;
  const ratio = useBase / sourceBase;
  if (!isFiniteNumber(ratio)) return null;
  return Math.max(ratio, 0);
}

function computeRatioFromNutrition(ref, parsedUse, values) {
  if (!ref || !ref.quantity || !ref.unit) return null;
  if (!values) return null;
  const refUnit = normalizeUnit(ref.unit) || ref.unit;
  const refBase = convertToBase(ref.quantity, refUnit);
  const useBase = convertToBase(parsedUse.quantity, parsedUse.unit);
  if (!isFiniteNumber(refBase) || !isFiniteNumber(useBase) || refBase <= 0) return null;
  const ratio = useBase / refBase;
  if (!isFiniteNumber(ratio)) return null;
  const normalized = normalizeMacros(values);
  return scaleMacros(normalized, ratio);
}

function normalizeMacros(values) {
  const normalized = {};
  for (const key of MACRO_KEYS) {
    const num = Number(values?.[key]);
    normalized[key] = Number.isFinite(num) ? num : 0;
  }
  return normalized;
}

function scaleMacros(macros, ratio) {
  const safeRatio = isFiniteNumber(ratio) ? Number(ratio) : 1;
  const scaled = {};
  for (const key of MACRO_KEYS) {
    scaled[key] = Number((macros?.[key] || 0) * safeRatio);
  }
  return scaled;
}

function addMacroTotals(base, addition) {
  const total = {};
  for (const key of MACRO_KEYS) {
    total[key] = Number((base?.[key] || 0) + (addition?.[key] || 0));
  }
  return total;
}

function createZeroMacros() {
  const zeros = {};
  for (const key of MACRO_KEYS) zeros[key] = 0;
  return zeros;
}

function isFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num);
}
