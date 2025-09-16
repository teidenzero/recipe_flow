# Nutrition Lookup Guide

This document explains how the ingredient nutrition lookup works in Recipe Flow and how to operate or extend it.

## Overview

Ingredient nodes can fetch nutrition data from [Open Food Facts](https://world.openfoodfacts.org/). You can search by product name, review up to 50 matches, or look up a product directly by barcode. Once a result is selected, its nutrition values are scaled to the ingredient amount stored on the node.

The lookup feature lives in `components/PropertyPanel.jsx` and relies on helpers from `utils/nutritionProvider.js`.

## Searching by Name

1. Select an ingredient node to open the inspector.
2. Enter a product name in the **Search term** field (defaults to the ingredient label).
3. Click **Search by name**. The app will call `searchNutritionCandidates` and return up to 50 matches.
4. Review the dropdown list. Each option shows:
   - Product name (and brand, if available)
   - Calories per reference quantity
   - Serving unit for the reference quantity (e.g., `100 g`, `30 g`)
5. Choose the closest match and click **Use selected result**. The ingredient’s nutrition data is updated and scaled to the node’s `amount` field.

If only one match is returned, it is applied automatically.

## Searching by Barcode

1. Enter a barcode in the **Barcode** field.
2. Click **Fetch by barcode**. The app calls `fetchNutritionByBarcode` for an exact match.
3. The returned nutrition data is applied immediately, bypassing the dropdown.

## Adjusting Amounts

- Changing the ingredient `amount` field triggers `adjustNutritionForAmount`, which rescales the nutrition values based on compatible units (mass or volume).
- If units are incompatible or cannot be parsed, the UI keeps the reference values and shows a warning.

## Clearing and Resetting

- Click **Clear nutrition data** to remove the stored nutrition object from the ingredient.
- Running a new search replaces previous results; the dropdown resets when a new ingredient is selected.

## Extending the Feature

- **API Layer:** `utils/nutritionProvider.js` exposes `searchNutritionCandidates`, `fetchNutrition`, and `fetchNutritionByBarcode`. Each candidate includes the original nutrition data so you can enrich the UI without re-fetching.
- **UI:** Customize the dropdown label in `buildResultOptionLabel` in `PropertyPanel.jsx`.
- **Limits:** The search helper enforces a maximum of 50 results (`DEFAULT_SEARCH_LIMIT`). Adjust this constant if needed.
- **Error Handling:** All fetch helpers throw on network failures or missing data. PropertyPanel catches errors and displays status messages to the user.

## Testing

- Unit tests in `utils/testUtils.js` cover nutrition extraction and scaling logic. Add additional tests there if you expand parsing rules or unit conversions.

## Troubleshooting

- **No results:** Ensure the search term is broad enough. Open Food Facts data varies by region.
- **Parsing warnings:** Amounts like `1 bunch` or non-standard units are not convertible. Update `utils/unitConversion.js` with additional unit aliases if required.
- **Deployment:** The lookup uses client-side fetches to the public Open Food Facts API, so no server configuration is required.

For further enhancements (e.g., caching results, richer product detail cards), extend the helper functions in `nutritionProvider.js` and adjust the PropertyPanel UI accordingly.
