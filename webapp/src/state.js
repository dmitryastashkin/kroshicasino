/**
 * Клиентское состояние KroshiCasino (localStorage demo-режим).
 */

const STORAGE_KEY = 'kroshi_v2';
const CURRENCY = '🍬';
const DAILY_BONUS = 500;
const REFERRAL_BONUS_INVITEE = 200;
const REFERRAL_BONUS_REFERRER = 100;
const START_BALANCE = 1000;

const initialState = {
  balance: START_BALANCE,
  totalWagered: 0,
  totalWon: 0,
  gamesPlayed: 0,
  winStreak: 0,
  maxWinMultiplier: 0,
  crashMax: 0,
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

const ACHIEVEMENTS = [
  { id: 'first_steps', emoji: '🎰', name: 'Первые шаги', desc: 'Сыграй свою первую игру' },
  { id: 'big_winner', emoji: '💎', name: 'Крупный выигрыш', desc: 'Выиграй одну ставку с множителем ×10 и выше' },
  { id: 'high_roller', emoji: '🐋', name: 'Хайроллер', desc: 'Сделай ставок на 10 000 🍬' },
  { id: 'lucky_10', emoji: '🍀', name: 'Десятка игр', desc: 'Сыграй 10 игр' },
  { id: 'millionaire', emoji: '💰', name: 'Миллионер', desc: 'Добий баланса 1 000 000 🍬' },
  { id: 'referrer', emoji: '👥', name: 'Талант-скаут', desc: 'Пригласи друга по реферальной ссылке' },
  { id: 'streak', emoji: '🔥', name: 'Серия побед', desc: 'Выиграй 5 игр подряд' },
  { id: 'crash_king', emoji: '🚀', name: 'Король краша', desc: 'Забери краш с множителем ×5 и выше' },
];

function loadState() {
  const state = { ...initialState };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
    }
  } catch (e) {
    console.error('load state', e);
  }

  // Инициализация из Telegram initData
  try {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      state.user.id = u.id;
      state.user.first_name = u.first_name || 'Игрок';
      state.user.last_name = u.last_name || '';
      state.user.username = u.username || '';
      state.user.language_code = u.language_code || 'ru';

      const params = new URLSearchParams(tg.initData || '');
      const start = params.get('start_param') || params.get('start');
      if (start && start.startsWith('ref_')) {
        const refId = start.slice(4);
        if (refId !== String(state.user.id) && !state.referrer) {
          state.referrer = refId;
        }
      }
    }
  } catch (e) {
    console.error('initData', e);
  }

  return state;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('save state', e);
  }
}

function format(n) {
  return n.toLocaleString('ru-RU');
}

export {
  STORAGE_KEY, CURRENCY, DAILY_BONUS, REFERRAL_BONUS_INVITEE,
  REFERRAL_BONUS_REFERRER, START_BALANCE, initialState, ACHIEVEMENTS,
  loadState, saveState, format,
};
