/**
 * KroshiCasino — Европейская рулетка (0-36).
 */

const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function colorOf(n) {
  if (n === 0) return 'green';
  return RED.has(n) ? 'red' : 'black';
}

let spinning = false;
let activeBet = null;

function init() { spinning = false; activeBet = null; }

function render() {
  const container = document.createElement('div');
  container.className = 'roulette';
  container.innerHTML = `
    <div class="roulette-title">РУЛЕТКА</div>
    <div class="roulette-wheel-wrap">
      <div class="roulette-wheel" id="rouletteWheel">?</div>
      <div class="roulette-pointer">▼</div>
    </div>
    <div class="roulette-result" id="rouletteResult">Ставь и крути</div>
    <div class="roulette-bets">
      <button class="bet-chip bet-red" data-bet="color:red">Красное</button>
      <button class="bet-chip bet-black" data-bet="color:black">Чёрное</button>
      <button class="bet-chip" data-bet="even">Чёт</button>
      <button class="bet-chip" data-bet="odd">Нечёт</button>
      <button class="bet-chip bet-zero" data-bet="zero">0</button>
    </div>
    <div class="roulette-hint">Выбери ставку, затем нажми «Вращать»</div>
  `;
  return container;
}

function controls() {
  const wrap = document.createElement('div');
  wrap.className = 'roulette-controls';
  wrap.innerHTML = `
    <div style="display:flex;gap:8px;">
      <button class="btn btn-big" id="btnSpinR">Вращать</button>
      <button class="btn" id="btnClear">Очистить</button>
    </div>
  `;
  const chips = [...document.querySelectorAll('.bet-chip')];
  const setChip = (chip) => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeBet = chip.dataset.bet;
  };
  chips.forEach(chip => {
    chip.addEventListener('click', () => setChip(chip));
  });

  $('#btnClear').onclick = () => {
    chips.forEach(c => c.classList.remove('active'));
    activeBet = null;
    $('#rouletteResult').textContent = 'Ставь и крути';
  };

  $('#btnSpinR').onclick = () => {
    const bet = betInputValue();
    if (!window.kroshi.canBet(bet)) { toast('Недостаточно 🍬', 'err'); return; }
    if (!activeBet) { toast('Выбери ставку', 'err'); return; }
    doSpin(bet, activeBet);
  };

  return wrap;
}

function setupMainButton() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.MainButton.setText('Вращать');
  tg.MainButton.onClick(() => {
    const bet = betInputValue();
    if (!window.kroshi.canBet(bet)) { toast('Недостаточно 🍬', 'err'); return; }
    if (!activeBet) { toast('Выбери ставку', 'err'); return; }
    doSpin(bet, activeBet);
  });
  tg.MainButton.show();
}

async function doSpin(bet, betType) {
  spinning = true;
  $('#btnSpinR').disabled = true;
  $('#btnSpinR').textContent = 'Крутится…';
  const wheel = $('#rouletteWheel');
  const result = $('#rouletteResult');

  const deg = 1440 + Math.floor(Math.random() * 360);
  wheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  wheel.style.transform = `rotate(${deg}deg)`;

  await new Promise(r => setTimeout(r, 4100));
  wheel.style.transition = 'none';

  const totalDeg = deg % 360;
  // Число на колесе: верхняя точка соответствует индексу. Ради convenience mapping:
  const index = Math.floor(((360 - totalDeg + 90) % 360) / 360 * 37);
  const num = NUMBERS[index % 37];

  const col = colorOf(num);
  result.textContent = `Выпало: ${num} (${col})`;
  result.className = 'roulette-result result-show ' + col;

  let won = 0;
  let mult = 0;
  const [kind, val] = betType.split(':');
  if (kind === 'zero') {
    if (num === 0) { won = bet * 35; mult = 35; }
  } else if (kind === 'color') {
    if (col === val) { won = bet * 2; mult = 2; }
  } else if (kind === 'even') {
    if (num !== 0 && num % 2 === 0) { won = bet * 2; mult = 2; }
  } else if (kind === 'odd') {
    if (num % 2 === 1) { won = bet * 2; mult = 2; }
  }

  window.kroshi.play(bet, won, mult);
  setBalanceText();
  toast(won > 0 ? `+${window.kroshi.format(won)} 🍬` : 'Мимо!');
  spinning = false;
  $('#btnSpinR').disabled = false;
  $('#btnSpinR').textContent = 'Вращать';
}

window.games.roulette = { title: 'Рулетка', init, render, controls, setupMainButton, destroy: () => { spinning = false; activeBet = null; } };
