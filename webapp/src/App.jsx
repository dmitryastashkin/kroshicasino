import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { loadState, saveState, ACHIEVEMENTS, CURRENCY, DAILY_BONUS } from './state';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GamesSection } from './components/sections/Games';
import { DailySection } from './components/sections/Daily';
import { ReferralSection } from './components/sections/Referral';
import { AchievementsSection } from './components/sections/Achievements';
import { LeaderboardSection } from './components/sections/Leaderboard';
import { ProfileSection } from './components/sections/Profile';
import { SlotsGame } from './components/games/Slots';
import { RouletteGame } from './components/games/Roulette';
import { DiceGame } from './components/games/Dice';
import { BlackjackGame } from './components/games/Blackjack';
import { CrashGame } from './components/games/Crash';
import { Toast } from './components/ui/Toast';
import { useToast } from './components/ui/Toast';

const GAME_COMPONENTS = {
  slots: SlotsGame,
  roulette: RouletteGame,
  dice: DiceGame,
  blackjack: BlackjackGame,
  crash: CrashGame,
};

const GAME_KEYS = ['slots', 'roulette', 'dice', 'blackjack', 'crash'];
const GAME_LABELS = {
  slots: '🎰 Слоты',
  roulette: '🎡 Рулетка',
  dice: '🎲 Кости',
  blackjack: '♠️ Блэкджек',
  crash: '🚀 Краш',
};

