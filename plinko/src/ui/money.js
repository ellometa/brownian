import { CONFIG } from "../config.js";
import { state, bus } from "../state.js";

const moneyDisplay = document.getElementById("moneyDisplay");
const dropBallBtn = document.getElementById("dropBallBtn");
const drop10BallsBtn = document.getElementById("drop10BallsBtn");

function format(n) {
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function updateMoneyDisplay() {
  moneyDisplay.textContent = format(state.money);
}

export function updateButtons() {
  dropBallBtn.disabled = state.money < CONFIG.BET_AMOUNT;
  drop10BallsBtn.disabled = state.money < CONFIG.BET_AMOUNT * 10;
}

bus.on("money:changed", () => {
  updateMoneyDisplay();
  updateButtons();
});
