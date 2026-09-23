// Charts page - depends on js/repos.js being loaded first for:
// user, DEFAULT_USER, fetchProjects, repos, LANGUAGE_COLORS, langColor,
// escapeHtml, ghURL, updateNavLink

// colors follow the theme picked in the nav bar (css/themes, js/theme.js)
const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fallback;

const CHART_OTHER = "#8b8b8b";
let CHART_BLUE = "#2a78d6";
let CHART_ORANGE = "#eb6834";
let charts = {}; // one chart instance per card, by key

// the two category charts can be shown as bars or as a pie
const CATEGORY_CHARTS = {
  language: {
    canvas: "chartLanguage",
    table: "tableLanguage",
    toggle: "toggleLanguage",
    labelHeader: "Language",
    valueHeader: "Projects",
    indexAxis: "x",
    barThickness: 80,
    data: () => languageChartData(),
  },
  stars: {
    canvas: "chartStars",
    table: "tableStars",
    toggle: "toggleStars",
    labelHeader: "Project",
    valueHeader: "Stars",
    indexAxis: "y",
    data: () => starsChartData(),
  },
};

const chartTypeKey = (key) => `gh-projects-chart-${key}`;

const CHART_VIEWS = ["bar", "pie", "table"];

const storedChartType = (key) => {
  try {
    const stored = localStorage.getItem(chartTypeKey(key));
    return CHART_VIEWS.includes(stored) ? stored : "bar";
  } catch (e) {
    return "bar";
  }
};

const chartTypes = {
  language: storedChartType("language"),
  stars: storedChartType("stars"),
};

const icoBars = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" /></svg>`;
const icoPie = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11,2V22C5.9,21.5 2,17.2 2,12C2,6.8 5.9,2.5 11,2M13,2V11H22C21.5,6.2 17.8,2.5 13,2M13,13V22C17.7,21.5 21.5,17.8 22,13H13Z" /></svg>`;
const icoTable = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4,3H20A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5A2,2 0 0,1 4,3M4,7V11H8V7H4M10,7V11H14V7H10M20,11V7H16V11H20M4,13V17H8V13H4M10,13V17H14V13H10M16,13V17H20V13H16Z" /></svg>`;

const icoLine = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z" /></svg>`;

// panels with no pie, they only switch between their chart and a table
const SIMPLE_PANELS = {
  activity: {
    canvas: "chartActivity",
    table: "tableActivity",
    toggle: "toggleActivity",
    icon: () => icoLine,
    title: "Line chart",
  },
  timeline: {
    canvas: "chartTimeline",
    table: "tableTimeline",
    toggle: "toggleTimeline",
    icon: () => icoBars,
    title: "Bar chart",
  },
};

const SIMPLE_VIEWS = ["chart", "table"];

const storedSimpleView = (key) => {
  try {
    const stored = localStorage.getItem(chartTypeKey(key));
    return SIMPLE_VIEWS.includes(stored) ? stored : "chart";
  } catch (e) {
    return "chart";
  }
};

const simpleViews = {
  activity: storedSimpleView("activity"),
  timeline: storedSimpleView("timeline"),
};

const renderChartToggle = (key) => {
  const elem = document.getElementById(CATEGORY_CHARTS[key].toggle);
  if (!elem) {
    return;
  }
  elem.innerHTML = [
    { type: "bar", icon: icoBars, title: "Bar chart" },
    { type: "pie", icon: icoPie, title: "Pie chart" },
    { type: "table", icon: icoTable, title: "Data as a table" },
  ]
    .map(
      (t) =>
        `<button type="button" class="${
          chartTypes[key] === t.type ? "selected" : ""
        }" onclick="setChartType('${key}', '${t.type}')" title="${
          t.title
        }" aria-label="${t.title}">${t.icon}</button>`,
    )
    .join("");
};

