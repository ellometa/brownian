import { bus } from "../state.js";
import { board } from "../board.js";
import { random } from "../rng.js";
import { recordBatch } from "./distribution.js";

let running = false;

export function isRunning() {
  return running;
}

export function runStressTest(totalSamples, onProgress) {
  if (running) return Promise.resolve();
  running = true;
  bus.emit("stress:started", { totalSamples });

  const rows = board.rows;
  const chunkSize = Math.min(2000, Math.max(500, Math.floor(totalSamples / 20)));
  let done = 0;

  return new Promise((resolve) => {
    function step(deadline) {
      const left = totalSamples - done;
      const n = Math.min(chunkSize, left);
      const samples = new Int8Array(n);
      for (let i = 0; i < n; i++) {
        let k = 0;
        for (let r = 0; r < rows; r++) if (random() < 0.5) k += 1;
        samples[i] = k;
      }
      recordBatch(samples);
      done += n;
      onProgress?.(done, totalSamples);
      bus.emit("dist:dirty");

      if (done < totalSamples && running) {
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(step, { timeout: 50 });
        } else {
          setTimeout(step, 0);
        }
      } else {
        running = false;
        bus.emit("stress:finished", { totalSamples: done });
        resolve();
      }
    }
    step();
  });
}

export function stopStressTest() {
  if (!running) return;
  running = false;
  bus.emit("stress:stopped");
}
