import { cn } from '@/lib/cn.js'

export interface SkeletonProps {
  className?: string
  /** Круглая заглушка — под аватар. */
  circle?: boolean
}

/**
 * Заглушка на время загрузки: серая плашка с бегущим бликом.
 * Размеры задаются снаружи через className, чтобы скелетон повторял
 * геометрию настоящего блока и страница не дёргалась при подстановке данных.
 */
export function Skeleton({ className, circle = false }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden bg-ink/6',
        circle ? 'rounded-full' : 'rounded-lg',
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/70 to-transparent" />
    </div>
  )
}
