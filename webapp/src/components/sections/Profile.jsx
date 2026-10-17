import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';

export function ProfileSection({ user, balance, stats, achievements, allAchievements, referrals }) {
  const { openLink, haptic } = useTelegram();
  const referralLink = `https://t.me/KroshiCasinoBot?start=ref_${user?.id || 0}`;

  const statsRows = [
    { label: 'Баланс', value: `${balance.toLocaleString('ru-RU')} 🍬`, accent: true },
    { label: 'Игр сыграно', value: stats?.gamesPlayed || 0 },
    { label: 'Всего ставок', value: `${(stats?.totalWagered || 0).toLocaleString('ru-RU')} 🍬` },
    { label: 'Всего выигрыша', value: `${(stats?.totalWon || 0).toLocaleString('ru-RU')} 🍬` },
    { label: 'Достижений', value: `${achievements?.length || 0} / ${allAchievements.length}` },
    { label: 'Рефералов', value: referrals?.length || 0 },
  ];

  const handleOpenTelegram = () => {
    haptic('light');
    openLink('https://t.me/KroshiCasinoBot');
  };

  return (
    <Card className="p-6 space-y-5">
      <CardHeader className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-kroshi-accent to-kroshi-accent2 flex items-center justify-center text-4xl shadow-neon mx-auto mb-3">
          🎰
        </div>
        <div>
          <CardTitle className="text-center">{user?.first_name || 'Игрок'}</CardTitle>
          <p className="text-xs text-kroshi-text-dim">{user?.username ? `@${user.username}` : 'нет username'}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {statsRows.map((row) => (
          <div key={row.label} className="flex justify-between items-center px-3 py-2 rounded-xl bg-kroshi-panel2 border border-kroshi-border">
            <span className="text-sm text-kroshi-text-dim">{row.label}</span>
            <span className={`text-sm font-bold ${row.accent ? 'text-kroshi-accent' : 'text-kroshi-text'}`}>
              {row.value}
            </span>
          </div>
        ))}

        <div className="pt-2 border-t border-kroshi-border">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-kroshi-text-dim">Реферальная ссылка</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 px-3 py-2 rounded-xl bg-kroshi-panel2 border border-kroshi-border text-kroshi-text text-xs focus:outline-none focus:ring-2 focus:ring-kroshi-accent"
            />
            <Button variant="ghost" size="sm" onClick={() => { haptic('light'); navigator.clipboard.writeText(referralLink); }}>
              Копировать
            </Button>
          </div>
        </div>

        <Button variant="primary" className="w-full" onClick={handleOpenTelegram}>
          Открыть бота в Telegram
        </Button>
      </CardContent>
    </Card>
  );
}
