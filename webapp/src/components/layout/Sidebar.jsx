import { useEffect } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { Button } from '../ui/Button';

const NAV_ITEMS = [
  { key: 'games', label: 'Игры', emoji: '🎰' },
  { key: 'daily', label: 'Бонус', emoji: '🎁' },
  { key: 'referral', label: 'Рефералы', emoji: '👥' },
  { key: 'achievements', label: 'Достижения', emoji: '🏆' },
  { key: 'leaderboard', label: 'Топ', emoji: '📊' },
  { key: 'profile', label: 'Профиль', emoji: '👤' },
];

export function Sidebar({ active, onSelect, onClose, user, onResetDemo }) {
  const { hideBackButton, haptic } = useTelegram();

  useEffect(() => {
    hideBackButton();
  }, [hideBackButton]);

  return (
    <>
      <div
        className="fixed inset-0 z-[49] bg-black/60 backdrop-blur-sm"
        onClick={() => { haptic('light'); onClose(); }}
      />
      <aside className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-kroshi-panel border-r border-kroshi-border z-[50] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-kroshi-border">
          <div className="font-black text-2xl tracking-tighter bg-gradient-to-r from-kroshi-accent to-kroshi-accent2 bg-clip-text text-transparent">
            KroshiCasino
          </div>
          <button
            className="p-2 rounded-xl bg-kroshi-panel2 border border-kroshi-border text-kroshi-text hover:bg-kroshi-border"
            onClick={(e) => { e.stopPropagation(); haptic('light'); onClose(); }}
            aria-label="Закрыть меню"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={
              'flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-left text-base font-semibold transition-colors' +
              (active === item.key
                ? ' bg-kroshi-accent/20 text-kroshi-accent border border-kroshi-accent/40 shadow-neon-sm'
                : ' text-kroshi-text-dim hover:bg-kroshi-panel2 hover:text-kroshi-text')
            }
            onClick={(e) => {
              e.stopPropagation();
              haptic('light');
              onSelect(item.key);
            }}
          >
            <span className="text-xl">{item.emoji}</span>
            {item.label}
          </button>
        ))}

        <div className="mt-6 pt-4 border-t border-kroshi-border">
          <Button
            variant="danger"
            className="w-full"
            onClick={(e) => { e.stopPropagation(); haptic('error'); onResetDemo(); }}
          >
            🗑 Сбросить демо
          </Button>
        </div>
      </nav>

      <div className="p-4 border-t border-kroshi-border">
        <div className="text-xs text-kroshi-text-dim">Клиентская игра (demo)</div>
        <div className="text-xs text-kroshi-text">{user?.first_name || 'Игрок'}</div>
      </div>
      </aside>
    </>
  );
}
