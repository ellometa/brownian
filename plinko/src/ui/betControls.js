import { state, bus } from "../state.js";
import { board, setBet } from "../board.js";

export function installBetControls() {
  const input = document.getElementById("betInput");
  input.value = board.bet.toFixed(2);

  input.addEventListener("input", () => {
    const v = parseFloat(input.value);
    if (!isNaN(v)) setBet(v);
  });

  bus.on("config:changed", ({ bet }) => {
    if (document.activeElement !== input) input.value = bet.toFixed(2);
  });

  document.querySelectorAll("[data-bet-mod]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mod = btn.dataset.betMod;
      if (mod === "half") setBet(board.bet / 2);
      else if (mod === "double") setBet(board.bet * 2);
      else if (mod === "min") setBet(0.1);
      else if (mod === "max") setBet(Math.max(0.1, state.money));
    });
  });
}
