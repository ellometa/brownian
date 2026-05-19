import { CONFIG } from "./config.js";
import { startEngine } from "./physics/engine.js";
import { createPegGrid } from "./physics/pegs.js";
import { createSlots, installCollisionHandler } from "./physics/slots.js";
import { startSlotsOverlay } from "./ui/slotsOverlay.js";
import { installControls } from "./ui/controls.js";
import { installBetControls } from "./ui/betControls.js";
import { installBoardControls } from "./ui/boardControls.js";
import { installAutoBet } from "./ui/autoBet.js";
import { installStatsPanel } from "./ui/statsPanel.js";
import { installDropsFeed } from "./ui/dropsFeed.js";
import { installModeToggle } from "./ui/modeToggle.js";
import { installSciencePanel } from "./ui/sciencePanel.js";
import { installStats } from "./stats.js";
import { installDistribution } from "./science/distribution.js";
import { installChartBindings } from "./science/chart.js";
import { installTrails } from "./viz/trails.js";
import { installHeatmap } from "./viz/heatmap.js";
import { installReplay } from "./viz/replay.js";
import { installAudio } from "./audio.js";
import { installKeyboard } from "./ui/keyboard.js";
import { installDeterminismToggle } from "./ui/determinismToggle.js";
import { updateMoneyDisplay, updateButtons } from "./ui/money.js";
import { bus, setMoney } from "./state.js";
import { load } from "./storage.js";

function init() {
  // Restore bankroll before any UI renders so it shows the persisted value.
  const savedMoney = load("bankroll", CONFIG.INITIAL_MONEY);
  setMoney(savedMoney);

  createPegGrid();
  createSlots();
  installCollisionHandler();
  installStats();
  installControls();
  installBetControls();
  installBoardControls();
  installAutoBet();
  installStatsPanel();
  installDropsFeed();
  installDistribution();
  installChartBindings();
  installSciencePanel();
  installTrails();
  installHeatmap();
  installReplay();
  installAudio();
  installKeyboard();
  installDeterminismToggle();
  installModeToggle();
  startSlotsOverlay();

  updateMoneyDisplay();
  updateButtons();

  startEngine();

  window.plinkoBus = bus;
  // Expose for ad-hoc DevTools inspection.
  import("./physics/engine.js").then((m) => {
    window.plinkoEngine = m.engine;
  });
}

window.addEventListener("load", init);
