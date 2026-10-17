import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const MOCK_LEADERBOARD = [
  { name: 'Виктория', bal: 45200, me: false, rank: 1 },
  { name: 'Артур', bal: 31800, me: false, rank: 2 },
  { name: 'Sonya', bal: 28400, me: false, rank: 3 },
  { name: 'Макс', bal: 19100, me: false, rank: 4 },
  { name: 'Kroshi', bal: 12300, me: false, rank: 5 },
];

export function LeaderboardSection({ myBalance, myName }) {
  const entries = [...MOCK_LEADERBOARD, { name: myName || 'Ты', bal: myBalance, me: true, rank: 0 }];
  entries.sort((a, b) => b.bal - a.bal);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Топ игроков</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.slice(0, 8).map((e) => (
            <div
              key={e.name + e.rank}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                e.me
                  ? 'bg-kroshi-accent/10 border border-kroshi-accent/40'
                  : 'bg-kroshi-panel2 border border-kroshi-border'
              }`}
            >
              <span className="text-xs font-bold text-kroshi-text-dim w-8">#{e.rank}</span>
              <span className="flex-1 font-semibold text-kroshi-text">{e.name}</span>
              <span className="font-mono text-sm font-bold text-kroshi-text">
                {e.bal.toLocaleString('ru-RU')} 🍬
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-kroshi-text-dim">
          Локальный демо-топ. Общий топ требует бэкенда.
        </p>
      </CardContent>
    </Card>
  );
}
