/**
 * KroshiCasino — общий UI.
 * Стандарты Telegram Mini App (skill: telegram-mini-app):
 *   tg.ready(), tg.expand(), tg.themeParams, tg.MainButton,
 *   tg.BackButton, tg.HapticFeedback.
 */

const tg = window.Telegram?.WebApp;

// --- Инициализация WebApp (обязательно по стандарту TWA) ---
if (tg) {
  tg.ready();
  tg.expand();
  // Темная тема под цвет приложения
  const bg = tg.themeParams?.bg_color || '#0b0c10';
  const text = tg.themeParams?.text_color || '#e5e7eb';
  const button = tg.themeParams?.button_color || '#8b5cf6';
  const buttonText = tg.themeParams?.button_text_color || '#ffffff';
  document.body.style.backgroundColor = bg;
  document.documentElement.style.setProperty('--tg-bg', bg);
  document.documentElement.style.setProperty('--tg-text', text);
  document.documentElement.style.setProperty('--tg-button', button);
  document.documentElement.style.setProperty('--tg-button-text', buttonText);
}

// --- Haptic feedback helper ---
function haptic(type = 'light') {
  if (tg?.HapticFeedback) {
    try { tg.HapticFeedback.impactOccurred(type); } catch (e) {}
  }
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
  haptic(type === 'err' ? 'error' : 'success');
  setTimeout(() => el.classList.remove('show'), 2000);
}

function setBalanceText() {
  const k = window.kroshi;
  const bal = $('#balanceView');
  if (bal) bal.textContent = `${k.CURRENCY} ${k.format(k.state.balance)}`;
  const v = $('#gameBalanceVal');
  if (v) v.textContent = k.format(k.state.balance);
}

// --- Telegram MainButton (нативная кнопка внизу экрана) ---
function showMainButton(text, onClick) {
  if (!tg) return;
  tg.MainButton.setText(text);
  tg.MainButton.onClick(onClick);
  tg.MainButton.show();
}
function hideMainButton() {
  if (!tg) return;
  tg.MainButton.hide();
  tg.MainButton.offClick();
}
function setMainButtonLoading(loading) {
  if (!tg) return;
  if (loading) { tg.MainButton.showProgress(); tg.MainButton.disable(); }
  else { tg.MainButton.hideProgress(); tg.MainButton.enable(); }
}

// --- Telegram BackButton ---
function showBackButton(onClick) {
  if (!tg) return;
  tg.BackButton.show();
  tg.BackButton.onClick(onClick);
}
function hideBackButton() {
  if (!tg) return;
  tg.BackButton.hide();
  tg.BackButton.offClick();
}

