import { bus } from "../state.js";
import { board } from "../board.js";
import {
  dist,
  chiSquare,
  chiSquarePValue,
  klDivergence,
  reset as resetDistribution,
} from "../science/distribution.js";
import { ensureChart, refreshChart } from "../science/chart.js";
import { runStressTest, isRunning, stopStressTest } from "../science/stressTest.js";

function interpretation(n, p) {
  if (n < 100) return { label: "warming up", cls: "tier-loss" };
  if (p > 0.05) return { label: "consistent with binomial", cls: "tier-win" };
  return { label: "deviates", cls: "tier-jackpot" };
}

function renderStats() {
  const el = document.getElementById("scienceStats");
  if (!el) return;

  const { stat, df } = chiSquare(board.rows);
  const p = chiSquarePValue(stat, df);
  const kl = klDivergence(board.rows);
  const inter = interpretation(dist.total, p);

  el.innerHTML = `
    <div class="stat-rows">
      <div class="stat-row"><span>Samples (n)</span><span class="mono">${dist.total.toLocaleString()}</span></div>
      <div class="stat-row"><span>Chi-square</span><span class="mono">${stat.toFixed(2)} (df ${df})</span></div>
      <div class="stat-row"><span>p-value</span><span class="mono">${p < 0.001 ? p.toExponential(2) : p.toFixed(3)}</span></div>
      <div class="stat-row"><span>KL divergence</span><span class="mono">${kl.toFixed(4)} nats</span></div>
      <div class="stat-row sep"><span>Fit</span><span class="mono ${inter.cls}" style="padding: 2px 6px; border-radius: 4px;">${inter.label}</span></div>
    </div>
  `;
}

function renderProgress(done, total) {
  const bar = document.getElementById("stressProgress");
  if (!bar) return;
  const pct = total > 0 ? (done / total) * 100 : 0;
  bar.style.width = `${pct}%`;
  const label = document.getElementById("stressLabel");
  if (label) label.textContent = total > 0 ? `${done.toLocaleString()} / ${total.toLocaleString()}` : "";
}

function wireStressButton() {
  const btn = document.getElementById("runStressBtn");
  const reset = document.getElementById("resetDistBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (isRunning()) {
      stopStressTest();
      btn.textContent = "Run 10,000 (fast)";
      return;
    }
    btn.textContent = "Stop";
    document.getElementById("stressNote")?.classList.add("active");
    await runStressTest(10000, renderProgress);
    btn.textContent = "Run 10,000 (fast)";
    document.getElementById("stressNote")?.classList.remove("active");
  });

  reset?.addEventListener("click", () => {
    resetDistribution();
    renderProgress(0, 0);
  });
}

export function installSciencePanel() {
  wireStressButton();
  renderStats();
  bus.on("dist:updated", renderStats);
  bus.on("config:changed", renderStats);
  bus.on("board:rebuilt", () => {
    if (document.getElementById("scienceSidebar")?.classList.contains("hidden")) return;
    ensureChart();
    refreshChart();
    renderStats();
  });
  bus.on("mode:changed", ({ mode }) => {
    if (mode === "science") {
      ensureChart();
      refreshChart();
      renderStats();
    }
  });
}
