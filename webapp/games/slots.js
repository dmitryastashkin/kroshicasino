/**
 * KroshiCasino — Слоты 3x5 с анимацией и линиями выплат.
 */
const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '⭐', '7️⃣', '💎'];
const PAY = {
  '🍒': { 3: 2, 4: 5, 5: 10 },
  '🍋': { 3: 3, 4: 6, 5: 12 },
  '🍇': { 3: 4, 4: 8, 5: 16 },
  '🔔': { 3: 6, 4: 12, 5: 24 },
  '⭐': { 3: 9, 4: 18, 5: 36 },
  '7️⃣': { 3: 15, 4: 30, 5: 75 },
  '💎': { 3: 25, 4: 50, 5: 125 },
};

function randSymbol() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

function generateGrid() {
  return [
    [randSymbol(), randSymbol(), randSymbol(), randSymbol(), randSymbol()],
    [randSymbol(), randSymbol(), randSymbol(), randSymbol(), randSymbol()],
    [randSymbol(), randSymbol(), randSymbol(), randSymbol(), randSymbol()],
  ];
}

// Линии: каждая — индексы строк для каждого из 5 барабанов
const LINES = [
  [1, 1, 1, 1, 1], // середина
  [0, 0, 0, 0, 0], // верх
  [2, 2, 2, 2, 2], // низ
  [0, 1, 2, 1, 0], // V
  [2, 1, 0, 1, 2], // ^
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 1, 2, 1],
];

function evaluate(grid, bet) {
  let win = 0;
  const winningLines = [];
  LINES.forEach((line, li) => {
    const sym = grid[line[0]][0];
    let len = 1;
    for (let c = 1; c < 5; c++) {
      if (grid[line[c]][c] === sym) len++; else break;
    }
    if (len >= 3 && PAY[sym] && PAY[sym][len]) {
      const p = PAY[sym][len] * bet;
      win += p;
      winningLines.push({ line: li, sym, len, pay: p });
    }
  });
  return { win, winningLines };
}

let spinning = false;

function init() { spinning = false; }

function render() {
  const container = document.createElement('div');
  container.className = 'slots';
  container.innerHTML = `
    <div class="slots-title">СЛОТЫ</div>
    <div class="slots-grid" id="slotsGrid">
      ${[0,1,2].map(r => `<div class="slots-row">${[0,1,2,3,4].map(c => `<div class="slots-cell" id="s-${r}-c-${c}">❓</div>`).join('')}</div>`).join('')}
    </div>
    <div class="slots-win" id="slotsWin"></div>
    <div class="slots-hint">Нажми «Вращать»</div>
  `;
  return container;
}

function controls() {
  const wrap = document.createElement('div');
  wrap.className = 'slots-controls';
  wrap.innerHTML = `
    <button class="btn btn-big" id="btnSpin">Вращать</button>
    <div class="slots-autoplay" style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
      <button class="btn" id="btnX2">×2</button>
      <button class="btn" id="btnX10">×10</button>
    </div>
  `;
  const spin = () => doSpin(1);
  $('#btnSpin').onclick = spin;
  $('#btnX2').onclick = () => doSpin(2);
  $('#btnX10').onclick = () => doSpin(10);
  return wrap;
}

function setupMainButton() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.MainButton.setText('Вращать');
  tg.MainButton.onClick(() => doSpin(1));
  tg.MainButton.show();
}

async function doSpin(times) {
  if (spinning) return;
  const bet = betInputValue();
  if (!window.kroshi.canBet(bet)) { toast('Недостаточно 🍬', 'err'); return; }

  const gridEl = document.getElementById('slotsGrid');
  const winEl = $('#slotsWin');
  let totalWin = 0;

  for (let t = 0; t < times; t++) {
    spinning = true;
    $('#btnSpin').disabled = true;
    $('#btnSpin').textContent = 'Крутится…';
    winEl.textContent = '';

    // Начальная сетка
    let grid = generateGrid();
    drawGrid(grid);

    // Анимация прокрутки каждого барабана
    for (let c = 0; c < 5; c++) {
      await spinColumn(c, 400 + c * 120);
    }

    // Финальная сетка
    grid = generateGrid();
    drawGrid(grid);

    const res = evaluate(grid, bet);
    totalWin += res.win;

    if (res.win > 0) {
      winEl.innerHTML = `🎉 Выигрыш: <b>${window.kroshi.format(res.win)} ${window.kroshi.CURRENCY}</b>`;
      highlightLines(res.winningLines);
      await new Promise(r => setTimeout(r, 900));
    }

    if (times === 1) {
      window.kroshi.play(bet, res.win, res.win / bet || 0);
      setBalanceText();
      if (res.win > 0) toast(`+${window.kroshi.format(res.win)} 🍬`);
      else toast('Попробуй ещё раз!');
    }
    spinning = false;
    $('#btnSpin').disabled = false;
    $('#btnSpin').textContent = 'Вращать';
  }

  if (times > 1) {
    window.kroshi.play(bet * times, totalWin, totalWin / (bet * times) || 0);
    setBalanceText();
    toast(`Итого выигрыш: ${window.kroshi.format(totalWin)} 🍬`);
  }
}

function drawGrid(grid) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = document.getElementById(`s-${r}-c-${c}`);
      cell.textContent = grid[r][c];
      cell.className = 'slots-cell';
    }
  }
}

async function spinColumn(c, duration) {
  const start = Date.now();
  const cells = [0, 1, 2].map(r => document.getElementById(`s-${r}-c-${c}`));
  return new Promise(resolve => {
    const iv = setInterval(() => {
      cells.forEach(cell => { cell.textContent = randSymbol(); });
      if (Date.now() - start >= duration) {
        clearInterval(iv);
        resolve();
      }
    }, 40);
  });
}

function highlightLines(lines) {
  lines.forEach(l => {
    l.line.forEach((r, c) => {
      const cell = document.getElementById(`s-${r}-c-${c}`);
      cell.classList.add('win');
    });
  });
  setTimeout(() => {
    $$('.slots-cell').forEach(cell => cell.classList.remove('win'));
  }, 900);
}

window.games.slots = { title: 'Слоты', init, render, controls, setupMainButton, destroy: () => { spinning = false; } };
