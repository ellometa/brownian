import { bus } from "./state.js";
import { load, save, debounce } from "./storage.js";

let ctx = null;
let master = null;
let volume = load("volume", 0.3);
let muted = load("muted", false);
let lastPegPing = 0;
const PEG_PING_THROTTLE_MS = 30;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : volume;
  master.connect(ctx.destination);
  return ctx;
}

function resumeIfNeeded() {
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function tone({ freq, duration, type = "triangle", vol = 0.5, when = 0 }) {
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function pegPing() {
  if (!ensureContext()) return;
  resumeIfNeeded();
  const now = performance.now();
  if (now - lastPegPing < PEG_PING_THROTTLE_MS) return;
  lastPegPing = now;
  tone({
    freq: 600 + Math.random() * 600,
    duration: 0.05,
    type: "triangle",
    vol: 0.18,
  });
}

function slotLand(multiplier) {
  if (!ensureContext()) return;
  resumeIfNeeded();
  if (multiplier >= 50) {
    tone({ freq: 523, duration: 0.18, type: "sine", vol: 0.5 });
    tone({ freq: 659, duration: 0.18, type: "sine", vol: 0.5, when: 0.13 });
    tone({ freq: 784, duration: 0.28, type: "sine", vol: 0.55, when: 0.26 });
    return;
  }
  // Map multiplier (~0.1 to 50) to frequency (200 to 900).
  const t = Math.min(1, Math.log10(multiplier + 1) / Math.log10(51));
  const freq = 200 + t * 700;
  tone({ freq, duration: 0.18, type: "sine", vol: 0.35 });
}

function syncUi() {
  const volEl = document.getElementById("volumeSlider");
  const muteEl = document.getElementById("muteBtn");
  if (volEl) volEl.value = String(Math.round(volume * 100));
  if (muteEl) {
    muteEl.textContent = muted ? "Unmute" : "Mute";
    muteEl.classList.toggle("toggle-on", !muted);
  }
}

const saveVolume = debounce(() => save("volume", volume), 200);
const saveMuted = debounce(() => save("muted", muted), 100);

function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (master) master.gain.value = muted ? 0 : volume;
  saveVolume();
  syncUi();
}

function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : volume;
  saveMuted();
  syncUi();
}

export function installAudio() {
  // Defer AudioContext creation until a user gesture (browsers block
  // autoplay otherwise). Any click on the page is enough.
  const unlock = () => {
    ensureContext();
    resumeIfNeeded();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);

  bus.on("physics:collision", ({ kind }) => {
    if (kind === "peg") pegPing();
  });

  bus.on("ball:settled", ({ multiplier }) => {
    slotLand(multiplier);
  });

  document.getElementById("volumeSlider")?.addEventListener("input", (e) => {
    setVolume(parseInt(e.target.value, 10) / 100);
  });
  document.getElementById("muteBtn")?.addEventListener("click", toggleMute);

  syncUi();
}

export const audio = { setVolume, toggleMute };
