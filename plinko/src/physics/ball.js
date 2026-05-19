import { CONFIG } from "../config.js";
import { engine } from "./engine.js";
import { state, bus, addMoney } from "../state.js";
import { board } from "../board.js";
import { random } from "../rng.js";

const { Bodies, World, Body, Events } = Matter;

let lastSpawnTs = 0;

// Deterministic mode: precomputed target slot per ball (or null if free physics).
const ballTargets = new Map(); // ballId -> targetX

let determinismActive = false;

export function setDeterminismActive(v) {
  determinismActive = !!v;
}

export function isDeterminismActive() {
  return determinismActive;
}

export function canSpawnNow() {
  return performance.now() - lastSpawnTs >= CONFIG.DROP_COOLDOWN_MS;
}

function precomputeTargetSlotX() {
  // Sample slot index from a Galton coin-flip walk using the seeded RNG.
  const rows = board.rows;
  let k = 0;
  for (let r = 0; r < rows; r++) if (random() < 0.5) k += 1;

  // Convert slot index to canvas x. Mirrors slots.js geometry.
  const centerX = CONFIG.CANVAS_WIDTH / 2;
  const slotCount = rows + 1;
  const margin = 10;
  const usable = CONFIG.CANVAS_WIDTH - margin * 2;
  const slotWidth = Math.min(80, usable / slotCount);
  const totalWidth = slotCount * slotWidth;
  const startX = centerX - totalWidth / 2;
  return { x: startX + k * slotWidth + slotWidth / 2, slotIndex: k };
}

export function spawnBall() {
  if (state.money < board.bet) return null;
  if (!canSpawnNow()) return null;
  lastSpawnTs = performance.now();

  const bet = board.bet;
  addMoney(-bet);

  const centerX = CONFIG.CANVAS_WIDTH / 2;
  const jitter = (random() - 0.5) * 2 * CONFIG.SPAWN_JITTER_PX;
  const x = centerX + jitter;

  const ball = Bodies.circle(x, CONFIG.SPAWN_Y, CONFIG.BALL_RADIUS, {
    restitution: CONFIG.BALL_RESTITUTION,
    friction: CONFIG.BALL_FRICTION,
    frictionAir: CONFIG.BALL_FRICTION_AIR,
    density: CONFIG.BALL_DENSITY,
    slop: 0.02,
    render: {
      fillStyle: "#f4f6ff",
      strokeStyle: "rgba(0, 229, 160, 0.9)",
      lineWidth: 2,
    },
  });

  // Small angular kick so two identical drops can still split L/R at peg 1.
  const omega = (random() - 0.5) * 2 * CONFIG.BALL_SPAWN_ANGULAR_JITTER;
  Body.setAngularVelocity(ball, omega);

  state.activeBalls.set(ball.id, {
    body: ball,
    bet,
    paidOut: false,
    spawnedAt: performance.now(),
  });

  if (determinismActive) {
    const { x: targetX } = precomputeTargetSlotX();
    ballTargets.set(ball.id, targetX);
  }

  World.add(engine.world, ball);

  bus.emit("ball:dropped", { id: ball.id, bet, spawnX: x });
  bus.emit("cooldown:started", { ms: CONFIG.DROP_COOLDOWN_MS });
  return ball.id;
}

export function dropBalls(count) {
  // Honor cooldown between rapid drops.
  const fire = (remaining) => {
    if (remaining <= 0) return;
    if (state.money < board.bet) return;
    const id = spawnBall();
    if (id === null) {
      // Retry once cooldown elapses.
      setTimeout(() => fire(remaining), CONFIG.DROP_COOLDOWN_MS);
      return;
    }
    if (remaining > 1) setTimeout(() => fire(remaining - 1), CONFIG.DROP_COOLDOWN_MS);
  };
  fire(count);
}

// --- Out-of-bounds sweeper + deterministic-mode nudge ----------------------

const OOB_MARGIN = 24;

function installSweeper() {
  Events.on(engine, "afterUpdate", () => {
    if (state.activeBalls.size === 0) return;

    for (const [id, data] of state.activeBalls) {
      const { x, y } = data.body.position;

      // Deterministic-mode steering: low-pass blend toward a velocity
      // that points at the target column. The blend is gentle, so pegs
      // still produce visible deflection, but the ball converges to the
      // pre-rolled slot over the full descent.
      if (determinismActive) {
        const tx = ballTargets.get(id);
        if (tx !== undefined) {
          const desiredVx = (tx - x) * 0.04;
          const vx = data.body.velocity.x * 0.92 + desiredVx * 0.08;
          Body.setVelocity(data.body, { x: vx, y: data.body.velocity.y });
        }
      }

      // Out-of-bounds removal — no payout for balls that escape.
      if (
        x < -OOB_MARGIN ||
        x > CONFIG.CANVAS_WIDTH + OOB_MARGIN ||
        y > CONFIG.CANVAS_HEIGHT + OOB_MARGIN
      ) {
        if (!data.paidOut) {
          data.paidOut = true;
          bus.emit("ball:settled", {
            id,
            slotIndex: -1,
            multiplier: 0,
            payout: 0,
            bet: data.bet,
          });
        }
        World.remove(engine.world, data.body);
        state.activeBalls.delete(id);
        ballTargets.delete(id);
      }
    }
  });
}

installSweeper();

// Clean up target table when balls settle.
bus.on("ball:settled", ({ id }) => ballTargets.delete(id));
bus.on("board:rebuilt", () => ballTargets.clear());
