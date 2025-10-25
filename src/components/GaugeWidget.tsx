interface GaugeWidgetProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color?: 'success' | 'warning' | 'destructive' | 'primary';
}

export function GaugeWidget({ value, max, label, unit, color = 'primary' }: GaugeWidgetProps) {
  const percentage = (value / max) * 100;
  
  const colorClasses = {
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
    primary: 'text-primary',
  };

  const bgColorClasses = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    primary: 'bg-primary',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-32">
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={`hsl(var(--${color}))`}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colorClasses[color]}`}>
            {Math.round(value)}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
