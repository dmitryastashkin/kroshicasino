import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

const CHART_W = 300;
const CHART_H = 140;

// Раунд синхронизирован по «мировым часам»: все клиенты видят один и тот же раунд.
const ROUND_MS = 20000;   // длительность раунда
const BETTING_MS = 5000;  // первые 5 сек — приём ставок
const GROWTH_BASE = 1.28; // множитель роста
const GROWTH_SPEED = 2;

/** Детерминированный псевдослучайный краш для номера раунда — одинаков у всех. */
function crashForRound(roundId) {
  // xorshift-like hash от номера раунда
  let x = Math.imul(roundId ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35) >>> 0;
  x ^= x >>> 16;
  const r = (x >>> 0) / 4294967296; // 0..1

  const r2 = ((Math.imul(roundId, 2246822519) >>> 0) % 1000) / 1000;

  if (r2 < 0.08) return 1 + r * 0.25;          // ранний краш
  if (r2 < 0.75) return 1.2 + r * 2.2;         // обычный
  return 3.5 + r * 6;                           // редкий большой
}

function roundIdAt(ts) {
  return Math.floor(ts / ROUND_MS);
}

export function CrashGame({ balance, onPlay, bet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();

  const [openBet, setOpenBet] = useState(false); // ставка сделана на текущий раунд
  const [phase, setPhase] = useState('betting'); // betting | running | crashed
  const [multiplier, setMultiplier] = useState(1);
  const [message, setMessage] = useState('Приём ставок');
  const [linePoints, setLinePoints] = useState('');
  const [crashedAt, setCrashedAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const stakesRef = useRef({});   // roundId -> bet amount
  const cashedRef = useRef({});   // roundId -> true
  const rafRef = useRef(null);
  const betRef = useRef(0);
  const roundRef = useRef(null);
  const crashRef = useRef(0);
  const openBetRef = useRef(false);

  const clearLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  /** Отрисовка/логика одного раунда */
  const runRound = useCallback((roundId) => {
    const roundStart = roundId * ROUND_MS;
    const crashAt = crashForRound(roundId);
    crashRef.current = crashAt;
    const startedAt = roundStart + BETTING_MS;

    setLinePoints('');
    setCrashedAt(null);
    setMultiplier(1);

    const pts = [];

    const loop = () => {
      const now = Date.now();
      const myRound = roundIdAt(now);

      // раунд закончился — переходим к следующему
      if (myRound !== roundId) {
        clearLoop();
        return;
      }

      const elapsed = (now - startedAt) / 1000;
      const current = Math.pow(GROWTH_BASE, elapsed * GROWTH_SPEED);

      const x = Math.min(CHART_W, (elapsed / 12) * CHART_W);
      const y = Math.max(
        6,
        CHART_H - (Math.log(Math.min(current, 10)) / Math.log(10)) * CHART_H * 0.85,
      );

      if (current >= crashAt) {
        pts.push(`${x},${y}`);
        setLinePoints(pts.join(' '));
        setMultiplier(crashAt);
        setCrashedAt(crashAt);
        roundRef.current = null;
        clearLoop();
        return;
      }

      setMultiplier(current);
      pts.push(`${x},${y}`);
      if (pts.length > 2) setLinePoints(pts.join(' '));
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  /** Главный такт: следит за сменой раунда и фазой приёма ставок */
  useEffect(() => {
    let tick;

    const sync = () => {
      const now = Date.now();
      const roundId = roundIdAt(now);
      const offset = now - roundId * ROUND_MS; // 0..ROUND_MS

      const inBetting = offset < BETTING_MS;

      if (roundRef.current !== roundId) {
        // Новый раунд
        const prevRound = roundRef.current;
        roundRef.current = roundId;

        // Закрываем ставку прошлого раунда, если игрок не забрал
        if (prevRound !== null && stakesRef.current[prevRound] && !cashedRef.current[prevRound]) {
          const lost = stakesRef.current[prevRound];
          onPlay?.(lost, 0, 0);
          haptic('light');
          setMessage(`Раунд #${prevRound % 10000} сорвался — ставка сгорела`);
        }

        // Новая ставка переносится в новый раунд, если игрок её сделал
        const carried = openBetRef.current;
        if (carried) {
          stakesRef.current[roundId] = betRef.current;
          cashedRef.current[roundId] = false;
        }

        setOpenBet(!!carried);
        openBetRef.current = !!carried;
        setCrashedAt(null);
        setMultiplier(1);
        setLinePoints('');
        setPhase('betting');
        setMessage(carried ? 'Ставка принята — ждём старт' : 'Приём ставок');
      }

      if (inBetting) {
        setPhase('betting');
        setTimeLeft(Math.ceil((BETTING_MS - offset) / 1000));
        clearLoop();
      } else {
        setPhase((p) => (p === 'crashed' ? p : 'running'));
        setTimeLeft(0);
        if (!rafRef.current && roundRef.current === roundId) {
          runRound(roundId);
        }
      }
    };

    tick = setInterval(sync, 200);
    sync();

    return () => {
      clearInterval(tick);
      clearLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runRound, onPlay, haptic]);

  // Ставка «активна» в текущем раунде?
  useEffect(() => {
    openBetRef.current = openBet;
  }, [openBet]);

  const placeBet = useCallback(() => {
    const amount = parseInt(bet, 10) || 1;
    if (!balance || amount > balance) {
      hapticNotification('error');
      setMessage('Недостаточно 🍬');
      return;
    }
    const roundId = roundRef.current;
    betRef.current = amount;
    stakesRef.current[roundId] = amount;
    cashedRef.current[roundId] = false;
    // списываем ставку сразу
    onPlay?.(amount, 0, 0);
    setOpenBet(true);
    openBetRef.current = true;
    haptic('medium');
    setMessage('Ставка принята — ждём старт раунда');
  }, [balance, bet, onPlay, haptic, hapticNotification]);

  const cashOut = useCallback(() => {
    const roundId = roundRef.current;
    if (!openBet || cashedRef.current[roundId]) return;
    const stake = stakesRef.current[roundId] || betRef.current;
    const won = Math.floor(stake * multiplier);
    cashedRef.current[roundId] = true;
    hapticNotification('success');
    onPlay?.(0, won, multiplier);
    setOpenBet(false);
    openBetRef.current = false;
    setMessage(`Забрано на ${multiplier.toFixed(2)}× — +${format(won)} 🍬`);
  }, [openBet, multiplier, onPlay, hapticNotification]);

  useEffect(() => {
    if (phase === 'betting' && !openBet) {
      showMainButton({ text: 'Сделать ставку', onClick: placeBet, visible: true });
    } else if (phase !== 'betting' && openBet) {
      showMainButton({ text: `Забрать ×${multiplier.toFixed(2)}`, onClick: cashOut, visible: true });
    } else if (phase === 'betting' && openBet) {
      showMainButton({ text: 'Ставка принята', onClick: () => {}, visible: true });
    } else {
      showMainButton({ text: 'Ждём следующий раунд', onClick: () => {}, visible: true });
    }
    return () => hideMainButton();
  }, [phase, openBet, multiplier, placeBet, cashOut, showMainButton, hideMainButton]);

  const canBet = phase === 'betting' && !openBet && balance > 0 && parseInt(bet, 10) <= balance;
  const canCash = phase !== 'betting' && openBet;
  const lastPoint = linePoints ? linePoints.split(' ').pop() : null;
  const lastX = lastPoint ? lastPoint.split(',')[0] : 0;
  const roundLabel = roundRef.current !== null ? `#${roundRef.current % 10000}` : '—';

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Краш 🚀</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Раунд {roundLabel}</span>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col items-center gap-3">
          <div
            className={`text-4xl font-black tracking-tighter tabular-nums ${
              crashedAt ? 'text-kroshi-danger' : phase === 'running' ? 'text-kroshi-accent' : 'text-kroshi-text-dim'
            }`}
          >
            {(crashedAt || multiplier).toFixed(2)}×
          </div>

          <div className="w-full bg-kroshi-panel2 border border-kroshi-border rounded-2xl relative overflow-hidden">
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={crashedAt ? '#f87171' : '#c084fc'} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={crashedAt ? '#f87171' : '#c084fc'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {linePoints && (
                <polygon points={`0,${CHART_H} ${linePoints} ${lastX},${CHART_H}`} fill="url(#crashFill)" />
              )}
              <polyline
                points={linePoints}
                fill="none"
                stroke={crashedAt ? '#f87171' : '#c084fc'}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {phase === 'betting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-kroshi-panel2/80">
                <div className="text-xs text-kroshi-text-dim">Приём ставок</div>
                <div className="text-2xl font-black text-kroshi-accent tabular-nums">{timeLeft}с</div>
              </div>
            )}
            {phase === 'crashed' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-kroshi-danger font-black text-lg">СОРВАЛОСЬ</span>
              </div>
            )}
          </div>

          <p className="text-sm text-kroshi-text-dim text-center min-h-[20px]">{message}</p>

          {openBet && phase !== 'betting' && (
            <div className="text-xs text-kroshi-success font-bold">
              Твоя ставка в игре: {betRef.current} 🍬
            </div>
          )}
        </div>
      </CardContent>

      {canCash ? (
        <Button variant="success" size="sm" onClick={cashOut} className="w-full">
          Забрать ×{multiplier.toFixed(2)}
        </Button>
      ) : (
        <Button variant="primary" size="sm" onClick={placeBet} disabled={!canBet} className="w-full">
          {openBet ? 'Ставка на следующий раунд' : phase === 'betting' ? 'Сделать ставку' : 'Ждём следующий раунд'}
        </Button>
      )}
    </Card>
  );
}