function App() {
  const { tg, user, themeParams, ready, setHeaderColor, haptic } = useTelegram();
  const { toast, show } = useToast();

  const [state, setState] = useState(() => loadState());
  const [activeSection, setActiveSection] = useState('games');
  const [currentGame, setCurrentGame] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bet, setBet] = useState('10');

  const balance = state.balance;

  // Initialize Telegram WebApp
  useEffect(() => {
    ready();
    if (themeParams?.bg_color) {
      setHeaderColor(themeParams.bg_color);
      document.documentElement.style.setProperty('--tg-bg', themeParams.bg_color);
      document.documentElement.style.setProperty('--tg-text', themeParams.text_color || '#f3f4f6');
      document.documentElement.style.setProperty('--tg-button', themeParams.button_color || '#c084fc');
      document.documentElement.style.setProperty('--tg-button-text', themeParams.button_text_color || '#ffffff');
    }
    document.body.style.backgroundColor = themeParams?.bg_color || '#0a0a0f';
  }, [ready, themeParams, setHeaderColor]);

  // Persist state
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Referral bonus claim via web_app_data from bot
  useEffect(() => {
    if (tg?.initDataUnsafe?.user && state.referrer && !state.referralBonusClaimed) {
      // Referral bonus will be claimed by bot when user opens webapp; here we just note it
    }
  }, [tg, state.referrer, state.referralBonusClaimed]);

  const setStateFn = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  const addBalance = useCallback((amount) => {
    setStateFn((s) => ({ ...s, balance: s.balance + amount }));
  }, [setStateFn]);

  const playGame = useCallback((amount, won, mult) => {
    setStateFn((s) => {
      const newBalance = s.balance - amount + won;
      const newWagered = s.totalWagered + amount;
      const newWon = s.totalWon + won;
      const newGames = s.gamesPlayed + 1;
      const newStreak = won > 0 ? s.winStreak + 1 : 0;
      const newMaxMult = won > 0 ? Math.max(s.maxWinMultiplier || 0, mult) : s.maxWinMultiplier;

      const newAchievements = [...s.achievements];
      ACHIEVEMENTS.forEach((a) => {
        if (!s.achievements.includes(a.id)) {
          let earned = false;
          if (a.id === 'first_steps' && newGames >= 1) earned = true;
          if (a.id === 'big_winner' && newMaxMult >= 10) earned = true;
          if (a.id === 'high_roller' && newWagered >= 10000) earned = true;
          if (a.id === 'lucky_10' && newGames >= 10) earned = true;
          if (a.id === 'millionaire' && newBalance >= 1000000) earned = true;
          if (a.id === 'referrer' && s.referrals.length >= 1) earned = true;
          if (a.id === 'streak' && newStreak >= 5) earned = true;
          if (a.id === 'crash_king' && (s.crashMax || 0) >= 5) earned = true;
          if (earned) newAchievements.push(a.id);
        }
      });

      return {
        ...s,
        balance: newBalance,
        totalWagered: newWagered,
        totalWon: newWon,
        gamesPlayed: newGames,
        winStreak: newStreak,
        maxWinMultiplier: newMaxMult,
        achievements: newAchievements,
      };
    });
  }, [setStateFn]);

  const hapticNotification = (type) => {
    if (tg?.HapticFeedback) {
      try { tg.HapticFeedback.notificationOccurred(type); } catch (e) {}
    }
  };

  const claimDaily = useCallback(() => {
    const now = Date.now();
    if (state.dailyBonusAt && now - state.dailyBonusAt < 24 * 60 * 60 * 1000) {
      show('Бонус уже получен', 'err');
      return;
    }
    setStateFn((s) => ({
      ...s,
      balance: s.balance + DAILY_BONUS,
      dailyBonusAt: now,
    }));
    hapticNotification('success');
    show(`+${DAILY_BONUS} ${CURRENCY}!`);
  }, [state.dailyBonusAt, setStateFn, hapticNotification, show]);

  const claimReferral = useCallback(() => {
    if (!state.referrer) {
      show('Нет реферального пригласителя', 'err');
      return;
    }
    if (state.referralBonusClaimed) {
      show('Бонус уже получен', 'err');
      return;
    }
    tg.sendData(JSON.stringify({ type: 'claimReferralBonus', ref: state.referrer }));
    show('Запрос отправлен боту');
    haptic('light');
  }, [state.referrer, state.referralBonusClaimed, tg, show, haptic]);

  const resetDemo = useCallback(() => {
    if (window.confirm('Сбросить весь демо-прогресс?')) {
      setState(() => ({
        ...loadState(),
        referrer: state.referrer,
        user: state.user,
      }));
      setActiveSection('games');
      haptic('error');
      show('Прогресс сброшен');
    }
  }, [state.referrer, state.user, setActiveSection, haptic, show]);

  const openGame = useCallback((key) => {
    haptic('selection');
    setCurrentGame(key);
    setBet(String(Math.min(50, balance) || 1));
  }, [balance, haptic]);

  const backToGames = useCallback(() => {
    setCurrentGame(null);
    setActiveSection('games');
  }, [setActiveSection]);

  const setMaxBet = useCallback(() => {
    setBet(String(balance));
  }, [balance]);

  const GameComponent = currentGame ? GAME_COMPONENTS[currentGame] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Toast toast={toast} />

      <Header
        balance={balance}
        onMenuToggle={() => { haptic('light'); setSidebarOpen(!sidebarOpen); }}
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-6">
          {sidebarOpen && (
            <Sidebar
              active={activeSection}
              onSelect={(key) => {
                setCurrentGame(null);
                setActiveSection(key);
                setSidebarOpen(false);
                haptic('light');
              }}
              onClose={() => setSidebarOpen(false)}
              user={user}
              onResetDemo={resetDemo}
            />
          )}

          {currentGame ? (
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  className="flex items-center gap-2 text-sm text-kroshi-text-dim hover:text-kroshi-text"
                  onClick={backToGames}
                >
                  ← Все игры
                </button>
                <button
                  className="p-2 rounded-xl bg-kroshi-panel2 border border-kroshi-border text-kroshi-text hover:bg-kroshi-border transition-colors"
                  aria-label="Меню"
                  onClick={() => { haptic('light'); setSidebarOpen(true); }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {GAME_KEYS.map((key) => (
                  <button
                    key={key}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      currentGame === key
                        ? 'bg-kroshi-accent/20 text-kroshi-accent border border-kroshi-accent/40'
                        : 'bg-kroshi-panel2 border border-kroshi-border text-kroshi-text-dim'
                    }`}
                    onClick={() => { haptic('light'); setCurrentGame(key); }}
                  >
                    {GAME_LABELS[key]}
                  </button>
                ))}
              </div>

              <GameComponent
                balance={balance}
                onPlay={playGame}
                bet={bet}
                setBet={setBet}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {activeSection === 'games' && (
                <GamesSection balance={balance} onOpenGame={openGame} onSetMaxBet={setMaxBet} />
              )}
              {activeSection === 'daily' && (
                <DailySection
                  balance={balance}
                  onClaim={claimDaily}
                  claimedAt={state.dailyBonusAt}
                />
              )}
              {activeSection === 'referral' && (
                <ReferralSection
                  user={user}
                  referrals={state.referrals}
                  referrer={state.referrer}
                  onClaim={claimReferral}
                  onCopy={() => show('Ссылка скопирована')}
                />
              )}
              {activeSection === 'achievements' && (
                <AchievementsSection
                  achievements={state.achievements}
                  allAchievements={ACHIEVEMENTS}
                />
              )}
              {activeSection === 'leaderboard' && (
                <LeaderboardSection
                  myBalance={balance}
                  myName={user?.first_name || 'Ты'}
                />
              )}
              {activeSection === 'profile' && (
                <ProfileSection
                  user={user}
                  balance={balance}
                  stats={state.stats}
                  achievements={state.achievements}
                  allAchievements={ACHIEVEMENTS}
                  referrals={state.referrals}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
