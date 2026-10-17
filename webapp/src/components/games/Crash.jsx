import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

export function CrashGame({ balance, onPlay, bet, setBet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();
  const [running, setRunning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [cashed, setCashed] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [message, setMessage] = useState('Сделай ставку, затем забери до краша');
  const [crashPoint, setCrashPoint] = useState(1);
  const [linePoints, setLinePoints] = useState('');
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);
  const betRef = useRef(0);

  useEffect(() => {
    setMultiplier(1);
    setResolved(false);
    setCashed(false);
    setLinePoints('');
    setMessage('Сделай ставку, затем забери до краша');
  }, [bet]);

  const computedCrashPoint = 1 + Math.random() * 3 + Math.random() * Math.random() * 6;
  const earlyCrash = Math.random() < 0.12 ? 1.0 + Math.random() * 0.3 : computedCrashPoint;

  const startRound = useCallback(() => {
    const betAmount = parseInt(bet, 10) || 1;
    if (!balance || betAmount > balance) {
      hapticNotification('error');
      setMessage('Недостаточно 🍬');
      return;
    }
    betRef.current = betAmount;
    setRunning(true);
    setCashed(false);
    setResolved(false);
    setMultiplier(1);
    setCrashPoint(earlyCrash);
    setMessage('Раунд идёт…');
    startTimeRef.current = Date.now();

    const wrapEl = document.getElementById('crash-chart');
    const W = wrapEl?.clientWidth || 300;
    const H = 160;

    const pts = [];
    const loop = () => {
      if (!running || resolved) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const current = 1 + Math.pow(elapsed, 1.6) * 0.35;

      if (current > earlyCrash) {
        endRound(earlyCrash);
        return;
      }

      setMultiplier(current);

      const x = (elapsed / 12) * W;
      const y = H - (Math.log(current) / Math.log(Math.max(2, earlyCrash))) * H * 0.9;
      pts.push(`${x},${y}`);

      if (pts.length > 1) {
        setLinePoints(pts.join(' '));
      }

      if (x > W) {
        setLinePoints(
          pts.map((p, i) => {
            const [px, py] = p.split(',').map(Number);
            return `${Math.max(0, px - 40)},${py}`;
          }).join(' ')
        );
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [running, balance, bet, earlyCrash, hapticNotification, resolved]);

  const cashOut = useCallback(() => {
    if (!running || cashed || resolved) return;
    setCashed(true);
    endRound(multiplier);
  }, [running, cashed, resolved, multiplier]);

  const endRound = useCallback((finalMulti) => {
    setResolved(true);
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const won = cashed ? Math.floor(betRef.current * finalMulti) : 0;
    const mult = cashed ? finalMulti : 0;

    if (!cashed) {
      haptic('light');
      setMessage(`Краш на ${finalMulti.toFixed(2)}×`);
    } else {
      hapticNotification('success');
      setMessage(`Забрано на ${finalMulti.toFixed(2)}× — +${format(won)} 🍬`);
    }

    onPlay?.(betRef.current, won, mult);
  }, [cashed, betRef.current, format, hapticNotification, haptic, onPlay]);

  useEffect(() => {
    if (running && !resolved) {
      showMainButton({
        text: 'Забрать',
        onClick: cashOut,
        visible: true,
        loading: false,
      });
    } else {
      showMainButton({
        text: 'Сделать ставку',
        onClick: startRound,
        visible: true,
        loading: false,
      });
    }
    return () => hideMainButton();
  }, [running, resolved, cashOut, startRound, showMainButton, hideMainButton]);

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Краш 🚀</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Ставка: {bet} 🍬</span>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col items-center gap-3">
          <div className="text-3xl font-black text-kroshi-accent tracking-tighter">
            {multiplier.toFixed(2)}×
          </div>

          <div
            id="crash-chart"
            className="w-full max-w-xs h-32 bg-kroshi-panel2 border border-kroshi-border rounded-2xl relative overflow-hidden"
          >
            <svg className="w-full h-full" viewBox="0 0 300 160">
              <polyline
                points={linePoints}
                fill="none"
                stroke="#c084fc"
                strokeWidth="3"
                className="transition-all duration-100"
              />
            </svg>
          </div>

          <p className="text-sm text-kroshi-text-dim text-center">{message}</p>
        </div>
      </CardContent>

      <Button
        variant="primary"
        size="sm"
        onClick={running ? cashOut : startRound}
        disabled={!balance || parseInt(bet, 10) > balance}
        className="w-full"
      >
        {running ? 'Забрать' : 'Сделать ставку'}
      </Button>
    </Card>
  );
}
