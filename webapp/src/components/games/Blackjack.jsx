import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];

function createDeck() {
  return SUITS.flatMap((s) => RANKS.map((r) => ({ s, r })));
}

function cardValue(r) {
  if (r === 'A') return 11;
  if (['J', 'Q', 'K'].includes(r)) return 10;
  return parseInt(r);
}

function handValue(cards) {
  let v = cards.reduce((s, c) => s + cardValue(c.r), 0);
  let aces = cards.filter((c) => c.r === 'A').length;
  while (v > 21 && aces-- > 0) v -= 10;
  return v;
}

function cardColor(suit) {
  return suit === '♥' || suit === '♦' ? 'text-kroshi-danger' : 'text-kroshi-text';
}

export function BlackjackGame({ balance, onPlay, bet, setBet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [inGame, setInGame] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [message, setMessage] = useState('Сделай ставку и раздай');
  const betAmountRef = useRef(0);

  useEffect(() => {
    setDeck(createDeck().sort(() => Math.random() - 0.5));
    setPlayer([]);
    setDealer([]);
    setInGame(false);
    setResolved(false);
    setMessage('Сделай ставку и нажми «Раздать»');
  }, [bet]);

  const startGame = useCallback(() => {
    const betAmount = parseInt(bet, 10) || 1;
    if (!balance || betAmount > balance) {
      hapticNotification('error');
      setMessage('Недостаточно 🍬');
      return;
    }
    betAmountRef.current = betAmount;
    const d = createDeck().sort(() => Math.random() - 0.5);
    setDeck(d);
    setPlayer([d.pop(), d.pop()]);
    setDealer([d.pop(), d.pop()]);
    setInGame(true);
    setResolved(false);
    setMessage('Игра идёт');

    if (handValue(player) === 21) {
      finish('blackjack');
    }
  }, [balance, bet, hapticNotification, player]);

  const hit = useCallback(() => {
    if (!inGame || resolved) return;
    setPlayer((p) => {
      const np = [...p, deck[deck.length - 1]];
      setDeck((d) => d.slice(0, -1));
      if (handValue(np) > 21) {
        finish('bust');
      }
      return np;
    });
  }, [inGame, resolved, deck, finish]);

  const stand = useCallback(() => {
    if (!inGame || resolved) return;
    let d = [...deck];
    let dlr = [...dealer];
    while (handValue(dlr) < 17) {
      dlr.push(d.pop());
    }
    setDealer(dlr);
    setDeck(d);

    const pv = handValue(player);
    const dv = handValue(dlr);
    let result;
    if (dv > 21) result = 'dealerBust';
    else if (dv > pv) result = 'lose';
    else if (dv < pv) result = 'win';
    else result = 'push';
    finish(result);
  }, [inGame, resolved, deck, dealer, player, finish]);

  const finish = useCallback((result) => {
    setResolved(true);
    setInGame(false);
    let won = 0;
    let mult = 0;

    if (result === 'blackjack') { won = Math.floor(betAmountRef.current * 2.5); mult = 2.5; }
    else if (result === 'win') { won = betAmountRef.current * 2; mult = 2; }
    else if (result === 'push') { won = betAmountRef.current; mult = 1; }

    if (won > 0) {
      hapticNotification('success');
    } else {
      haptic('light');
    }

    const msgs = {
      blackjack: `Блэкджек! ×2.5`,
      win: `Победа! +${format(won)} 🍬`,
      lose: 'Проигрыш',
      push: 'Ничья — ставка возвращена',
      dealerBust: `Дилер перебрал! +${format(won)} 🍬`,
      bust: 'Перебор',
    };
    setMessage(msgs[result] || 'Игра окончена');
    onPlay?.(betAmountRef.current, won, mult);
  }, [betAmountRef.current, format, hapticNotification, haptic, onPlay]);

  useEffect(() => {
    if (inGame && !resolved) {
      showMainButton({
        text: 'Ещё карту',
        onClick: hit,
        visible: true,
        loading: false,
      });
    } else if (!inGame) {
      showMainButton({
        text: 'Раздать',
        onClick: startGame,
        visible: true,
        loading: false,
      });
    } else {
      hideMainButton();
    }
    return () => hideMainButton();
  }, [inGame, resolved, hit, startGame, showMainButton, hideMainButton]);

  const cardHtml = (c) => (
    <span
      key={`${c.r}${c.s}`}
      className={`w-10 h-14 rounded-lg border border-kroshi-border bg-white flex items-center justify-center text-xs font-black ${cardColor(c.s)}`}
    >
      {c.r}{c.s}
    </span>
  );

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Блэкджек ♠️</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Ставка: {bet} 🍬</span>
      </CardHeader>

      <CardContent className="p-2">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-kroshi-text-dim mb-1">Дилер</div>
              <div className="flex gap-1">
                {dealer.map((c, i) => (
                  resolved || i > 0 ? cardHtml(c) : (
                    <div key="hidden" className="w-10 h-14 rounded-lg border border-kroshi-border bg-kroshi-panel2 flex items-center justify-center text-kroshi-text font-black">
                      ?
                    </div>
                  )
                ))}
              </div>
              {resolved && (
                <div className="mt-1 text-xs font-bold text-kroshi-text">{handValue(dealer)}</div>
              )}
            </div>
            <div className="text-center">
              <div className="text-xs text-kroshi-text-dim mb-1">Ты</div>
              <div className="flex gap-1">
                {player.map(cardHtml)}
              </div>
              <div className="mt-1 text-xs font-bold text-kroshi-text">{handValue(player)}</div>
            </div>
          </div>

          <p className="text-sm font-bold text-kroshi-text text-center">{message}</p>

          {!inGame && (
            <div className="text-[10px] text-kroshi-text-dim text-center">
              A = 11 или 1 • J,Q,K = 10 • Дилер берёт до 17
            </div>
          )}
        </div>
      </CardContent>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={hit}
          disabled={!inGame || resolved}
          className="flex-1"
        >
          Ещё карту
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={stand}
          disabled={!inGame || resolved}
          className="flex-1"
        >
          Стоп
        </Button>
      </div>
    </Card>
  );
}
