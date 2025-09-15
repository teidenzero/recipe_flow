import { MarkerType } from "reactflow";
import { NodeKinds } from "../constants/nodeKinds";
import { validateGraph, simulateExecute } from "./graphUtils";
import { exportRecipe, importRecipe } from "./recipeIO";

export function runTests(logFn = console.log) {
  const results = [];
  const assert = (name, cond) => results.push({ name, pass: !!cond });
  (() => {
    const ing = { id: "i1", type: NodeKinds.INGREDIENT, position: { x: 0, y: 0 }, data: { label: "Flour" } };
    const step = { id: "s1", type: NodeKinds.STEP, position: { x: 1, y: 0 }, data: { label: "Mix", action: "Combine" } };
    const out = { id: "o1", type: NodeKinds.OUTPUT, position: { x: 2, y: 0 }, data: { label: "Dough" } };
    const edges = [
      { id: "e1", source: ing.id, target: step.id },
      { id: "e2", source: step.id, target: out.id },
    ];
    const errs = validateGraph([ing, step, out], edges);
    assert("Valid DAG has no validation errors", errs.length === 0);
    const sim = simulateExecute([ing, step, out], edges);
    assert("Simulation returns non-empty log", typeof sim === "string" && sim.length > 0);
  })();
  (() => {
    const ing = { id: "i1", type: NodeKinds.INGREDIENT, position: { x: 0, y: 0 }, data: { label: "Water" } };
    const step = { id: "s1", type: NodeKinds.STEP, position: { x: 1, y: 0 }, data: { label: "Weird", action: "Push" } };
    const edges = [{ id: "e1", source: step.id, target: ing.id }];
    const errs = validateGraph([ing, step], edges);
    assert("Ingredient cannot have incoming edges", errs.some((e) => e.includes("cannot have inputs")));
  })();
  (() => {
    const out = { id: "o1", type: NodeKinds.OUTPUT, position: { x: 0, y: 0 }, data: { label: "Dish" } };
    const errs = validateGraph([out], []);
    assert("Output without inputs triggers error", errs.some((e) => e.includes("no inputs")));
  })();
  (() => {
    const a = { id: "a", type: NodeKinds.STEP, position: { x: 0, y: 0 }, data: { label: "A" } };
    const b = { id: "b", type: NodeKinds.STEP, position: { x: 0, y: 0 }, data: { label: "B" } };
    const edges = [
      { id: "e1", source: a.id, target: b.id },
      { id: "e2", source: b.id, target: a.id },
    ];
    const errs = validateGraph([a, b], edges);
    assert("Cycle is detected", errs.some((e) => e.includes("Cycle detected")));
  })();
  (() => {
    const i1 = { id: "i1", type: NodeKinds.INGREDIENT, position: { x: 0, y: 0 }, data: { label: "Flour", amount: "1 cup" } };
    const i2 = { id: "i2", type: NodeKinds.INGREDIENT, position: { x: 0, y: 1 }, data: { label: "Water", amount: "1 cup" } };
    const s = { id: "s", type: NodeKinds.STEP, position: { x: 1, y: 1 }, data: { label: "Mix", action: "Combine" } };
    const o = { id: "o", type: NodeKinds.OUTPUT, position: { x: 2, y: 1 }, data: { label: "Dough" } };
    const edges = [
      { id: "e1", source: i1.id, target: s.id, data: { useAmount: "0.5 cup" } },
      { id: "e2", source: i2.id, target: s.id, data: { useAmount: "1 cup" } },
      { id: "e3", source: s.id, target: o.id },
    ];
    const errs = validateGraph([i1, i2, s, o], edges);
    assert("Step accepts multiple inputs without error", errs.length === 0);
    const log = simulateExecute([i1, i2, s, o], edges);
    assert("Edge override shows Flour 0.5 cup", log.includes("Flour") && log.includes("0.5 cup"));
    assert("Edge override shows Water 1 cup", log.includes("Water") && log.includes("1 cup"));
  })();
  (() => {
    const i1 = { id: "i1", type: NodeKinds.INGREDIENT, position: { x: 0, y: 0 }, data: { label: "Flour", amount: "1 cup" } };
    const s1 = { id: "s1", type: NodeKinds.STEP, position: { x: 1, y: 0 }, data: { label: "Mix", action: "Combine" } };
    const edges = [{ id: "e1", source: i1.id, target: s1.id }];
    const json = exportRecipe([i1, s1], edges);
    const r = importRecipe(json);
    assert("Import round-trip nodes", r.nodes.length === 2);
    assert("Import round-trip edges", r.edges.length === 1);
  })();
  (() => {
    const base = JSON.stringify({ nodes: [{ id: "i", type: NodeKinds.INGREDIENT, position: { x: 0, y: 0 }, data: { label: "Flour", amount: "1 cup" } }], edges: [] });
    const text = "Exported to clipboard (JSON)." + base;
    const r = importRecipe(text);
    assert("Import tolerant of prefix", r.nodes.length === 1 && r.edges.length === 0);
  })();
  (() => {
    const raw = {
      nodes: [
        { id: "i", type: NodeKinds.INGREDIENT, position: { x: 0, y: 0 }, data: { label: "Water", amount: "1 cup" } },
        { id: "s", type: NodeKinds.STEP, position: { x: 1, y: 0 }, data: { label: "Boil" } },
      ],
      edges: [{ source: "i", target: "s" }],
    };
    const r = importRecipe(JSON.stringify(raw));
    const e = r.edges[0];
    assert("Import supplies edge id", typeof e.id === "string" && e.id.length > 0);
    assert("Import sets edge defaults", e.type === "bezier" && e.markerEnd && e.markerEnd.type === MarkerType.ArrowClosed);
  })();
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  const summary = `Tests: ${passed}/${total} passed`;
  logFn([summary, ...results.map((r) => `${r.pass ? "✅" : "❌"} ${r.name}`)].join("\n"));
  return { passed, total };
}
