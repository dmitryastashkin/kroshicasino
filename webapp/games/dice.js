/**
 * KroshiCasino — Кости. Угадай: сумма больше или меньше 7.
 */

let rolling = false;

function init() { rolling = false; }

function render() {
  const container = document.createElement('div');
  container.className = 'dice';
  container.innerHTML = `
    <div class="dice-title">КОСТИ 🎲</div>
    <div class="dice-wrap" id="diceWrap">
      <div class="dice-die" id="die1">⚀</div>
      <div class="dice-die" id="die2">⚁</div>
    </div>
    <div class="dice-sum" id="diceSum">Сумма: -</div>
    <div class="dice-bets">
      <button class="bet-chip" data-bet="under">Меньше 7</button>
      <button class="bet-chip" data-bet="over">Больше 7</button>
      <button class="bet-chip bet-seven" data-bet="seven">Ровно 7 (×4)</button>
    </div>
  `;
  return container;
}

function controls() {
  const wrap = document.createElement('div');
  wrap.className = 'dice-controls';
  wrap.innerHTML = `
    <button class="btn btn-big" id="btnRoll">Бросить кости</button>
  `;
  let activeBet = null;
  const chips = [...wrap.querySelectorAll('.bet-chip')];
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeBet = chip.dataset.bet;
    });
  });
  $('#btnRoll').onclick = () => {
    const bet = betInputValue();
    if (!window.kroshi.canBet(bet)) { toast('Недостаточно 🍬', 'err'); return; }
    if (!activeBet) { toast('Выбери ставку', 'err'); return; }
    doRoll(bet, activeBet);
  };
  return wrap;
}

async function doRoll(bet, betType) {
  rolling = true;
  const btn = $('#btnRoll');
  btn.disabled = true;
  btn.textContent = 'Бросание…';
  const d1 = $('#die1'); const d2 = $('#die2');
  const sumEl = $('#diceSum');

  const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const end = Date.now() + 700;
  const iv = setInterval(() => {
    d1.textContent = faces[Math.floor(Math.random() * 6)];
    d2.textContent = faces[Math.floor(Math.random() * 6)];
  }, 60);

  await new Promise(r => setTimeout(r, 700));
  clearInterval(iv);
  const a = Math.floor(Math.random() * 6) + 1;
  const b = Math.floor(Math.random() * 6) + 1;
  d1.textContent = faces[a - 1];
  d2.textContent = faces[b - 1];
  const sum = a + b;
  sumEl.textContent = `Сумма: ${sum}`;

  let won = 0; let mult = 0;
  if (betType === 'seven') {
    if (sum === 7) { won = bet * 4; mult = 4; }
  } else if (betType === 'under') {
    if (sum < 7) { won = bet * 2; mult = 2; }
  } else if (betType === 'over') {
    if (sum > 7) { won = bet * 2; mult = 2; }
  }

  window.kroshi.play(bet, won, mult);
  setBalanceText();
  toast(won > 0 ? `+${window.kroshi.format(won)} 🍬` : 'Мимо!');
  rolling = false;
  btn.disabled = false;
  btn.textContent = 'Бросить кости';
}

window.games.dice = { title: 'Кости', init, render, controls, destroy: () => { rolling = false; } };
