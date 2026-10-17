import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const GAMES = [
  {
    key: 'slots',
    title: 'Слоты',
    emoji: '🎰',
    desc: 'Крути барабаны и собери выигрышную линию.',
    badge: <Badge variant="default">НОВОЕ</Badge>,
  },
  {
    key: 'roulette',
    title: 'Рулетка',
    emoji: '🎡',
    desc: 'Ставь на цвет, чёт/нечёт или число до 36.',
  },
  {
    key: 'dice',
    title: 'Кости',
    emoji: '🎲',
    desc: 'Угадай, будет сумма больше или меньше 7.',
  },
  {
    key: 'blackjack',
    title: 'Блэкджек',
    emoji: '♠️',
    desc: 'Набери 21 очко, не перебрав.',
  },
  {
    key: 'crash',
    title: 'Краш',
    emoji: '🚀',
    desc: 'Забери выигрыш до того, как мультипликатор рухнет.',
    badge: <Badge variant="hot">ГОРЯЧЕЕ</Badge>,
  },
];

export function GamesSection({ balance, onOpenGame, onSetMaxBet }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-kroshi-text">Выбери игру</span>
        <Badge variant="outline">Play-валюта</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES.map((game) => (
          <Card key={game.key} className="card-game group" onClick={() => onOpenGame(game.key)} role="button" tabIndex={0}>
            <CardHeader className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{game.emoji}</span>
                {game.badge}
              </div>
            </CardHeader>
            <CardTitle className="text-lg">{game.title}</CardTitle>
            <CardContent>{game.desc}</CardContent>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onOpenGame(game.key); }}>
                Играть
              </Button>
              <span className="text-xs text-kroshi-text-dim opacity-60">ставка</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-kroshi-panel2/50 rounded-2xl border border-kroshi-border p-4">
        <p className="text-xs text-kroshi-text-dim">
          Ваш баланс: <span className="text-kroshi-text font-bold">{balance.toLocaleString('ru-RU')} 🍬</span>
        </p>
      </div>
    </div>
  );
}
