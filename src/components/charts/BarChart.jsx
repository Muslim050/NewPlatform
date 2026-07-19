import { useState } from 'react'
import { cn } from '@/lib/cn.js'

/**
 * Столбчатый график. data: [{ label, value, color? }]
 */
export function BarChart({ data = [], formatValue = (v) => v, className }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={cn('flex h-full items-end gap-2', className)}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 100, 2)
        const active = hover === i
        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center gap-2"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {active && (
              <div className="pointer-events-none absolute -top-9 z-10 whitespace-nowrap rounded-lg border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-ink shadow-lift tnum">
                {formatValue(d.value)}
              </div>
            )}
            <div className="flex h-full w-full items-end">
              <div
                className="w-full rounded-t-lg transition-all duration-300"
                style={{
                  height: `${h}%`,
                  background: d.color || '#4F46E5',
                  opacity: hover == null || active ? 1 : 0.4,
                }}
              />
            </div>
            <span className="max-w-full truncate text-[11px] text-ink-muted">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
