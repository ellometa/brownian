import { bus } from "../state.js";
import { sessionStats, resetStats } from "../stats.js";
import { board, getMultipliers } from "../board.js";
import { houseEdge } from "../houseEdge.js";

function fmtMoney(n) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function fmtPercent(n) {
  return `${(n * 100).toFixed(2)}%`;
}

function netClass(net) {
  if (net > 0) return "stat-pos";
  if (net < 0) return "stat-neg";
  return "";
}

function renderStats() {
  const card = document.getElementById("statsCard");
  if (!card) return;

  const s = sessionStats;
  const net = s.won - s.wagered;
  const roi = s.wagered > 0 ? net / s.wagered : 0;
  const winRate = s.drops > 0 ? s.wins / s.drops : 0;

  const edge = houseEdge(board.rows, getMultipliers());
  const edgeClass = edge > 0 ? "stat-neg" : edge < 0 ? "stat-pos" : "";

  card.innerHTML = `
    <h3>Session Stats</h3>
    <div class="stat-rows">
      <div class="stat-row"><span>Drops</span><span class="mono">${s.drops}</span></div>
      <div class="stat-row"><span>Wagered</span><span class="mono">${fmtMoney(s.wagered)}</span></div>
      <div class="stat-row"><span>Won</span><span class="mono">${fmtMoney(s.won)}</span></div>
      <div class="stat-row"><span>Net</span><span class="mono ${netClass(net)}">${fmtMoney(net)}</span></div>
      <div class="stat-row"><span>ROI</span><span class="mono ${netClass(net)}">${fmtPercent(roi)}</span></div>
      <div class="stat-row"><span>Win rate</span><span class="mono">${fmtPercent(winRate)}</span></div>
      <div class="stat-row"><span>Biggest hit</span><span class="mono">${
        s.biggestPayout > 0 ? `${fmtMoney(s.biggestPayout)} (${s.biggestMultiplier}×)` : "—"
      }</span></div>
      <div class="stat-row"><span>Best streak</span><span class="mono">${s.bestStreak}</span></div>
      <div class="stat-row sep"><span>House edge</span><span class="mono ${edgeClass}">${fmtPercent(edge)}</span></div>
    </div>
    <button id="resetStatsBtn" class="reset-stats-btn">Reset Stats</button>
  `;

  document
    .getElementById("resetStatsBtn")
    .addEventListener("click", resetStats);
}

export function installStatsPanel() {
  renderStats();
  bus.on("stats:updated", renderStats);
  bus.on("config:changed", renderStats);
  bus.on("board:rebuilt", renderStats);
}
