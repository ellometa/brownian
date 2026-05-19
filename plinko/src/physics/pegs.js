import { CONFIG } from "../config.js";
import { engine } from "./engine.js";

const { Bodies, World } = Matter;

export function createPegGrid() {
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