// the canvas fades out, is redrawn with the other shape, and fades back in
// while Chart.js plays its own grow animation
const setChartType = (key, type) => {
  if (chartTypes[key] === type) {
    return;
  }
  chartTypes[key] = type;
  try {
    localStorage.setItem(chartTypeKey(key), type);
  } catch (e) {
    // private browsing, the choice just does not stick
  }
  renderChartToggle(key);
  applyChartView(key);
};

const renderSimpleToggle = (key) => {
  const panel = SIMPLE_PANELS[key];
  const elem = document.getElementById(panel.toggle);
  if (!elem) {
    return;
  }
  elem.innerHTML = [
    { type: "chart", icon: panel.icon(), title: panel.title },
    { type: "table", icon: icoTable, title: "Data as a table" },
  ]
    .map(
      (t) =>
        `<button type="button" class="${
          simpleViews[key] === t.type ? "selected" : ""
        }" onclick="setSimpleView('${key}', '${t.type}')" title="${
          t.title
        }" aria-label="${t.title}">${t.icon}</button>`,
    )
    .join("");
};

// the canvas is only hidden, so Chart.js needs a resize when it comes back
const applySimpleView = (key) => {
  const panel = SIMPLE_PANELS[key];
  const table = simpleViews[key] === "table";
  document.getElementById(panel.canvas).hidden = table;
  document.getElementById(panel.table).hidden = !table;
  if (!table && charts[key]) {
    charts[key].resize();
  }
};

const setSimpleView = (key, type) => {
  if (simpleViews[key] === type) {
    return;
  }
  simpleViews[key] = type;
  try {
    localStorage.setItem(chartTypeKey(key), type);
  } catch (e) {
    // private browsing, the choice just does not stick
  }
  renderSimpleToggle(key);
  applySimpleView(key);
};

// bar and pie morph into each other, the table simply takes their place
const applyChartView = (key) => {
  const conf = CATEGORY_CHARTS[key];
  const table = chartTypes[key] === "table";
  document.getElementById(conf.canvas).hidden = table;
  document.getElementById(conf.table).hidden = !table;
  if (!table) {
    applyMorphLayout(key);
  }
};

// Tableau 10, cycled for charts that have no colors of their own
// (the language chart keeps GitHub's own language colors)
const PIE_COLORS = [
  "#4e79a7",
  "#f28e2b",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc948",
  "#b07aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ac",
];

const sliceColors = (count) =>
  Array.from({ length: count }, (_, i) => PIE_COLORS[i % PIE_COLORS.length]);

const applyChartTheme = () => {
  CHART_BLUE = cssVar("--chart-1", "#2a78d6");
  CHART_ORANGE = cssVar("--chart-2", "#eb6834");
  Chart.defaults.color = cssVar("--panel-muted", "#898781");
  Chart.defaults.borderColor = cssVar("--panel-grid", "#e1e0d9");
  Chart.defaults.font.family = "Overpass, system-ui, sans-serif";
};

const monthKey = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
};

const languageChartData = () => {
  const counts = {};
  repos.forEach((r) => {
    const lang = r.language || "Other";
    counts[lang] = (counts[lang] || 0) + 1;
  });
  const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  return {
    labels,
    data: labels.map((l) => counts[l]),
    colors: labels.map((l) => LANGUAGE_COLORS[l] || CHART_OTHER),
  };
};

const starsChartData = (limit = 10) => {
  const top = [...repos]
    .filter((r) => r.stargazers_count > 0)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit);
  return {
    labels: top.map((r) => r.name),
    data: top.map((r) => r.stargazers_count),
  };
};

// projects created and updated, month by month, on the same time line
const activityChartData = () => {
  const created = {};
  const updated = {};
  repos.forEach((r) => {
    const c = monthKey(r.created_at);
    const u = monthKey(r.updated_at);
    created[c] = (created[c] || 0) + 1;
    updated[u] = (updated[u] || 0) + 1;
  });
  const keys = [
    ...new Set([...Object.keys(created), ...Object.keys(updated)]),
  ].sort();
  return {
    labels: keys.map(monthLabel),
    series: [
      {
        label: "Created",
        data: keys.map((k) => created[k] || 0),
        color: CHART_BLUE,
      },
      {
        label: "Updated",
        data: keys.map((k) => updated[k] || 0),
        color: CHART_ORANGE,
      },
    ],
  };
};

