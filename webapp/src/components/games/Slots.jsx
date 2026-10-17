import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '⭐', '7️⃣', '💎'];
const PAY = {
  '🍒': { 3: 2, 4: 5, 5: 10 },
  '🍋': { 3: 3, 4: 6, 5: 12 },
  '🍇': { 3: 4, 4: 8, 5: 16 },
  '🔔': { 3: 6, 4: 12, 5: 24 },
  '⭐': { 3: 9, 4: 18, 5: 36 },
  '7️⃣': { 3: 15, 4: 30, 5: 75 },
  '💎': { 3: 25, 4: 50, 5: 125 },
};

const LINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 0, 1, 2, 1],
];

function randSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function generateGrid() {
  return [
    [randSymbol(), randSymbol(), randSymbol(), randSymbol(), randSymbol()],
    [randSymbol(), randSymbol(), randSymbol(), randSymbol(), randSymbol()],
    [randSymbol(), randSymbol(), randSymbol(), randSymbol(), randSymbol()],
  ];
}

function evaluate(grid, bet) {
  let win = 0;
  const winningLines = [];
  LINES.forEach((line, li) => {
    const sym = grid[line[0]][0];
    let len = 1;
    for (let c = 1; c < 5; c++) {
      if (grid[line[c]][c] === sym) len++; else break;
    }
    if (len >= 3 && PAY[sym] && PAY[sym][len]) {
      const p = PAY[sym][len] * bet;
      win += p;
      winningLines.push({ line: li, sym, len, pay: p });
    }
  });
  return { win, winningLines };
}

export function SlotsGame({ balance, onPlay, bet, setBet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();
  const [grid, setGrid] = useState(generateGrid());
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState(0);
  const [winningLines, setWinningLines] = useState([]);
  const [message, setMessage] = useState('Крути барабаны!');
  const [highlight, setHighlight] = useState(new Set());
  const spinRef = useRef(null);

  useEffect(() => {
    setGrid(generateGrid());
    setWin(0);
    setWinningLines([]);
    setMessage('Крути барабаны!');
    setHighlight(new Set());
  }, [bet]);

  useEffect(() => {
    return () => {
      if (spinRef.current) clearInterval(spinRef.current);
    };
  }, []);

  const doSpin = useCallback((times = 1) => {
    if (spinning) return;
    const betAmount = parseInt(bet, 10) || 1;
    if (!balance || betAmount > balance) {
      hapticNotification('error');
      setMessage('Недостаточно 🍬');
      return;
    }

    setSpinning(true);
    setMessage('Крутится…');
    setWinningLines([]);
    setHighlight(new Set());

    let totalWin = 0;
    let spinsDone = 0;

    const spinColumn = (col, duration) => {
      return new Promise((resolve) => {
        const start = Date.now();
        spinRef.current = setInterval(() => {
          setGrid((g) => {
            const ng = g.map((row) => [...row]);
            ng[0][col] = randSymbol();
            ng[1][col] = randSymbol();
            ng[2][col] = randSymbol();
            return ng;
          });
        }, 50);

        setTimeout(() => {
          clearInterval(spinRef.current);
          resolve();
        }, duration);
      });
    };

    const runSpins = async () => {
      for (let t = 0; t < times; t++) {
        await Promise.all([
          spinColumn(0, 500),
          spinColumn(1, 650),
          spinColumn(2, 800),
          spinColumn(3, 950),
          spinColumn(4, 1100),
        ]);

        const finalGrid = generateGrid();
        setGrid(finalGrid);

        const result = evaluate(finalGrid, betAmount);
        totalWin += result.win;

        if (result.win > 0) {
          setWin(result.win);
          setWinningLines(result.winningLines);
          const hl = new Set();
          result.winningLines.forEach((l) => {
            l.line.forEach((r, c) => hl.add(`${r}-${c}`));
          });
          setHighlight(hl);
          hapticNotification('success');
          setMessage(`Выигрыш: ${format(result.win)} 🍬`);
          await new Promise((r) => setTimeout(r, 900));
          setHighlight(new Set());
        } else {
          haptic('light');
          setMessage('Попробуй ещё раз!');
        }
        spinsDone++;
      }

      if (times > 1) {
        onPlay?.(betAmount * times, totalWin, totalWin / (betAmount * times) || 0);
        setMessage(`Итого выигрыш: ${format(totalWin)} 🍬`);
      } else if (totalWin > 0) {
        onPlay?.(betAmount, totalWin, totalWin / betAmount || 0);
      } else {
        onPlay?.(betAmount, 0, 0);
      }

      setSpinning(false);
    };

    runSpins();
  }, [spinning, balance, bet, onPlay, haptic, hapticNotification]);

  useEffect(() => {
    showMainButton({
      text: spinning ? 'Крутится…' : 'Вращать',
      onClick: () => doSpin(1),
      visible: true,
      loading: spinning,
    });
    return () => hideMainButton();
  }, [spinning, doSpin, showMainButton, hideMainButton]);

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Слоты 🎰</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Ставка: {bet} 🍬</span>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col items-center gap-2">
          <div className="grid grid-cols-5 gap-2 w-full max-w-xs mx-auto">
            {grid.map((row, r) =>
              row.map((sym, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
                    highlight.has(`${r}-${c}`) ? 'border-2 border-kroshi-success shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'bg-kroshi-panel2 border border-kroshi-border'
                  }`}
                >
                  {sym}
                </div>
              ))
            )}
          </div>
          {win > 0 && (
            <div className="text-xl font-bold text-kroshi-success animate-pulse-fast">
              🎉 {format(win)} 🍬
            </div>
          )}
          <p className="text-xs text-kroshi-text-dim text-center">{message}</p>
        </div>
      </CardContent>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => doSpin(1)}
          disabled={spinning || !balance || parseInt(bet, 10) > balance}
          className="flex-1"
        >
          Вращать
        </Button>
        <Button variant="ghost" size="sm" onClick={() => doSpin(2)} disabled={spinning} className="flex-1">
          ×2
        </Button>
        <Button variant="ghost" size="sm" onClick={() => doSpin(10)} disabled={spinning} className="flex-1">
          ×10
        </Button>
      </div>
    </Card>
  );
}
