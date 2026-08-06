import { cn } from '@/lib/cn.js'
import { initials as toInitials } from '@/lib/format.js'

const sizes = {
  sm: 'h-8 w-8 text-[11px] rounded-lg',
  md: 'h-10 w-10 text-xs rounded-xl',
  lg: 'h-12 w-12 text-sm rounded-xl',
}

/** Аватар с инициалами на цветной подложке. */
export function Avatar({ name = '', color = '#FFD106', size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold ring-1 ring-black/5',
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(140deg, ${color}, ${shade(color, -18)})`,
        color: contrastColor(color),
      }}
    >
      {toInitials(name)}
    </span>
  )
}

function contrastColor(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = n >> 16
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return r * 0.299 + g * 0.587 + b * 0.114 > 165 ? '#17161C' : '#FFFFFF'
}

// Простое затемнение hex-цвета для градиента.
function shade(hex, percent) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (n >> 16) + percent))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + percent))
  const b = Math.max(0, Math.min(255, (n & 0xff) + percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