// each project as a span, from the day it started to its last update
const timelineChartData = () => {
  const list = [...repos].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
  return {
    labels: list.map((r) => r.name),
    data: list.map((r) => [
      new Date(r.created_at).getTime(),
      new Date(r.updated_at).getTime(),
    ]),
  };
};

const timelineTableHTML = (chartData) => `<table>
  <thead><tr><th>Project</th><th>Started</th><th>Last updated</th></tr></thead>
  <tbody>
    ${chartData.labels
      .map(
        (l, i) =>
          `<tr><td>${escapeHtml(String(l))}</td><td>${fDate(
            chartData.data[i][0],
          )}</td><td>${fDate(chartData.data[i][1])}</td></tr>`,
      )
      .join("")}
  </tbody>
</table>`;

const tableHTML = (labels, data, labelHeader, valueHeader) => `<table>
  <thead><tr><th>${escapeHtml(labelHeader)}</th><th>${escapeHtml(
    valueHeader,
  )}</th></tr></thead>
  <tbody>
    ${labels
      .map(
        (l, i) =>
          `<tr><td>${escapeHtml(String(l))}</td><td>${data[i]}</td></tr>`,
      )
      .join("")}
  </tbody>
</table>`;

const seriesTableHTML = (chartData, labelHeader) => `<table>
  <thead><tr><th>${escapeHtml(labelHeader)}</th>${chartData.series
    .map((s) => `<th>${escapeHtml(s.label)}</th>`)
    .join("")}</tr></thead>
  <tbody>
    ${chartData.labels
      .map(
        (l, i) =>
          `<tr><td>${escapeHtml(String(l))}</td>${chartData.series
            .map((s) => `<td>${s.data[i]}</td>`)
            .join("")}</tr>`,
      )
      .join("")}
  </tbody>
</table>`;

// every integer is shown while the counts stay small, otherwise Chart.js
// picks the steps itself (but never a fraction, these are all counts)
const valueTicks = (max) => ({
  precision: 0,
  ...(max && max <= 12 ? { stepSize: 1 } : {}),
});

const chartOptions = (indexAxis, max) => ({
  indexAxis,
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: indexAxis === "y" },
      beginAtZero: indexAxis === "y",
      ticks: valueTicks(indexAxis === "y" ? max : null),
    },
    y: {
      grid: { display: indexAxis === "x" },
      beginAtZero: indexAxis === "x",
      ticks: valueTicks(indexAxis === "x" ? max : null),
    },
  },
});

// --- morphing bars <-> pie ---------------------------------------------
// Ported from react-morph-charts (https://github.com/evoluteur/react-morph-charts):
// every slice is a positioned box, the pie wedge is a clip-path on it, and
// the shape change is a plain CSS transition of transform/size/clip-path.

const fNum = (n) => new Intl.NumberFormat().format(n || 0);

const MORPH = {
  barGap: 10,
  barMaxWidth: 80,
  barMinHeight: 26,
  stageHeight: 250,
  pieMaxRadius: 125,
  clipSteps: 48,
};

const morphItems = {}; // key -> Map(label -> element)
const morphLayout = {}; // key -> Map(label -> placement)

