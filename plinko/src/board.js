import { CONFIG } from "./config.js";
import { MULTIPLIERS } from "./multipliers.js";
import { state, bus } from "./state.js";
import { engine } from "./physics/engine.js";
import { createPegGrid, clearPegs } from "./physics/pegs.js";
import { createSlots, clearSlots } from "./physics/slots.js";
import { load, save, debounce } from "./storage.js";

const { World } = Matter;

export const board = {
  rows: load("rows", 12),
  risk: load("risk", "medium"),
  bet: load("bet", 10),
};

export function getMultipliers() {
  return MULTIPLIERS[board.risk][board.rows];
}

export function getGeometry() {
  // Slot count = rows + 1 (one outer lane on each side of the last peg row,
  // plus rows - 1 lanes between adjacent bottom pegs). Peg horizontal spacing
  // equals slot width so peg columns align with slot dividers.
  const margin = 10;
  const usable = CONFIG.CANVAS_WIDTH - margin * 2;
  const slotCount = board.rows + 1;
  const slotWidth = Math.min(80, usable / slotCount);
  const hSpacing = slotWidth;

  const verticalBudget = CONFIG.SLOT_Y - CONFIG.PEG_START_Y - CONFIG.SLOT_HEIGHT;
  const vSpacing = Math.max(32, verticalBudget / Math.max(board.rows - 1, 1));

  return { hSpacing, vSpacing, slotWidth, slotCount };
}

export function rebuildBoard() {
  // Drop in-flight balls so nothing is left orphaned mid-physics.
  for (const data of state.activeBalls.values()) {
    World.remove(engine.world, data.body);
  }
  state.activeBalls.clear();

  clearPegs();
  clearSlots();
  createPegGrid();
  createSlots();

  bus.emit("board:rebuilt", { rows: board.rows, risk: board.risk });
}

const saveBet = debounce((v) => save("bet", v), 200);
const saveRows = debounce((v) => save("rows", v), 200);
const saveRisk = debounce((v) => save("risk", v), 200);

export function setBet(v) {
  v = Math.max(0.1, Math.round(v * 100) / 100);
  if (v === board.bet) return;
  board.bet = v;
  saveBet(v);
  bus.emit("config:changed", { ...board });
}

export function setRows(v) {
  v = Math.max(8, Math.min(16, Math.round(v)));
  if (v === board.rows) return;
  board.rows = v;
  saveRows(v);
  rebuildBoard();
  bus.emit("config:changed", { ...board });
}

export function setRisk(v) {
  if (!["low", "medium", "high"].includes(v)) return;
  if (v === board.risk) return;
  board.risk = v;
  saveRisk(v);
  rebuildBoard();
  bus.emit("config:changed", { ...board });
}
