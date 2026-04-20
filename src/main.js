import {
  calculateSipProjection,
  formatInr,
  formatInrCompact,
  formatPercent,
} from "./lib/sip.js";

const sliderConfig = {
  monthlyInvestment: {
    label: "Monthly SIP",
    min: 1000,
    max: 200000,
    step: 1000,
    formatValue: (value) => formatInr(value),
    scaleMin: "₹1k",
    scaleMax: "₹2 lakh",
  },
  currentCapital: {
    label: "Current capital",
    min: 0,
    max: 10000000,
    step: 50000,
    formatValue: (value) => formatInr(value),
    scaleMin: "₹0",
    scaleMax: "₹1 crore",
  },
  annualRate: {
    label: "Expected annual return",
    min: 4,
    max: 18,
    step: 0.1,
    formatValue: (value) => formatPercent(value),
    scaleMin: "4%",
    scaleMax: "18%",
  },
  annualStepUp: {
    label: "Annual SIP step-up",
    min: 0,
    max: 20,
    step: 0.5,
    formatValue: (value) => formatPercent(value),
    scaleMin: "0%",
    scaleMax: "20%",
  },
  durationYears: {
    label: "Focus horizon",
    min: 5,
    max: 35,
    step: 1,
    formatValue: (value) => `${value} years`,
    scaleMin: "5 years",
    scaleMax: "35 years",
  },
};

const state = {
  monthlyInvestment: 25000,
  currentCapital: 500000,
  annualRate: 12,
  annualStepUp: 8,
  durationYears: 30,
};

const root = document.querySelector("#root");

function getFocusYear(durationYears) {
  if (durationYears >= 20) return 20;
  return Math.max(5, Math.floor(durationYears / 2));
}

function renderShell() {
  root.innerHTML = `
    <main class="atlas-shell">
      <section class="atlas-frame reveal">
        <section class="planner-panel" aria-label="SIP planner inputs">
          <div class="planner-top">
            <p class="kicker">ODIN WEALTH TOOL</p>
            <h1>SIP Atlas</h1>
            <p class="planner-summary">
              Shape your SIP return expectations and yearly step-up, then watch
              how disciplined investing compounds into real capital over long horizons.
            </p>
          </div>

          <div class="planner-strip">
            <div>
              <span>Starting capital</span>
              <strong id="starting-capital-display"></strong>
            </div>
            <div>
              <span>Annual return</span>
              <strong id="annual-return-display"></strong>
            </div>
          </div>

          <div class="controls-stack">
            ${Object.entries(sliderConfig)
              .map(
                ([key, config]) => `
                  <label class="control" data-control="${key}">
                    <div class="control__header">
                      <span>${config.label}</span>
                      <strong id="${key}-value"></strong>
                    </div>
                    <input
                      class="control__slider"
                      id="${key}"
                      type="range"
                      min="${config.min}"
                      max="${config.max}"
                      step="${config.step}"
                      value="${state[key]}"
                      data-key="${key}"
                    />
                    <div class="control__scale">
                      <span>${config.scaleMin}</span>
                      <span>${config.scaleMax}</span>
                    </div>
                  </label>
                `,
              )
              .join("")}
          </div>

          <div class="planner-metrics">
            <div>
              <span>Wealth at horizon</span>
              <strong id="wealth-horizon-value"></strong>
            </div>
            <div>
              <span>Total invested</span>
              <strong id="total-invested-value"></strong>
            </div>
            <div>
              <span>Estimated gains</span>
              <strong id="estimated-gains-value"></strong>
            </div>
            <div>
              <span>Ending monthly SIP</span>
              <strong id="ending-sip-value"></strong>
            </div>
          </div>

          <p class="planner-note">
            Estimates assume monthly contributions at month-end and the step-up
            is applied once every 12 months. This is a planning tool, not financial advice.
          </p>
        </section>

        <section class="projection-panel" aria-label="SIP projection output">
          <div class="projection-copy">
            <p class="kicker kicker--dark">Projected capital</p>
            <h2 id="projection-headline"></h2>
            <p class="projection-body" id="projection-body"></p>
          </div>

          <div class="projection-toolbar">
            <div class="legend-row">
              <span><i class="legend-dot legend-dot--wealth"></i> Projected wealth</span>
              <span><i class="legend-dot legend-dot--invested"></i> Total invested</span>
            </div>
            <div class="tracking-pill" id="tracking-pill"></div>
          </div>

          <div class="chart-card" id="chart-card">
            <svg
              class="projection-chart"
              id="projection-chart"
              viewBox="0 0 840 420"
              role="img"
              aria-label="Projected SIP growth chart"
            ></svg>
          </div>

          <div class="insight-metrics">
            <div class="insight-metric insight-metric--accent">
              <strong id="insight-wealth"></strong>
              <p id="insight-wealth-detail"></p>
            </div>
            <div class="insight-metric">
              <strong id="insight-invested"></strong>
              <p id="insight-invested-detail"></p>
            </div>
            <div class="insight-metric insight-metric--accent">
              <strong id="insight-gains"></strong>
              <p id="insight-gains-detail"></p>
            </div>
          </div>

          <div class="timeline-row" id="timeline-row"></div>
        </section>
      </section>
    </main>
  `;
}

