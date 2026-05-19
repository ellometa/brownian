import { CONFIG } from "../config.js";
import { engine } from "./engine.js";
import { board, getGeometry } from "../board.js";

const { Bodies, World } = Matter;

let pegBodies = [];

export function createPegGrid() {
  const { hSpacing, vSpacing } = getGeometry();
  const centerX = CONFIG.CANVAS_WIDTH / 2;
  pegBodies = [];

  // board.rows = number of decision rows. Top row has 1 peg, bottom row
  // has board.rows pegs. board.rows pegs create board.rows + 1 slot lanes
  // (one between each adjacent pair + the two outer lanes).
  for (let row = 0; row < board.rows; row++) {
    const y = CONFIG.PEG_START_Y + row * vSpacing;
    const pegsInRow = row + 1;
    const totalWidth = (pegsInRow - 1) * hSpacing;
    const startX = centerX - totalWidth / 2;

    for (let col = 0; col < pegsInRow; col++) {
      const x = startX + col * hSpacing;
      const peg = Bodies.circle(x, y, CONFIG.PEG_RADIUS, {
        isStatic: true,
        label: "peg",
        render: {
          fillStyle: "#ffd700",
          strokeStyle: "#ffed4e",
          lineWidth: 2,
        },
      });
      pegBodies.push(peg);
    }
  }

  World.add(engine.world, pegBodies);
  return pegBodies;
}

export function clearPegs() {
  if (pegBodies.length) {
    World.remove(engine.world, pegBodies);
    pegBodies = [];
  }
}
