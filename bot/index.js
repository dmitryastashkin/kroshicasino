/**
 * KroshiCasino — Telegram бот с WebApp казино.
 * Запуск: node bot/index.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, 'config.local.env') });
const path = require('path');
const fs = require('fs-extra');
const { TelegramBot } = require('node-telegram-bot-api');

const {
  BOT_TOKEN,
  WEBAPP_URL,
  BOT_USERNAME,
  CURRENCY_NAME,
  CURRENCY_EMOJI,
  START_BALANCE,
  DAILY_BONUS,
  REFERRAL_BONUS_INVITEE,
  REFERRAL_BONUS_REFERRER,
  MIN_BET,
  MAX_BET,
  DB_PATH,
} = require('./config');

// Администраторы (Telegram user IDs). Через код.
const ADMIN_IDS = [];

// Подключение бота (long polling — не нужен сервер с вебхуком)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ---------- База данных (JSON файл) ----------
const db = {
  users: {},
  stats: { gamesPlayed: 0, totalWagered: 0, totalWon: 0 },
};

async function loadDb() {
  try {
    await fs.ensureDir(path.dirname(DB_PATH));
    if (await fs.pathExists(DB_PATH)) {
      const raw = await fs.readFile(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      db.users = parsed.users || {};
      db.stats = parsed.stats || db.stats;
    }
  } catch (e) {
    console.error('Ошибка загрузки БД:', e.message);
  }
}

async function saveDb() {
  try {
    await fs.ensureDir(path.dirname(DB_PATH));
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Ошибка сохранения БД:', e.message);
  }
}

function ensureUser(user, referrerId = null) {
  const id = String(user.id);
  if (!db.users[id]) {
    db.users[id] = {
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      balance: START_BALANCE,
      totalWagered: 0,
      totalWon: 0,
      gamesPlayed: 0,
      referrals: [],
      referrer: referrerId || null,
      referralBonusClaimed: false,
      dailyBonusAt: 0,
      achievements: [],
      createdAt: Date.now(),
    };
    if (referrerId && String(referrerId) !== id) {
      const ref = db.users[String(referrerId)];
      if (ref) {
        ref.referrals.push(id);
      }
    }
  }
  return db.users[id];
}

function getUser(id) {
  return db.users[String(id)] || null;
}

function formatBalance(u) {
  return `${u.balance.toLocaleString()} ${CURRENCY_EMOJI}`;
}

// ---------- Клавиатуры ----------
function mainMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎰 Открыть казино', web_app: { url: WEBAPP_URL } },
        ],
        [
          { text: '💰 Баланс', callback_data: 'menu:balance' },
          { text: '👤 Профиль', callback_data: 'menu:profile' },
        ],
        [
          { text: '🎁 Ежедневный бонус', callback_data: 'menu:daily' },
          { text: '👥 Рефералы', callback_data: 'menu:referral' },
        ],
        [
          { text: '🏆 Топ игроков', callback_data: 'menu:leaderboard' },
          { text: '📜 Помощь', callback_data: 'menu:help' },
        ],
      ],
    },
  };
}

function backKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '↩️ В меню', callback_data: 'menu:main' }],
      ],
    },
  };
}

// ---------- Команды ----------
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const referrerId = match && match[1] ? match[1].replace(/^ref_/, '') : null;
  const user = ensureUser(msg.from, referrerId);
  await saveDb();

  const text =
    `🎰 <b>KroshiCasino</b> — лучшее казино прямо в Telegram!\n\n` +
    `Привет, ${msg.from.first_name || 'игрок'}!\n` +
    `Твой баланс: ${formatBalance(user)}\n\n` +
    `Выбирай игру в веб-аппе ниже или через меню:`;

  if (WEBAPP_URL.includes('YOUR_USERNAME')) {
    // Если URL не настроен — просто текстовое меню
    await bot.sendMessage(msg.chat.id, text, {
      parse_mode: 'HTML',
      ...mainMenuKeyboard(),
    });
  } else {
    await bot.sendMessage(msg.chat.id, text, {
      parse_mode: 'HTML',
      ...mainMenuKeyboard(),
    });
  }

  if (referrerId && !user.referralBonusClaimed && String(referrerId) !== String(user.id)) {
    // реферальный бонус выдастся при первом открытии веб-аппа (см. ниже)
  }
});

bot.onText(/\/balance/, async (msg) => {
  const user = ensureUser(msg.from);
  await saveDb();
  await bot.sendMessage(
    msg.chat.id,
    `💰 Твой баланс: ${formatBalance(user)}\n🎰 Сыграно игр: ${user.gamesPlayed}\n🏆 Выиграно всего: ${user.totalWon.toLocaleString()} ${CURRENCY_EMOJI}`,
    { reply_markup: { inline_keyboard: [[{ text: '🎰 Играть', web_app: { url: WEBAPP_URL } }]] } }
  );
});

bot.onText(/\/profile/, async (msg) => {
  const user = ensureUser(msg.from);
  await saveDb();
  const refCount = (user.referrals || []).length;
  const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${user.id}`;
  const ach = (user.achievements || []).length;
  await bot.sendMessage(
    msg.chat.id,
    `👤 <b>Профиль</b>\n\n` +
    `Имя: ${user.first_name || '—'}${user.last_name ? ' ' + user.last_name : ''}\n` +
    `Username: ${user.username ? '@' + user.username : '—'}\n` +
    `Баланс: ${formatBalance(user)}\n` +
    `Сыграно игр: ${user.gamesPlayed}\n` +
    `Ставок всего: ${user.totalWagered.toLocaleString()} ${CURRENCY_EMOJI}\n` +
    `Выиграно всего: ${user.totalWon.toLocaleString()} ${CURRENCY_EMOJI}\n` +
    `Рефералов: ${refCount}\n` +
    `Достижений: ${ach}\n\n` +
    `🔗 Твоя реферальная ссылка:\n<code>${refLink}</code>`,
    { parse_mode: 'HTML', ...backKeyboard() }
  );
});

bot.onText(/\/referral/, async (msg) => {
  const user = ensureUser(msg.from);
  await saveDb();
  const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${user.id}`;
  await bot.sendMessage(
    msg.chat.id,
    `👥 <b>Реферальная программа</b>\n\n` +
    `Приглашай друзей и получай ${REFERRAL_BONUS_REFERRER} ${CURRENCY_EMOJI} за каждого!\n` +
    `Твой друг получит стартовый бонус ${REFERRAL_BONUS_INVITEE} ${CURRENCY_EMOJI}.\n\n` +
    `Твоя ссылка:\n<code>${refLink}</code>\n\n` +
    `Приглашено: ${(user.referrals || []).length} человек`,
    { parse_mode: 'HTML', ...backKeyboard() }
  );
});

bot.onText(/\/daily/, async (msg) => {
  const user = ensureUser(msg.from);
  await saveDb();
  const now = Date.now();
  if (user.dailyBonusAt && now - user.dailyBonusAt < 24 * 60 * 60 * 1000) {
    const left = Math.ceil((24 * 60 * 60 * 1000 - (now - user.dailyBonusAt)) / 60000);
    await bot.sendMessage(
      msg.chat.id,
      `🎁 Ежедневный бонус уже получен. Возвращайся через ${left} мин.`,
      { ...backKeyboard() }
    );
    return;
  }
  user.balance += DAILY_BONUS;
  user.dailyBonusAt = now;
  await saveDb();
  await bot.sendMessage(
    msg.chat.id,
    `🎁 Ежедневный бонус: +${DAILY_BONUS} ${CURRENCY_EMOJI}!\nНовый баланс: ${formatBalance(user)}`,
    { ...backKeyboard() }
  );
});

bot.onText(/\/top|^\/leaderboard/, async (msg) => {
  await showLeaderboard(msg.chat.id);
});

bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `📜 <b>KroshiCasino — помощь</b>\n\n` +
    `/start — главное меню и запуск казино\n` +
    `/balance — проверить баланс\n` +
    `/profile — твой профиль и статистика\n` +
    `/referral — пригласить друга\n` +
    `/daily — ежедневный бонус\n` +
    `/top — таблица лидеров\n\n` +
    `Игры: слоты, рулетка, кости, блэкджек, краш.\n` +
    `Удачи! 🍀`,
    { parse_mode: 'HTML', ...backKeyboard() }
  );
});

// ---------- Callback queries ----------
bot.on('callback_query', async (q) => {
  const data = q.data;
  const chatId = q.message.chat.id;
  const user = ensureUser(q.from);
  await saveDb();

  if (data === 'menu:main') {
    await bot.editMessageText(
      `🎰 <b>KroshiCasino</b>\n\nБаланс: ${formatBalance(user)}\nВыбирай действие:`,
      {
        chat_id: chatId,
        message_id: q.message.message_id,
        parse_mode: 'HTML',
        ...mainMenuKeyboard(),
      }
    );
  } else if (data === 'menu:balance') {
    await bot.editMessageText(
      `💰 Твой баланс: ${formatBalance(user)}\n🎰 Сыграно игр: ${user.gamesPlayed}\n🏆 Выиграно всего: ${user.totalWon.toLocaleString()} ${CURRENCY_EMOJI}`,
      { chat_id: chatId, message_id: q.message.message_id, ...backKeyboard() }
    );
  } else if (data === 'menu:profile') {
    const refCount = (user.referrals || []).length;
    const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${user.id}`;
    await bot.editMessageText(
      `👤 <b>Профиль</b>\n\nБаланс: ${formatBalance(user)}\n` +
      `Сыграно игр: ${user.gamesPlayed}\nСтавок: ${user.totalWagered.toLocaleString()} ${CURRENCY_EMOJI}\n` +
      `Выиграно: ${user.totalWon.toLocaleString()} ${CURRENCY_EMOJI}\nРефералов: ${refCount}\n` +
      `Достижений: ${(user.achievements || []).length}\n\n` +
      `Ссылка:\n<code>${refLink}</code>`,
      { chat_id: chatId, message_id: q.message.message_id, parse_mode: 'HTML', ...backKeyboard() }
    );
  } else if (data === 'menu:daily') {
    const now = Date.now();
    if (user.dailyBonusAt && now - user.dailyBonusAt < 24 * 60 * 60 * 1000) {
      const left = Math.ceil((24 * 60 * 60 * 1000 - (now - user.dailyBonusAt)) / 60000);
      await bot.answerCallbackQuery(q.id, { text: `Бонус через ${left} мин.` });
      return;
    }
    user.balance += DAILY_BONUS;
    user.dailyBonusAt = now;
    await saveDb();
    await bot.answerCallbackQuery(q.id, { text: `+${DAILY_BONUS} ${CURRENCY_EMOJI} начислено!` });
    await bot.editMessageText(
      `🎁 Ежедневный бонус: +${DAILY_BONUS} ${CURRENCY_EMOJI}!\nНовый баланс: ${formatBalance(user)}`,
      { chat_id: chatId, message_id: q.message.message_id, ...backKeyboard() }
    );
  } else if (data === 'menu:referral') {
    const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${user.id}`;
    await bot.editMessageText(
      `👥 <b>Рефералы</b>\n\n+${REFERRAL_BONUS_REFERRER} ${CURRENCY_EMOJI} за друга.\n` +
      `Друг получает +${REFERRAL_BONUS_INVITEE} ${CURRENCY_EMOJI}.\n\n` +
      `<code>${refLink}</code>\n\nПриглашено: ${(user.referrals || []).length}`,
      { chat_id: chatId, message_id: q.message.message_id, parse_mode: 'HTML', ...backKeyboard() }
    );
  } else if (data === 'menu:leaderboard') {
    await showLeaderboard(chatId, q.message.message_id);
  } else if (data === 'menu:help') {
    await bot.editMessageText(
      `📜 /start, /balance, /profile, /referral, /daily, /top, /help\n\nИгры: слоты, рулетка, кости, блэкджек, краш.`,
      { chat_id: chatId, message_id: q.message.message_id, parse_mode: 'HTML', ...backKeyboard() }
    );
  } else if (data === 'menu:webapp') {
    await bot.answerCallbackQuery(q.id, { text: 'Открывай веб-апп!' });
  } else if (data === 'admin:stats') {
    if (!ADMIN_IDS.includes(q.from.id)) {
      await bot.answerCallbackQuery(q.id, { text: 'Нет доступа' });
      return;
    }
    const users = Object.values(db.users);
    await bot.editMessageText(
      `📊 <b>Админ-статистика</b>\n\nИгроков: ${users.length}\n` +
      `Игр: ${db.stats.gamesPlayed}\nСтавок: ${db.stats.totalWagered.toLocaleString()} ${CURRENCY_EMOJI}\n` +
      `Выигрышей: ${db.stats.totalWon.toLocaleString()} ${CURRENCY_EMOJI}`,
      { chat_id: chatId, message_id: q.message.message_id, parse_mode: 'HTML', ...backKeyboard() }
    );
  }

  await bot.answerCallbackQuery(q.id);
});

async function showLeaderboard(chatId, messageId) {
  const users = Object.values(db.users).sort((a, b) => b.balance - a.balance).slice(0, 10);
  let text = `🏆 <b>Топ игроков</b>\n\n`;
  users.forEach((u, i) => {
    text += `${i + 1}. ${u.first_name || 'Игрок'}${u.username ? ' (@' + u.username + ')' : ''} — ${formatBalance(u)}\n`;
  });
  if (!users.length) text += 'Пока никто не играл.';
  const opts = { chat_id: chatId, parse_mode: 'HTML', ...backKeyboard() };
  if (messageId) opts.message_id = messageId;
  if (messageId) await bot.editMessageText(text, opts);
  else await bot.sendMessage(chatId, text, opts);
}

// ---------- WebApp данные (от игрока) ----------
bot.on('web_app_data', async (msg) => {
  const user = ensureUser(msg.from);
  try {
    const payload = JSON.parse(msg.web_app_data.data);
    if (payload.type === 'claimReferralBonus' && payload.ref) {
      const refUser = db.users[String(payload.ref)];
      if (refUser && refUser.referrals.includes(String(user.id)) && !user.referralBonusClaimed) {
        user.referralBonusClaimed = true;
        user.balance += REFERRAL_BONUS_INVITEE;
        refUser.balance += REFERRAL_BONUS_REFERRER;
        await saveDb();
        await bot.sendMessage(
          refUser.id,
          `🎉 Твой реферал ${user.first_name || 'кто-то'} начал играть! +${REFERRAL_BONUS_REFERRER} ${CURRENCY_EMOJI}`
        );
      }
    }
  } catch (e) {
    console.error('WebApp data error:', e.message);
  }
});

loadDb().then(() => {
  console.log(`KroshiCasino бот запущен. Пользователей в БД: ${Object.keys(db.users).length}`);
  if (WEBAPP_URL.includes('YOUR_USERNAME')) {
    console.warn('ВНИМАНИЕ: Укажи реальный WEBAPP_URL в bot/config.js перед публикацией!');
  }
});

// graceful
process.on('SIGINT', () => { saveDb(); process.exit(0); });
process.on('SIGTERM', () => { saveDb(); process.exit(0); });
