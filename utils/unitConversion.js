const UNIT_DEFINITIONS = {
  g: { type: "mass", toBase: 1, aliases: ["g", "gram", "grams", "gramme", "grammes"] },
  kg: { type: "mass", toBase: 1000, aliases: ["kg", "kilogram", "kilograms"] },
  mg: { type: "mass", toBase: 0.001, aliases: ["mg", "milligram", "milligrams"] },
  lb: { type: "mass", toBase: 453.59237, aliases: ["lb", "lbs", "pound", "pounds"] },
  oz: { type: "mass", toBase: 28.349523125, aliases: ["oz", "ounce", "ounces"] },
  ml: { type: "volume", toBase: 1, aliases: ["ml", "milliliter", "milliliters", "millilitre", "millilitres"] },
  l: { type: "volume", toBase: 1000, aliases: ["l", "liter", "liters", "litre", "litres"] },
  tsp: { type: "volume", toBase: 4.92892, aliases: ["tsp", "teaspoon", "teaspoons"] },
  tbsp: { type: "volume", toBase: 14.7868, aliases: ["tbsp", "tablespoon", "tablespoons"] },
  cup: { type: "volume", toBase: 240, aliases: ["cup", "cups"] },
};

const UNIT_ALIAS_LOOKUP = Object.entries(UNIT_DEFINITIONS).reduce((acc, [unit, def]) => {
  def.aliases.forEach((alias) => {
    acc[alias.toLowerCase()] = unit;
  });
  return acc;
}, {});

export function normalizeUnit(rawUnit) {
  if (!rawUnit || typeof rawUnit !== "string") return null;
  const cleaned = rawUnit.trim().toLowerCase().replace(/\./g, "");
  return UNIT_ALIAS_LOOKUP[cleaned] || null;
}

export function getUnitInfo(unit) {
  const normalized = normalizeUnit(unit) || unit;
  return UNIT_DEFINITIONS[normalized] || null;
}

const NUMBER_UNIT_REGEX = /([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)/g;

export function parseQuantityAndUnit(text) {
  if (!text || typeof text !== "string") return null;
  let match;
  while ((match = NUMBER_UNIT_REGEX.exec(text))) {
    const quantity = parseFloat(match[1].replace(",", "."));
    if (Number.isNaN(quantity)) continue;
    const normalizedUnit = normalizeUnit(match[2]);
    if (!normalizedUnit) continue;
    const unitInfo = UNIT_DEFINITIONS[normalizedUnit];
    if (!unitInfo) continue;
    return {
      quantity,
      unit: normalizedUnit,
      originalUnit: match[2],
      type: unitInfo.type,
    };
  }
  return null;
}

export function convertToBase(quantity, unit) {
  const unitInfo = UNIT_DEFINITIONS[unit];
  if (!unitInfo) return null;
  return quantity * unitInfo.toBase;
}

export function convertBetween(quantity, fromUnit, toUnit) {
  const fromInfo = UNIT_DEFINITIONS[fromUnit];
  const toInfo = UNIT_DEFINITIONS[toUnit];
  if (!fromInfo || !toInfo || fromInfo.type !== toInfo.type) return null;
  const baseValue = convertToBase(quantity, fromUnit);
  if (baseValue == null) return null;
  return baseValue / toInfo.toBase;
}

export function getUnitType(unit) {
  const info = UNIT_DEFINITIONS[unit];
  return info ? info.type : null;
}

export function compareUnitTypes(unitA, unitB) {
  const typeA = getUnitType(unitA);
  const typeB = getUnitType(unitB);
  if (!typeA || !typeB) return false;
  return typeA === typeB;
}

export function buildAmountLabel(quantity, unit) {
  if (quantity == null || !unit) return null;
  const normalized = normalizeUnit(unit) || unit;
  return `${quantity}${normalized}`;
}
