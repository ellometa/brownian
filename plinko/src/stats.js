import { bus } from "./state.js";

export const sessionStats = {
  drops: 0,
  wagered: 0,
  won: 0,
  wins: 0,
  biggestPayout: 0,
  biggestMultiplier: 0,
  currentStreak: 0,
  bestStreak: 0,
  recent: [], // newest first; capped at 20
};

const RECENT_MAX = 20;

function reset() {
  sessionStats.drops = 0;
  sessionStats.wagered = 0;
  sessionStats.won = 0;
  sessionStats.wins = 0;
  sessionStats.biggestPayout = 0;
  sessionStats.biggestMultiplier = 0;
  sessionStats.currentStreak = 0;
  sessionStats.bestStreak = 0;
  sessionStats.recent = [];
  bus.emit("stats:updated", sessionStats);
  bus.emit("stats:reset");
}

export function installStats() {
  bus.on("ball:settled", ({ slotIndex, multiplier, payout, bet }) => {
    sessionStats.drops += 1;
    sessionStats.wagered += bet;
    sessionStats.won += payout;

    const isWin = payout > bet;
    if (isWin) {
      sessionStats.wins += 1;
      sessionStats.currentStreak += 1;
      if (sessionStats.currentStreak > sessionStats.bestStreak) {
        sessionStats.bestStreak = sessionStats.currentStreak;
      }
    } else {
      sessionStats.currentStreak = 0;
    }

    if (payout > sessionStats.biggestPayout) {
      sessionStats.biggestPayout = payout;
      sessionStats.biggestMultiplier = multiplier;
    }

    sessionStats.recent.unshift({
      slotIndex,
      multiplier,
      payout,
      bet,
      isWin,
      at: Date.now(),
    });
    if (sessionStats.recent.length > RECENT_MAX) {
      sessionStats.recent.length = RECENT_MAX;
    }

    bus.emit("stats:updated", sessionStats);
  });

  return { reset };
}

export { reset as resetStats };
