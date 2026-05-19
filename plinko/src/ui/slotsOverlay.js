import { state, bus } from "../state.js";
import { getMultipliers } from "../board.js";
import { slotCanvas } from "../physics/engine.js";

const ctx = slotCanvas.getContext("2d");

function tierColor(multiplier) {
  if (multiplier >= 10) return { fill: "rgba(255, 209, 102, 0.18)", accent: "#ffd166", glow: "rgba(255, 209, 102, 0.55)" };
  if (multiplier > 1) return { fill: "rgba(0, 229, 160, 0.14)", accent: "#00e5a0", glow: "rgba(0, 229, 160, 0.45)" };
  return { fill: "rgba(255, 84, 112, 0.14)", accent: "#ff5470", glow: "rgba(255, 84, 112, 0.4)" };
}

// Pending slot impact animations: { slotIndex, startedAt }
let impacts = [];

function renderCustomSlots() {
  ctx.clearRect(0, 0, slotCanvas.width, slotCanvas.height);
  const multipliers = getMultipliers();
  if (!multipliers) return;
  const now = performance.now();
  impacts = impacts.filter((im) => now - im.startedAt < 600);

  state.slots.forEach((slot, i) => {
    const multiplier = multipliers[i];
    if (multiplier === undefined) return;
    const bounds = slot.bounds;
    const x = bounds.min.x;
    const y = bounds.min.y;
    const w = bounds.max.x - bounds.min.x;
    const h = bounds.max.y - bounds.min.y;
    const { fill, accent, glow } = tierColor(multiplier);

    // Body
    ctx.fillStyle = fill;
    roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 4);
    ctx.fill();

    // Top accent bar
    ctx.fillStyle = accent;
    ctx.fillRect(x + 1, y + 1, w - 2, 2);

    // Number
    ctx.fillStyle = "#f4f6ff";
    const fontSize = Math.max(10, Math.min(15, Math.floor(w / 4)));
    ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${multiplier}×`, x + w / 2, y + h / 2 + 1);

    // Impact glow
    const im = impacts.find((m) => m.slotIndex === i);
    if (im) {
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
      grad.addColorStop(0, glow.replace(/0\.\d+\)$/, `${a.toFixed(2)})`));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(
        x - w,
        y - h,
        w * 3,
        h * 3
      );
      // Inner outline pulse
      ctx.strokeStyle = accent;
      ctx.globalAlpha = a;
      ctx.lineWidth = 1.5 + swell * 1.5;
      roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function flashSlot(slotIndex) {
  impacts.push({ slotIndex, startedAt: performance.now() });
}

export function startSlotsOverlay() {
  function loop() {
    renderCustomSlots();
    requestAnimationFrame(loop);
  }
  loop();

  bus.on("ball:settled", ({ slotIndex }) => flashSlot(slotIndex));
}
