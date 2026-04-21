const SIGNS = ["白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手", "摩羯", "水瓶", "双鱼"];
const OBJECTS = [
  "太阳", "月亮", "水星", "金星", "火星", "木星", "土星", "天王", "海王", "冥王",
  "凯龙", "谷神", "智神", "婚神", "灶神", "北交", "南交", "莉莉丝", "福点", "宿命点", "上升", "下降", "天顶", "天底", "顶点"
];

const CHART_CONFIG = [
  { id: "a-natal", title: "A 本命盘", dynamic: false },
  { id: "b-natal", title: "B 本命盘", dynamic: false },
  { id: "synastry", title: "双方比较盘", dynamic: false },
  { id: "spacetime-primary", title: "时空三限", dynamic: true },
  { id: "spacetime-secondary", title: "时空次限", dynamic: true },
  { id: "spacetime", title: "时空盘", dynamic: true },
  { id: "composite-primary", title: "组合三限", dynamic: true },
  { id: "composite-secondary", title: "组合次限", dynamic: true },
  { id: "composite", title: "组合盘", dynamic: false },
  { id: "midpoint-primary", title: "马盘三限", dynamic: true },
  { id: "midpoint-secondary", title: "马盘次限", dynamic: true },
  { id: "midpoint", title: "马盘", dynamic: false },
  { id: "a-lunar-return", title: "A 月亮返照盘", dynamic: true },
  { id: "b-lunar-return", title: "B 月亮返照盘", dynamic: true }
];
const SCORE_DIMENSIONS = ["沟通", "吸引", "稳定", "成长"];
const ASPECT_TYPES = [
  { name: "合相", angle: 0 },
  { name: "六合", angle: 60 },
  { name: "刑克", angle: 90 },
  { name: "拱相", angle: 120 },
  { name: "对冲", angle: 180 }
];

const chartContainer = document.getElementById("charts");
const chartTemplate = document.getElementById("chart-template");
const dynamicDateInput = document.getElementById("dynamic-date");

function hashText(input) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function computePlacements(seedText) {
  const seed = hashText(seedText);
  return OBJECTS.map((obj, index) => {
    const v = (seed + index * 7919) % 36000;
    const degreeValue = (v % 3000) / 100;
    return {
      object: obj,
      sign: SIGNS[Math.floor(v / 3000) % 12],
      degree: `${degreeValue.toFixed(2)}°`,
      house: ((seed + index * 13) % 12) + 1,
      status: (seed + index) % 7 === 0 ? "逆行" : "顺行"
    };
  });
}

function normalizeDegree(degreeText) {
  return Number(degreeText.replace("°", ""));
}

function angularDistance(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

function getInputs() {
  return {
    a: {
      name: document.getElementById("a-name").value.trim() || "A",
      datetime: document.getElementById("a-datetime").value,
      location: document.getElementById("a-location").value.trim(),
      timezone: document.getElementById("a-timezone").value.trim()
    },
    b: {
      name: document.getElementById("b-name").value.trim() || "B",
      datetime: document.getElementById("b-datetime").value,
      location: document.getElementById("b-location").value.trim(),
      timezone: document.getElementById("b-timezone").value.trim()
    },
    dynamicDate: dynamicDateInput.value
  };
}

function buildReading(title, placements, dynamicDate) {
  const sun = placements.find((p) => p.object === "太阳");
  const moon = placements.find((p) => p.object === "月亮");
  const venus = placements.find((p) => p.object === "金星");
  const text = `${title}显示太阳落在${sun.sign}，强调自我驱动与关系中的主导主题；月亮位于${moon.sign}，情绪互动模式更偏向${moon.house}宫议题。`;
  const relation = `金星位于${venus.sign}${venus.degree}，在亲密关系中会通过审美、价值与照顾方式表达连接需求。`;
  const dynamic = dynamicDate ? `本次按 ${dynamicDate} 的动态日期计算，解读会随日期切换而自动更新。` : "该盘为固定盘，不随日期变化。";
  return `${text}${relation}${dynamic}`;
}

function renderChart(config, data, globalDate) {
  const fragment = chartTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".chart-card");
  const titleEl = fragment.querySelector(".chart-title");
  const metaEl = fragment.querySelector(".chart-meta");
  const controls = fragment.querySelector(".dynamic-controls");
  const dateInput = fragment.querySelector(".chart-date");
  const refreshBtn = fragment.querySelector(".refresh-btn");
  const body = fragment.querySelector(".placement-body");
  const readingEl = fragment.querySelector(".chart-reading");

  const effectiveDate = config.dynamic ? (globalDate || new Date().toISOString().slice(0, 10)) : "固定盘";
  const seed = JSON.stringify({ config: config.id, data, effectiveDate });
  const placements = computePlacements(seed);

  titleEl.textContent = config.title;
  metaEl.textContent = config.dynamic ? `动态盘 · 日期 ${effectiveDate}` : "固定盘";
  if (config.dynamic) {
    controls.hidden = false;
    dateInput.value = effectiveDate;
    refreshBtn.addEventListener("click", () => {
      dynamicDateInput.value = dateInput.value;
      generateCharts();
    });
  }

  placements.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.object}</td><td>${p.sign}</td><td>${p.degree}</td><td>${p.house}</td><td>${p.status}</td>`;
    body.appendChild(tr);
  });

  readingEl.textContent = buildReading(config.title, placements, config.dynamic ? effectiveDate : "");
  card.dataset.chartId = config.id;
  return fragment;
}

function scorePairing(data, dynamicDate) {
  const seed = hashText(JSON.stringify({ data, dynamicDate, tag: "score" }));
  return SCORE_DIMENSIONS.map((dim, i) => ({
    dim,
    score: ((seed + i * 97) % 41) + 60
  }));
}

function renderScores(scores) {
  const wrap = document.getElementById("score-bars");
  wrap.innerHTML = "";
  scores.forEach((item) => {
    const row = document.createElement("div");
    row.className = "score-item";
    row.innerHTML = `
      <div class="score-head"><span>${item.dim}</span><strong>${item.score}</strong></div>
      <div class="bar"><span style="width:${item.score}%"></span></div>
    `;
    wrap.appendChild(row);
  });
}

function calculateAspects(data, dynamicDate) {
  const aPlacements = computePlacements(JSON.stringify({ p: "A", data, dynamicDate }));
  const bPlacements = computePlacements(JSON.stringify({ p: "B", data, dynamicDate }));
  const keys = ["太阳", "月亮", "水星", "金星", "火星"];
  const aspects = [];
  keys.forEach((k, idx) => {
    const a = aPlacements.find((p) => p.object === k);
    const b = bPlacements.find((p) => p.object === k);
    const angleA = normalizeDegree(a.degree) + SIGNS.indexOf(a.sign) * 30;
    const angleB = normalizeDegree(b.degree) + SIGNS.indexOf(b.sign) * 30;
    const distance = angularDistance(angleA, angleB);
    let best = ASPECT_TYPES[0];
    let bestOrb = 180;
    ASPECT_TYPES.forEach((type) => {
      const orb = Math.abs(distance - type.angle);
      if (orb < bestOrb) {
        best = type;
        bestOrb = orb;
      }
    });
    aspects.push({
      obj: k,
      type: best.name,
      orb: `${bestOrb.toFixed(2)}°`,
      desc: `${k}形成${best.name}，提示双方在该主题上呈现${idx % 2 === 0 ? "互补" : "磨合"}倾向。`
    });
  });
  return aspects;
}

function renderAspects(aspects) {
  const panel = document.getElementById("aspect-panel");
  const body = document.getElementById("aspect-body");
  body.innerHTML = "";
  aspects.forEach((a) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${a.obj}</td><td>${a.type}</td><td>${a.orb}</td><td>${a.desc}</td>`;
    body.appendChild(tr);
  });
  panel.hidden = false;
}

