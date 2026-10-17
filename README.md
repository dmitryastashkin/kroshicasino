# KroshiCasino 🎰

Telegram-бот с встроенным WebApp-казино (Mini App). Всё настраивается через код — конфигурация, бонусы, игры, лимиты.

## Стек

- **Бот (`bot/`)** — Node.js + `node-telegram-bot-api@^1.2.0`, long polling
- **WebApp (`webapp/`)** — React 18 + Vite + Tailwind CSS, публикуется на GitHub Pages

## Что внутри

**Бот (`bot/`)**
- `/start` — главное меню с кнопкой «Открыть казино» (WebApp)
- `/balance` — баланс и статистика
- `/profile` — профиль, реферальная ссылка, достижения
- `/referral` — пригласить друга (+100 🍬 вам, +200 🍬 другу)
- `/daily` — ежедневный бонус (+500 🍬 раз в 24 часа)
- `/top` — таблица лидеров
- `/help` — помощь
- Реферальная система, локальная JSON-БД (`bot/data/db.json`)

**WebApp (`webapp/`)** — по стандартам Telegram Mini App:
- `tg.ready()`, `tg.expand()`, `tg.themeParams` — адаптация под тему Telegram
- `tg.MainButton` — нативная кнопка действия внизу экрана
- `tg.BackButton` — навигация назад
- `tg.HapticFeedback` — тактильный отклик
- Слоты 🎰 (3×5, 10 линий), Рулетка 🎡, Кости 🎲, Блэкджек ♠️, Краш 🚀
- Ежедневный бонус, рефералы, достижения, топ, профиль
- Прогресс в `localStorage` (демо на Play-валюту)

## Быстрый старт

### 1. Создай репозиторий на GitHub
Загрузи этот код в репозиторий `kroshicasino`, ветка `main`.

### 2. Опубликуй WebApp на GitHub Pages
Включи GitHub Pages (Settings → Pages → Build and deployment → Source: **GitHub Actions**).
После первого деплоя URL веб-аппа: `https://dmitryastashkin.github.io/kroshicasino/`

### 3. Настрой бота
В `bot/config.js` уже прописан `WEBAPP_URL`. Проверь:
- `WEBAPP_URL` — ссылка на GitHub Pages
- `BOT_USERNAME` — имя бота без `@`
- Остальные константы — через код

### 4. Собери иdeploy WebApp
```bash
cd webapp
npm install
npm run build
# результат в dist/ — Actions сам задеплоит на Pages
```

### 5. Запусти бота локально
```bash
cd bot
npm install
npm start
```
Бот работает через long polling.

### 6. Настрой бота в @BotFather
- `/setcommands`:
  ```
  start - Главное меню
  balance - Баланс
  profile - Профиль
  referral - Рефералы
  daily - Ежедневный бонус
  top - Топ игроков
  help - Помощь
  ```
- `/setmenubutton` — кнопка «Открыть казино», URL = твой GitHub Pages

## Важно про токен

Токен бота указан в `bot/config.js`. **Не публикуй его в открытом доступе** — вынеси в `bot/config.local.js` (игнорируется git) или в переменные окружения.

## Демо vs реальные ставки

WebApp работает на Play-валюту в `localStorage` — выигрыши не выводятся. Для реальных денег добавь бэкенд, валидацию `initData` от Telegram и привязку к БД бота.

## Прикольные функции

- 🎰 5 игр с анимациями
- 🎁 Ежедневный бонус с таймером
- 👥 Реферальная программа с бонусами
- 🏆 8 достижений
- 📊 Топ игроков и профиль
- 🌙 Неоновый дизайн под тему Telegram
- 🚀 Краш с мультипликатором
