export function Card({ className, children, ...props }) {
  return (
    <div
      className={
        'glass-panel p-6 relative overflow-hidden' +
        (className ? ' ' + className : '')
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={'mb-4 flex items-center gap-2' + (className ? ' ' + className : '')}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={'text-xl font-bold text-kroshi-text tracking-tight' + (className ? ' ' + className : '')}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children }) {
  return (
    <div className={'text-kroshi-text-dim text-sm leading-relaxed' + (className ? ' ' + className : '')}>
      {children}
    </div>
  );
}
