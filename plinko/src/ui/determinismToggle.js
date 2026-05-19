import { bus } from "../state.js";
import { load, save } from "../storage.js";
import { setDeterminismActive, isDeterminismActive } from "../physics/ball.js";

const STORAGE_KEY = "determinism";

function syncUi() {
  const banner = document.getElementById("determinismBanner");
  if (banner) banner.classList.toggle("hidden", !isDeterminismActive());
  document.querySelectorAll(".determinism-btn").forEach((b) => {
    const on = b.dataset.det === "on";
    b.classList.toggle("active", on === isDeterminismActive());
  });
}

export function installDeterminismToggle() {
  const saved = load(STORAGE_KEY, false);
  setDeterminismActive(saved);
  syncUi();

  document.querySelectorAll(".determinism-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const on = btn.dataset.det === "on";
      setDeterminismActive(on);
      save(STORAGE_KEY, on);
      syncUi();
      bus.emit("determinism:changed", { active: on });
    });
  });
}