// dark text on a light slice, light text on a dark one
const textOn = (color) => {
  const hex = color.replace("#", "");
  const n =
    hex.length === 3
      ? hex.split("").map((c) => parseInt(c + c, 16))
      : [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const luminance = (0.299 * n[0] + 0.587 * n[1] + 0.114 * n[2]) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
};

const barsLayout = (width, entries) => {
  const placements = new Map();
  const count = Math.max(entries.length, 1);
  const barWidth = Math.min(
    MORPH.barMaxWidth,
    (width - MORPH.barGap * (count - 1)) / count,
  );
  const totalWidth = barWidth * count + MORPH.barGap * (count - 1);
  const offsetX = Math.max((width - totalWidth) / 2, 0);
  const max = Math.max(...entries.map((e) => e.value), 1);
  entries.forEach((entry, i) => {
    const h =
      MORPH.barMinHeight +
      (entry.value / max) * (MORPH.stageHeight - MORPH.barMinHeight);
    placements.set(entry.label, {
      x: offsetX + i * (barWidth + MORPH.barGap),
      y: MORPH.stageHeight - h,
      w: barWidth,
      h,
    });
  });
  return placements;
};

const pieLayout = (width, entries) => {
  const placements = new Map();
  const total = entries.reduce((t, e) => t + e.value, 0) || 1;
  const r = Math.max(
    Math.min(MORPH.pieMaxRadius, width / 2 - 10, MORPH.stageHeight / 2),
    50,
  );
  let angle = 0;
  entries.forEach((entry) => {
    const sweep = (entry.value / total) * 360;
    placements.set(entry.label, {
      x: width / 2 - r,
      y: MORPH.stageHeight / 2 - r,
      w: r * 2,
      h: r * 2,
      startAngle: angle,
      endAngle: angle + sweep,
    });
    angle += sweep;
  });
  return placements;
};

// a point of the item's box (a square for the pie, the rectangle for the
// bars) at the given angle, in percent of the box
const pointOnShape = (shape, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  if (shape === "rect") {
    const scale = 50 / Math.max(Math.abs(dx), Math.abs(dy), 0.0001);
    return [50 + dx * scale, 50 + dy * scale];
  }
  return [50 + dx * 50, 50 + dy * 50];
};

const clipPathFor = (shape, startAngle, endAngle, centerAnchor) => {
  const points = [];
  if (centerAnchor) {
    points.push("50% 50%");
  } else {
    const [ax, ay] = pointOnShape(shape, startAngle);
    points.push(`${ax}% ${ay}%`);
  }
  for (let i = 0; i <= MORPH.clipSteps; i++) {
    const angle = startAngle + ((endAngle - startAngle) * i) / MORPH.clipSteps;
    const [x, y] = pointOnShape(shape, angle);
    points.push(`${x}% ${y}%`);
  }
  return `polygon(${points.join(",")})`;
};

const pieCenterOffset = (p, distance) => {
  if (p.startAngle === undefined) {
    return { dx: 0, dy: 0 };
  }
  const mid = (p.startAngle + p.endAngle) / 2;
  const rad = (mid * Math.PI) / 180;
  return { dx: Math.sin(rad) * distance, dy: -Math.cos(rad) * distance };
};

const applyMorphLayout = (key) => {
  const conf = CATEGORY_CHARTS[key];
  const stage = document.getElementById(conf.canvas);
  const items = morphItems[key];
  if (!stage || !items) {
    return;
  }
  const pie = chartTypes[key] === "pie";
  const width = stage.clientWidth || 380;
  const entries = [...items.keys()].map((label) => ({
    label,
    value: Number(items.get(label).dataset.value),
  }));
  const placements = pie
    ? pieLayout(width, entries)
    : barsLayout(width, entries);
  morphLayout[key] = placements;
  stage.style.height = `${MORPH.stageHeight}px`;
  items.forEach((el, label) => {
    const p = placements.get(label);
    el.style.width = `${p.w}px`;
    el.style.height = `${p.h}px`;
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    el.style.clipPath = clipPathFor(
      pie ? "circle" : "rect",
      p.startAngle ?? 0,
      p.endAngle ?? 360,
      pie,
    );
    // a thin bar or a thin wedge has no room for the name, the title
    // attribute still carries it on hover
    const sweep = pie ? p.endAngle - p.startAngle : 0;
    el.classList.toggle("narrow", pie ? sweep < 28 : p.w < 46);
    el.classList.toggle("tiny", pie && sweep < 13);
    const label3 = el.querySelector(".morph-label");
    if (pie) {
      const mid = (p.startAngle + p.endAngle) / 2;
      const rad = (mid * Math.PI) / 180;
      const r = p.w / 2;
      label3.style.transform = `translate(${(Math.sin(rad) * r * 0.62).toFixed(
        1,
      )}px, ${(-Math.cos(rad) * r * 0.62).toFixed(1)}px)`;
    } else {
      label3.style.transform = "translate(0px, 0px)";
    }
  });
};

// the boxes are built once per data set, then only their style changes, so
// switching bars <-> pie morphs the same elements instead of redrawing
const renderCategoryChart = (key) => {
  const conf = CATEGORY_CHARTS[key];
  const stage = document.getElementById(conf.canvas);
  const chartData = conf.data();
  const colors = chartData.colors || sliceColors(chartData.labels.length);
  const wanted = chartData.labels.join("|");
  if (!morphItems[key] || stage.dataset.labels !== wanted) {
    stage.replaceChildren();
    stage.classList.add("no-transition");
    const items = new Map();
    chartData.labels.forEach((label, i) => {
      const el = document.createElement("div");
      el.className = "morph-item";
      el.style.backgroundColor = colors[i];
      el.style.color = textOn(colors[i]);
      el.dataset.value = chartData.data[i];
      el.title = `${label}: ${chartData.data[i]} ${conf.valueHeader.toLowerCase()}`;
      const box = document.createElement("div");
      box.className = "morph-label";
      const name = document.createElement("span");
      name.className = "morph-name";
      name.textContent = label;
      const value = document.createElement("span");
      value.className = "morph-value";
      value.textContent = fNum(chartData.data[i]);
      box.append(name, value);
      el.append(box);
      el.addEventListener("mouseenter", () => morphHover(key, label, true));
      el.addEventListener("mouseleave", () => morphHover(key, label, false));
      stage.append(el);
      items.set(label, el);
    });
    morphItems[key] = items;
    stage.dataset.labels = wanted;
    applyMorphLayout(key);
    // let the first layout land before transitions are allowed
    requestAnimationFrame(() =>
      requestAnimationFrame(() => stage.classList.remove("no-transition")),
    );
  } else {
    chartData.labels.forEach((label, i) => {
      const el = morphItems[key].get(label);
      el.dataset.value = chartData.data[i];
      el.querySelector(".morph-value").textContent = fNum(chartData.data[i]);
    });
    applyMorphLayout(key);
  }
  document.getElementById(conf.table).innerHTML = tableHTML(
    chartData.labels,
    chartData.data,
    conf.labelHeader,
    conf.valueHeader,
  );
};

// hovering lifts a bar or pulls a slice out of the pie, like in the library
const morphHover = (key, label, on) => {
  const el = morphItems[key]?.get(label);
  const p = morphLayout[key]?.get(label);
  if (!el || !p) {
    return;
  }
  if (!on) {
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    el.style.zIndex = "";
    return;
  }
  el.style.zIndex = "5";
  if (chartTypes[key] === "pie") {
    const { dx, dy } = pieCenterOffset(p, 14);
    el.style.transform = `translate(${p.x + dx}px, ${p.y + dy}px)`;
  } else {
    const scale = 1.12;
    el.style.transform = `translate(${p.x}px, ${
      p.y - (p.h * (scale - 1)) / 2
    }px) scale(${scale})`;
  }
};

// the stage is sized in pixels, so the layout is redone when it changes
window.addEventListener("resize", () => {
  Object.keys(CATEGORY_CHARTS).forEach((key) => applyMorphLayout(key));
});

// several lines on one chart, with a legend
const renderLinesChart = (canvasId, tableId, chartData, options) => {
  if (charts.activity) {
    charts.activity.destroy();
  }
  charts.activity = new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: chartData.series.map((s) => ({
        label: s.label,
        data: s.data,
        borderColor: s.color,
        backgroundColor: s.color,
        tension: 0.3,
        pointRadius: 3,
        borderWidth: 2,
      })),
    },
    options: {
      ...chartOptions(
        "x",
        Math.max(...chartData.series.flatMap((s) => s.data)),
      ),
      plugins: { legend: { display: true, position: "bottom" } },
    },
  });
  document.getElementById(tableId).innerHTML = seriesTableHTML(
    chartData,
    options.labelHeader,
  );
};

