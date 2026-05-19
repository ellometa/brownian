import { bus } from "../state.js";
import { load, save } from "../storage.js";

export const mode = {
  current: load("mode", "casino"),
};

function applyMode() {
  const casinoSidebar = document.getElementById("casinoSidebar");
  const scienceSidebar = document.getElementById("scienceSidebar");
  const isScience = mode.current === "science";
  casinoSidebar.classList.toggle("hidden", isScience);
  scienceSidebar.classList.toggle("hidden", !isScience);

  document.querySelectorAll(".mode-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode.current);
  });
}

export function installModeToggle() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mode === mode.current) return;
      mode.current = btn.dataset.mode;
      save("mode", mode.current);
      applyMode();
      bus.emit("mode:changed", { mode: mode.current });
    });
  });
  applyMode();
  // Fire once on init so panels can populate.
  bus.emit("mode:changed", { mode: mode.current });
}
