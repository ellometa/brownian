import { CONFIG } from "../config.js";
import { bus } from "../state.js";
import { load, save } from "../storage.js";

const GRID_W = 80;
const GRID_H = 60;
const grid = new Float32Array(GRID_W * GRID_H);
let maxCount = 0;

let canvas = null;
let ctx = null;
let enabled = load("heatmap", false);
let dirty = true;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.getElementById("heatmapCanvas");
  if (!canvas) return;
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;
  ctx = canvas.getContext("2d");
}

function pxToGrid(x, y) {
  const gx = Math.floor((x / CONFIG.CANVAS_WIDTH) * GRID_W);
  const gy = Math.floor((y / CONFIG.CANVAS_HEIGHT) * GRID_H);
  return [Math.max(0, Math.min(GRID_W - 1, gx)), Math.max(0, Math.min(GRID_H - 1, gy))];
}

function viridis(t) {
  // Simple 4-stop interpolation through viridis-ish colors.
  const stops = [
    [68, 1, 84],
    [59, 82, 139],
    [33, 145, 140],
    [94, 201, 98],
    [253, 231, 37],
  ];
  const seg = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
  const frac = t * (stops.length - 1) - seg;
  const a = stops[seg];
  const b = stops[seg + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * frac),
    Math.round(a[1] + (b[1] - a[1]) * frac),
    Math.round(a[2] + (b[2] - a[2]) * frac),
  ];
}

function render() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!enabled || maxCount === 0) return;

  const cellW = canvas.width / GRID_W;
  const cellH = canvas.height / GRID_H;
  const logMax = Math.log(maxCount + 1);

  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const count = grid[gy * GRID_W + gx];
      if (count === 0) continue;
      const t = Math.log(count + 1) / logMax;
      const [r, g, b] = viridis(t);
      const alpha = Math.floor(t * 180);

      const x0 = Math.floor(gx * cellW);
      const y0 = Math.floor(gy * cellH);
      const x1 = Math.floor((gx + 1) * cellW);
      const y1 = Math.floor((gy + 1) * cellH);
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          const idx = (py * canvas.width + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = alpha;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

let scheduled = false;
function scheduleRender() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    if (dirty) {
      render();
      dirty = false;
    }
  });
}

function syncToggleUi() {
  const btn = document.getElementById("toggleHeatmapBtn");
  if (btn) btn.classList.toggle("toggle-on", enabled);
  if (canvas) canvas.style.display = enabled ? "block" : "none";
}

export function setHeatmapEnabled(v) {
  enabled = !!v;
  save("heatmap", enabled);
  syncToggleUi();
  dirty = true;
  scheduleRender();
}

export function clearHeatmap() {
  grid.fill(0);
  maxCount = 0;
  dirty = true;
  scheduleRender();
}

export function recordPegHit(x, y) {
  const [gx, gy] = pxToGrid(x, y);
  const idx = gy * GRID_W + gx;
  grid[idx] += 1;
  if (grid[idx] > maxCount) maxCount = grid[idx];
  dirty = true;
  if (enabled) scheduleRender();
}

export function installHeatmap() {
  ensureCanvas();
  syncToggleUi();

  bus.on("physics:collision", ({ x, y, kind }) => {
    if (kind === "peg") recordPegHit(x, y);
  });

  document
    .getElementById("toggleHeatmapBtn")
    ?.addEventListener("click", () => setHeatmapEnabled(!enabled));

  document
    .getElementById("clearHeatmapBtn")
    ?.addEventListener("click", clearHeatmap);
}
