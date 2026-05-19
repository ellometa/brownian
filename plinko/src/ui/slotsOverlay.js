import { state, bus } from "../state.js";
import { getMultipliers } from "../board.js";
import { slotCanvas } from "../physics/engine.js";

const ctx = slotCanvas.getContext("2d");

function multiplierColors(multiplier, maxMult) {
  // Map multiplier to a fill gradient + stroke tier.
  const normalized = Math.log(multiplier + 1) / Math.log(maxMult + 1);
  const r = Math.floor(50 + normalized * 200);
  const g = Math.floor(25 + normalized * 100);
  const b = Math.floor(50 + (1 - normalized) * 150);
  const stroke =
    multiplier >= 50 ? "#ffd700" : multiplier >= 5 ? "#ff6b6b" : "#4ecdc4";
  return { r, g, b, stroke };
}

function renderCustomSlots() {
  ctx.clearRect(0, 0, slotCanvas.width, slotCanvas.height);
  const multipliers = getMultipliers();
  if (!multipliers) return;
  const maxMult = Math.max(...multipliers);

  state.slots.forEach((slot, i) => {
    const multiplier = multipliers[i];
    if (multiplier === undefined) return;
    const bounds = slot.bounds;
    const x = bounds.min.x;
    const y = bounds.min.y;
    const w = bounds.max.x - bounds.min.x;
    const h = bounds.max.y - bounds.min.y;

    const { r, g, b, stroke } = multiplierColors(multiplier, maxMult);
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
    gradient.addColorStop(
      1,
      `rgba(${Math.floor(r / 2)}, ${Math.floor(g / 2)}, ${Math.floor(b / 2)}, 0.4)`
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#fff";
    const fontSize = Math.max(10, Math.min(16, Math.floor(w / 3.5)));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${multiplier}x`, x + w / 2, y + h / 2);
  });
}

function flashSlot(slotIndex) {
  const slot = state.slots[slotIndex];
  if (!slot) return;

  const bounds = slot.bounds;
  const x = bounds.min.x;
  const y = bounds.min.y;
  const w = bounds.max.x - bounds.min.x;
  const h = bounds.max.y - bounds.min.y;

  const gradient = ctx.createRadialGradient(
    x + w / 2,
    y + h / 2,
    0,
    x + w / 2,
    y + h / 2,
    Math.max(w, h) / 2
  );
  gradient.addColorStop(0, "rgba(255, 215, 0, 0.8)");
  gradient.addColorStop(1, "rgba(255, 215, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(x - w / 2, y - h / 2, w * 2, h * 2);

  setTimeout(renderCustomSlots, 200);
}

export function startSlotsOverlay() {
  function loop() {
    renderCustomSlots();
    requestAnimationFrame(loop);
  }
  loop();

  bus.on("ball:settled", ({ slotIndex }) => flashSlot(slotIndex));
}
