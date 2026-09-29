(function (root) {
  "use strict";

  const fields = Object.freeze({
    value: { label: "Measured value", decimals: 2, max: 1e12 },
    taxable: { label: "Taxable acreage", decimals: 4, max: 1e9 },
    roads: { label: "Roads / right-of-way acreage", decimals: 4, max: 1e9 },
    drainage: { label: "Drainage / detention acreage", decimals: 4, max: 1e9 },
    common: { label: "Common / open space acreage", decimals: 4, max: 1e9 },
    easements: { label: "Easements / other acreage", decimals: 4, max: 1e9 }
  });
  const landKeys = Object.freeze(["taxable", "roads", "drainage", "common", "easements"]);
  const defaults = Object.freeze({
    a: Object.freeze({ name: "40-acre neighborhood", value: "28,000,000", taxable: "28", roads: "5", drainage: "4", common: "3", easements: "0" }),
    b: Object.freeze({ name: "5-acre development", value: "2,000,000", taxable: "2", roads: "1", drainage: "0.75", common: "1", easements: "0.25" })
  });
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const acreage = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
  const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function parseField(raw, key) {
    const field = fields[key];
    let text = String(raw == null ? "" : raw).trim();
    if (key === "value") text = text.replace(/^\$\s*/, "");
    if (!text) return { error: key === "taxable" ? "Enter taxable acreage greater than zero." : "Enter a value. Use 0 if none." };
    if (/^-/.test(text)) return { error: "Use zero or a positive number." };
    // Accept US grouping, but never silently turn malformed input into a new value.
    if (!/^(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)$/.test(text)) {
      return { error: "Use a number such as 1,250 or 1.25." };
    }
    const fraction = text.split(".")[1] || "";
    if (fraction.length > field.decimals) return { error: `Use no more than ${field.decimals} decimal places.` };
    const value = Number(text.replace(/,/g, ""));
    if (!Number.isFinite(value) || value > field.max) return { error: `Use a number no larger than ${acreage.format(field.max)}.` };
    if (key === "taxable" && value === 0) return { error: "Taxable acreage must be greater than zero." };
    return { value };
  }

  function calculate(raw) {
    const errors = {};
    const values = {};
    Object.keys(fields).forEach((key) => {
      const parsed = parseField(raw[key], key);
      if (parsed.error) errors[key] = parsed.error;
      else values[key] = parsed.value;
    });
    if (Object.keys(errors).length) return { valid: false, errors };

    // Sum exact ten-thousandths of an acre to avoid visible decimal addition drift.
    const gross = landKeys.reduce((sum, key) => sum + Math.round(values[key] * 10000), 0) / 10000;
    const taxableRate = values.value / values.taxable;
    const grossRate = values.value / gross;
    // For V > 0, (V/AT - V/AG) / (V/AT) equals (AG - AT) / AG.
    const reduction = values.value === 0 ? null : (gross - values.taxable) / gross * 100;
    return {
      valid: true, errors, values, gross, taxableRate, grossRate, reduction,
      taxableShare: values.taxable / gross * 100,
      name: String(raw.name || "").trim().slice(0, 64)
    };
  }

  function formatPercent(value) {
    if (value == null) return "N/A";
    if (value > 0 && value < 0.05) return "<0.1%";
    if (value < 100 && value >= 99.95) return ">99.9%";
    return `${percent.format(value)}%`;
  }

  function summary(scenarios) {
    if (scenarios.some((scenario) => !scenario.valid)) return null;
    const lines = ["THE COST OF PLACE", "Value per acre | Scenario comparison", ""];
    scenarios.forEach((s, index) => {
      lines.push(
        `Scenario ${String.fromCharCode(65 + index)}: ${s.name || "Untitled scenario"}`,
        `Measured value (USD): ${money.format(s.values.value)}`,
        `Taxable acreage: ${acreage.format(s.values.taxable)} acres`,
        `Roads / right-of-way: ${acreage.format(s.values.roads)} acres`,
        `Drainage / detention: ${acreage.format(s.values.drainage)} acres`,
        `Common / open space: ${acreage.format(s.values.common)} acres`,
        `Easements / other: ${acreage.format(s.values.easements)} acres`,
        `Gross development acreage: ${acreage.format(s.gross)} acres`,
        `Value per taxable acre: ${money.format(s.taxableRate)}/acre`,
        `Value per gross acre: ${money.format(s.grossRate)}/acre`,
        `Reduction using gross acreage: ${s.reduction == null ? "N/A (both rates are $0; the percentage is undefined)" : formatPercent(s.reduction)}`,
        ""
      );
    });
    lines.push(
      "FORMULAS",
      "AG = AT + AR + AD + AC + AE",
      "Value per taxable acre = V / AT; value per gross acre = V / AG.",
      "Reduction (%) = [(V / AT - V / AG) / (V / AT)] × 100, for V > 0.",
      "V = measured value; AT = taxable acreage; AR = roads; AD = drainage; AC = common space; AE = easements/other.",
      "The same measured value is used for both denominators within each scenario. Displayed results are rounded; calculations use unrounded values.",
      "",
      "Results are only comparable when the acreage boundary is defined consistently.",
      "Count each acre once. Additional land must exclude acreage already counted in taxable parcels or another category; an easement may overlap a taxable parcel.",
      "Use a consistent value definition, assessment date, and treatment of shared land across scenarios. Saleable acreage is not automatically taxable acreage.",
      "This compares value density, not tax revenue, service costs, or net fiscal impact."
    );
    return lines.join("\n");
  }

  const api = Object.freeze({ fields, landKeys, defaults, parseField, calculate, formatPercent, summary, money, acreage });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AcreCalculator = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
