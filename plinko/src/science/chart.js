import { bus } from "../state.js";
import { board } from "../board.js";
import {
  dist,
  empiricalProbabilities,
  normalApproximation,
} from "./distribution.js";
import { binomialPmf } from "../houseEdge.js";

let chart = null;

function buildData() {
  const rows = board.rows;
  const labels = Array.from({ length: rows + 1 }, (_, i) => String(i));
  const pmf = binomialPmf(rows);
  const normal = normalApproximation(rows);
  const empirical =
    dist.total > 0 ? Array.from(empiricalProbabilities()) : new Array(rows + 1).fill(0);

  return {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Empirical",
        data: empirical,
        backgroundColor: "rgba(78, 205, 196, 0.6)",
        borderColor: "rgba(78, 205, 196, 1)",
        borderWidth: 1,
      },
      {
        type: "line",
        label: "Binomial",
        data: pmf,
        borderColor: "rgba(255, 215, 0, 0.9)",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 2,
        tension: 0,
      },
      {
        type: "line",
        label: "Normal",
        data: normal,
        borderColor: "rgba(255, 107, 107, 0.7)",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      labels: { color: "rgba(255, 255, 255, 0.85)", font: { size: 11 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y * 100).toFixed(2)}%`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "rgba(255, 255, 255, 0.7)" },
      grid: { color: "rgba(255, 255, 255, 0.05)" },
      title: { display: true, text: "Slot", color: "rgba(255,255,255,0.5)" },
    },
    y: {
      ticks: {
        color: "rgba(255, 255, 255, 0.7)",
        callback: (v) => `${(v * 100).toFixed(0)}%`,
      },
      grid: { color: "rgba(255, 255, 255, 0.05)" },
      title: { display: true, text: "Probability", color: "rgba(255,255,255,0.5)" },
      beginAtZero: true,
    },
  },
};

export function ensureChart() {
  if (chart) return chart;
  const canvas = document.getElementById("distChart");
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: buildData(),
    options: baseOptions,
  });
  return chart;
}

export function refreshChart() {
  if (!chart) return;
  chart.data = buildData();
  chart.update("none");
}

export function destroyChart() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}

export function installChartBindings() {
  bus.on("dist:updated", refreshChart);
  bus.on("board:rebuilt", () => {
    destroyChart();
    // The science panel will request the chart again when it re-renders.
    bus.emit("dist:updated", dist);
  });
}
