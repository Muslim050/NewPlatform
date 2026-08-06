import { cn } from '@/lib/cn.js'

export function Logo({ size = 32, withWord = true, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden bg-black shadow-pop"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
          <path
            fill="#FFD106"
            d="M0 80h80V0H0Zm45.238-19.048H22.381a.953.953 0 0 1-.952-.952V42.857a.952.952 0 0 1 .952-.952h22.857a9.524 9.524 0 1 1 0 19.048Zm13.333-23.81a.953.953 0 0 1-.952.952H34.762a9.524 9.524 0 0 1 0-19.048h22.857a.953.953 0 0 1 .952.952Z"
          />
        </svg>
      </div>
      {withWord && (
        <span className="flex min-w-0 flex-col font-display uppercase text-ink">
          <span
            className="whitespace-nowrap font-bold leading-[0.95] tracking-[-0.02em]"
            style={{ fontSize: Math.max(20, size * 0.34) }}
          >
            Setanta Sports
          </span>
          <span
            className="mt-1 whitespace-nowrap font-medium leading-none tracking-[0.2em] text-ink-muted"
            style={{ fontSize: Math.max(14, size * 0.2) }}
          >
            Platform
          </span>
        </span>
      )}
    </div>
  )
}
