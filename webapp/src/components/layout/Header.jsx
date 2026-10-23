import { useTelegram } from '../../hooks/useTelegram';

export function Header({ onMenuToggle, balance }) {
  const { haptic } = useTelegram();

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-kroshi-border">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        {/* Логотип — единый градиентный вордмарк */}
        <div className="min-w-0 shrink">
          <span className="bg-gradient-to-r from-kroshi-accent to-kroshi-accent2 bg-clip-text text-transparent font-black text-xl tracking-tight whitespace-nowrap">
            KroshiCasino
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Баланс виден всегда */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-kroshi-panel2 border border-kroshi-border">
            <span className="text-kroshi-accent">🍬</span>
            <span className="font-bold text-kroshi-text tabular-nums text-sm">
              {balance.toLocaleString('ru-RU')}
            </span>
          </div>

          <button
            className="p-2 rounded-xl bg-kroshi-panel2 border border-kroshi-border text-kroshi-text hover:bg-kroshi-border transition-colors"
            aria-label="Меню"
            onClick={() => {
              haptic('light');
              onMenuToggle();
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
