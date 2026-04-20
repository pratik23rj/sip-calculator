export function calculateSip({ monthlyInvestment, annualRate, durationYears }) {
  const months = durationYears * 12;
  const monthlyRate = annualRate / 12 / 100;
  const totalInvested = monthlyInvestment * months;

  let maturityValue;

  if (monthlyRate === 0) {
    maturityValue = totalInvested;
  } else {
    maturityValue =
      monthlyInvestment *
      (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
        (1 + monthlyRate));
  }

  const estimatedReturns = maturityValue - totalInvested;

  return {
    totalInvested,
    estimatedReturns,
    maturityValue,
  };
}

export function calculateSipProjection({
  monthlyInvestment,
  currentCapital,
  annualRate,
  annualStepUp,
  durationYears,
}) {
  const monthlyRate = annualRate / 12 / 100;
  const yearlyStepUpRate = annualStepUp / 100;
  const yearlyPoints = [{ year: 0, invested: currentCapital, value: currentCapital }];

  let currentValue = currentCapital;
  let totalInvested = currentCapital;
  let sipForYear = monthlyInvestment;

  for (let year = 1; year <= durationYears; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      if (monthlyRate > 0) {
        currentValue *= 1 + monthlyRate;
      }

      currentValue += sipForYear;
      totalInvested += sipForYear;
    }

    yearlyPoints.push({
      year,
      invested: totalInvested,
      value: currentValue,
    });

    sipForYear *= 1 + yearlyStepUpRate;
  }

  const maturityValue = currentValue;
  const estimatedGains = maturityValue - totalInvested;
  const endingMonthlySip =
    durationYears > 0
      ? monthlyInvestment * Math.pow(1 + yearlyStepUpRate, durationYears - 1)
      : monthlyInvestment;

  return {
    maturityValue,
    totalInvested,
    estimatedGains,
    endingMonthlySip,
    yearlyPoints,
  };
}

export function buildGrowthSeries({
  monthlyInvestment,
  annualRate,
  durationYears,
}) {
  const points = [];
  const monthlyRate = annualRate / 12 / 100;
  let invested = 0;
  let currentValue = 0;

  for (let month = 1; month <= durationYears * 12; month += 1) {
    invested += monthlyInvestment;
    currentValue += monthlyInvestment;

    if (monthlyRate > 0) {
      currentValue *= 1 + monthlyRate;
    }

    if (month % 12 === 0 || month === durationYears * 12) {
      points.push({
        label: month % 12 === 0 ? `Year ${month / 12}` : `Month ${month}`,
        invested,
        value: currentValue,
      });
    }
  }

  return points;
}

export function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

export function formatInrCompact(value) {
  const absolute = Math.abs(value);

  if (absolute >= 10000000) {
    const crores = value / 10000000;
    return `₹${trimNumber(crores)}Cr`;
  }

  if (absolute >= 100000) {
    const lakhs = value / 100000;
    return `₹${trimNumber(lakhs)}L`;
  }

  if (absolute >= 1000) {
    const thousands = value / 1000;
    return `₹${trimNumber(thousands)}k`;
  }

  return formatInr(value);
}

function trimNumber(value) {
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, "");
  return value.toFixed(1).replace(/\.0$/, "");
}
