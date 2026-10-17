/**
 * KroshiCasino — клиентское состояние (локальное хранилище).
 * Это демо-режим на play-валюту. Для реальных ставок добавь бэкенд (см. server/ и README).
 */

const STORAGE_KEY = 'kroshi_v1';
const CURRENCY = '🍬';

const START_BALANCE = 1000;
const DAILY_BONUS = 500;
const REFERRAL_BONUS_INVITEE = 200;
const REFERRAL_BONUS_REFERRER = 100;

const state = {
  balance: START_BALANCE,
  totalWagered: 0,
  totalWon: 0,
  gamesPlayed: 0,
  referrals: [],
  referrer: null,
  referralBonusClaimed: false,
  dailyBonusAt: 0,
  achievements: [],
  stats: { slots: 0, roulette: 0, dice: 0, blackjack: 0, crash: 0 },
  user: {
    id: 0, first_name: 'Игрок', last_name: '', username: '', language_code: 'ru',
  },
};

// Достижения
const ACHIEVEMENTS = [
  { id: 'first_steps', emoji: '🎰', name: 'Первые шаги', desc: 'Сыграй первую игру', check: s => s.gamesPlayed >= 1 },
  { id: 'big_winner', emoji: '💎', name: 'Крупный выигрыш', desc: 'Выиграй одну ставку ×10 и выше', check: s => s.maxWinMultiplier >= 10 },
  { id: 'high_roller', emoji: '🐋', name: 'Хайроллер', desc: 'Сделай ставок на 10 000 🍬', check: s => s.totalWagered >= 10000 },
  { id: 'lucky_10', emoji: '🍀', name: 'Десятка игр', desc: 'Сыграй 10 игр', check: s => s.gamesPlayed >= 10 },
  { id: 'millionaire', emoji: '💰', name: 'Миллионер', desc: 'Добий баланса 1 000 000 🍬', check: s => s.balance >= 1000000 },
  { id: 'referrer', emoji: '👥', name: 'Талант-скаут', desc: 'Пригласи друга по реферальной ссылке', check: s => s.referrals.length >= 1 },
  { id: 'streak', emoji: '🔥', name: 'Серия побед', desc: 'Выиграй 5 игр подряд', check: s => s.winStreak >= 5 },
  { id: 'crash_king', emoji: '🚀', name: 'Король краша', desc: 'Забери краш с множителем ×5 и выше', check: s => s.crashMax >= 5 },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) { console.error('load state', e); }
  // initData из Telegram (имя, язык)
  try {
    const init = window.Telegram?.WebApp?.initDataUnsafe;
    if (init?.user) {
      state.user.id = init.user.id;
      state.user.first_name = init.user.first_name || 'Игрок';
      state.user.last_name = init.user.last_name || '';
      state.user.username = init.user.username || '';
      state.user.language_code = init.user.language_code || 'ru';
      // реферальный параметр start=ref_123
      const params = new URLSearchParams(window.Telegram.WebApp.initData || '');
      const start = params.get('start_param') || params.get('start');
      if (start && start.startsWith('ref_')) {
        const refId = start.slice(4);
        if (refId !== String(state.user.id) && !state.referrer) {
          state.referrer = refId;
        }
      }
    }
  } catch (e) { console.error('initData', e); }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.error('save state', e); }
}

function getBalance() { return state.balance; }
function setBalance(v) { state.balance = Math.max(0, Math.floor(v)); save(); }

function addBalance(v) { setBalance(state.balance + v); }

function canBet(amount) {
  return amount >= 1 && amount <= state.balance;
}

function play(amount, won, multiplier) {
  state.gamesPlayed += 1;
  state.totalWagered += amount;
  if (won > 0) {
    state.totalWon += won;
    state.winStreak = (state.winStreak || 0) + 1;
    state.maxWinMultiplier = Math.max(state.maxWinMultiplier || 0, multiplier);
  } else {
    state.winStreak = 0;
  }
  state.balance = state.balance - amount + won;
  save();
  checkAchievements();
  return state.balance;
}

function claimDaily() {
  const now = Date.now();
  if (state.dailyBonusAt && now - state.dailyBonusAt < 24 * 60 * 60 * 1000) {
    const left = Math.ceil((24 * 60 * 60 * 1000 - (now - state.dailyBonusAt)) / 60000);
    return { ok: false, left };
  }
  state.dailyBonusAt = now;
  addBalance(DAILY_BONUS);
  checkAchievements();
  return { ok: true, amount: DAILY_BONUS };
}

function checkAchievements() {
  const earned = [];
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id);
      earned.push(a);
    }
  });
  if (earned.length) save();
  return earned;
}

function resetDemo() {
  Object.assign(state, {
    balance: START_BALANCE, totalWagered: 0, totalWon: 0, gamesPlayed: 0,
    referrals: [], referrer: null, referralBonusClaimed: false,
    dailyBonusAt: 0, achievements: [], stats: { slots: 0, roulette: 0, dice: 0, blackjack: 0, crash: 0 },
    winStreak: 0, maxWinMultiplier: 0, crashMax: 0,
  });
  save();
  return state;
}

function getAchievements() {
  return ACHIEVEMENTS.map(a => ({ ...a, earned: state.achievements.includes(a.id) }));
}

function addReferral(id) {
  if (!state.referrals.includes(id)) state.referrals.push(id);
  save();
}

function getReferralLink(botUsername) {
  return `https://t.me/${botUsername || 'KroshiCasinoBot'}?start=ref_${state.user.id}`;
}

function format(n) { return n.toLocaleString('ru-RU'); }

window.kroshi = {
  state, load, save, getBalance, setBalance, addBalance, canBet, play,
  claimDaily, getAchievements, resetDemo, addReferral, getReferralLink,
  ACHIEVEMENTS, CURRENCY, format,
};

load();
