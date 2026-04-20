import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGrowthSeries,
  calculateSip,
  calculateSipProjection,
  formatInr,
  formatInrCompact,
} from "./sip.js";

test("calculateSip matches zero-interest SIP accumulation", () => {
  const result = calculateSip({
    monthlyInvestment: 1000,
    annualRate: 0,
    durationYears: 2,
  });

  assert.equal(result.totalInvested, 24000);
  assert.equal(result.estimatedReturns, 0);
  assert.equal(result.maturityValue, 24000);
});

test("calculateSip returns known maturity estimate for a common SIP case", () => {
  const result = calculateSip({
    monthlyInvestment: 10000,
    annualRate: 12,
    durationYears: 10,
  });

  assert.equal(Math.round(result.totalInvested), 1200000);
  assert.equal(Math.round(result.maturityValue), 2323391);
  assert.equal(Math.round(result.estimatedReturns), 1123391);
});

test("buildGrowthSeries creates one point per completed year", () => {
  const series = buildGrowthSeries({
    monthlyInvestment: 5000,
    annualRate: 10,
    durationYears: 5,
  });

  assert.equal(series.length, 5);
  assert.equal(series[0].label, "Year 1");
  assert.equal(series.at(-1).label, "Year 5");
  assert.ok(series.at(-1).value > series.at(-1).invested);
});

test("formatInr uses Indian currency formatting", () => {
  assert.equal(formatInr(1250000), "₹12,50,000");
});

test("calculateSipProjection includes starting capital and yearly step-up", () => {
  const result = calculateSipProjection({
    monthlyInvestment: 25000,
    currentCapital: 500000,
    annualRate: 12,
    annualStepUp: 8,
    durationYears: 30,
  });

  assert.equal(result.yearlyPoints.length, 31);
  assert.ok(result.maturityValue > result.totalInvested);
  assert.ok(result.endingMonthlySip > 25000);
  assert.equal(result.yearlyPoints[0].value, 500000);
});

test("formatInrCompact returns crore and lakh shorthand", () => {
  assert.equal(formatInrCompact(190000000), "₹19Cr");
  assert.equal(formatInrCompact(4800000), "₹48L");
});
