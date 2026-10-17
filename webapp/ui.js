/**
 * KroshiCasino — общий UI.
 */

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor(tg.themeParams.bg_color || '#0b0c10');
  document.body.style.backgroundColor = tg.themeParams.bg_color || '#0b0c10';
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function toast(text, type = 'ok') {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.className = 'toast ' + (type === 'err' ? 'err' : 'ok') + ' show';
  setTimeout(() => el.classList.remove('show'), 2000);
}

function setBalanceText() {
  const bal = $('#balanceView');
  if (bal) bal.textContent = `${window.kroshi.CURRENCY} ${window.kroshi.format(window.kroshi.state.balance)}`;
  const v = $('#gameBalanceVal');
  if (v) v.textContent = window.kroshi.format(window.kroshi.state.balance);
}

function showSection(id) {
  $$('.section').forEach(s => s.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  const sec = $(`#section-${id}`);
  const nav = $(`.nav-item[data-section="${id}"]`);
  if (sec) sec.classList.add('active');
  if (nav) nav.classList.add('active');
  if (id === 'leaderboard') renderLeaderboard();
  if (id === 'achievements') renderAchievements();
  if (id === 'referral') renderReferral();
  if (id === 'daily') renderDaily();
  if (id === 'profile') renderProfile();
}

function openGame(key) {
  const g = games[key];
  if (!g) return;
  window.kroshi.state.__lastGame = key;
  window.kroshi.save();
  $$('.section').forEach(s => s.classList.remove('active'));
  $(`#section-game`).classList.add('active');
  $('#gameTitle').textContent = g.title;
  $('#betInput').value = Math.min(50, window.kroshi.state.balance) || 1;
  $('#gameControls').classList.add('hidden');
  g.init ? g.init() : null;
  renderGame();
}

function backToGames() {
  $$('.section').forEach(s => s.classList.remove('active'));
  $('#section-games').classList.add('active');
  $('#gameControls').classList.add('hidden');
  const cur = games[currentGameKey()];
  if (cur && cur.destroy) cur.destroy();
}

function currentGameKey() { return window.kroshi.state.__lastGame; }

function renderGame() {
  const key = currentGameKey();
  const g = games[key];
  if (!g) return;
  $('#gameView').innerHTML = '';
  const view = g.render();
  if (view) $('#gameView').appendChild(view);
  $('#gameControls').innerHTML = '';
  if (g.controls) {
    $('#gameControls').appendChild(g.controls());
    $('#gameControls').classList.remove('hidden');
  }
  setBalanceText();
}

function betInputValue() {
  return parseInt($('#betInput').value, 10) || 1;
}

function setMaxBet() {
  $('#betInput').value = window.kroshi.state.balance;
}

// ---------- Ежедневный бонус ----------
function renderDaily() {
  const s = window.kroshi.state;
  const card = $('#dailyCard');
  const btn = $('#btnDaily');
  const timer = $('#dailyTimer');
  const now = Date.now();
  const ready = !s.dailyBonusAt || now - s.dailyBonusAt >= 24 * 60 * 60 * 1000;

  $('#dailyAmount').textContent = `+${window.kroshi.format(DAILY_BONUS)} ${window.kroshi.CURRENCY}`;

  if (ready) {
    btn.disabled = false;
    btn.textContent = 'Забрать бонус';
    timer.textContent = 'Бонус готов к получению';
    btn.onclick = () => {
      const r = window.kroshi.claimDaily();
      if (r.ok) {
        toast(`+${r.amount} ${window.kroshi.CURRENCY} на cuenta!`);
        setBalanceText();
        renderDaily();
      } else {
        renderDaily();
      }
    };
  } else {
    btn.disabled = true;
    btn.textContent = 'Уже получено';
    const left = Math.ceil((24 * 60 * 60 * 1000 - (now - s.dailyBonusAt)) / 60000);
    timer.textContent = `Следующий бонус через ${left} мин.`;
    const iv = setInterval(() => {
      const n2 = Date.now();
      if (!s.dailyBonusAt || n2 - s.dailyBonusAt >= 24 * 60 * 60 * 1000) { clearInterval(iv); renderDaily(); return; }
      const l2 = Math.ceil((24 * 60 * 60 * 1000 - (n2 - s.dailyBonusAt)) / 60000);
      timer.textContent = `Следующий бонус через ${l2} мин.`;
    }, 1000);
  }
}

// ---------- Рефералы ----------
function renderReferral() {
  const s = window.kroshi.state;
  $('#refLink').value = window.kroshi.getReferralLink('KroshiCasinoBot');
  $('#refCount').textContent = s.referrals.length;
  $('#btnCopy').onclick = () => {
    navigator.clipboard.writeText($('#refLink').value).then(() => toast('Ссылка скопирована'));
  };
  $('#btnClaimRef').onclick = () => {
    if (!tg) { toast('Открой через Telegram', 'err'); return; }
    tg.sendData(JSON.stringify({ type: 'claimReferralBonus', ref: s.referrer }));
    toast('Запрос отправлен боту');
  };
  if (!s.referrer) {
    $('#btnClaimRef').style.display = 'none';
    $('#refCount').textContent = 'Укажи реферального пригласителя при /start в боте';
  }
}

// ---------- Достижения ----------
function renderAchievements() {
  const grid = $('#achGrid');
  grid.innerHTML = '';
  window.kroshi.getAchievements().forEach(a => {
    const el = document.createElement('div');
    el.className = `ach-item ${a.earned ? '' : 'locked'}`;
    el.innerHTML = `
      <div class="ach-emoji">${a.emoji}</div>
      <div class="ach-info">
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>
    `;
    grid.appendChild(el);
  });
}

// ---------- Топ ----------
function renderLeaderboard() {
  const lb = $('#leaderboard');
  // Локальный демо-топ: поддельные игроки + текущий пользователь для зрелища
  const me = window.kroshi.state;
  const fake = [
    { name: 'Виктория', bal: 45200 },
    { name: 'Артур', bal: 31800 },
    { name: 'Sonya', bal: 28400 },
    { name: 'Макс', bal: 19100 },
    { name: 'Kroshi', bal: 12300 },
  ];
  const entries = fake.map((e, i) => ({ name: e.name, bal: e.bal, me: false, rank: i + 1 }));
  const meRank = entries.findIndex(e => e.bal <= me.balance) === -1 ? entries.length + 1 : entries.findIndex(e => e.bal <= me.balance) + 1;
  entries.push({ name: me.user.first_name || 'Ты', bal: me.balance, me: true, rank: meRank });
  entries.sort((a, b) => b.bal - a.bal);
  entries.forEach((e, i) => { e.rank = i + 1; });

  lb.innerHTML = entries.slice(0, 8).map(e => `
    <div class="lb-row ${e.me ? 'me' : ''}">
      <div class="lb-rank">#${e.rank}</div>
      <div class="lb-name">${e.name}</div>
      <div class="lb-value">${window.kroshi.format(e.bal)} ${window.kroshi.CURRENCY}</div>
    </div>
  `).join('');
}

// ---------- Профиль ----------
function renderProfile() {
  const s = window.kroshi.state;
  const card = $('#profileCard');
  const name = s.user.first_name || 'Игрок';
  card.innerHTML = `
    <div class="profile-avatar">🎰</div>
    <div class="profile-name">${name}</div>
    <div class="profile-username">${s.user.username ? '@' + s.user.username : 'нет username'}</div>
    <div class="profile-row"><span>Баланс</span><span class="val">${window.kroshi.format(s.balance)} ${window.kroshi.CURRENCY}</span></div>
    <div class="profile-row"><span>Игр сыграно</span><span class="val">${s.gamesPlayed}</span></div>
    <div class="profile-row"><span>Всего ставок</span><span class="val">${window.kroshi.format(s.totalWagered)} ${window.kroshi.CURRENCY}</span></div>
    <div class="profile-row"><span>Всего выигрыша</span><span class="val">${window.kroshi.format(s.totalWon)} ${window.kroshi.CURRENCY}</span></div>
    <div class="profile-row"><span>Достижений</span><span class="val">${s.achievements.length} / ${window.kroshi.ACHIEVEMENTS.length}</span></div>
    <div class="profile-row"><span>Рефералов</span><span class="val">${s.referrals.length}</span></div>
  `;
}

function openWebAppInTelegram() {
  // заглушка: внутри Telegram веб-апп уже открыт
}

// Игры зарегистрируются здесь
const games = {};

window.app = {
  openGame, backToGames, setMaxBet, renderGame, setBalanceText,
  showSection, renderDaily, renderReferral, renderAchievements,
  renderLeaderboard, renderProfile,
};

$$('.nav-item').forEach(n => {
  n.addEventListener('click', () => {
    if (n.dataset.section) showSection(n.dataset.section);
  });
});
$('#btnMenu').addEventListener('click', () => { $('#sidebar').classList.add('open'); });
$('#closeSidebar').addEventListener('click', () => { $('#sidebar').classList.remove('open'); });
$('#btnReset').addEventListener('click', () => {
  if (confirm('Сбросить весь демо-прогресс?')) {
    window.kroshi.resetDemo();
    setBalanceText();
    showSection('games');
    toast('Прогресс сброшен');
  }
});
// init balance on load
setBalanceText();
