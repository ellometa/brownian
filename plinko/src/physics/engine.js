import { CONFIG } from "../config.js";

const { Engine, Render, Runner, World, Bodies } = Matter;

export const engine = Engine.create();
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
    background: "#1a1a2e",
    pixelRatio: window.devicePixelRatio || 1,
  },
});

export { canvas as gameCanvas, slotCanvas };

const wallThickness = 50;
const walls = [
  Bodies.rectangle(
    -wallThickness / 2,
    CONFIG.CANVAS_HEIGHT / 2,
    wallThickness,
    CONFIG.CANVAS_HEIGHT,
    { isStatic: true, render: { fillStyle: "#333" } }
  ),
  Bodies.rectangle(
    CONFIG.CANVAS_WIDTH + wallThickness / 2,
    CONFIG.CANVAS_HEIGHT / 2,
    wallThickness,
    CONFIG.CANVAS_HEIGHT,
    { isStatic: true, render: { fillStyle: "#333" } }
  ),
  Bodies.rectangle(
    CONFIG.CANVAS_WIDTH / 2,
    CONFIG.CANVAS_HEIGHT + wallThickness / 2,
    CONFIG.CANVAS_WIDTH,
    wallThickness,
    { isStatic: true, render: { fillStyle: "transparent", opacity: 0 } }
  ),
];

World.add(engine.world, walls);

const runner = Runner.create();

export function startEngine() {
  Render.run(render);
  Runner.run(runner, engine);
}
