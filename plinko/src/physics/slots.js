import { CONFIG } from "../config.js";
import { engine } from "./engine.js";
import { state, bus, addMoney } from "../state.js";

const { Bodies, World, Events } = Matter;

export function createSlots() {
  const centerX = CONFIG.CANVAS_WIDTH / 2;
  const totalWidth = CONFIG.NUM_SLOTS * CONFIG.SLOT_WIDTH;
  const startX = centerX - totalWidth / 2;

  state.slots = [];

  for (let i = 0; i < CONFIG.NUM_SLOTS; i++) {
    const x = startX + i * CONFIG.SLOT_WIDTH + CONFIG.SLOT_WIDTH / 2;
    const multiplier = CONFIG.MULTIPLIERS[i];

    const slot = Bodies.rectangle(
      x,
      CONFIG.SLOT_Y,
      CONFIG.SLOT_WIDTH - 2,
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
