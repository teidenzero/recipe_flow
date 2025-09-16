import graphUtils from "../utils/graphUtils.js";
import nodeKindsModule from "../constants/nodeKinds.js";

const { computeNodeNutrition } = graphUtils;
const { NodeKinds } = nodeKindsModule;
const ingredient = {
  id: "ing1",
  type: NodeKinds.INGREDIENT,
  position: { x: 0, y: 0 },
  data: {
    label: "Sugar",
    amount: "100 g",
    nutrition: {
      values: {
        calories: 400,
        protein: 0,
        fat: 0,
        carbs: 100,
      },
    },
  },
};
const ingredient2 = {
  id: "ing2",
  type: NodeKinds.INGREDIENT,
  position: { x: 0, y: 1 },
  data: {
    label: "Butter",
    amount: "200 g",
    nutrition: {
      values: {
        calories: 150,
        protein: 2,
        fat: 16,
        carbs: 0,
      },
    },
  },
};
const step = { id: "step", type: NodeKinds.STEP, position: { x: 1, y: 0 }, data: { label: "Combine" } };
const output = { id: "out", type: NodeKinds.OUTPUT, position: { x: 2, y: 0 }, data: { label: "Dessert" } };
const edges = [
  { id: "e1", source: ingredient.id, target: step.id, data: { useAmount: "50 g" } },
  { id: "e2", source: ingredient2.id, target: step.id },
  { id: "e3", source: step.id, target: output.id },
];
const macros = computeNodeNutrition([ingredient, ingredient2, step, output], edges);
console.log('Step', macros[step.id]);
console.log('Output', macros[output.id]);
