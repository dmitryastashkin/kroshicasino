import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

// Европейская рулетка: порядок чисел на колесе
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const SEGMENTS = WHEEL_ORDER.length; // 37
const SEG_DEG = 360 / SEGMENTS;

function colorOf(n) {
  if (n === 0) return 'green';
  return RED.has(n) ? 'red' : 'black';
}

function colorName(c) {
  return c === 'red' ? 'Красное' : c === 'black' ? 'Чёрное' : 'Зеро';
}

/** SVG-колесо с 37 пронумерованными секторами */
function WheelFace() {
  const rad = (a) => (a * Math.PI) / 180;
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {WHEEL_ORDER.map((num, i) => {
        const start = i * SEG_DEG - 90 - SEG_DEG / 2;
        const end = start + SEG_DEG;
        const x1 = 100 + 95 * Math.cos(rad(start));
        const y1 = 100 + 95 * Math.sin(rad(start));
        const x2 = 100 + 95 * Math.cos(rad(end));
        const y2 = 100 + 95 * Math.sin(rad(end));
        const col = colorOf(num);
        const fill = col === 'red' ? '#dc2626' : col === 'green' ? '#16a34a' : '#1f2937';
        const mid = start + SEG_DEG / 2;
        const tx = 100 + 72 * Math.cos(rad(mid));
        const ty = 100 + 72 * Math.sin(rad(mid));
        return (
          <g key={num}>
            <path
              d={`M100,100 L${x1},${y1} A95,95 0 0,1 ${x2},${y2} Z`}
              fill={fill}
              stroke="#0a0a0f"
              strokeWidth="0.6"
            />
            <text
              x={tx}
              y={ty}
              fill="#fff"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${mid + 90}, ${tx}, ${ty})`}
            >
              {num}
            </text>
          </g>
        );
      })}
      <circle cx="100" cy="100" r="30" fill="#131321" stroke="#2a2a40" strokeWidth="2" />
    </svg>
  );
}

export function RouletteGame({ balance, onPlay, bet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('Выбери ставку и крути');
  const [activeBet, setActiveBet] = useState(null);
  const [wheel, setWheel] = useState(null);
  const degRef = useRef(0);
  const timerRef = useRef(null);
  const spinningRef = useRef(false);

  const bets = [
    { key: 'color:red', label: 'Красное ×2' },
    { key: 'color:black', label: 'Чёрное ×2' },
    { key: 'even', label: 'Чёт ×2' },
    { key: 'odd', label: 'Нечёт ×2' },
    { key: 'zero', label: 'Зеро ×35' },
  ];

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const doSpin = useCallback(() => {
    if (spinningRef.current) return;

    const betAmount = parseInt(bet, 10) || 1;
    if (!balance || betAmount > balance) {
      hapticNotification('error');
      setMessage('Недостаточно 🍬');
      return;
    }
    if (!activeBet) {
      hapticNotification('error');
      setMessage('Сначала выбери ставку');
      return;
    }

    spinningRef.current = true;
    setSpinning(true);
    setResult(null);
    setMessage('Крутится…');
    haptic('medium');

    // Результат выбираем заранее и доворачиваем колесо ровно под указатель (сверху).
    const winIndex = Math.floor(Math.random() * SEGMENTS);
    const num = WHEEL_ORDER[winIndex];
    const col = colorOf(num);

    const targetAngle = 360 - winIndex * SEG_DEG;
    const currentMod = ((degRef.current % 360) + 360) % 360;
    const delta = ((targetAngle - currentMod) % 360 + 360) % 360;
    degRef.current += 5 * 360 + delta;

    setWheel({
      transform: `rotate(${degRef.current}deg)`,
      transition: 'transform 4.2s cubic-bezier(0.15, 0.9, 0.25, 1)',
    });

    timerRef.current = setTimeout(() => {
      setWheel({ transform: `rotate(${degRef.current}deg)`, transition: 'none' });
      setResult({ num, col });

      let won = 0;
      let mult = 0;
      const [kind, val] = activeBet.split(':');

      if (kind === 'zero') {
        if (num === 0) { won = betAmount * 35; mult = 35; }
      } else if (kind === 'color') {
        if (col === val) { won = betAmount * 2; mult = 2; }
      } else if (kind === 'even') {
        if (num !== 0 && num % 2 === 0) { won = betAmount * 2; mult = 2; }
      } else if (kind === 'odd') {
        if (num % 2 === 1) { won = betAmount * 2; mult = 2; }
      }

      if (won > 0) {
        hapticNotification('success');
        setMessage(`Выпало ${num} — выигрыш ${format(won)} 🍬`);
      } else {
        haptic('light');
        setMessage(`Выпало ${num} (${colorName(col)}) — мимо`);
      }

      onPlay?.(betAmount, won, mult);
      setSpinning(false);
      spinningRef.current = false;
    }, 4300);
  }, [balance, bet, activeBet, onPlay, haptic, hapticNotification]);

  useEffect(() => {
    showMainButton({
      text: spinning ? 'Крутится…' : 'Вращать',
      onClick: doSpin,
      visible: true,
      loading: spinning,
    });
    return () => hideMainButton();
  }, [spinning, doSpin, showMainButton, hideMainButton]);

  const selectBet = (key) => {
    if (spinning) return;
    haptic('light');
    setActiveBet(key);
    setResult(null);
    setMessage('Выбери ставку и крути');
  };

  const canSpin = !spinning && balance > 0 && parseInt(bet, 10) <= balance && !!activeBet;

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Рулетка 🎡</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Ставка: {bet} 🍬</span>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-56 h-56 mx-auto">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 text-kroshi-accent text-2xl leading-none">
              ▼
            </div>
            <div className="w-full h-full" style={wheel || { transform: 'rotate(0deg)' }}>
              <WheelFace />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-kroshi-panel border border-kroshi-border flex items-center justify-center text-xl font-black">
                {result ? result.num : '?'}
              </div>
            </div>
          </div>

          {result && (
            <div className="text-lg font-bold flex items-center gap-2">
              <span
                className={
                  result.col === 'red'
                    ? 'text-kroshi-danger'
                    : result.col === 'black'
                    ? 'text-kroshi-text-dim'
                    : 'text-kroshi-success'
                }
              >
                {result.num}
              </span>
              <span className="text-kroshi-text-dim text-sm">({colorName(result.col)})</span>
            </div>
          )}

          <p className="text-sm text-kroshi-text-dim text-center min-h-[20px]">{message}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          {bets.map((b) => (
            <button
              key={b.key}
              disabled={spinning}
              className={`px-2 py-2 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50 ${
                activeBet === b.key
                  ? 'bg-kroshi-accent/20 text-kroshi-accent border border-kroshi-accent/40 shadow-neon-sm'
                  : 'bg-kroshi-panel2 border border-kroshi-border text-kroshi-text-dim hover:bg-kroshi-border hover:text-kroshi-text'
              }`}
              onClick={() => selectBet(b.key)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </CardContent>

      <Button variant="primary" size="sm" onClick={doSpin} disabled={!canSpin} className="w-full">
        {spinning ? 'Крутится…' : 'Вращать'}
      </Button>
    </Card>
  );
}
