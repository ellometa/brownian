import { bus } from "../state.js";
import { board, setRows, setRisk } from "../board.js";

export function installBoardControls() {
  const rowsSlider = document.getElementById("rowsSlider");
  const rowsValue = document.getElementById("rowsValue");

  rowsSlider.value = String(board.rows);
  rowsValue.textContent = String(board.rows);

  rowsSlider.addEventListener("input", () => {
    rowsValue.textContent = rowsSlider.value;
  });
  rowsSlider.addEventListener("change", () => {
    setRows(parseInt(rowsSlider.value, 10));
  });

  const riskButtons = document.querySelectorAll(".risk-btn");
  function refreshRiskButtons() {
    riskButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.risk === board.risk);
    });
  }
  refreshRiskButtons();

  riskButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setRisk(btn.dataset.risk);
    });
  });

  bus.on("config:changed", () => {
    rowsSlider.value = String(board.rows);
    rowsValue.textContent = String(board.rows);
    refreshRiskButtons();
  });
}
