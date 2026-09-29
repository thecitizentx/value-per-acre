"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../calculator.js");
const scenario = (changes = {}) => ({ ...core.defaults.a, ...changes });

test("40-acre example preserves the numerator and produces the documented rates", () => {
  const result = core.calculate(scenario());
  assert.equal(result.valid, true);
  assert.equal(result.gross, 40);
  assert.equal(result.taxableRate, 1000000);
  assert.equal(result.grossRate, 700000);
  assert.equal(result.reduction, 30);
});

test("five-acre example has the same taxable density but a different gross density", () => {
  const result = core.calculate(core.defaults.b);
  assert.equal(result.gross, 5);
  assert.equal(result.taxableRate, 1000000);
  assert.equal(result.grossRate, 400000);
  assert.equal(result.reduction, 60);
});

test("zero value keeps acreage and zero rates but has no defined percentage", () => {
  const result = core.calculate(scenario({ value: "0" }));
  assert.equal(result.valid, true);
  assert.equal(result.gross, 40);
  assert.equal(result.taxableRate, 0);
  assert.equal(result.grossRate, 0);
  assert.equal(result.reduction, null);
});

test("identical acreage denominators produce equal rates and no reduction", () => {
  const result = core.calculate(scenario({ roads: "0", drainage: "0", common: "0", easements: "0" }));
  assert.equal(result.gross, 28);
  assert.equal(result.taxableRate, result.grossRate);
  assert.equal(result.reduction, 0);
});

test("percentage uses taxable rate as its baseline, rather than a symmetric or reverse change", () => {
  const result = core.calculate(scenario({ value: "100", taxable: "1", roads: "1", drainage: "0", common: "0", easements: "0" }));
  assert.equal(result.taxableRate, 100);
  assert.equal(result.grossRate, 50);
  assert.equal(result.reduction, 50);
});

test("fractional acreage sums exactly at the supported precision", () => {
  const result = core.calculate(scenario({ value: "123.45", taxable: "0.1", roads: "0.2", drainage: "0.0001", common: "0", easements: "0" }));
  assert.equal(result.gross, 0.3001);
  assert.equal(result.taxableRate, 1234.5);
  assert.ok(Math.abs(result.grossRate - 123.45 / 0.3001) < 1e-10);
});

test("missing, negative, and zero taxable acreage are rejected without stale numeric results", () => {
  for (const taxable of ["", "  ", "0", "-1", "NaN", "Infinity"]) {
    const result = core.calculate(scenario({ taxable }));
    assert.equal(result.valid, false, taxable);
    assert.ok(result.errors.taxable);
    assert.equal(result.taxableRate, undefined);
  }
});

test("every numeric field rejects malformed, blank, and non-finite data", () => {
  for (const key of Object.keys(core.fields)) {
    for (const invalid of ["", "-0.1", "1,2", "1,00,000", "1.2.3", "1e309", "Infinity", "abc"]) {
      const result = core.calculate(scenario({ [key]: invalid }));
      assert.equal(result.valid, false, `${key}: ${invalid}`);
      assert.ok(result.errors[key]);
    }
  }
});

test("US currency and grouped acreage input are parsed without losing decimal precision", () => {
  assert.equal(core.parseField(" $ 1,234,567.89 ", "value").value, 1234567.89);
  assert.equal(core.parseField("1,234.5678", "taxable").value, 1234.5678);
  assert.equal(core.parseField(".5", "taxable").value, 0.5);
  assert.ok(core.parseField("0.001", "value").error);
  assert.ok(core.parseField("0.00001", "taxable").error);
  assert.ok(core.parseField("$10", "roads").error);
});

test("large and small supported inputs stay finite and respect documented bounds", () => {
  const result = core.calculate(scenario({ value: "1000000000000", taxable: "0.0001", roads: "1000000000", drainage: "1000000000", common: "1000000000", easements: "1000000000" }));
  assert.equal(result.valid, true);
  assert.ok(Number.isFinite(result.grossRate));
  assert.ok(Number.isFinite(result.taxableRate));
  assert.ok(result.reduction < 100);
  assert.ok(core.parseField("1000000000001", "value").error);
  assert.ok(core.parseField("1000000001", "roads").error);
});

test("changing only the numerator changes both rates proportionately but not the reduction", () => {
  const a = core.calculate(scenario());
  const b = core.calculate(scenario({ value: "56,000,000" }));
  assert.equal(b.taxableRate, a.taxableRate * 2);
  assert.equal(b.grossRate, a.grossRate * 2);
  assert.equal(b.reduction, a.reduction);
});

test("summary includes both scenarios, full inputs, percentage baseline, and the caveat", () => {
  const text = core.summary([core.calculate(core.defaults.a), core.calculate(core.defaults.b)]);
  assert.match(text, /Scenario A: 40-acre neighborhood/);
  assert.match(text, /Scenario B: 5-acre development/);
  assert.match(text, /Easements \/ other: 0.25 acres/);
  assert.match(text, /Value per gross acre: \$700,000\/acre/);
  assert.match(text, /Reduction using gross acreage: 60.0%/);
  assert.match(text, /Results are only comparable when the acreage boundary is defined consistently\./);
  assert.match(text, /Count each acre once/);
  assert.match(text, /assessment date/);
  assert.match(core.summary([core.calculate(scenario({ value: "0" }))]), /N\/A \(both rates are \$0/);
  assert.equal(core.summary([core.calculate(scenario({ taxable: "0" }))]), null);
});

test("display rounding preserves tiny positive percentages and values just below 100%", () => {
  assert.equal(core.formatPercent(0), "0.0%");
  assert.equal(core.formatPercent(0.0001), "<0.1%");
  assert.equal(core.formatPercent(99.9999), ">99.9%");
  assert.equal(core.formatPercent(100), "100.0%");
  assert.equal(core.formatPercent(null), "N/A");
});
