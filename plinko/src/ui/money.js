import { state, bus, setMoney } from "../state.js";
import { board } from "../board.js";
import { save, debounce } from "../storage.js";

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
  dropBallBtn.disabled = state.money < board.bet;
  drop10BallsBtn.disabled = state.money < board.bet * 10;
}

const saveBankroll = debounce((v) => save("bankroll", v), 250);

bus.on("money:changed", () => {
  updateMoneyDisplay();
  updateButtons();
  saveBankroll(state.money);
});

bus.on("config:changed", updateButtons);
