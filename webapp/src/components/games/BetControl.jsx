import { useTelegram } from '../../hooks/useTelegram';

const QUICK = [10, 50, 100, 500];

export function BetControl({ bet, setBet, balance, disabled }) {
  const { haptic } = useTelegram();

  const value = parseInt(bet, 10) || 0;

  const clamp = (n) => {
    const max = Math.max(1, balance);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(Math.floor(n), max);
  };

  const apply = (n) => {
    if (disabled) return;
    haptic('light');
    setBet(String(clamp(n)));
  };

  const onChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setBet(raw);
  };

  const onBlur = () => {
    setBet(String(clamp(parseInt(bet, 10))));
  };

  const halve = () => apply(Math.floor(value / 2));
  const double = () => apply(value * 2);
  const max = () => apply(balance);

  const invalid = value < 1 || value > balance;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={halve}
          disabled={disabled}
          className="w-10 h-10 shrink-0 rounded-xl bg-kroshi-panel2 border border-kroshi-border text-kroshi-text font-bold disabled:opacity-40 active:scale-95 transition-transform"
          aria-label="Уменьшить ставку вдвое"
        >
          −
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={bet}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            aria-label="Сумма ставки"
            className={`w-full text-center px-3 py-2.5 rounded-xl bg-kroshi-panel2 border text-kroshi-text font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-kroshi-accent disabled:opacity-50 ${
              invalid ? 'border-kroshi-danger' : 'border-kroshi-border'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-kroshi-text-dim text-sm pointer-events-none">
            🍬
          </span>
        </div>

        <button
          type="button"
          onClick={double}
          disabled={disabled}
          className="w-10 h-10 shrink-0 rounded-xl bg-kroshi-panel2 border border-kroshi-border text-kroshi-text font-bold disabled:opacity-40 active:scale-95 transition-transform"
          aria-label="Удвоить ставку"
        >
          +
        </button>

        <button
          type="button"
          onClick={max}
          disabled={disabled}
          className="h-10 px-3 shrink-0 rounded-xl bg-kroshi-accent/20 border border-kroshi-accent/40 text-kroshi-accent text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform"
        >
          MAX
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => apply(q)}
            disabled={disabled || q > balance}
            className={`py-1.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-30 ${
              value === q
                ? 'bg-kroshi-accent/20 text-kroshi-accent border-kroshi-accent/40'
                : 'bg-kroshi-panel2 border-kroshi-border text-kroshi-text-dim'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {invalid && (
        <p className="text-[11px] text-kroshi-danger text-center">
          {value > balance ? `Максимум ${balance.toLocaleString('ru-RU')} 🍬` : 'Минимальная ставка 1 🍬'}
        </p>
      )}
    </div>
  );
}
