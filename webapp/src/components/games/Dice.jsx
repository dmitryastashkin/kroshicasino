import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function DiceGame({ balance, onPlay, bet, setBet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();
  const [die1, setDie1] = useState('⚀');
  const [die2, setDie2] = useState('⚁');
  const [rolling, setRolling] = useState(false);
  const [sum, setSum] = useState(null);
  const [message, setMessage] = useState('Выбери ставку и брось');
  const [activeBet, setActiveBet] = useState(null);

  const bets = [
    { key: 'under', label: 'Меньше 7', mult: 2 },
    { key: 'over', label: 'Больше 7', mult: 2 },
    { key: 'seven', label: 'Ровно 7', mult: 4 },
  ];

  useEffect(() => {
    setSum(null);
    setMessage('Выбери ставку и брось');
  }, [bet]);

  const doRoll = useCallback(() => {
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

    setRolling(true);
    const faces = FACES;
    const iv = setInterval(() => {
      setDie1(faces[Math.floor(Math.random() * 6)]);
      setDie2(faces[Math.floor(Math.random() * 6)]);
    }, 60);

    setTimeout(() => {
      clearInterval(iv);
      const a = Math.floor(Math.random() * 6) + 1;
      const b = Math.floor(Math.random() * 6) + 1;
      setDie1(faces[a - 1]);
      setDie2(faces[b - 1]);
      const s = a + b;
      setSum(s);

      let won = 0;
      let mult = 0;
      if (activeBet === 'seven') {
        if (s === 7) { won = betAmount * 4; mult = 4; }
      } else if (activeBet === 'under') {
        if (s < 7) { won = betAmount * 2; mult = 2; }
      } else if (activeBet === 'over') {
        if (s > 7) { won = betAmount * 2; mult = 2; }
      }

      if (won > 0) {
        hapticNotification('success');
        setMessage(`Выигрыш: ${format(won)} 🍬`);
      } else {
        haptic('light');
        setMessage('Мимо!');
      }

      onPlay?.(betAmount, won, mult);
      setRolling(false);
    }, 700);
  }, [rolling, balance, bet, activeBet, onPlay, haptic, hapticNotification]);

  useEffect(() => {
    showMainButton({
      text: rolling ? 'Бросание…' : 'Бросить кости',
      onClick: doRoll,
      visible: true,
      loading: rolling,
    });
    return () => hideMainButton();
  }, [rolling, doRoll, showMainButton, hideMainButton]);

  const selectBet = (key) => {
    haptic('light');
    setActiveBet(key);
    setSum(null);
    setMessage('Выбери ставку и брось');
  };

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Кости 🎲</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Ставка: {bet} 🍬</span>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl bg-kroshi-panel2 border border-kroshi-border flex items-center justify-center text-5xl shadow-panel">
              {die1}
            </div>
            <div className="w-20 h-20 rounded-2xl bg-kroshi-panel2 border border-kroshi-border flex items-center justify-center text-5xl shadow-panel">
              {die2}
            </div>
          </div>

          {sum !== null && (
            <div className="text-2xl font-bold text-kroshi-accent">
              Сумма: {sum}
            </div>
          )}

          <p className="text-sm text-kroshi-text-dim text-center">{message}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
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
              {b.label}{b.mult > 2 && ` ×${b.mult}`}
            </button>
          ))}
        </div>
      </CardContent>

      <Button
        variant="primary"
        size="sm"
        onClick={doRoll}
        disabled={rolling || !balance || parseInt(bet, 10) > balance || !activeBet}
        className="w-full"
      >
        Бросить кости
      </Button>
    </Card>
  );
}
