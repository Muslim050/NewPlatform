import { Logo } from '@/components/Logo'
import { cn } from '@/lib/cn.js'

/**
 * Ожидание с фирменным знаком: логотип в центре, вокруг бежит круг.
 * `full` растягивает лоадер на весь экран — это состояние загрузки
 * приложения, когда рисовать ещё нечего.
 *
 * @param {{
 *   label?: string,
 *   size?: number,
 *   full?: boolean,
 *   className?: string,
 * }} props
 */
export function Loader({ label, size = 56, full = false, className }) {
  // Кольцо крупнее знака: между ними остаётся воздух, иначе дуга липнет
  // к логотипу и читается как рамка.
  const ring = Math.round(size * 1.9)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        full ? 'min-h-screen bg-paper' : 'py-16',
        className,
      )}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: ring, height: ring }}
      >
        {/* Дорожка кольца — бледная, поверх неё бежит жёлтая дуга. */}
        <span className="absolute inset-0 rounded-full border-2 border-ink/8" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#FFD106] border-r-[#FFD106]/40" />
        <Logo size={size} withWord={false} />
      </div>

      {label && <p className="text-[13px] text-ink-muted">{label}</p>}
      <span className="sr-only">Загрузка</span>
    </div>
  )
}