// one horizontal bar per project, spanning its first and last day
const renderTimelineChart = () => {
  if (charts.timeline) {
    charts.timeline.destroy();
  }
  const chartData = timelineChartData();
  if (!chartData.labels.length) {
    return;
  }
  // the card grows with the number of projects, a squeezed bar is unreadable
  const wrap = document.getElementById("wrapTimeline");
  wrap.style.height = `${Math.max(280, chartData.labels.length * 24 + 75)}px`;
  const flat = chartData.data.flat();
  const firstYear = new Date(Math.min(...flat)).getFullYear();
  const lastYear = new Date(Math.max(...flat)).getFullYear();
  const years = [];
  for (let y = firstYear; y <= lastYear + 1; y += 1) {
    years.push(new Date(y, 0, 1).getTime());
  }
  charts.timeline = new Chart(document.getElementById("chartTimeline"), {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          data: chartData.data,
          backgroundColor: CHART_BLUE,
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.7,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${fDate(ctx.raw[0])} - ${fDate(ctx.raw[1])}`,
          },
        },
      },
      scales: {
        x: {
          min: years[0],
          max: years[years.length - 1],
          grid: { display: true },
          afterBuildTicks: (axis) => {
            axis.ticks = years.map((value) => ({ value }));
          },
          ticks: {
            maxRotation: 0,
            autoSkip: false,
            callback: (value) => new Date(value).getFullYear(),
          },
        },
        // same year axis repeated on top, handy when the list is long
        xTop: {
          axis: "x",
          position: "top",
          min: years[0],
          max: years[years.length - 1],
          grid: { display: false },
          afterBuildTicks: (axis) => {
            axis.ticks = years.map((value) => ({ value }));
          },
          ticks: {
            maxRotation: 0,
            autoSkip: false,
            callback: (value) => new Date(value).getFullYear(),
          },
        },
        y: { grid: { display: false } },
      },
    },
  });
  document.getElementById("tableTimeline").innerHTML =
    timelineTableHTML(chartData);
};

const renderCharts = () => {
  applyChartTheme();
  Object.keys(CATEGORY_CHARTS).forEach((key) => {
    renderChartToggle(key);
    renderCategoryChart(key);
    applyChartView(key);
  });
  renderLinesChart("chartActivity", "tableActivity", activityChartData(), {
    labelHeader: "Month",
  });
  renderTimelineChart();
  Object.keys(SIMPLE_PANELS).forEach((key) => {
    renderSimpleToggle(key);
    applySimpleView(key);
  });
};

const chartsTitleHTML = () => `<span id="title-main">
    ${userEditHTML()} ${sitePickerHTML()} ${fansLinkHTML()}
    <span id="total-stars">${totalHTML()}</span>
  </span>
  ${headerLinksHTML("gh-charts")}`;

const setupChartsPage = async () => {
  chartsPage = true;
  pageLabel = "Projects Charts";
  const userParam = new URLSearchParams(window.location.search).get("user");
  if (userParam) {
    user = userParam.trim() || user;
  }
  const summary = document.getElementById("summary");
  try {
    await fetchProjects();
  } catch (e) {
    summary.textContent = `Could not find GitHub user "${user}".`;
    user = DEFAULT_USER;
    await fetchProjects();
  }
  setPageMetaTitle();
  document.getElementById("chartsTitle").innerHTML = chartsTitleHTML();
  setBackLink();
  updateBookmarkableUrl();
  updateNavLink();
  renderCharts();
};

// the picked theme changed: redraw with its colors
window.onThemeChanged = () => {
  if (repos.length) {
    renderCharts();
  }
};
