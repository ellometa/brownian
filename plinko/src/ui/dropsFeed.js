import { bus } from "../state.js";
import { sessionStats } from "../stats.js";

function tier(multiplier) {
  if (multiplier >= 10) return "tier-jackpot";
  if (multiplier > 1) return "tier-win";
  return "tier-loss";
}

function fmtPayout(n) {
  return `+$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function render() {
  const feed = document.getElementById("dropsFeed");
  if (!feed) return;

  const items = sessionStats.recent
    .map(
      (d) =>
        `<li class="${tier(d.multiplier)}">
          <span class="mono">${fmtPayout(d.payout)}</span>
          <span class="mono mult">${d.multiplier}×</span>
        </li>`
    )
    .join("");

  feed.innerHTML = `
    <h3>Recent Drops</h3>
    <ul class="drops-list">${items || '<li class="empty">No drops yet</li>'}</ul>
  `;
}

export function installDropsFeed() {
  render();
  bus.on("stats:updated", render);
  bus.on("stats:reset", render);
}
