import { cn } from '@/lib/cn.js'

/** Тонкий прогресс-бар. value в процентах (0..100+). */
export function Progress({ value = 0, className, tone = 'indigo' }) {
  const pct = Math.max(0, Math.min(100, value))
  const over = value > 100
  const bar = {
    indigo: 'bg-indigo-500',
    lime: 'bg-lime-400',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }[over ? 'danger' : tone]

  return (
    <div className={cn('h-1.5 w-full rounded-full bg-ink/[0.07]', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700', bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
