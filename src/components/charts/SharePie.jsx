import { Suspense, lazy } from 'react'
import { cn } from '@/lib/cn.js'

// Recharts весит около 100 КБ в сжатом виде и нужен только там, где есть
// диаграммы, — поэтому он отдельным чанком, а не в общем бандле.
const SharePieChart = lazy(() => import('./SharePieChart.jsx'))

/**
 * Кольцевая диаграмма долей на shadcn/ui Chart.
 * data: [{ label, value, color? }] — значения в процентах.
 *
 * Сектора разделены зазором, а при наведении показывают подпись с долей:
 * соседние цвета палитры при дальтонизме различаются на грани, поэтому
 * рядом с диаграммой всегда стоит список подписей.
 */
export function SharePie({
  data = [],
  size = 176,
  thickness = 20,
  centerLabel,
  centerValue,
  className,
}) {
  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {/* Пока чанк едет, место под кольцо уже занято — вёрстка не прыгает. */}
      <Suspense
        fallback={
          <div
            className="h-full w-full rounded-full border-ink/6"
            style={{ borderWidth: thickness }}
          />
        }
      >
        <SharePieChart data={data} size={size} thickness={thickness} />
      </Suspense>

      {(centerValue != null || centerLabel) && (
        // Центр диаграммы кликов не ловит — иначе он перекрыл бы наведение.
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue != null && (
            <span className="font-display text-xl font-semibold text-ink tnum">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-[11px] text-ink-muted">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
