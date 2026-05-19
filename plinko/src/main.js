import { startEngine } from "./physics/engine.js";
import { createPegGrid } from "./physics/pegs.js";
import { createSlots, installCollisionHandler } from "./physics/slots.js";
import { startSlotsOverlay } from "./ui/slotsOverlay.js";
import { installControls } from "./ui/controls.js";
import { updateMoneyDisplay, updateButtons } from "./ui/money.js";
import { bus } from "./state.js";

function init() {
  createPegGrid();
  createSlots();
  installCollisionHandler();
  installControls();
  startSlotsOverlay();

  updateMoneyDisplay();
  updateButtons();

  startEngine();

  // expose bus for ad-hoc debugging
  window.plinkoBus = bus;
}

window.addEventListener("load", init);
