import { convertToBase, getUnitInfo, getUnitType, normalizeUnit, parseQuantityAndUnit } from "./unitConversion";

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
  let reference = determineReferenceServing(product);
  let preferServing = (product.nutrition_data_per || "").trim().toLowerCase() === "serving";

  const pickAndSync = (key) => {
    const { value, referenceOverride } = pickNutrient(nutr, key, reference, preferServing);
    if (referenceOverride) {
      reference = {
        ...reference,
        ...referenceOverride,
        displayUnit: referenceOverride.displayUnit ?? reference.displayUnit ?? referenceOverride.unit,
        type: referenceOverride.type ?? reference.type,
      };
      preferServing = false;
    }
    return value;
  };

  const baseValues = {
    calories: pickAndSync("energy-kcal"),
    protein: pickAndSync("proteins"),
    fat: pickAndSync("fat"),
    carbs: pickAndSync("carbohydrates"),
  };

  return {
    values: { ...baseValues },
    perReference: {
      quantity: reference.quantity,
      unit: reference.unit,
      displayUnit: reference.displayUnit,
      values: { ...baseValues },
    },
    perAmount: null,
    ratio: null,
    warning: null,
    referenceSource: product.nutrition_data_per || null,
    servingSizeText: product.serving_size || null,
    sourceUrl: product.url,
    productName: product.product_name,
    brand: product.brands,
    barcode: product.code,
  };
}

export function adjustNutritionForAmount(nutrition, amountString) {
  if (!nutrition) return nutrition;
  const perReference = nutrition.perReference
    ? { ...nutrition.perReference, values: { ...nutrition.perReference.values } }
    : null;
  const baseValues = perReference ? { ...perReference.values } : { ...(nutrition.values || {}) };
  const referenceQuantity = perReference?.quantity ?? 100;
  const referenceUnit = perReference?.unit || null;
  const normalizedUnit = referenceUnit ? normalizeUnit(referenceUnit) || referenceUnit : null;
  const baseType = normalizedUnit ? getUnitType(normalizedUnit) : null;
  const existingDisplayUnit = nutrition.perReference?.displayUnit || nutrition.perReference?.unit || referenceUnit;

  let ratio = null;
  let warning = null;
  let perAmount = null;

  const parsedAmount = parseQuantityAndUnit(amountString || "");
  if (parsedAmount && normalizedUnit) {
    if (baseType && parsedAmount.type === baseType) {
      const referenceInBase = convertToBase(referenceQuantity, normalizedUnit);
      const amountInBase = convertToBase(parsedAmount.quantity, parsedAmount.unit);
      if (referenceInBase && amountInBase != null && referenceInBase > 0) {
        ratio = amountInBase / referenceInBase;
      } else {
        warning = "Unable to scale nutrition with the provided units.";
      }
    } else if (baseType && parsedAmount.type && parsedAmount.type !== baseType) {
      warning = `Cannot convert ${parsedAmount.originalUnit || parsedAmount.unit} to ${existingDisplayUnit || referenceUnit}.`;
    } else if (!baseType) {
      warning = "Nutrition reference uses unsupported units; showing original values.";
    }
  } else if (amountString && amountString.trim()) {
    warning = "Could not parse ingredient amount; showing reference nutrition.";
  }

  const scaledValues = ratio != null ? scaleValues(baseValues, ratio) : { ...baseValues };
  if (ratio != null && parsedAmount) {
    perAmount = {
      quantity: parsedAmount.quantity,
      unit: parsedAmount.unit,
      displayUnit: parsedAmount.originalUnit || parsedAmount.unit,
      values: { ...scaledValues },
    };
  }

  return {
    ...nutrition,
    values: scaledValues,
    ratio,
    perAmount,
    warning,
    perReference: perReference || {
      quantity: referenceQuantity,
      unit: normalizedUnit,
      displayUnit: existingDisplayUnit || normalizedUnit,
      values: { ...baseValues },
    },
  };
}

function determineReferenceServing(product) {
  const rawPer = (product.nutrition_data_per || "").trim();
  const lowerPer = rawPer.toLowerCase();
  if (lowerPer === "serving") {
    const servingParsed = parseQuantityAndUnit(product.serving_size || "");
    if (servingParsed) {
      return {
        ...servingParsed,
        displayUnit: servingParsed.originalUnit || servingParsed.unit,
      };
    }
    return { quantity: 1, unit: "serving", displayUnit: "serving", type: null };
  }

  const parsedPer = parseQuantityAndUnit(rawPer);
  if (parsedPer) {
    return {
      ...parsedPer,
      displayUnit: parsedPer.originalUnit || parsedPer.unit,
    };
  }

  const servingParsed = parseQuantityAndUnit(product.serving_size || "");
  if (servingParsed) {
    return {
      ...servingParsed,
      displayUnit: servingParsed.originalUnit || servingParsed.unit,
    };
  }

  const fallbackUnitName = lowerPer.includes("ml") ? "ml" : "g";
  const normalized = normalizeUnit(fallbackUnitName) || fallbackUnitName;
  const info = getUnitInfo(normalized);
  return {
    quantity: 100,
    unit: normalized,
    displayUnit: fallbackUnitName,
    type: info?.type || null,
  };
}

function pickNutrient(nutriments, key, reference, preferServing) {
  const normalizedReferenceUnit = reference?.unit ? normalizeUnit(reference.unit) || reference.unit : null;
  const options = [];
  const seen = new Set();
  const addOption = (suffix, override = null) => {
    if (seen.has(suffix)) return;
    seen.add(suffix);
    options.push({ suffix, override });
  };

  if (preferServing) {
    addOption("_serving");
    addOption("_serving_value");
  }

  if (normalizedReferenceUnit === "ml") {
    addOption("_100ml", { quantity: 100, unit: "ml", displayUnit: "ml", type: "volume" });
  } else if (normalizedReferenceUnit === "g") {
    addOption("_100g", { quantity: 100, unit: "g", displayUnit: "g", type: "mass" });
  }

  addOption("_100g", { quantity: 100, unit: "g", displayUnit: "g", type: "mass" });
  addOption("_100ml", { quantity: 100, unit: "ml", displayUnit: "ml", type: "volume" });
  addOption("_value");
  addOption("");

  for (const option of options) {
    const raw = nutriments[`${key}${option.suffix}`];
    const num = toNumber(raw);
    if (num != null) {
      return { value: num, referenceOverride: option.override || null };
    }
  }

  return { value: null, referenceOverride: null };
}

function toNumber(value) {
  if (value == null) return null;
  const num = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(num) ? num : null;
}

function scaleValues(values, ratio) {
  const scaled = {};
  Object.entries(values || {}).forEach(([key, val]) => {
    if (typeof val === "number" && Number.isFinite(val)) {
      scaled[key] = Number((val * ratio).toFixed(3));
    } else {
      scaled[key] = val;
    }
  });
  return scaled;
}