function updateSliderPresentation(key) {
  const config = sliderConfig[key];
  const input = document.getElementById(key);
  const control = input.closest(".control");
  const valueNode = document.getElementById(`${key}-value`);
  const progress = ((state[key] - config.min) / (config.max - config.min)) * 100;

  control.style.setProperty("--slider-progress", `${progress}%`);
  valueNode.textContent = config.formatValue(state[key]);
}

function buildChartMarkup(points, durationYears, focusYear) {
  const width = 840;
  const height = 420;
  const paddingLeft = 84;
  const paddingRight = 28;
  const paddingTop = 24;
  const paddingBottom = 54;
  const chartLeft = paddingLeft;
  const chartRight = width - paddingRight;
  const chartTop = paddingTop;
  const chartBottom = height - paddingBottom;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const axisSteps = [0, 0.25, 0.5, 0.75, 1];

  const xForYear = (year) =>
    chartLeft + ((year - 0) / Math.max(durationYears, 1)) * (chartRight - chartLeft);
  const yForValue = (value) =>
    chartBottom - (value / maxValue) * (chartBottom - chartTop);

  const buildPath = (key) =>
    points
      .map((point, index) => {
        const x = xForYear(point.year);
        const y = yForValue(point[key]);
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

  const areaPath = `${buildPath("value")} L ${xForYear(durationYears)} ${chartBottom} L ${xForYear(
    0,
  )} ${chartBottom} Z`;

  const focusPoint = points.find((point) => point.year === focusYear) ?? points.at(-1);
  const endPoint = points.at(-1);

  const grid = axisSteps
    .map((step) => {
      const value = maxValue * step;
      const y = yForValue(value);
      return `
        <g>
          <line x1="${chartLeft}" y1="${y}" x2="${chartRight}" y2="${y}" class="chart-grid"></line>
          <text x="${18}" y="${y + 6}" class="chart-label chart-label--y">${formatInrCompact(value)}</text>
        </g>
      `;
    })
    .join("");

  const xTicks = Array.from({ length: Math.floor(durationYears / 5) + 1 }, (_, index) => index * 5)
    .filter((year) => year <= durationYears)
    .concat(durationYears % 5 === 0 ? [] : [durationYears])
    .map((year, index, arr) => {
      const unique = arr.indexOf(year) === index;
      if (!unique) return "";
      return `
        <text x="${xForYear(year)}" y="${height - 16}" class="chart-label chart-label--x">${year}Y</text>
      `;
    })
    .join("");

  return `
    <rect x="${chartLeft}" y="${chartTop}" width="${chartRight - chartLeft}" height="${chartBottom - chartTop}" rx="28" class="chart-backdrop"></rect>
    ${grid}
    <path d="${areaPath}" class="chart-area"></path>
    <path d="${buildPath("invested")}" class="chart-line chart-line--invested"></path>
    <path d="${buildPath("value")}" class="chart-line chart-line--wealth"></path>
    <line x1="${xForYear(focusPoint.year)}" y1="${chartTop}" x2="${xForYear(
      focusPoint.year,
    )}" y2="${chartBottom}" class="chart-focus-line"></line>
    <line x1="${xForYear(endPoint.year)}" y1="${chartTop}" x2="${xForYear(
      endPoint.year,
    )}" y2="${chartBottom}" class="chart-focus-line"></line>
    <circle cx="${xForYear(focusPoint.year)}" cy="${yForValue(
      focusPoint.value,
    )}" r="8" class="chart-point"></circle>
    <circle cx="${xForYear(endPoint.year)}" cy="${yForValue(endPoint.value)}" r="8" class="chart-point"></circle>
    <text x="${xForYear(focusPoint.year) + 10}" y="${yForValue(
      focusPoint.value,
    ) - 12}" class="chart-note">${focusPoint.year}Y</text>
    <text x="${xForYear(endPoint.year) - 88}" y="${yForValue(
      endPoint.value,
    ) - 12}" class="chart-note">Focus value: ${formatInrCompact(endPoint.value)}</text>
    ${xTicks}
  `;
}

function buildTimeline(points, durationYears) {
  const milestones = [5, 10, 15, 20, 25, 30]
    .filter((year) => year <= durationYears)
    .map((year) => points.find((point) => point.year === year))
    .filter(Boolean);

  return milestones
    .map(
      (point) => `
        <div class="timeline-item">
          <span>${point.year} years</span>
          <strong>${formatInrCompact(point.value)}</strong>
        </div>
      `,
    )
    .join("");
}

function pulseChart() {
  const chartCard = document.getElementById("chart-card");
  chartCard.classList.remove("chart-card--pulse");
  window.requestAnimationFrame(() => {
    chartCard.classList.add("chart-card--pulse");
  });
}

function updateView({ animateChart = false } = {}) {
  const projection = calculateSipProjection(state);
  const focusYear = getFocusYear(state.durationYears);
  const focusPoint =
    projection.yearlyPoints.find((point) => point.year === focusYear) ??
    projection.yearlyPoints.at(-1);
  const endPoint = projection.yearlyPoints.at(-1);
  const wealthMultiple = projection.totalInvested
    ? `${(projection.maturityValue / projection.totalInvested).toFixed(1)}x of invested capital`
    : "0x of invested capital";

  Object.keys(sliderConfig).forEach(updateSliderPresentation);

  document.getElementById("starting-capital-display").textContent = formatInr(
    state.currentCapital,
  );
  document.getElementById("annual-return-display").textContent = formatPercent(
    state.annualRate,
  );

  document.getElementById("wealth-horizon-value").textContent = formatInr(
    projection.maturityValue,
  );
  document.getElementById("total-invested-value").textContent = formatInr(
    projection.totalInvested,
  );
  document.getElementById("estimated-gains-value").textContent = formatInr(
    projection.estimatedGains,
  );
  document.getElementById("ending-sip-value").textContent = formatInr(
    projection.endingMonthlySip,
  );

  document.getElementById("projection-headline").textContent =
    `${formatInrCompact(projection.maturityValue)} after ${state.durationYears} years`;

  document.getElementById("projection-body").textContent =
    `If you invest ${formatInr(state.monthlyInvestment)} each month, start with ${formatInr(
      state.currentCapital,
    )}, earn ${formatPercent(state.annualRate)} annually and raise the SIP by ${formatPercent(
      state.annualStepUp,
    )} every year, the corpus can reach ${formatInrCompact(
      focusPoint.value,
    )} in ${focusPoint.year} years and ${formatInrCompact(endPoint.value)} in ${
      state.durationYears
    } years.`;

  document.getElementById("tracking-pill").textContent =
    `Tracking ${state.durationYears} years`;

  document.getElementById("projection-chart").innerHTML = buildChartMarkup(
    projection.yearlyPoints,
    state.durationYears,
    focusYear,
  );

  document.getElementById("insight-wealth").textContent = formatInr(
    projection.maturityValue,
  );
  document.getElementById("insight-wealth-detail").innerHTML =
    `Invested: ${formatInr(projection.totalInvested)}<br>Gain: ${formatInr(
      projection.estimatedGains,
    )}<br>${wealthMultiple}`;

  document.getElementById("insight-invested").textContent = formatInr(
    projection.totalInvested,
  );
  document.getElementById("insight-invested-detail").innerHTML =
    `Starting corpus: ${formatInr(state.currentCapital)}<br>SIP deployed: ${formatInr(
      projection.totalInvested - state.currentCapital,
    )}<br>Step-up: ${formatPercent(state.annualStepUp)}`;

  document.getElementById("insight-gains").textContent = formatInr(
    projection.estimatedGains,
  );
  document.getElementById("insight-gains-detail").innerHTML =
    `Gain: ${formatInr(projection.estimatedGains)}<br>Focus year: ${focusPoint.year}Y at ${formatInrCompact(
      focusPoint.value,
    )}<br>Ending SIP: ${formatInr(projection.endingMonthlySip)}`;

  document.getElementById("timeline-row").innerHTML = buildTimeline(
    projection.yearlyPoints,
    state.durationYears,
  );

  if (animateChart) {
    pulseChart();
  }
}

function attachEvents() {
  root.querySelectorAll(".control__slider").forEach((slider) => {
    slider.addEventListener("input", (event) => {
      state[event.target.dataset.key] = Number(event.target.value);
      updateView({ animateChart: true });
    });
  });
}

function revealPage() {
  window.requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });
}

renderShell();
attachEvents();
updateView();
revealPage();
