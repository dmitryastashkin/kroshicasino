import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useTelegram } from '../../hooks/useTelegram';

export function Header({ onMenuToggle, balance }) {
  const { tg, haptic } = useTelegram();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const gradientText = (
    <span className="bg-gradient-to-r from-kroshi-accent via-kroshi-accent2 to-kroshi-accent bg-clip-text text-transparent font-black text-2xl tracking-tighter">
      K<span className="font-light text-kroshi-text-dim">o</span>
      <span className="font-light text-kroshi-text-dim">r</span>
      <span className="font-light text-kroshi-text-dim">s</span>
      <span className="font-light text-kroshi-text-dim">h</span>
      <span className="font-light text-kroshi-text-dim">i</span>
      <span className="font-light text-kroshi-text-dim">C</span>
      <span className="font-light text-kroshi-text-dim">a</span>
      <span className="font-light text-kroshi-text-dim">s</span>
      <span className="font-light text-kroshi-text-dim">i</span>
      no
    </span>
  );

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-kroshi-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2" onClick={() => {}}>
          {gradientText}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-kroshi-panel2 border border-kroshi-border">
            <span className="text-kroshi-accent font-bold">🍬</span>
            <span className="font-bold text-kroshi-text">{balance.toLocaleString('ru-RU')}</span>
          </div>

          <button
            className="p-2 rounded-xl bg-kroshi-panel2 border border-kroshi-border text-kroshi-text hover:bg-kroshi-border transition-colors"
            aria-label="Меню"
            onClick={(e) => {
              e.stopPropagation();
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

      {tg && sidebarOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[41]" onClick={() => setSidebarOpen(false)} />
      )}
    </header>
  );
}
