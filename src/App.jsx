import { useMemo, useState } from "react";
import { buildGrowthSeries, calculateSip, formatInr } from "./lib/sip";

const sliderConfig = {
  monthlyInvestment: {
    label: "Monthly investment",
    min: 500,
    max: 200000,
    step: 500,
    suffix: "/month",
  },
  annualRate: {
    label: "Expected return rate",
    min: 1,
    max: 30,
    step: 0.1,
    suffix: "% p.a.",
  },
  durationYears: {
    label: "Time horizon",
    min: 1,
    max: 40,
    step: 1,
    suffix: "years",
  },
};

const defaultInputs = {
  monthlyInvestment: 25000,
  annualRate: 12,
  durationYears: 15,
};

function SliderControl({ label, min, max, step, value, onChange, suffix }) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <label className="control">
      <div className="control__header">
        <span>{label}</span>
        <strong>
          {typeof value === "number" && Number.isInteger(value)
            ? value.toLocaleString("en-IN")
            : value.toFixed(1)}{" "}
          <em>{suffix}</em>
        </strong>
      </div>
      <input
        className="control__slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        style={{
          background: `linear-gradient(90deg, var(--accent) 0%, var(--accent-soft) ${progress}%, rgba(255,255,255,0.12) ${progress}%, rgba(255,255,255,0.12) 100%)`,
        }}
      />
      <div className="control__scale">
        <span>{min.toLocaleString("en-IN")}</span>
        <span>{max.toLocaleString("en-IN")}</span>
      </div>
    </label>
  );
}

function StatsCard({ label, value, tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function GrowthChart({ points }) {
  const width = 640;
  const height = 320;
  const padding = 32;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const minX = padding;
  const maxX = width - padding;
  const minY = height - padding;
  const maxY = padding;

  const buildPath = (key) =>
    points
      .map((point, index) => {
        const x =
          minX + (index / Math.max(points.length - 1, 1)) * (maxX - minX);
        const y =
          minY - ((point[key] || 0) / maxValue) * (minY - maxY);
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

  const investedPath = buildPath("invested");
  const valuePath = buildPath("value");
  const areaPath = `${valuePath} L ${maxX} ${minY} L ${minX} ${minY} Z`;

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <p>Projected wealth growth</p>
          <h3>How your SIP compounds over time</h3>
        </div>
        <div className="chart-card__legend">
          <span><i className="legend-dot legend-dot--value" /> Portfolio value</span>
          <span><i className="legend-dot legend-dot--invested" /> Amount invested</span>
        </div>
      </div>
      <svg
        className="chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="SIP growth chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = minY - tick * (minY - maxY);
          return (
            <g key={tick}>
              <line
                x1={minX}
                x2={maxX}
                y1={y}
                y2={y}
                className="chart__grid"
              />
              <text x={8} y={y + 4} className="chart__axis">
                {formatInr(maxValue * tick)}
              </text>
            </g>
          );
        })}
        <path d={areaPath} className="chart__area" />
        <path d={investedPath} className="chart__line chart__line--invested" />
        <path d={valuePath} className="chart__line chart__line--value" />
        {points.map((point, index) => {
          const x =
            minX + (index / Math.max(points.length - 1, 1)) * (maxX - minX);
          const y =
            minY - ((point.value || 0) / maxValue) * (minY - maxY);
          return (
            <g key={point.label}>
              <circle cx={x} cy={y} r="4" className="chart__point" />
              <text x={x} y={height - 8} className="chart__axis chart__axis--x">
                {point.label.replace("Year ", "Y")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function App() {
  const [inputs, setInputs] = useState(defaultInputs);

  const results = useMemo(() => calculateSip(inputs), [inputs]);
  const growthSeries = useMemo(() => buildGrowthSeries(inputs), [inputs]);

  const handleChange = (key) => (event) => {
    setInputs((current) => ({
      ...current,
      [key]: Number(event.target.value),
    }));
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Smart SIP Planner</span>
          <h1>See how a steady monthly SIP can grow into long-term wealth.</h1>
          <p>
            Move the sliders to estimate your invested capital, projected
            returns, and maturity value in Indian Rupees.
          </p>
        </div>

        <div className="calculator-panel">
          <div className="controls-grid">
            <SliderControl
              {...sliderConfig.monthlyInvestment}
              value={inputs.monthlyInvestment}
              onChange={handleChange("monthlyInvestment")}
            />
            <SliderControl
              {...sliderConfig.annualRate}
              value={inputs.annualRate}
              onChange={handleChange("annualRate")}
            />
            <SliderControl
              {...sliderConfig.durationYears}
              value={inputs.durationYears}
              onChange={handleChange("durationYears")}
            />
          </div>

          <section className="stats-grid" aria-label="SIP summary">
            <StatsCard
              label="Monthly SIP"
              value={formatInr(inputs.monthlyInvestment)}
              tone="neutral"
            />
            <StatsCard
              label="Total invested"
              value={formatInr(results.totalInvested)}
              tone="calm"
            />
            <StatsCard
              label="Estimated returns"
              value={formatInr(results.estimatedReturns)}
              tone="warm"
            />
            <StatsCard
              label="Maturity value"
              value={formatInr(results.maturityValue)}
              tone="bright"
            />
          </section>
        </div>
      </section>

      <section className="insights-grid">
        <GrowthChart points={growthSeries} />
        <article className="insight-card">
          <p className="insight-card__eyebrow">Quick take</p>
          <h2>Your money works harder with time in the market.</h2>
          <p>
            Over {inputs.durationYears} years, a SIP of{" "}
            {formatInr(inputs.monthlyInvestment)} at {inputs.annualRate}% annual
            return could grow to {formatInr(results.maturityValue)}.
          </p>
          <div className="insight-callout">
            <span>Wealth created</span>
            <strong>{formatInr(results.estimatedReturns)}</strong>
          </div>
          <p className="disclaimer">
            These figures are illustrative estimates based on monthly
            compounding and do not guarantee actual market returns.
          </p>
        </article>
      </section>
    </main>
  );
}
