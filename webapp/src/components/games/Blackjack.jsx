import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { format } from '../../state';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];

function createDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ s, r });
  // тасуем Фишером-Йетсом
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(r) {
  if (r === 'A') return 11;
  if (['J', 'Q', 'K'].includes(r)) return 10;
  return parseInt(r, 10);
}

function handValue(cards) {
  let v = cards.reduce((s, c) => s + cardValue(c.r), 0);
  let aces = cards.filter((c) => c.r === 'A').length;
  while (v > 21 && aces > 0) {
    v -= 10;
    aces -= 1;
  }
  return v;
}

function isRed(suit) {
  return suit === '♥' || suit === '♦';
}

function CardFace({ card, hidden }) {
  if (hidden) {
    return (
      <div className="w-10 h-14 rounded-lg border border-kroshi-border bg-kroshi-panel2 flex items-center justify-center text-kroshi-text-dim font-black">
        ?
      </div>
    );
  }
  return (
    <div
      className={`w-10 h-14 rounded-lg border border-kroshi-border bg-white flex flex-col items-center justify-center font-black leading-none ${
        isRed(card.s) ? 'text-red-600' : 'text-gray-900'
      }`}
    >
      <span className="text-sm">{card.r}</span>
      <span className="text-base">{card.s}</span>
    </div>
  );
}