function renderOverall(data, dynamicDate) {
  const panel = document.getElementById("overview-panel");
  const text = document.getElementById("overall-reading");
  panel.hidden = false;

  const aName = data.a.name;
  const bName = data.b.name;
  const dateHint = dynamicDate ? `当前动态盘基于 ${dynamicDate}，适合用于阶段性关系节奏追踪。` : "当前展示包含固定盘与默认动态日期。";
  const timezoneHint = (data.a.timezone || data.b.timezone) ? `你提供了时区信息（A:${data.a.timezone || "未填"} / B:${data.b.timezone || "未填"}），后续可直接接入真实星历计算。` : "建议补充时区信息以支持更精准的真实星历计算。";

  text.textContent = `${aName} 与 ${bName} 的关系图谱可拆分为“底层人格（本命）—互动机制（比较/组合/马盘）—时间波动（时空与月返）”三层结构。整体上建议你先看固定盘确认长期匹配，再用动态盘观察近期触发点。${dateHint}${timezoneHint}`;
}

function validateInput(data) {
  return data.a.datetime && data.b.datetime && data.a.location && data.b.location;
}

function generateCharts() {
  const data = getInputs();
  if (!validateInput(data)) {
    alert("请先完整填写 A/B 的出生时间与地点。");
    return;
  }

  chartContainer.innerHTML = "";
  CHART_CONFIG.forEach((config) => {
    chartContainer.appendChild(renderChart(config, data, data.dynamicDate));
  });

  const scores = scorePairing(data, data.dynamicDate);
  renderScores(scores);
  renderOverall(data, data.dynamicDate);
  renderAspects(calculateAspects(data, data.dynamicDate));
}

document.getElementById("generate-btn").addEventListener("click", generateCharts);
document.getElementById("export-btn").addEventListener("click", () => {
  const data = getInputs();
  if (!validateInput(data)) {
    alert("请先生成星盘后再导出。");
    return;
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    inputs: data,
    charts: CHART_CONFIG,
    summaryScores: scorePairing(data, data.dynamicDate),
    keyAspects: calculateAspects(data, data.dynamicDate)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `synastry-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
});
document.getElementById("prev-day-btn").addEventListener("click", () => {
  const current = new Date(dynamicDateInput.value || new Date().toISOString().slice(0, 10));
  current.setDate(current.getDate() - 1);
  dynamicDateInput.value = current.toISOString().slice(0, 10);
});
document.getElementById("next-day-btn").addEventListener("click", () => {
  const current = new Date(dynamicDateInput.value || new Date().toISOString().slice(0, 10));
  current.setDate(current.getDate() + 1);
  dynamicDateInput.value = current.toISOString().slice(0, 10);
});

dynamicDateInput.value = new Date().toISOString().slice(0, 10);
