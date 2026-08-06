import { cn } from '@/lib/cn.js'

const tones = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/12 text-warning',
  danger: 'bg-danger/10 text-danger',
  indigo: 'bg-indigo-100 text-indigo-900',
  muted: 'bg-ink/[0.06] text-ink-soft',
  lime: 'bg-lime-100 text-lime-600',
}

export function Badge({ tone = 'muted', className, dot = false, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone] || tones.muted,
        className,
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  )
}
