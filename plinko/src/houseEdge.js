// Pure math: slot probabilities under an ideal Galton board (left/right
// at each row with probability 1/2) and expected multiplier / house edge.

function logBinomial(n, k) {
  // log C(n, k) via log gamma, stable for n up to a few thousand.
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

function logGamma(x) {
  // Lanczos approximation, accurate enough for our use.
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export function binomialPmf(n) {
  // Returns array of length n+1; pmf[k] = C(n,k) / 2^n.
  const out = new Array(n + 1);
  for (let k = 0; k <= n; k++) {
    out[k] = Math.exp(logBinomial(n, k) - n * Math.log(2));
  }
  return out;
}

export function expectedMultiplier(rows, multipliers) {
  const pmf = binomialPmf(rows);
  let ev = 0;
  for (let k = 0; k <= rows; k++) ev += pmf[k] * multipliers[k];
  return ev;
}

export function houseEdge(rows, multipliers) {
  // Edge expressed so positive = house favored.
  return 1 - expectedMultiplier(rows, multipliers);
}