// --- Секции ---
function showSection(id) {
  $$('.section').forEach(s => s.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  hideMainButton();
  hideBackButton();

  const sec = $(`#section-${id}`);
  const nav = $(`.nav-item[data-section="${id}"]`);
  if (sec) sec.classList.add('active');
  if (nav) nav.classList.add('active');

  // Настройка MainButton под секцию
  if (id === 'games') {
    // на главной — без MainButton
  } else if (id === 'daily') {
    showMainButton('Забрать бонус', () => {
      const r = window.kroshi.claimDaily();
      if (r.ok) {
        toast(`+${r.amount} ${window.kroshi.CURRENCY}!`);
        setBalanceText();
        renderDaily();
      } else {
        toast('Бонус уже получен', 'err');
        renderDaily();
      }
    });
  } else if (id === 'referral') {
    // копирование ссылки
  } else if (id === 'profile') {
    showMainButton('Открыть в Telegram', () => {
      if (tg) tg.openTelegramLink(tg.platform ? '' : '');
    });
  } else if (id.startsWith('game-') || id === 'game') {
    // игра — MainButton управляется самой игрой
  }

  if (id === 'leaderboard') renderLeaderboard();
  if (id === 'achievements') renderAchievements();
  if (id === 'referral') renderReferral();
  if (id === 'daily') renderDaily();
  if (id === 'profile') renderProfile();
}

function openGame(key) {
  const g = window.games[key];
  if (!g) return;
  window.kroshi.state.__lastGame = key;
  window.kroshi.save();

  $$('.section').forEach(s => s.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  const sec = $('#section-game');
  if (sec) sec.classList.add('active');

  $('#gameTitle').textContent = g.title;
  $('#betInput').value = Math.min(50, window.kroshi.state.balance) || 1;
  $('#gameControls').classList.add('hidden');

  if (g.init) g.init();
  renderGame();

  // MainButton для игр = «Сделать ставку / Забрать» управляется игрой сама
  if (g.setupMainButton) {
    g.setupMainButton();
  } else {
    hideMainButton();
  }

  showBackButton(() => backToGames());
  haptic('selection');
}

function backToGames() {
  $$('.section').forEach(s => s.classList.remove('active'));
  $('#section-games').classList.add('active');
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = $('.nav-item[data-section="games"]');
  if (nav) nav.classList.add('active');
  hideMainButton();
  hideBackButton();
  const cur = window.games[window.kroshi.state.__lastGame];
  if (cur && cur.destroy) cur.destroy();
  setBalanceText();
}

function currentGameKey() { return window.kroshi.state.__lastGame; }

function renderGame() {
  const key = currentGameKey();
  const g = window.games[key];
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
  const btn = $('#btnDaily');
  const timer = $('#dailyTimer');
  const now = Date.now();
  const ready = !s.dailyBonusAt || now - s.dailyBonusAt >= 24 * 60 * 60 * 1000;

  $('#dailyAmount').textContent = `+${window.kroshi.format(window.kroshi.DAILY_BONUS)} ${window.kroshi.CURRENCY}`;

  if (ready) {
    btn.disabled = false;
    btn.textContent = 'Забрать бонус';
    timer.textContent = 'Бонус готов к получению';
    btn.onclick = () => {
      const r = window.kroshi.claimDaily();
      if (r.ok) {
        toast(`+${r.amount} ${window.kroshi.CURRENCY}!`);
        setBalanceText();
        renderDaily();
      } else {
        renderDaily();
      }
    };
    haptic('success');
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
  const refLinkEl = $('#refLink');
  if (refLinkEl) refLinkEl.value = window.kroshi.getReferralLink('KroshiCasinoBot');
  const countEl = $('#refCount');
  if (countEl) countEl.textContent = s.referrals.length;

  const btnCopy = $('#btnCopy');
  if (btnCopy) {
    btnCopy.onclick = () => {
      navigator.clipboard.writeText(refLinkEl.value).then(() => toast('Ссылка скопирована'));
      haptic('light');
    };
  }

  const btnClaim = $('#btnClaimRef');
  if (btnClaim) {
    btnClaim.onclick = () => {
      if (!tg) { toast('Открой через Telegram', 'err'); return; }
      tg.sendData(JSON.stringify({ type: 'claimReferralBonus', ref: s.referrer }));
      toast('Запрос отправлен боту');
      haptic('light');
    };
    if (!s.referrer) btnClaim.style.display = 'none';
  }
}

// ---------- Достижения ----------
function renderAchievements() {
  const grid = $('#achGrid');
  if (!grid) return;
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
  if (!lb) return;
  const me = window.kroshi.state;
  const fake = [
    { name: 'Виктория', bal: 45200 },
    { name: 'Артур', bal: 31800 },
    { name: 'Sonya', bal: 28400 },
    { name: 'Макс', bal: 19100 },
    { name: 'Kroshi', bal: 12300 },
  ];
  const entries = fake.map((e, i) => ({ name: e.name, bal: e.bal, me: false, rank: i + 1 }));
  entries.push({ name: me.user.first_name || 'Ты', bal: me.balance, me: true, rank: 0 });
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
  if (!card) return;
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
  // внутри Telegram веб-апп уже открыт
}

// Игры регистрируются здесь
window.games = window.games || {};

window.app = {
  openGame, backToGames, setMaxBet, renderGame, setBalanceText,
  showSection, renderDaily, renderReferral, renderAchievements,
  renderLeaderboard, renderProfile, showMainButton, hideMainButton,
  showBackButton, hideBackButton,
};

// --- События ---
$$('.nav-item').forEach(n => {
  n.addEventListener('click', () => {
    if (n.dataset.section) {
      haptic('light');
      showSection(n.dataset.section);
    }
  });
});

const btnMenu = $('#btnMenu');
const sidebar = $('#sidebar');
const closeSidebar = $('#closeSidebar');
const sidebarOverlay = $('#sidebarOverlay');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('visible');
  haptic('light');
}
function closeSidebarFn() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
}

if (btnMenu) btnMenu.addEventListener('click', openSidebar);
if (closeSidebar) closeSidebar.addEventListener('click', closeSidebarFn);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebarFn);

// Кнопка сброса демо
const btnReset = $('#btnReset');
if (btnReset) {
  btnReset.addEventListener('click', () => {
    if (confirm('Сбросить весь демо-прогресс?')) {
      window.kroshi.resetDemo();
      setBalanceText();
      showSection('games');
      toast('Прогресс сброшен');
      haptic('error');
    }
  });
}

// Инициализация баланса при загрузке
setBalanceText();
showSection('games');
