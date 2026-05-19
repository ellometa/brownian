import { CONFIG } from "../config.js";
import { engine } from "../physics/engine.js";
import { bus, state } from "../state.js";

let canvas = null;
let ctx = null;
let pegs = []; // mirrored peg positions for rendering
let flashes = []; // active peg-collision flashes

function ensureCanvas() {
  if (canvas) return;
  canvas = document.getElementById("glowCanvas");
  if (!canvas) return;
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;
  ctx = canvas.getContext("2d");
}

function refreshPegList() {
  pegs = engine.world.bodies
    .filter((b) => b.label === "peg")
    .map((b) => ({ x: b.position.x, y: b.position.y, r: b.circleRadius || CONFIG.PEG_RADIUS }));
}

function drawPegHalo(p) {
  // Outer soft halo
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  grad.addColorStop(0.4, "rgba(0, 229, 160, 0.10)");
  grad.addColorStop(1, "rgba(0, 229, 160, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = "#f4f6ff";
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Thin ring
  ctx.strokeStyle = "rgba(0, 229, 160, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBallGlow(body) {
  // Outer glow halo
  const grad = ctx.createRadialGradient(
    body.position.x,
    body.position.y,
    0,
    body.position.x,
    body.position.y,
    CONFIG.BALL_RADIUS * 2.6
  );
  grad.addColorStop(0, "rgba(0, 229, 160, 0.35)");
  grad.addColorStop(1, "rgba(0, 229, 160, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(body.position.x, body.position.y, CONFIG.BALL_RADIUS * 2.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlashes(now) {
  const FLASH_MS = 240;
  flashes = flashes.filter((f) => now - f.t < FLASH_MS);
  for (const f of flashes) {
    const age = (now - f.t) / FLASH_MS;
    const radius = CONFIG.PEG_RADIUS + age * 16;
    const alpha = (1 - age) * 0.7;
    ctx.strokeStyle = `rgba(0, 229, 160, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 1.5 + (1 - age) * 1.2;
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

  // Pegs
  for (const p of pegs) drawPegHalo(p);

  // Ball glows
  for (const [, data] of state.activeBalls) drawBallGlow(data.body);

  // Flashes
  drawFlashes(performance.now());

  requestAnimationFrame(renderLoop);
}

export function installGlow() {
  ensureCanvas();
  refreshPegList();

  bus.on("board:rebuilt", () => {
    // Pegs are re-created during rebuild — wait one tick to read them.
    setTimeout(refreshPegList, 0);
  });

  bus.on("physics:collision", ({ x, y, kind }) => {
    if (kind === "peg") flashes.push({ x, y, t: performance.now() });
  });

  renderLoop();
}
