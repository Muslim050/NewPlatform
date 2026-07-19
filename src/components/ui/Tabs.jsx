import { motion } from 'framer-motion'
import { cn } from '@/lib/cn.js'

/**
 * Сегментированный переключатель.
 * items: [{ value, label, count? }], value, onChange
 */
export function SegmentTabs({ items, value, onChange, className }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1',
        className,
      )}
    >
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn(
              'relative rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-ring',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft',
            )}
          >
            {active && (
              <motion.span
                layoutId="segment-active"
                className="absolute inset-0 rounded-lg bg-ink/[0.06]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {it.label}
              {it.count != null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[11px] tnum',
                    active ? 'bg-ink/10 text-ink' : 'bg-ink/[0.06] text-ink-muted',
                  )}
                >
                  {it.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
