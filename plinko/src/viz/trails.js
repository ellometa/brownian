import { CONFIG } from "../config.js";
import { state, bus } from "../state.js";
import { engine } from "../physics/engine.js";
import { load, save } from "../storage.js";

const { Events } = Matter;

const TRAIL_LEN = 60;
const trails = new Map(); // ballId -> { buf: [{x,y}], head: number, size: number }
let canvas = null;
let ctx = null;
let enabled = load("trails", false);
let lastSampleTs = 0;
const SAMPLE_INTERVAL_MS = 24;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.getElementById("trailCanvas");
  if (!canvas) return;
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;
  ctx = canvas.getContext("2d");
}

function recordPositions() {
  if (!enabled) return;
  const now = performance.now();
  if (now - lastSampleTs < SAMPLE_INTERVAL_MS) return;
  lastSampleTs = now;

  for (const [id, data] of state.activeBalls) {
    let trail = trails.get(id);
    if (!trail) {
      trail = { buf: new Float32Array(TRAIL_LEN * 2), head: 0, size: 0 };
      trails.set(id, trail);
    }
    const i = trail.head * 2;
    trail.buf[i] = data.body.position.x;
    trail.buf[i + 1] = data.body.position.y;
    trail.head = (trail.head + 1) % TRAIL_LEN;
    if (trail.size < TRAIL_LEN) trail.size += 1;
  }
}

function render() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!enabled) return;

  for (const [id, trail] of trails) {
    if (trail.size < 2) continue;
    const points = [];
    for (let n = 0; n < trail.size; n++) {
      const idx = (trail.head - 1 - n + TRAIL_LEN) % TRAIL_LEN;
      points.push([trail.buf[idx * 2], trail.buf[idx * 2 + 1]]);
    }
    // Newest first → oldest. Draw oldest → newest so alpha builds up.
    for (let i = points.length - 1; i > 0; i--) {
      const alpha = 1 - i / trail.size;
      ctx.strokeStyle = `rgba(255, 200, 100, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 2.2 * alpha + 0.4;
      ctx.beginPath();
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[i - 1][0], points[i - 1][1]);
      ctx.stroke();
    }
  }
}

function dropDeadTrails() {
  for (const id of trails.keys()) {
    if (!state.activeBalls.has(id)) trails.delete(id);
  }
}

function renderLoop() {
  render();
  dropDeadTrails();
  requestAnimationFrame(renderLoop);
}

function syncToggleUi() {
  const btn = document.getElementById("toggleTrailsBtn");
  if (btn) btn.classList.toggle("toggle-on", enabled);
  if (canvas) canvas.style.display = enabled ? "block" : "none";
}

export function setTrailsEnabled(v) {
  enabled = !!v;
  save("trails", enabled);
  if (!enabled) trails.clear();
  syncToggleUi();
}

export function isTrailsEnabled() {
  return enabled;
}

export function installTrails() {
  ensureCanvas();
  syncToggleUi();
  Events.on(engine, "afterUpdate", recordPositions);

  // Reset trails on settle so the drawn streak ends at the slot.
  bus.on("ball:settled", ({ id }) => {
    trails.delete(id);
  });

  // Clear trails when board rebuilds (everything's gone anyway).
  bus.on("board:rebuilt", () => trails.clear());

  document
    .getElementById("toggleTrailsBtn")
    ?.addEventListener("click", () => setTrailsEnabled(!enabled));

  renderLoop();
}
