/**
 * KroshiCasino — Блэкджек. Против дилера, до 21.
 */

const DECK = () => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  return suits.flatMap(s => ranks.map(r => ({ s, r })));
};
const VALUE = r => (r === 'A' ? 11 : ['J','Q','K'].includes(r) ? 10 : parseInt(r));
const handValue = cards => {
  let v = cards.reduce((s, c) => s + VALUE(c.r), 0);
  let aces = cards.filter(c => c.r === 'A').length;
  while (v > 21 && aces-- > 0) v -= 10;
  return v;
};

let inGame = false;
let deck = [];
let player = [], dealer = [];
let betAmt = 0;
let resolved = false;

function init() { inGame = false; resolved = false; deck = DECK(); player = []; dealer = []; }

function cardHtml(c) { return `<span class="card ${c.s === '♥' || c.s === '♦' ? 'red' : ''}">${c.r}${c.s}</span>`; }

function render() {
  const container = document.createElement('div');
  container.className = 'blackjack';
  container.innerHTML = `
    <div class="bj-title">БЛЭКДЖЕК ♠️</div>
    <div class="bj-table">
      <div class="bj-hand bj-dealer">
        <div class="bj-label">Дилер</div>
        <div class="bj-cards" id="bjDealerCards"></div>
        <div class="bj-value" id="bjDealerValue">?</div>
      </div>
      <div class="bj-hand bj-player">
        <div class="bj-label">Ты</div>
        <div class="bj-cards" id="bjPlayerCards"></div>
        <div class="bj-value" id="bjPlayerValue">0</div>
      </div>
    </div>
    <div class="bj-message" id="bjMsg">Сделай ставку и нажми «Раздать»</div>
  `;
  return container;
}

function controls() {
  const wrap = document.createElement('div');
  wrap.className = 'bj-controls';
  wrap.innerHTML = `
    <button class="btn btn-big" id="bjDeal">Раздать</button>
    <button class="btn" id="bjHit">Ещё карту</button>
    <button class="btn" id="bjStand">Стоп</button>
  `;
  const deal = () => {
    const bet = betInputValue();
    if (!window.kroshi.canBet(bet)) { toast('Недостаточно 🍬', 'err'); return; }
    startGame(bet);
  };
  $('#bjDeal').onclick = deal;
  $('#bjHit').onclick = () => hit();
  $('#bjStand').onclick = () => stand();
  return wrap;
}

function startGame(bet) {
  if (inGame) return;
  betAmt = bet;
  deck = DECK().sort(() => Math.random() - 0.5);
  player = [deck.pop(), deck.pop()];
  dealer = [deck.pop(), deck.pop()];
  inGame = true; resolved = false;
  setButtons(true);
  renderUI();
  $('#bjMsg').textContent = 'Игра идёт';
  if (handValue(player) === 21) {
    finish('blackjack');
  }
}

function hit() {
  if (!inGame || resolved) return;
  player.push(deck.pop());
  renderUI();
  if (handValue(player) > 21) finish('bust');
}

function stand() {
  if (!inGame || resolved) return;
  while (handValue(dealer) < 17) dealer.push(deck.pop());
  const pv = handValue(player), dv = handValue(dealer);
  let result;
  if (dv > 21) result = 'dealerBust';
  else if (dv > pv) result = 'lose';
  else if (dv < pv) result = 'win';
  else result = 'push';
  finish(result);
}

function finish(result) {
  resolved = true; inGame = false;
  let won = 0, mult = 0;
  if (result === 'blackjack') { won = Math.floor(betAmt * 2.5); mult = 2.5; }
  else if (result === 'win') { won = betAmt * 2; mult = 2; }
  else if (result === 'push') { won = betAmt; mult = 1; }
  else { won = 0; mult = 0; }
  window.kroshi.play(betAmt, won, mult);
  setBalanceText();
  const msg = {
    blackjack: 'Блэкджек! +2.5×',
    win: `Победа! +${window.kroshi.format(won)} 🍬`,
    lose: 'Проигрыш',
    push: 'Ничья — ставка возвращена',
    dealerBust: `Дилер перебрал! +${window.kroshi.format(won)} 🍬`,
    bust: 'Перебор',
  }[result];
  $('#bjMsg').textContent = msg;
  toast(msg);
  setButtons(false);
}

function renderUI() {
  $('#bjDealerCards').innerHTML = dealer.map(cardHtml).join('');
  $('#bjPlayerCards').innerHTML = player.map(cardHtml).join('');
  $('#bjPlayerValue').textContent = handValue(player);
  $('#bjDealerValue').textContent = resolved ? handValue(dealer) : '?';
}

function setButtons(playing) {
  $('#bjHit').disabled = !playing;
  $('#bjStand').disabled = !playing;
  $('#bjDeal').disabled = playing;
}

window.games.blackjack = { title: 'Блэкджек', init, render, controls, destroy: () => { inGame = false; resolved = false; } };
