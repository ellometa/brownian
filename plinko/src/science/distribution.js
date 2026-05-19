import { bus } from "../state.js";
import { board } from "../board.js";
import { binomialPmf } from "../houseEdge.js";

export const dist = {
  counts: new Int32Array(0),
  total: 0,
  rows: 0,
};

function resize(rows) {
  dist.rows = rows;
  dist.counts = new Int32Array(rows + 1);
  dist.total = 0;
}

export function reset() {
  resize(board.rows);
  bus.emit("dist:updated", dist);
}

export function recordLanding(slotIndex) {
  if (dist.rows !== board.rows) resize(board.rows);
  if (slotIndex < 0 || slotIndex > dist.rows) return;
  dist.counts[slotIndex] += 1;
  dist.total += 1;
}

export function recordBatch(slotIndexArray) {
  if (dist.rows !== board.rows) resize(board.rows);
  for (let i = 0; i < slotIndexArray.length; i++) {
    const k = slotIndexArray[i];
    if (k >= 0 && k <= dist.rows) {
      dist.counts[k] += 1;
      dist.total += 1;
    }
  }
}

export function empiricalProbabilities() {
  const out = new Float64Array(dist.counts.length);
  if (dist.total === 0) return out;
  for (let i = 0; i < dist.counts.length; i++) {
    out[i] = dist.counts[i] / dist.total;
  }
  return out;
}

export function chiSquare(rows) {
  // Pearson chi-square vs uniform binomial; counts under 5 are pooled with
  // their neighbors to keep the asymptotic chi-square approximation valid.
  if (dist.total === 0 || rows < 1) return { stat: 0, df: 0 };
  const pmf = binomialPmf(rows);
  const expected = pmf.map((p) => p * dist.total);
  // Pool low-expected bins from the edges inward.
  const exp = [...expected];
  const obs = Array.from(dist.counts);
  while (exp.length > 1 && exp[0] < 5) {
    exp[1] += exp[0];
    obs[1] += obs[0];
    exp.shift();
    obs.shift();
  }
  while (exp.length > 1 && exp[exp.length - 1] < 5) {
    exp[exp.length - 2] += exp[exp.length - 1];
    obs[exp.length - 2] += obs[exp.length - 1];
    exp.pop();
    obs.pop();
  }
  let stat = 0;
  for (let i = 0; i < exp.length; i++) {
    const d = obs[i] - exp[i];
    stat += (d * d) / exp[i];
  }
  return { stat, df: Math.max(1, exp.length - 1) };
}

export function klDivergence(rows) {
  // KL(empirical || binomial) in nats. Skips bins with zero empirical mass.
  if (dist.total === 0) return 0;
  const pmf = binomialPmf(rows);
  let kl = 0;
  for (let i = 0; i < dist.counts.length; i++) {
    const p = dist.counts[i] / dist.total;
    const q = pmf[i];
    if (p > 0 && q > 0) kl += p * Math.log(p / q);
  }
  return kl;
}

export function chiSquarePValue(stat, df) {
  // Upper-tail p-value via Wilson-Hilferty cube-root approximation.
  if (df <= 0 || stat <= 0) return 1;
  const z =
    (Math.cbrt(stat / df) - (1 - 2 / (9 * df))) /
    Math.sqrt(2 / (9 * df));
  return 1 - normalCdf(z);
}

function normalCdf(z) {
  // Abramowitz & Stegun 7.1.26 approximation.
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y =
    1 -
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

export function normalApproximation(rows) {
  // Discrete sampling of the matched normal at each integer k, normalized
  // to sum to 1 so it overlays the binomial cleanly.
  const mu = rows / 2;
  const sigma = Math.sqrt(rows / 4);
  const out = new Array(rows + 1);
  let s = 0;
  for (let k = 0; k <= rows; k++) {
    const v = Math.exp(-((k - mu) ** 2) / (2 * sigma * sigma));
    out[k] = v;
    s += v;
  }
  for (let k = 0; k <= rows; k++) out[k] /= s;
  return out;
}

export function installDistribution() {
  // Reset whenever the geometry changes.
  bus.on("board:rebuilt", reset);

  // Listen to physics-mode landings only; stress test pushes directly.
  bus.on("ball:settled", ({ slotIndex }) => {
    recordLanding(slotIndex);
  });

  // Throttled re-render notification.
  let scheduled = false;
  bus.on("dist:dirty", () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      bus.emit("dist:updated", dist);
    }, 100);
  });

  // Treat every settle as dirtying the distribution.
  bus.on("ball:settled", () => bus.emit("dist:dirty"));

  reset();
}
