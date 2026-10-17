/**
 * Hook для Telegram Web App API.
 * Стандарты: tg.ready(), tg.expand(), themeParams, MainButton, BackButton, HapticFeedback.
 */

import { useEffect, useRef, useCallback } from 'react';

export function useTelegram() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const initialized = useRef(false);

  const ready = useCallback(() => {
    if (tg && !initialized.current) {
      tg.ready();
      tg.expand();
      initialized.current = true;
    }
  }, [tg]);

  const setHeaderColor = useCallback((color) => {
    if (tg) tg.setHeaderColor(color);
  }, [tg]);

  const haptic = useCallback((type = 'light') => {
    if (tg?.HapticFeedback) {
      try { tg.HapticFeedback.impactOccurred(type); } catch (e) {}
    }
  }, [tg]);

  const hapticNotification = useCallback((type) => {
    if (tg?.HapticFeedback) {
      try { tg.HapticFeedback.notificationOccurred(type); } catch (e) {}
    }
  }, [tg]);

  const showMainButton = useCallback(({ text, onClick, visible = true, loading = false }) => {
    if (!tg) return;
    if (visible) {
      tg.MainButton.setText(text);
      if (onClick) tg.MainButton.onClick(onClick);
      if (loading) tg.MainButton.showProgress(); else tg.MainButton.hideProgress();
      tg.MainButton.enable();
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }
  }, [tg]);

  const hideMainButton = useCallback(() => {
    if (tg) tg.MainButton.hide();
  }, [tg]);

  const showBackButton = useCallback((onClick) => {
    if (tg) {
      tg.BackButton.show();
      if (onClick) tg.BackButton.onClick(onClick);
    }
  }, [tg]);

  const hideBackButton = useCallback(() => {
    if (tg) tg.BackButton.hide();
  }, [tg]);

  const openLink = useCallback((url) => {
    if (tg) tg.openTelegramLink(url);
    else window.open(url, '_blank');
  }, [tg]);

  const sendData = useCallback((data) => {
    if (tg) tg.sendData(typeof data === 'string' ? data : JSON.stringify(data));
  }, [tg]);

  const user = tg?.initDataUnsafe?.user ?? null;
  const initData = tg?.initData ?? '';
  const themeParams = tg?.themeParams ?? {};

  return {
    tg,
    user,
    initData,
    queryId: tg?.initDataUnsafe?.query_id,
    themeParams,
    ready,
    setHeaderColor,
    haptic,
    hapticNotification,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    openLink,
    sendData,
    isTelegram: !!tg,
  };
}
