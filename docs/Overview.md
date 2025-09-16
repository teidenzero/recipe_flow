# Recipe Flow Documentation

This guide provides an overview of the Recipe Flow project, how the visual editor is structured, and how to extend or deploy it. If you are new to the codebase, start here.

## 1. Introduction

Recipe Flow is a React application that lets users build recipes as visual graphs. It relies on [React Flow](https://reactflow.dev/) for the node-based editor, [Tailwind CSS](https://tailwindcss.com/) for styling, and Vite for the build toolchain.

Key capabilities include:

- Creating ingredient, step, and output nodes
- Connecting nodes to represent recipe flow
- Validating for missing inputs and cycles
- Simulating a textual recipe run-through
- Importing/exporting recipes as JSON
- Looking up nutrition for ingredients (with dropdown selection)

## 2. Directory Structure

```
recipe_flow/
|-- components/
|   |-- App.jsx             # Shell around the editor
|   |-- InnerApp.jsx        # Main React Flow configuration
|   |-- PropertyPanel.jsx   # Inspector for selected nodes
|   |-- nodes/              # React components for each node type
|-- constants/
|   |-- nodeKinds.js        # Enum of node type identifiers
|-- utils/
|   |-- graphUtils.js       # Validation, execution, nutrition helpers
|   |-- recipeIO.js         # Import/export helpers
|   |-- testUtils.js        # Built-in smoke tests
|   |-- uid.js              # ID generator
|   |-- nutritionProvider.js# Nutrition API helpers
|-- src/styles.css          # Tailwind entry point
|-- docs/                   # Documentation (this file, nutrition guide, etc.)
```

## 3. Application Flow

1. **Entry Point (`main.jsx`)** - Mounts `<App />`.
2. **App shell (`components/App.jsx`)** - Provides layout and renders `<InnerApp />`.
3. **Editor (`components/InnerApp.jsx`)** - Configures React Flow (nodes, edges, selection, toolbar actions).
4. **Nodes (`components/nodes/*.jsx`)** - Render individual node types.
5. **Property Panel (`components/PropertyPanel.jsx`)** - Displays editable fields for the selected node, including nutrition lookup for ingredients.
6. **Utilities (`utils/*`)** - Shared functions for validation, import/export, nutrition, etc.

## 4. Node Architecture

Recipe Flow uses three core node types defined in `constants/nodeKinds.js`:

- `ingredient`: Source nodes with amount data and optional nutrition information.
- `step`: Processing nodes that can take multiple inputs; store action, time, temperature.
- `output`: Sink nodes representing the final dish, storing serving count.

Each node component receives `data` (user-provided fields) and renders its UI. Additional node types can be added by:

1. Extending `NodeKinds` with a new identifier.
2. Creating a React component under `components/nodes/` for rendering.
3. Registering the new component in `components/InnerApp.jsx` under `nodeTypes`.
4. Updating `PropertyPanel.jsx` to expose editable fields for the new node type.

## 5. Toolbar Actions

The toolbar buttons in `InnerApp.jsx` map to these functions:

- **Validate** - `validateGraph` checks node/edge rules and cycles.
- **Simulate** - `simulateExecute` produces a textual recipe log.
- **Export** - `exportRecipe` serializes nodes/edges to JSON and copies to clipboard.
- **Import** - Prompts for JSON, parses via `importRecipe`, and sets state.
- **Run Tests** - Invokes `runTests`, logging smoke-test results.
- **Map Toggle / Delete Selection** - UI conveniences provided by React Flow and local state.

## 6. Nutrition Lookup

Ingredient nutrition is handled in `PropertyPanel.jsx` and `utils/nutritionProvider.js`. Users can:

- Search by name (dropdown of up to 50 Open Food Facts matches with calories and serving units).
- Fetch by barcode for a direct match.
- Apply a result, which is then scaled to the node's `amount` using unit conversion logic in `utils/unitConversion.js`.

Detailed instructions live in [docs/NutritionLookup.md](./NutritionLookup.md).

## 7. Nutrition Propagation

Once nutrition is attached to ingredients, `computeNodeNutrition` (in `utils/graphUtils.js`) propagates macro totals through the graph:

- Ingredient macros are scaled according to edge `useAmount` values (with unit conversion) before flowing into step nodes.
- Step nodes aggregate the scaled macros from all incoming edges, exposing the sum via `data.computedNutrition`.
- Output nodes accumulate macros from every upstream branch, enabling the UI to display total calories, protein, fat, and carbs for the final dish.

`InnerApp.jsx` stores the computed totals on each node so that `StepNode` and `OutputNode` components can render the values in real time.

## 8. Validation & Simulation

- `validateGraph(nodes, edges)` - Ensures every output has inputs, ingredient nodes have no incoming edges, steps have at least one input, and no cycles exist (via `topologicalSort`).
- `simulateExecute(nodes, edges)` - Traverses the DAG in topological order, generating human-readable steps. Ingredient labels and edge `useAmount` data feed into the output text.

These functions are used by UI buttons and can be reused in future automation (e.g., exporting to PDF).

## 9. Import/Export Format

`utils/recipeIO.js` defines the JSON schema:

```
{
  "nodes": [
    {
      "id": "unique id",
      "type": "ingredient|step|output",
      "position": { "x": number, "y": number },
      "data": { /* node-specific fields */ }
    }
  ],
  "edges": [
    {
      "id": "unique id",
      "source": "nodeId",
      "target": "nodeId",
      "data": { "useAmount": string }
    }
  ]
}
```

When importing, the utility ensures edges get default styles (bezier, arrow heads) and IDs if missing.

## 10. Styling

Tailwind CSS classes are used throughout components. Global CSS lives in `src/styles.css`. If you add Tailwind plugins or custom themes, update `tailwind.config.js` and `postcss.config.js`.

## 11. Testing

`utils/testUtils.js` bundles a set of smoke tests that run when the user clicks **Run Tests**. They cover:

- Graph validation
- Simulation logging
- Import/export round-trips
- Nutrition extraction, scaling, and propagation

You can add more assertions to this file or wire a full testing framework (e.g., Vitest) if deeper coverage is needed.

## 12. Deployment

The project is configured for GitHub Pages:

1. `npm run deploy` runs `vite build` then publishes `dist/` via `gh-pages`.
2. Ensure the repository's Pages setting points to the `gh-pages` branch.
3. Links and asset paths are fixed by setting `base: "/recipe_flow/"` in `vite.config.js`.

Alternate hosting options (Netlify, Vercel) only require pointing the build command to `npm run build` and publishing the `dist/` directory.

## 13. Extending the App

Ideas for modular extensions:

- **New Node Types:** e.g., timers, notes, equipment.
- **Custom Validation Rules:** Extend `validateGraph` to enforce nutrition or allergen checks.
- **Advanced Simulation:** Replace `simulateExecute` with a more detailed output (e.g., step timing summaries).
- **Integration Modules:** Following the nutrition pattern, you can integrate other APIs (spice databases, wine pairings, etc.) by adding utilities under `utils/` and UI sections in `PropertyPanel.jsx`.

When sharing modules, include documentation similar to `docs/NutritionLookup.md` so contributors understand configuration and API usage.

## 14. Contributing

- Fork the repo, clone locally, and run `npm install`.
- Use `npm run dev` for interactive development.
- Run the built-in tests via the UI or add automated checks as needed.
- Update documentation for any new features (docs are located under `docs/`).
- Submit pull requests with a clear summary and screenshots if the UI changes.

## 15. Resources

- [React Flow Docs](https://reactflow.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Open Food Facts API](https://wiki.openfoodfacts.org/API)
- [Nutrition Lookup Guide](./NutritionLookup.md)

Feel free to expand this documentation as the project evolves—sections such as API integration, multi-user collaboration, or persistence layers can be added when implemented.
