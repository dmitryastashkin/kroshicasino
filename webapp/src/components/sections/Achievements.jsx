import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export function AchievementsSection({ achievements, allAchievements }) {
  const earned = allAchievements.filter((a) => achievements?.includes(a.id)).length;
  const total = allAchievements.length;

  return (
    <Card className="p-6 space-y-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Достижения</CardTitle>
          <span className="text-xs font-bold text-kroshi-accent">{earned} / {total}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAchievements.map((ach) => {
            const isEarned = achievements?.includes(ach.id);
            return (
              <Card
                key={ach.id}
                className={`p-4 flex items-center gap-3 ${isEarned ? 'border-kroshi-accent/40 bg-kroshi-accent/5' : 'opacity-50 grayscale border-dashed'}`}
              >
                <span className="text-3xl">{ach.emoji}</span>
                <div>
                  <div className="text-sm font-semibold text-kroshi-text">{ach.name}</div>
                  <div className="text-xs text-kroshi-text-dim">{ach.desc}</div>
                </div>
                {isEarned && (
                  <span className="ml-auto text-xs font-bold text-kroshi-success">Получено ✅</span>
                )}
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
