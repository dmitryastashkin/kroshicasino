import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

const CHART_W = 300;
const CHART_H = 140;

export function CrashGame({ balance, onPlay, bet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();
  const [running, setRunning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [message, setMessage] = useState('Сделай ставку, затем забери до краша');
  const [crashed, setCrashed] = useState(null);
  const [linePoints, setLinePoints] = useState('');

  const rafRef = useRef(null);
  const startTimeRef = useRef(0);
  const betRef = useRef(0);
  const crashAtRef = useRef(0);
  const cashedRef = useRef(false);
  const runningRef = useRef(false);
  const multRef = useRef(1);

  const clearLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => {
    return () => clearLoop();
  }, []);

  const finish = useCallback((finalMult, didCash) => {
    if (!runningRef.current) return;
    runningRef.current = false;
    clearLoop();

    const won = didCash ? Math.floor(betRef.current * finalMult) : 0;
    const mult = didCash ? finalMult : 0;

    if (didCash) {
      hapticNotification('success');
      setMessage(`Забрано на ${finalMult.toFixed(2)}× — +${format(won)} 🍬`);
    } else {
      haptic('light');
      setMessage(`Краш на ${finalMult.toFixed(2)}× — не успел`);
      setCrashed(finalMult);
    }

    onPlay?.(betRef.current, won, mult);
    setRunning(false);
  }, [haptic, hapticNotification, onPlay]);

  const cashOut = useCallback(() => {
    if (!runningRef.current || cashedRef.current) return;
    cashedRef.current = true;
    haptic('medium');
    finish(multRef.current, true);
  }, [finish, haptic]);

  const startRound = useCallback(() => {
    if (runningRef.current) return;

    const betAmount = parseInt(bet, 10) || 1;
    if (!balance || betAmount > balance) {
      hapticNotification('error');
      setMessage('Недостаточно 🍬');
      return;
    }

    betRef.current = betAmount;
    cashedRef.current = false;
    runningRef.current = true;
    multRef.current = 1;

    // Точка краша: ранняя / обычная / редкая большая
    const r = Math.random();
    let crashAt;
    if (r < 0.10) crashAt = 1 + Math.random() * 0.25;
    else if (r < 0.75) crashAt = 1.2 + Math.random() * 2.2;
    else crashAt = 3.5 + Math.random() * 6;
    crashAtRef.current = crashAt;

    setCrashed(null);
    setMultiplier(1);
    setLinePoints('');
    setMessage('Раунд идёт… забери до краша');
    setRunning(true);
    startTimeRef.current = Date.now();

    const pts = [];

    const loop = () => {
      if (!runningRef.current) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const current = Math.pow(1.28, elapsed * 2);

      const x = Math.min(CHART_W, (elapsed / 8) * CHART_W);
      const y = Math.max(
        6,
        CHART_H - (Math.log(Math.min(current, 8)) / Math.log(8)) * CHART_H * 0.85,
      );

      if (current >= crashAtRef.current) {
        pts.push(`${x},${y}`);
        setLinePoints(pts.join(' '));
        setMultiplier(crashAtRef.current);
        finish(crashAtRef.current, false);
        return;
      }

      multRef.current = current;
      setMultiplier(current);

      pts.push(`${x},${y}`);
      if (pts.length > 2) setLinePoints(pts.join(' '));

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [balance, bet, finish, hapticNotification]);

  useEffect(() => {
    if (running) {
      showMainButton({ text: `Забрать ×${multiplier.toFixed(2)}`, onClick: cashOut, visible: true });
    } else {
      showMainButton({ text: 'Сделать ставку', onClick: startRound, visible: true });
    }
    return () => hideMainButton();
  }, [running, multiplier, cashOut, startRound, showMainButton, hideMainButton]);

  const canBet = !running && balance > 0 && parseInt(bet, 10) <= balance;
  const lastPoint = linePoints ? linePoints.split(' ').pop() : null;
  const lastX = lastPoint ? lastPoint.split(',')[0] : 0;

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Краш 🚀</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Ставка: {bet} 🍬</span>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col items-center gap-3">
          <div
            className={`text-4xl font-black tracking-tighter ${
              crashed ? 'text-kroshi-danger' : running ? 'text-kroshi-accent' : 'text-kroshi-text-dim'
            }`}
          >
            {(crashed || multiplier).toFixed(2)}×
          </div>

          <div className="w-full bg-kroshi-panel2 border border-kroshi-border rounded-2xl relative overflow-hidden">
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={crashed ? '#f87171' : '#c084fc'} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={crashed ? '#f87171' : '#c084fc'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {linePoints && (
                <polygon
                  points={`0,${CHART_H} ${linePoints} ${lastX},${CHART_H}`}
                  fill="url(#crashFill)"
                />
              )}
              <polyline
                points={linePoints}
                fill="none"
                stroke={crashed ? '#f87171' : '#c084fc'}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {!linePoints && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-kroshi-text-dim">
                график появится здесь
              </div>
            )}
          </div>

          <p className="text-sm text-kroshi-text-dim text-center min-h-[20px]">{message}</p>
        </div>
      </CardContent>

      <Button
        variant={running ? 'success' : 'primary'}
        size="sm"
        onClick={running ? cashOut : startRound}
        disabled={!running && !canBet}
        className="w-full"
      >
        {running ? `Забрать ×${multiplier.toFixed(2)}` : 'Сделать ставку'}
      </Button>
    </Card>
  );
}
