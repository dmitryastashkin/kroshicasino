import { useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { REFERRAL_BONUS_INVITEE, REFERRAL_BONUS_REFERRER } from '../../state';

export function ReferralSection({ user, referrals, referrer, onClaim, onCopy }) {
  const { haptic, openLink } = useTelegram();

  const referralLink = useCallback(() => {
    const username = 'KroshiCasinoBot';
    return `https://t.me/${username}?start=ref_${user?.id || 0}`;
  }, [user?.id]);

  const handleCopy = () => {
    haptic('light');
    navigator.clipboard.writeText(referralLink()).then(() => onCopy());
  };

  const handleShare = () => {
    haptic('light');
    const text = `Присоединяйся к KroshiCasino! Начни с бонуса ${REFERRAL_BONUS_INVITEE} 🍬`;
    openLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink())}&text=${encodeURIComponent(text)}`);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Пригласи друзей</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-2xl bg-kroshi-panel2 border border-kroshi-border text-center">
            <div className="text-xs text-kroshi-text-dim mb-1">За каждого друга</div>
            <div className="text-lg font-bold text-kroshi-accent">+{REFERRAL_BONUS_REFERRER} 🍬</div>
          </div>
          <div className="p-3 rounded-2xl bg-kroshi-panel2 border border-kroshi-border text-center">
            <div className="text-xs text-kroshi-text-dim mb-1">Друг получает</div>
            <div className="text-lg font-bold text-kroshi-success">+{REFERRAL_BONUS_INVITEE} 🍬</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            readOnly
            value={referralLink()}
            className="w-full px-4 py-3 rounded-xl bg-kroshi-panel2 border border-kroshi-border text-kroshi-text text-sm focus:outline-none focus:ring-2 focus:ring-kroshi-accent"
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleCopy} className="flex-1">
              Копировать
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare} className="flex-1">
              Поделиться
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-kroshi-border">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-kroshi-text-dim">Приглашено друзей</span>
            <span className="text-sm font-bold text-kroshi-text">{referrals?.length || 0}</span>
          </div>
          {!referrer ? (
            <p className="text-xs text-kroshi-text-dim">
              Укажи реферального пригласителя при /start в боте, чтобы получить бонус.
            </p>
          ) : (
            <Button variant="outline" size="sm" onClick={onClaim} className="w-full">
              Забрать бонус реферала
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
