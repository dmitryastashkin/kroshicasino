/**
 * KroshiCasino — конфигурация (всё настраивается через код)
 * Скопируйте этот файл в bot/config.local.js и правьте там, не меняя этот файл.
 */

// Токен бота от @BotFather (задан через код по запросу пользователя)
const BOT_TOKEN = '8212506692:AAFUcXU330SGkVNuvSkqhaCcRgrXPoh-4iE';

// URL веб-аппа на GitHub Pages (замените на свой после первой публикации)
const WEBAPP_URL = 'https://github.com/dmitryastashkin/kroshicasino/';

// Имя бота (без @), для deep-link'ов
const BOT_USERNAME = 'KroshiCasinoBot';

// Валюта казино
const CURRENCY_NAME = 'Кроши';
const CURRENCY_EMOJI = '🍬';

// Стартовый баланс новых игроков
const START_BALANCE = 1000;

// Ежедневный бонус
const DAILY_BONUS = 500;

// Реферальный бонус (кому и пригласившему)
const REFERRAL_BONUS_INVITEE = 200;
const REFERRAL_BONUS_REFERRER = 100;

// Лимиты ставок
const MIN_BET = 1;
const MAX_BET = 100000;

// Путь к файлу базы данных (JSON)
const DB_PATH = './data/db.json';

module.exports = {
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
};
