# Recipe Flow

A node-based recipe builder that allows you to create, visualize, and validate cooking recipes using a visual flow editor. Built with React, React Flow, and Tailwind CSS.

## Features

- Visual recipe building with a drag-and-drop flow editor
- Node types for ingredients, steps, and outputs
- Interactive GUI for connecting nodes and editing properties
- Recipe validation for missing inputs, invalid links, and cycles
- Import/Export recipes as JSON
- Nutrition lookup (powered by Open Food Facts) for ingredient macros
- Built-in smoke tests that exercise the core graph utilities

## Prerequisites

- Node.js 16 or later
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/teidenzero/recipe_flow.git
   cd recipe_flow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

Start the development server:
```bash
npm run dev
```

Visit http://localhost:5173 (or the URL shown in your terminal) in your browser.

## Deployment (GitHub Pages)

This project is pre-configured to deploy to GitHub Pages at [https://teidenzero.github.io/recipe_flow/](https://teidenzero.github.io/recipe_flow/).

1. Build and publish the site:
   ```bash
   npm run deploy
   ```
   The `predeploy` script runs `npm run build`, and `deploy` pushes the generated `dist/` folder to the `gh-pages` branch.

2. In the GitHub repository settings, ensure **Pages** is set to deploy from the `gh-pages` branch (this only needs to be done once).

Subsequent runs of `npm run deploy` will update the live site automatically.

## Usage

1. Click "+ Ingredient" to add ingredients
2. Click "+ Step" to add cooking steps
3. Click "+ Output" to add the final dish
4. Drag nodes to position them
5. Connect nodes by dragging from output handles to input handles
6. Select nodes to edit their properties in the inspector panel
7. Use the toolbar buttons to validate, simulate, import/export, and run tests
8. For ingredient nodes, use the Nutrition Lookup card to fetch macro data from Open Food Facts (optional)

## Nutrition Lookup

Ingredient nodes include a Nutrition Lookup helper powered by [Open Food Facts](https://world.openfoodfacts.org/).

- Search by product name (defaulting to the ingredient label) to review up to 50 matches (calories and serving units) in the dropdown, or enter a barcode for a direct lookup
- Click "Fetch by name" to populate the dropdown or "Fetch by barcode" for a direct match; selected results include calories, protein, fat, and carbs per 100g (or per serving when available)
- Nutrition values automatically scale to the ingredient amount when the units are compatible (g, kg, mg, lb, oz, ml, l, tsp, tbsp, cup)
- The fetched data is stored on the node and displayed both in the inspector and on the ingredient node itself
- Use "Clear nutrition data" if you want to remove the stored values

Open Food Facts is community-maintained, so results depend on their dataset and may vary by region. No API key is required.

## Project Structure

```
recipe_flow/
|-- components/          # React components
|   |-- nodes/           # Node type components
|   |-- App.jsx          # Main app component
|   |-- InnerApp.jsx     # Flow editor component
|   |-- PropertyPanel.jsx
|-- constants/           # Application constants
|-- utils/               # Utility functions
|-- src/
|   |-- styles.css       # Global styles
|-- ... config files
```

## Tech Stack

- React
- React Flow (node-based editor)
- Vite (build tool)
- Tailwind CSS (styling)

## Contributing

Feel free to open issues and submit pull requests. Please make sure to run tests before submitting changes.

## License

ISC
