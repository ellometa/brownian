const CONFIG = {

  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  GRAVITY_Y: 1.0,
  PEG_RADIUS: 9,
  BALL_RADIUS: 12,

  PEG_ROWS: 12,
  PEG_H_SPACING: 60,
  PEG_V_SPACING: 50,
  PEG_START_Y: 80,

  NUM_SLOTS: 11,
  SLOT_WIDTH: 70,
  SLOT_HEIGHT: 40,
  SLOT_Y: 560,
  MULTIPLIERS: [100, 50, 20, 5, 1, 0.2, 1, 5, 20, 50, 100],

  INITIAL_MONEY: 1000,
  BET_AMOUNT: 10,

  SPAWN_Y: 30,
  SPAWN_RANDOM_OFFSET: 20,
};

let money = CONFIG.INITIAL_MONEY;
let activeBalls = new Map();
let slots = [];
let slotFlashElements = [];

const { Engine, Render, World, Bodies, Body, Events, Composite } = Matter;

const engine = Engine.create();
engine.world.gravity.y = CONFIG.GRAVITY_Y;

const canvas = document.getElementById("gameCanvas");
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

const slotCanvas = document.getElementById("slotCanvas");
slotCanvas.width = CONFIG.CANVAS_WIDTH;
slotCanvas.height = CONFIG.CANVAS_HEIGHT;

const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: CONFIG.CANVAS_WIDTH,
    height: CONFIG.CANVAS_HEIGHT,
    wireframes: false,
    background: "#1a1a2e",
    pixelRatio: window.devicePixelRatio || 1,
  },
});

Render.run(render);

const wallThickness = 50;
const walls = [

  Bodies.rectangle(
    -wallThickness / 2,
    CONFIG.CANVAS_HEIGHT / 2,
    wallThickness,
    CONFIG.CANVAS_HEIGHT,
    {
      isStatic: true,
      render: { fillStyle: "#333" },
    }
  ),

  Bodies.rectangle(
    CONFIG.CANVAS_WIDTH + wallThickness / 2,
    CONFIG.CANVAS_HEIGHT / 2,
    wallThickness,
    CONFIG.CANVAS_HEIGHT,
    {
      isStatic: true,
      render: { fillStyle: "#333" },
    }
  ),

  Bodies.rectangle(
    CONFIG.CANVAS_WIDTH / 2,
    CONFIG.CANVAS_HEIGHT + wallThickness / 2,
    CONFIG.CANVAS_WIDTH,
    wallThickness,
    {
      isStatic: true,
      render: { fillStyle: "transparent", opacity: 0 },
    }
  ),
];

World.add(engine.world, walls);

function createPegGrid() {
  const pegs = [];
  const centerX = CONFIG.CANVAS_WIDTH / 2;

  for (let row = 0; row < CONFIG.PEG_ROWS; row++) {
    const y = CONFIG.PEG_START_Y + row * CONFIG.PEG_V_SPACING;

    const pegsInRow = row + 1;
    const totalWidth = (pegsInRow - 1) * CONFIG.PEG_H_SPACING;
    const startX = centerX - totalWidth / 2;

    const offset = row % 2 === 1 ? CONFIG.PEG_H_SPACING / 2 : 0;

    for (let col = 0; col < pegsInRow; col++) {
      const x = startX + col * CONFIG.PEG_H_SPACING + offset;
      const peg = Bodies.circle(x, y, CONFIG.PEG_RADIUS, {
        isStatic: true,
        render: {
          fillStyle: "#ffd700",
          strokeStyle: "#ffed4e",
          lineWidth: 2,
        },
      });
      pegs.push(peg);
    }
  }

  World.add(engine.world, pegs);
  return pegs;
}

function createSlots() {
  const centerX = CONFIG.CANVAS_WIDTH / 2;
  const totalWidth = CONFIG.NUM_SLOTS * CONFIG.SLOT_WIDTH;
  const startX = centerX - totalWidth / 2;

  slots = [];

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
        multiplier: multiplier,
        slotIndex: i,
      }
    );

    slots.push(slot);
  }

  World.add(engine.world, slots);
  renderSlotLabels();
}

function renderSlotLabels() {

}

