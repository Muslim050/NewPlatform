import { cn } from '@/lib/cn.js'

export function Logo({ size = 32, withWord = true, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-indigo-600 shadow-pop"
        style={{ width: size, height: size }}
      >
        <span
          className="font-display font-bold leading-none text-lime-300"
          style={{ fontSize: size * 0.5 }}
        >
          B
        </span>
      </div>
      {withWord && (
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          Bloom
        </span>
      )}
    </div>
  )
}
