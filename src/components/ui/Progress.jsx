import { cn } from '@/lib/cn.js'

/**
 * Тонкий прогресс-бар. value в процентах (0..100+).
 * label — подпись поверх полосы, для неё полосу делают выше.
 */
export function Progress({ value = 0, className, tone = 'indigo', label }) {
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
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-ink/[0.07]',
        label ? 'h-4' : 'h-1.5',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-700', bar)}
        style={{ width: `${pct}%` }}
      />
      {label && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-ink tnum">
          {label}
        </span>
      )}
    </div>
  )
}
