import { CONFIG } from "../config.js";
import { engine } from "./engine.js";
import { state, bus, addMoney } from "../state.js";
import { board } from "../board.js";
import { random } from "../rng.js";

const { Bodies, World } = Matter;

export function spawnBall() {
  if (state.money < board.bet) return null;

  const bet = board.bet;
  addMoney(-bet);

  const centerX = CONFIG.CANVAS_WIDTH / 2;
  const randomOffset = (random() - 0.5) * CONFIG.SPAWN_RANDOM_OFFSET * 2;
  const x = centerX + randomOffset;

  const ball = Bodies.circle(x, CONFIG.SPAWN_Y, CONFIG.BALL_RADIUS, {
    restitution: 0.6,
    friction: 0.1,
    density: 0.001,
    render: {
      fillStyle: "#ff6b6b",
      strokeStyle: "#fff",
      lineWidth: 2,
    },
  });

  state.activeBalls.set(ball.id, {
    body: ball,
    bet,
    paidOut: false,
  });

  World.add(engine.world, ball);

  bus.emit("ball:dropped", { id: ball.id, bet, spawnX: x });
  return ball.id;
}

export function dropBalls(count, intervalMs = 100) {
  const drop = (remaining) => {
    if (remaining <= 0) return;
    if (spawnBall() === null) return;
    if (remaining > 1) setTimeout(() => drop(remaining - 1), intervalMs);
  };
  drop(count);
}