export function BlackjackGame({ balance, onPlay, bet }) {
  const { haptic, hapticNotification, showMainButton, hideMainButton } = useTelegram();

  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [inGame, setInGame] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [message, setMessage] = useState('Сделай ставку и нажми «Раздать»');

  const deckRef = useRef([]);
  const betRef = useRef(0);
  const inGameRef = useRef(false);
  const resolvedRef = useRef(false);

  const finish = useCallback(
    (result, playerCards, dealerCards, betAmount) => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      inGameRef.current = false;

      let won = 0;
      let mult = 0;
      if (result === 'blackjack') {
        won = Math.floor(betAmount * 2.5);
        mult = 2.5;
      } else if (result === 'win') {
        won = betAmount * 2;
        mult = 2;
      } else if (result === 'push') {
        won = betAmount;
        mult = 1;
      }

      if (won > 0) hapticNotification('success');
      else haptic('light');

      const pv = handValue(playerCards);
      const dv = handValue(dealerCards);
      const msgs = {
        blackjack: 'Блэкджек! ×2.5 🎉',
        win: `Победа ${pv}:${dv} — +${format(won)} 🍬`,
        lose: `Проигрыш ${pv}:${dv}`,
        push: `Ничья ${pv}:${dv} — ставка возвращена`,
        dealerBust: `Дилер перебрал (${dv}) — +${format(won)} 🍬`,
        bust: `Перебор (${pv})`,
      };
      setMessage(msgs[result] || 'Игра окончена');
      setResolved(true);
      setInGame(false);
      onPlay?.(betAmount, won, mult);
    },
    [haptic, hapticNotification, onPlay],
  );

  const startGame = useCallback(() => {
    if (inGameRef.current) return;

    const betAmount = parseInt(bet, 10) || 1;
    if (!balance || betAmount > balance) {
      hapticNotification('error');
      setMessage('Недостаточно 🍬');
      return;
    }

    betRef.current = betAmount;
    deckRef.current = createDeck();

    const p = [deckRef.current.pop(), deckRef.current.pop()];
    const d = [deckRef.current.pop(), deckRef.current.pop()];

    resolvedRef.current = false;
    inGameRef.current = true;

    setPlayer(p);
    setDealer(d);
    setResolved(false);
    setInGame(true);
    setMessage('Игра идёт — бери карту или стоп');
    haptic('light');

    if (handValue(p) === 21) {
      finish('blackjack', p, d, betAmount);
    }
  }, [balance, bet, finish, haptic, hapticNotification]);

  const hit = useCallback(() => {
    if (!inGameRef.current || resolvedRef.current) return;
    haptic('light');

    const card = deckRef.current.pop();
    const p = [...player, card];
    setPlayer(p);

    const pv = handValue(p);
    if (pv > 21) {
      finish('bust', p, dealer, betRef.current);
    } else if (pv === 21) {
      // автостоп на 21
      let d = [...dealer];
      while (handValue(d) < 17 && deckRef.current.length) d.push(deckRef.current.pop());
      setDealer(d);
      const dv = handValue(d);
      finish(dv > 21 ? 'dealerBust' : dv === 21 ? 'push' : 'win', p, d, betRef.current);
    }
  }, [player, dealer, finish, haptic]);

  const stand = useCallback(() => {
    if (!inGameRef.current || resolvedRef.current) return;
    haptic('light');

    const d = [...dealer];
    while (handValue(d) < 17 && deckRef.current.length) {
      d.push(deckRef.current.pop());
    }
    setDealer(d);

    const pv = handValue(player);
    const dv = handValue(d);
    let result;
    if (dv > 21) result = 'dealerBust';
    else if (dv > pv) result = 'lose';
    else if (dv < pv) result = 'win';
    else result = 'push';

    finish(result, player, d, betRef.current);
  }, [player, dealer, finish, haptic]);

  useEffect(() => {
    if (inGame && !resolved) {
      showMainButton({ text: 'Ещё карту', onClick: hit, visible: true });
    } else if (!inGame) {
      showMainButton({ text: 'Раздать', onClick: startGame, visible: true });
    } else {
      hideMainButton();
    }
    return () => hideMainButton();
  }, [inGame, resolved, hit, startGame, showMainButton, hideMainButton]);

  const playerTotal = handValue(player);
  const dealerTotal = handValue(dealer);
  const canDeal = !inGame && balance > 0 && parseInt(bet, 10) <= balance;

  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Блэкджек ♠️</CardTitle>
        <span className="text-xs text-kroshi-text-dim">Ставка: {bet} 🍬</span>
      </CardHeader>

      <CardContent className="p-2 space-y-3">
        <div className="flex items-start justify-center gap-6">
          <div className="text-center">
            <div className="text-[11px] text-kroshi-text-dim mb-1.5">Дилер</div>
            <div className="flex gap-1 justify-center min-h-[56px]">
              {dealer.length === 0 && <span className="text-xs text-kroshi-text-dim self-center">—</span>}
              {dealer.map((c, i) => (
                <CardFace key={i} card={c} hidden={!resolved && i === 1} />
              ))}
            </div>
            <div className="mt-1.5 text-xs font-bold text-kroshi-text">
              {dealer.length ? (resolved ? dealerTotal : `${cardValue(dealer[0]?.r) || 0} + ?`) : ''}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[11px] text-kroshi-text-dim mb-1.5">Ты</div>
            <div className="flex gap-1 justify-center min-h-[56px]">
              {player.length === 0 && <span className="text-xs text-kroshi-text-dim self-center">—</span>}
              {player.map((c, i) => (
                <CardFace key={i} card={c} />
              ))}
            </div>
            <div className="mt-1.5 text-xs font-bold text-kroshi-text">
              {player.length ? playerTotal : ''}
            </div>
          </div>
        </div>

        <p className="text-sm font-bold text-kroshi-text text-center min-h-[20px]">{message}</p>

        <div className="text-[10px] text-kroshi-text-dim text-center">
          A = 11 или 1 · J, Q, K = 10 · Дилер берёт до 17 · Блэкджек платит ×2.5
        </div>
      </CardContent>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={hit} disabled={!inGame || resolved} className="flex-1">
          Ещё карту
        </Button>
        <Button variant="ghost" size="sm" onClick={stand} disabled={!inGame || resolved} className="flex-1">
          Стоп
        </Button>
      </div>

      {!inGame && (
        <Button variant="primary" size="sm" onClick={startGame} disabled={!canDeal} className="w-full">
          Раздать
        </Button>
      )}
    </Card>
  );
}
