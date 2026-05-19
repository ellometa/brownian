import { CONFIG } from "../config.js";

const { Engine, Render, Runner, World } = Matter;

export const engine = Engine.create({
  positionIterations: 10,
  velocityIterations: 8,
});
engine.world.gravity.y = CONFIG.GRAVITY_Y;

const canvas = document.getElementById("gameCanvas");
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

const slotCanvas = document.getElementById("slotCanvas");
slotCanvas.width = CONFIG.CANVAS_WIDTH;
slotCanvas.height = CONFIG.CANVAS_HEIGHT;

export const render = Render.create({
  canvas,
  engine,
  options: {
    width: CONFIG.CANVAS_WIDTH,
    height: CONFIG.CANVAS_HEIGHT,
    wireframes: false,
    background: "transparent",
    pixelRatio: window.devicePixelRatio || 1,
  },
});

export { canvas as gameCanvas, slotCanvas };

// No reflective side walls — anything that drifts past the play area is
// removed by the out-of-bounds sweeper in ball.js. Keep only a hidden
// floor catch so balls don't fall forever through gaps between slots.
const floor = Matter.Bodies.rectangle(
  CONFIG.CANVAS_WIDTH / 2,
  CONFIG.CANVAS_HEIGHT + 25,
  CONFIG.CANVAS_WIDTH * 2,
  50,
  { isStatic: true, render: { visible: false }, label: "floor" }
);
World.add(engine.world, floor);

const runner = Runner.create();

export function startEngine() {
  Render.run(render);
  Runner.run(runner, engine);
}
