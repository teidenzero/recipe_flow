import React from "react";
import InnerApp from "./InnerApp";

export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Recipe Flow (Prototype)</h1>
      <p className="opacity-80 mb-4 text-sm">Add ingredients, connect them into steps, and end at an output dish. Validate the DAG and simulate execution. Export/Import JSON. Use Run Tests to verify core graph logic. Curved edges with arrowheads are enabled for multi‑input flows.</p>
      <InnerApp />
    </div>
  );
}
