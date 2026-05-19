import { dropBalls } from "../physics/ball.js";
import { addMoney } from "../state.js";

export function installControls() {
  document.getElementById("dropBallBtn").addEventListener("click", () => {
    dropBalls(1);
  });

  document.getElementById("drop10BallsBtn").addEventListener("click", () => {
    dropBalls(10);
  });

  document.getElementById("increaseMoneyBtn").addEventListener("click", () => {
    addMoney(1000);
  });
}
