import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function colorOf(n) {
  if (n === 0) return 'green';
  return RED.has(n) ? 'red' : 'black';
}

function colorName(c) {
  return c === 'red' ? 'Красное' : c === 'black' ? 'Чёрное' : 'Зеленый (0)';
}

export function RouletteGame({ balance, onPlay, bet, setBet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();
  const [spinning, setSpinning] = useState(false);
  [useState(0)]; // result number placeholder
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('Ставь и крути');
  const [activeBet, setActiveBet] = useState(null);
  const wheelRef = useRef(null);
  const degRef = useRef(0);

  const bets = [
    { key: 'color:red', label: 'Красное', color: '#ef4444', mult: 2 },
    { key: 'color:black', label: 'Чёрное', color: '#1f2937', mult: 2 },
    { key: 'even', label: 'Чёт', mult: 2 },
    { key: 'odd', label: 'Нечёт', mult: 2 },
    { key: 'zero', label: '0', mult: 35 },
  ];

  useEffect(() => {
    setResult(null);
    setMessage('Ставь и крути');
  }, [bet]);

  const doSpin = useCallback(() => {
    const betAmount = parseInt(bet, 10) || 1;
    if (!balance || betAmount > balance) {
      hapticNotification('error');
      setMessage('Недостаточно 🍬');
      return;
    }
    if (!activeBet) {
      hapticNotification('error');
      setMessage('Выбери ставку');
      return;
    }

    setSpinning(true);
    setResult(null);

    const targetDeg = 1440 + Math.floor(Math.random() * 360);
    degRef.current += targetDeg;

    const wheelEl = wheelRef.current;
    wheelEl.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    wheelEl.style.transform = `rotate(${degRef.current}deg)`;

    setTimeout(() => {
      wheelEl.style.transition = 'none';

      const totalDeg = degRef.current % 360;
      const index = Math.floor(((360 - totalDeg + 90) % 360) / 360 * 37);
      const num = NUMBERS[index % 37];
      const col = colorOf(num);

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
        setMessage(`Выигрыш: ${format(won)} 🍬`);
      } else {
        haptic('light');
        setMessage('Мимо!');
      }

      onPlay?.(betAmount, won, mult);
      setSpinning(false);
    }, 4100);
  }, [spinning, balance, bet, activeBet, onPlay, haptic, hapticNotification]);

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
    haptic('light');
    setActiveBet(key);
    setResult(null);
    setMessage('Ставь и крути');
  };

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Рулетка 🎡</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Ставка: {bet} 🍬</span>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-64 h-64 mx-auto">
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full border-[14px] border-transparent"
              style={{
                borderImage: `conic-gradient(
                  #c084fc 0deg 58deg,
                  #f472b6 58deg 117deg,
                  #34d399 117deg 175deg,
                  #fbbf24 175deg 234deg,
                  #f87171 234deg 292deg,
                  #22d3ee 292deg 360deg
                ) 1`,
              }}
            >
              <div className="absolute inset-0 rounded-full bg-kroshi-panel flex items-center justify-center text-3xl font-black">
                ?
              </div>
            </div>
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-kroshi-accent font-black text-xl">
              ▼
            </div>
          </div>

          {result && (
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className={result.col === 'red' ? 'text-kroshi-danger' : result.col === 'black' ? 'text-kroshi-text-dim' : 'text-kroshi-success'}>
                {result.num}
              </span>
              <span className="text-kroshi-text-dim">({colorName(result.col)})</span>
            </div>
          )}

          <p className="text-sm text-kroshi-text-dim text-center">{message}</p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {bets.map((b) => (
            <button
              key={b.key}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
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

      <Button
        variant="primary"
        size="sm"
        onClick={doSpin}
        disabled={spinning || !balance || parseInt(bet, 10) > balance || !activeBet}
        className="w-full"
      >
        Вращать
      </Button>
    </Card>
  );
}
