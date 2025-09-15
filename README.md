# Recipe Flow 🍳

A node-based recipe builder that allows you to create, visualize, and validate cooking recipes using a visual flow editor. Built with React, React Flow, and Tailwind CSS.

## Features

- 🔄 Visual Recipe Building: Create recipes by connecting ingredients through steps to final dishes
- 🎯 Node Types:
  - Ingredients: Define ingredients with amounts
  - Steps: Specify cooking actions, times, and temperatures
  - Output: Define the final dish and serving size
- ✨ Interactive GUI:
  - Drag & drop nodes
  - Connect nodes with arrows
  - Edit properties in the inspector panel
- 🔍 Recipe Validation:
  - Validates the recipe graph
  - Ensures proper connections
  - Checks for missing ingredients or steps
- 💾 Import/Export:
  - Export recipes as JSON
  - Import previously saved recipes
- 🧪 Built-in Tests

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

## Usage

1. Click "+ Ingredient" to add ingredients
2. Click "+ Step" to add cooking steps
3. Click "+ Output" to add the final dish
4. Drag nodes to position them
5. Connect nodes by dragging from output handles to input handles
6. Select nodes to edit their properties in the inspector panel
7. Use the toolbar buttons to:
   - Validate your recipe
   - Simulate execution
   - Export/Import recipes
   - Run tests

## Project Structure

```
recipe_flow/
├── components/          # React components
│   ├── nodes/          # Node type components
│   ├── App.jsx         # Main app component
│   ├── InnerApp.jsx    # Flow editor component
│   └── PropertyPanel.jsx
├── constants/          # Application constants
├── utils/             # Utility functions
├── src/
│   └── styles.css     # Global styles
└── ... config files
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