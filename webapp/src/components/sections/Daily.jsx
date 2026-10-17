import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { DAILY_BONUS } from '../../state';

export function DailySection({ balance, onClaim, claimedAt }) {
  const { haptic, showMainButton, hideMainButton } = useTelegram();
  const [timer, setTimer] = useState('');

  const now = Date.now();
  const ready = !claimedAt || now - claimedAt >= 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!ready) {
      const iv = setInterval(() => {
        const n = Date.now();
        if (!claimedAt || n - claimedAt >= 24 * 60 * 60 * 1000) {
          setTimer('Бонус готов к получению');
          clearInterval(iv);
          return;
        }
        const left = Math.ceil((24 * 60 * 60 * 1000 - (n - claimedAt)) / 60000);
        setTimer(`Следующий бонус через ${left} мин.`);
      }, 1000);
      return () => clearInterval(iv);
    } else {
      setTimer('Бонус готов к получению');
    }
  }, [ready, claimedAt]);

  useEffect(() => {
    showMainButton({ text: 'Забрать бонус', onClick: onClaim, visible: ready });
    return () => hideMainButton();
  }, [ready, onClaim, showMainButton, hideMainButton]);

  const handleClick = () => {
    haptic('light');
    onClaim();
  };

  return (
    <Card className="p-6 text-center">
      <CardHeader>
        <CardTitle>Ежедневный бонус</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-4xl font-black text-kroshi-accent">+{DAILY_BONUS}</span>
          <span className="text-xl text-kroshi-text">🍬</span>
        </div>

        <Button
          variant="primary"
          className="w-full mb-4"
          disabled={!ready}
          onClick={handleClick}
        >
          {ready ? 'Забрать бонус' : 'Уже получено'}
        </Button>

        <p className="text-sm text-kroshi-text-dim">{timer}</p>
      </CardContent>
    </Card>
  );
}
