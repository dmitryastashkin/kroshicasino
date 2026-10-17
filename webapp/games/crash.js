/**
 * KroshiCasino — Краш. Мультипликатор растёт; забери выигрыш до краша.
 */

let running = false;
let crashPoint = 1;
let current = 1;
let startTime = 0;
let raf = null;
let betAmt = 0;
let cashed = false;
let resolved = false;

function init() { running = false; cashed = false; resolved = false; if (raf) cancelAnimationFrame(raf); }

function render() {
  const container = document.createElement('div');
  container.className = 'crash';
  container.innerHTML = `
    <div class="crash-title">КРАШ 🚀</div>
    <div class="crash-multi" id="crashMulti">1.00×</div>
    <div class="crash-chart-wrap" id="crashChartWrap">
      <svg class="crash-chart" id="crashChart" width="100%" height="200">
        <polyline id="crashLine" fill="none" stroke="#8b5cf6" stroke-width="3" points="" />
      </svg>
    </div>
    <div class="crash-status" id="crashStatus">Нажми «Ставка», затем «Забрать» до краша</div>
  `;
  return container;
}

function controls() {
  const wrap = document.createElement('div');
  wrap.className = 'crash-controls';
  wrap.innerHTML = `
    <button class="btn btn-big" id="crashBet">Сделать ставку</button>
    <button class="btn" id="crashCash" disabled>Забрать</button>
  `;
  $('#crashBet').onclick = () => {
    const bet = betInputValue();
    if (!window.kroshi.canBet(bet)) { toast('Недостаточно 🍬', 'err'); return; }
    startRound(bet);
  };
  $('#crashCash').onclick = () => cashOut();
  return wrap;
}

function startRound(bet) {
  if (running) return;
  betAmt = bet;
  running = true; cashed = false; resolved = false;
  crashPoint = 1 + Math.random() * 3 + Math.random() * Math.random() * 6; // обычно 1.0x - 10x, редко выше
  if (Math.random() < 0.12) crashPoint = 1.0 + Math.random() * 0.3; // частый ранний краш
  current = 1; startTime = Date.now();
  $('#crashStatus').textContent = 'Раунд идёт…';
  $('#crashCash').disabled = false;
  $('#crashBet').disabled = true;
  $('#crashMulti').style.color = '#8b5cf6';
  const pts = [];
  const line = $('#crashLine');
  const wrap = $('#crashChartWrap');
  const W = wrap.clientWidth || 300;
  const H = 200;

  const loop = () => {
    if (!running || resolved) return;
    const elapsed = (Date.now() - startTime) / 1000;
    // экспоненциальный рост
    current = 1 + Math.pow(elapsed, 1.6) * 0.35;
    if (current > crashPoint) { endRound(crashPoint); return; }
    $('#crashMulti').textContent = current.toFixed(2) + '×';
    const x = (elapsed / 12) * W;
    const y = H - (Math.log(current) / Math.log(Math.max(2, crashPoint))) * H * 0.9;
    pts.push(`${x},${y}`);
    line.setAttribute('points', pts.join(' '));
    if (x > W) {
      // сдвинуть точки влево, чтобы график не уходил за край
      pts.shift();
      line.setAttribute('points', pts.map((p, i) => {
        const [px, py] = p.split(',').map(Number);
        return `${px - 40},${py}`;
      }).join(' '));
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

function cashOut() {
  if (!running || cashed || resolved) return;
  cashed = true;
  endRound(current);
}

function endRound(finalMulti) {
  resolved = true; running = false;
  if (raf) cancelAnimationFrame(raf);
  const won = cashed ? Math.floor(betAmt * finalMulti) : 0;
  const mult = cashed ? finalMulti : 0;
  if (!cashed) window.kroshi.state.crashMax = Math.max(window.kroshi.state.crashMax || 0, current);
  window.kroshi.play(betAmt, won, mult);
  setBalanceText();
  $('#crashStatus').textContent = cashed
    ? `Забрано на ${finalMulti.toFixed(2)}× — +${window.kroshi.format(won)} 🍬`
    : `Краш на ${finalMulti.toFixed(2)}×`;
  toast(cashed ? `+${window.kroshi.format(won)} 🍬` : 'Краш!');
  $('#crashBet').disabled = false;
  $('#crashCash').disabled = true;
}

window.games.crash = { title: 'Краш', init, render, controls, destroy: () => { running = false; resolved = false; if (raf) cancelAnimationFrame(raf); } };
