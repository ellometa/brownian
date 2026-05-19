import { CONFIG } from "./config.js";

export const state = {
  money: CONFIG.INITIAL_MONEY,
  activeBalls: new Map(),
  slots: [],
};

const listeners = new Map();

export const bus = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event).delete(fn);
  },
  emit(event, payload) {
    const set = listeners.get(event);
    if (!set) return;
    for (const fn of set) fn(payload);
  },
};

export function setMoney(next) {
  const delta = next - state.money;
  state.money = next;
  bus.emit("money:changed", { money: state.money, delta });
}

export function addMoney(delta) {
  setMoney(state.money + delta);
}
