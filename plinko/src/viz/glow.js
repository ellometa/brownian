import { CONFIG } from "../config.js";
import { engine } from "../physics/engine.js";
import { bus, state } from "../state.js";

let canvas = null;
let ctx = null;

// Pre-rendered static pegs layer. Rebuilt on board:rebuilt only.
let pegBaseCanvas = null;
let pegBaseCtx = null;

let flashes = []; // active peg-collision flashes

function ensureCanvas() {
  if (canvas) return;
  canvas = document.getElementById("glowCanvas");
  if (!canvas) return;
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;
  ctx = canvas.getContext("2d");

  pegBaseCanvas = document.createElement("canvas");
  pegBaseCanvas.width = canvas.width;
  pegBaseCanvas.height = canvas.height;
  pegBaseCtx = pegBaseCanvas.getContext("2d");
}

function drawPegInto(c, p) {
  // Outer soft halo
  const grad = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  grad.addColorStop(0.4, "rgba(0, 229, 160, 0.12)");
  grad.addColorStop(1, "rgba(0, 229, 160, 0)");
  c.fillStyle = grad;
  c.beginPath();
  c.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
  c.fill();

  // Core
  c.fillStyle = "#f4f6ff";
  c.beginPath();
  c.arc(p.x, p.y, p.r * 0.65, 0, Math.PI * 2);
  c.fill();

  // Thin ring
  c.strokeStyle = "rgba(0, 229, 160, 0.55)";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  c.stroke();
}

function rebuildPegBase() {
  if (!pegBaseCtx) return;
  pegBaseCtx.clearRect(0, 0, pegBaseCanvas.width, pegBaseCanvas.height);
  const pegs = engine.world.bodies
    .filter((b) => b.label === "peg")
    .map((b) => ({ x: b.position.x, y: b.position.y, r: b.circleRadius || CONFIG.PEG_RADIUS }));
  for (const p of pegs) drawPegInto(pegBaseCtx, p);
}

function drawBallGlow(body) {
  const grad = ctx.createRadialGradient(
    body.position.x,
    body.position.y,
    0,
    body.position.x,
    body.position.y,
    CONFIG.BALL_RADIUS * 2.8
  );
  grad.addColorStop(0, "rgba(0, 229, 160, 0.45)");
  grad.addColorStop(1, "rgba(0, 229, 160, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(body.position.x, body.position.y, CONFIG.BALL_RADIUS * 2.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlashes(now) {
  const FLASH_MS = 240;
  flashes = flashes.filter((f) => now - f.t < FLASH_MS);
  for (const f of flashes) {
    const age = (now - f.t) / FLASH_MS;
    const radius = CONFIG.PEG_RADIUS + age * 14;
    const alpha = (1 - age) * 0.7;
    ctx.strokeStyle = `rgba(0, 229, 160, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 1.2 + (1 - age) * 1.0;
    ctx.beginPath();
    ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function renderLoop() {
  if (!ctx) {
    requestAnimationFrame(renderLoop);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Composite static pegs first (one drawImage call, no per-frame gradient math).
  ctx.drawImage(pegBaseCanvas, 0, 0);

  // Per-frame dynamic content
  for (const [, data] of state.activeBalls) drawBallGlow(data.body);
  drawFlashes(performance.now());

  requestAnimationFrame(renderLoop);
}

export function installGlow() {
  ensureCanvas();
  rebuildPegBase();

  bus.on("board:rebuilt", () => {
    // Pegs are created during rebuild — defer one tick.
    setTimeout(rebuildPegBase, 0);
  });

  bus.on("physics:collision", ({ x, y, kind }) => {
    if (kind === "peg") flashes.push({ x, y, t: performance.now() });
  });

  renderLoop();
}
