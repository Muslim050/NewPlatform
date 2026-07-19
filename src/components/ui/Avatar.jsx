import { cn } from '@/lib/cn.js'
import { initials as toInitials } from '@/lib/format.js'

const sizes = {
  sm: 'h-8 w-8 text-[11px] rounded-lg',
  md: 'h-10 w-10 text-xs rounded-xl',
  lg: 'h-12 w-12 text-sm rounded-xl',
}

/** Аватар с инициалами на цветной подложке. */
export function Avatar({ name = '', color = '#4F46E5', size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold text-white ring-1 ring-black/5',
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(140deg, ${color}, ${shade(color, -18)})`,
      }}
    >
      {toInitials(name)}
    </span>
  )
}

// Простое затемнение hex-цвета для градиента.
function shade(hex, percent) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (n >> 16) + percent))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + percent))
  const b = Math.max(0, Math.min(255, (n & 0xff) + percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
