import { useEffect, useState } from 'react';

export function Toast({ message, type = 'ok', duration = 2500 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  if (!visible || !message) return null;

  return (
    <div
      className={`toast show ${type === 'err' ? 'toast.err' : 'toast.ok'}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = (message, type = 'ok') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  };

  const clear = () => setToast(null);

  return { toast, show, clear };
}
