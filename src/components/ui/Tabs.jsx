import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn.js'

// Подложка активной вкладки: обычная — фирменный жёлтый, «soft» — его
// светлый оттенок для длинных рядов вроде номеров договоров.
const TONES = {
  accent: 'bg-indigo-100 ring-1 ring-inset ring-indigo-600/30',
  soft: 'bg-indigo-100 ring-1 ring-inset ring-indigo-300',
}

/**
 * Сегментированный переключатель.
 * items: [{ value, label, count? }], value, onChange, tone: accent | soft
 */
export function SegmentTabs({
  items,
  value,
  onChange,
  tone = 'accent',
  className,
}) {
  // Свой layoutId на каждый переключатель: на странице их несколько, с общим
  // id подложка перелетала бы из одной группы вкладок в другую.
  const layoutId = useId()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-[4.5px] shadow-soft',
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
              active
                ? 'text-ink'
                : 'text-ink-soft  hover:bg-indigo-50 hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className={cn('absolute inset-0 rounded-lg', TONES[tone])}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {it.label}
              {it.count != null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[11px] tnum',
                    active
                      ? 'bg-black/[0.08] text-ink'
                      : 'bg-ink/[0.07] text-ink-soft',
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
