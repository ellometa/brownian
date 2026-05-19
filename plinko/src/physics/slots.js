import { CONFIG } from "../config.js";
import { engine } from "./engine.js";
import { state, bus, addMoney } from "../state.js";
import { board, getMultipliers, getGeometry } from "../board.js";

const { Bodies, World, Events } = Matter;

export function createSlots() {
  const { slotWidth, slotCount } = getGeometry();
  const multipliers = getMultipliers();
  const centerX = CONFIG.CANVAS_WIDTH / 2;
  const totalWidth = slotCount * slotWidth;
  const startX = centerX - totalWidth / 2;

  state.slots = [];

  for (let i = 0; i < slotCount; i++) {
    const x = startX + i * slotWidth + slotWidth / 2;
    const multiplier = multipliers[i];

    const slot = Bodies.rectangle(
      x,
      CONFIG.SLOT_Y,
      slotWidth - 2,
      CONFIG.SLOT_HEIGHT,
      {
        isStatic: true,
        isSensor: true,
        label: `slot_${i}`,
        render: {
          fillStyle: "transparent",
          strokeStyle: "transparent",
        },
        multiplier,
        slotIndex: i,
      }
    );

    state.slots.push(slot);
  }

  World.add(engine.world, state.slots);
}

export function clearSlots() {
  if (state.slots.length) {
    World.remove(engine.world, state.slots);
    state.slots = [];
  }
}

function handlePayout(ballId, slot) {
  const ballData = state.activeBalls.get(ballId);
  if (!ballData || ballData.paidOut) return;

  ballData.paidOut = true;
  const payout = ballData.bet * slot.multiplier;
  addMoney(payout);

  bus.emit("ball:settled", {
    id: ballId,
    slotIndex: slot.slotIndex,
    multiplier: slot.multiplier,
    payout,
    bet: ballData.bet,
  });

  setTimeout(() => {
    if (state.activeBalls.has(ballId)) {
      World.remove(engine.world, ballData.body);
      state.activeBalls.delete(ballId);
    }
  }, 500);
}

export function installCollisionHandler() {
  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;
      let ball = null;
      let slot = null;

      if (bodyA.label.startsWith("slot_")) {
        slot = bodyA;
        ball = bodyB;
      } else if (bodyB.label.startsWith("slot_")) {
        slot = bodyB;
        ball = bodyA;
      }

      if (ball && slot && state.activeBalls.has(ball.id)) {
        handlePayout(ball.id, slot);
      }
    });
  });
}
