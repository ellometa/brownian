import { state, bus } from "../state.js";
import { getMultipliers } from "../board.js";
import { slotCanvas } from "../physics/engine.js";

const ctx = slotCanvas.getContext("2d");

// Off-screen layer for the static slot panels (panels + numbers). Rebuilt only
// when geometry/multipliers change. Per-frame work is just the impact glows.
let baseCanvas = null;
let baseCtx = null;
let baseDirty = true;

let impacts = []; // { slotIndex, startedAt }
let needsRender = false;

function tierColor(multiplier) {
  if (multiplier >= 10) return { fill: "rgba(255, 209, 102, 0.18)", accent: "#ffd166", glow: "rgba(255, 209, 102, " };
  if (multiplier > 1) return { fill: "rgba(0, 229, 160, 0.14)", accent: "#00e5a0", glow: "rgba(0, 229, 160, " };
  return { fill: "rgba(255, 84, 112, 0.14)", accent: "#ff5470", glow: "rgba(255, 84, 112, " };
}

function ensureBase() {
  if (baseCanvas) return;
  baseCanvas = document.createElement("canvas");
  baseCanvas.width = slotCanvas.width;
  baseCanvas.height = slotCanvas.height;
  baseCtx = baseCanvas.getContext("2d");
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function rebuildBase() {
  ensureBase();
  baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
  const multipliers = getMultipliers();
  if (!multipliers) return;

  state.slots.forEach((slot, i) => {
    const multiplier = multipliers[i];
    if (multiplier === undefined) return;
    const b = slot.bounds;
    const x = b.min.x;
    const y = b.min.y;
    const w = b.max.x - b.min.x;
    const h = b.max.y - b.min.y;
    const { fill, accent } = tierColor(multiplier);

    baseCtx.fillStyle = fill;
    roundRect(baseCtx, x + 1, y + 1, w - 2, h - 2, 4);
    baseCtx.fill();

    baseCtx.fillStyle = accent;
    baseCtx.fillRect(x + 1, y + 1, w - 2, 2);

    baseCtx.fillStyle = "#f4f6ff";
    const fontSize = Math.max(10, Math.min(15, Math.floor(w / 4)));
    baseCtx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
    baseCtx.textAlign = "center";
    baseCtx.textBaseline = "middle";
    baseCtx.fillText(`${multiplier}×`, x + w / 2, y + h / 2 + 1);
  });
  baseDirty = false;
}

function renderFrame() {
  if (baseDirty) rebuildBase();
  ctx.clearRect(0, 0, slotCanvas.width, slotCanvas.height);
  ctx.drawImage(baseCanvas, 0, 0);

  const now = performance.now();
  impacts = impacts.filter((im) => now - im.startedAt < 600);
  if (impacts.length === 0) {
    needsRender = false;
    return;
  }

  const multipliers = getMultipliers();
  for (const im of impacts) {
    const slot = state.slots[im.slotIndex];
    if (!slot) continue;
    const multiplier = multipliers[im.slotIndex];
    const b = slot.bounds;
    const x = b.min.x;
    const y = b.min.y;
    const w = b.max.x - b.min.x;
    const h = b.max.y - b.min.y;
    const { accent, glow } = tierColor(multiplier);

    const age = (now - im.startedAt) / 600;
    const swell = 1 - Math.abs(2 * age - 1);
    const a = (1 - age) * 0.85;

    const grad = ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      0,
      x + w / 2,
      y + h / 2,
      Math.max(w, h) * (1 + swell * 0.6)
    );
    grad.addColorStop(0, `${glow}${a.toFixed(2)})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - w, y - h, w * 3, h * 3);

    ctx.strokeStyle = accent;
    ctx.globalAlpha = a;
    ctx.lineWidth = 1.5 + swell * 1.5;
    roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function loop() {
  if (needsRender || impacts.length > 0 || baseDirty) {
    renderFrame();
  }
  requestAnimationFrame(loop);
}

function flashSlot(slotIndex) {
  if (slotIndex < 0) return;
  impacts.push({ slotIndex, startedAt: performance.now() });
  needsRender = true;
}

export function startSlotsOverlay() {
  ensureBase();
  baseDirty = true;
  needsRender = true;
  loop();

  bus.on("ball:settled", ({ slotIndex }) => flashSlot(slotIndex));
  bus.on("board:rebuilt", () => {
    baseDirty = true;
    needsRender = true;
  });
  bus.on("config:changed", () => {
    baseDirty = true;
    needsRender = true;
  });
}
