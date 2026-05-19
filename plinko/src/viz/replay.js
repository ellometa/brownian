import { CONFIG } from "../config.js";
import { state, bus } from "../state.js";
import { engine } from "../physics/engine.js";

const { Events } = Matter;

const SAMPLE_EVERY_TICK = 2;
let tickCounter = 0;
let activeRecordings = new Map(); // ballId -> [{x,y}, ...]
let lastPath = null;

let canvas = null;
let ctx = null;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.getElementById("replayCanvas");
  if (!canvas) return;
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;
  ctx = canvas.getContext("2d");
}

function record() {
  tickCounter += 1;
  if (tickCounter % SAMPLE_EVERY_TICK !== 0) return;
  for (const [id, data] of state.activeBalls) {
    let arr = activeRecordings.get(id);
    if (!arr) {
      arr = [];
      activeRecordings.set(id, arr);
    }
    arr.push({ x: data.body.position.x, y: data.body.position.y });
  }
}

function setReplayButtonEnabled(enabled) {
  const btn = document.getElementById("replayBtn");
  if (btn) btn.disabled = !enabled;
}

function runReplay() {
  if (!lastPath || !ctx) return;
  ensureCanvas();
  const path = lastPath;
  const badge = document.getElementById("replayBadge");
  if (badge) badge.classList.add("active");

  const start = performance.now();
  const durationMs = path.length * 16;

  function frame(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / durationMs);
    const idx = Math.floor(t * (path.length - 1));
    const pos = path[idx];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Faint trail of the full path.
    ctx.strokeStyle = "rgba(255, 215, 0, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i <= idx; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();

    // Ghost ball.
    ctx.fillStyle = "rgba(255, 215, 0, 0.85)";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        badge?.classList.remove("active");
      }, 400);
    }
  }
  requestAnimationFrame(frame);
}

export function installReplay() {
  ensureCanvas();
  setReplayButtonEnabled(false);
  Events.on(engine, "afterUpdate", record);

  bus.on("ball:settled", ({ id }) => {
    const path = activeRecordings.get(id);
    if (path && path.length > 4) {
      lastPath = path.slice();
      setReplayButtonEnabled(true);
    }
    activeRecordings.delete(id);
  });

  bus.on("board:rebuilt", () => {
    activeRecordings.clear();
    lastPath = null;
    setReplayButtonEnabled(false);
  });

  document.getElementById("replayBtn")?.addEventListener("click", runReplay);
}
