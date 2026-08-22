import { cn } from '@/lib/cn.js'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/[0.04] text-ink-muted">
          <Icon size={24} strokeWidth={1.75} />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-ink">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
