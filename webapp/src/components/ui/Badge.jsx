export function Badge({ className, variant = 'default', children }) {
  const variants = {
    default: 'bg-kroshi-accent/20 text-kroshi-accent border border-kroshi-accent/40',
    hot: 'bg-kroshi-danger/20 text-kroshi-danger border border-kroshi-danger/40 animate-pulse-fast',
    success: 'bg-kroshi-success/20 text-kroshi-success border border-kroshi-success/40',
    outline: 'bg-transparent text-kroshi-text-dim border border-kroshi-border',
  };

  return (
    <span
      className={
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider' +
        ' ' +
        variants[variant] +
        (className ? ' ' + className : '')
      }
    >
      {children}
    </span>
  );
}
