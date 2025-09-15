const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const PRODUCT_URL = "https://world.openfoodfacts.org/api/v0/product";

export async function fetchNutrition(label) {
  const res = await fetch(
    `${SEARCH_URL}?search_terms=${encodeURIComponent(label)}&search_simple=1&action=process&json=1&page_size=1`
  );
  if (!res.ok) throw new Error(`Open Food Facts API error: ${res.status}`);

  const data = await res.json();
  const product = data.products?.[0];
  if (!product) throw new Error("No nutrition data found");

  return extractNutrients(product);
}

export async function fetchNutritionByBarcode(barcode) {
  const res = await fetch(`${PRODUCT_URL}/${encodeURIComponent(barcode)}.json`);
  if (!res.ok) throw new Error(`Open Food Facts API error: ${res.status}`);

  const data = await res.json();
  const product = data.product;
  if (!product) throw new Error("No nutrition data found");

  return extractNutrients(product);
}

export function extractNutrients(product) {
  const nutr = product.nutriments || {};
  return {
    calories: nutr["energy-kcal_100g"] ?? nutr["energy-kcal"],
    protein: nutr["proteins_100g"] ?? nutr["proteins"],
    fat: nutr["fat_100g"] ?? nutr["fat"],
    carbs: nutr["carbohydrates_100g"] ?? nutr["carbohydrates"],
    sourceUrl: product.url,
    productName: product.product_name,
    brand: product.brands,
    barcode: product.code,
  };
}
