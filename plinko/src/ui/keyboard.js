import { bus } from "../state.js";
import { dropBalls } from "../physics/ball.js";
import { board, setBet } from "../board.js";
import { mode } from "./modeToggle.js";

function isTyping(event) {
  const t = event.target;
  if (!t) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function installKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (isTyping(e)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        dropBalls(1);
        break;
      case "d":
      case "D":
        dropBalls(10);
        break;
      case "a":
      case "A":
        document.getElementById("autoToggleBtn")?.click();
        break;
      case "m":
      case "M":
        document
          .querySelector(`.mode-btn[data-mode="${mode.current === "casino" ? "science" : "casino"}"]`)
          ?.click();
        break;
      case "r":
      case "R":
        document.getElementById("resetStatsBtn")?.click();
        break;
      case "+":
      case "=":
        setBet(board.bet * 2);
        break;
      case "-":
      case "_":
        setBet(board.bet / 2);
        break;
      case "?":
      case "/":
        if (e.shiftKey || e.key === "?") {
          document.getElementById("shortcutsHelp")?.classList.toggle("hidden");
        }
        break;
      case "Escape":
        document.getElementById("shortcutsHelp")?.classList.add("hidden");
        break;
    }
  });
}
