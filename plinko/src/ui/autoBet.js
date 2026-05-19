import { state, bus } from "../state.js";
import { board } from "../board.js";
import { spawnBall } from "../physics/ball.js";

let running = false;
let timer = null;
let remaining = 0;

export function installAutoBet() {
  const toggleBtn = document.getElementById("autoToggleBtn");
  const countInput = document.getElementById("autoCount");
  const intervalInput = document.getElementById("autoInterval");
  const dropBtn = document.getElementById("dropBallBtn");
  const drop10Btn = document.getElementById("drop10BallsBtn");

  function refreshLabel() {
    toggleBtn.textContent = running
      ? `Stop (${remaining} left)`
      : "Start Auto";
    toggleBtn.classList.toggle("auto-active", running);
    dropBtn.disabled = running || state.money < board.bet;
    drop10Btn.disabled = running || state.money < board.bet * 10;
    countInput.disabled = running;
    intervalInput.disabled = running;
  }

  function stop() {
    if (!running) return;
    running = false;
    clearInterval(timer);
    timer = null;
    remaining = 0;
    bus.emit("auto:stopped");
    refreshLabel();
  }

  function start() {
    if (running) return;
    const total = Math.max(1, Math.min(500, parseInt(countInput.value, 10) || 1));
    const interval = Math.max(120, Math.min(500, parseInt(intervalInput.value, 10) || 120));
    if (state.money < board.bet) return;

    running = true;
    remaining = total;
    bus.emit("auto:started", { count: total, interval });
    refreshLabel();

    timer = setInterval(() => {
      if (!running) return;
      if (state.money < board.bet || remaining <= 0) {
        stop();
        return;
      }
      const id = spawnBall();
      if (id === null) {
        stop();
        return;
      }
      remaining -= 1;
      refreshLabel();
      if (remaining <= 0) stop();
    }, interval);
  }

  toggleBtn.addEventListener("click", () => {
    if (running) stop();
    else start();
  });

  bus.on("money:changed", refreshLabel);
  bus.on("config:changed", refreshLabel);
  refreshLabel();
}