function renderCustomSlots() {
  const ctx = slotCanvas.getContext("2d");
  ctx.clearRect(0, 0, slotCanvas.width, slotCanvas.height);

  slots.forEach((slot, i) => {
    const multiplier = CONFIG.MULTIPLIERS[i];
    const bounds = slot.bounds;

    const x = bounds.min.x;
    const y = bounds.min.y;
    const w = bounds.max.x - bounds.min.x;
    const h = bounds.max.y - bounds.min.y;

    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);

    const normalizedMultiplier = (multiplier - 0.2) / (100 - 0.2);
    const intensity = normalizedMultiplier;
    const r = Math.floor(50 + intensity * 155);
    const g = Math.floor(25 + intensity * 155);
    const b = Math.floor(50 + intensity * 155);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
    gradient.addColorStop(
      1,
      `rgba(${Math.floor(r / 2)}, ${Math.floor(g / 2)}, ${Math.floor(
        b / 2
      )}, 0.4)`
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle =
      multiplier >= 50 ? "#ffd700" : multiplier >= 5 ? "#ff6b6b" : "#4ecdc4";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${multiplier}x`, x + w / 2, y + h / 2);
  });
}

function customRenderLoop() {
  renderCustomSlots();
  requestAnimationFrame(customRenderLoop);
}

function dropBall(count = 1) {
  if (money < CONFIG.BET_AMOUNT * count) {
    updateButtons();
    return;
  }

  const dropBalls = (remaining) => {
    if (remaining <= 0) return;

    money -= CONFIG.BET_AMOUNT;
    updateMoneyDisplay();
    updateButtons();

    const centerX = CONFIG.CANVAS_WIDTH / 2;
    const randomOffset = (Math.random() - 0.5) * CONFIG.SPAWN_RANDOM_OFFSET * 2;
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

    const ballId = ball.id;
    activeBalls.set(ballId, {
      body: ball,
      bet: CONFIG.BET_AMOUNT,
      paidOut: false,
    });

    World.add(engine.world, ball);

    if (remaining > 1) {
      setTimeout(() => dropBalls(remaining - 1), 100);
    }
  };

  dropBalls(count);
}

function updateMoneyDisplay() {
  const moneyDisplay = document.getElementById("moneyDisplay");
  moneyDisplay.textContent = `$${money
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function increaseMoney() {
  money += 1000;
  updateMoneyDisplay();
  updateButtons();
}

function updateButtons() {
  const dropBallBtn = document.getElementById("dropBallBtn");
  const drop10BallsBtn = document.getElementById("drop10BallsBtn");

  const canAfford = money >= CONFIG.BET_AMOUNT;
  dropBallBtn.disabled = !canAfford;

  const canAfford10 = money >= CONFIG.BET_AMOUNT * 10;
  drop10BallsBtn.disabled = !canAfford10;
}

function handlePayout(ballId, slot) {
  const ballData = activeBalls.get(ballId);
  if (!ballData || ballData.paidOut) return;

  ballData.paidOut = true;
  const payout = ballData.bet * slot.multiplier;
  money += payout;
  updateMoneyDisplay();
  updateButtons();

  flashSlot(slot.slotIndex);

  setTimeout(() => {
    if (activeBalls.has(ballId)) {
      World.remove(engine.world, ballData.body);
      activeBalls.delete(ballId);
    }
  }, 500);
}

function flashSlot(slotIndex) {
  const slot = slots[slotIndex];
  if (!slot) return;

  const ctx = slotCanvas.getContext("2d");
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

  setTimeout(() => {
    renderCustomSlots();
  }, 200);
}

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

    if (ball && slot && activeBalls.has(ball.id)) {
      handlePayout(ball.id, slot);
    }
  });
});

document.getElementById("dropBallBtn").addEventListener("click", () => {
  dropBall(1);
});

document.getElementById("drop10BallsBtn").addEventListener("click", () => {
  dropBall(10);
});

document.getElementById("increaseMoneyBtn").addEventListener("click", () => {
  increaseMoney();
});

function init() {
  createPegGrid();
  createSlots();
  updateMoneyDisplay();
  updateButtons();

  Engine.run(engine);

  customRenderLoop();
}

window.addEventListener("load", init);
