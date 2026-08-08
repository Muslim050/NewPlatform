import { useEffect, useRef } from 'react'
import { LayoutGrid } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { cn } from '@/lib/cn.js'

/**
 * Вкладки брендов над таблицей кампаний.
 * На узких экранах — лента с прокруткой, на широких переносится по строкам,
 * чтобы все бренды были на виду.
 * items: [{ id, name, color, count }], value, onChange
 */
export function BrandTabs({ items, value, onChange, className }) {
  const listRef = useRef(null)
  const activeRef = useRef(null)

  // В режиме ленты выбранный бренд может уехать за край — подтягиваем его в кадр.
  useEffect(() => {
    const list = listRef.current
    const tab = activeRef.current
    if (!list || !tab) return
    const left = tab.offsetLeft
    const right = left + tab.offsetWidth
    if (left < list.scrollLeft) {
      list.scrollTo({ left: left - 8, behavior: 'smooth' })
    } else if (right > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: right - list.clientWidth + 8, behavior: 'smooth' })
    }
  }, [value])

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Бренды"
      className={cn(
        'no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible',
        className,
      )}
    >
      {items.map((b) => {
        const active = b.id === value
        return (
          <button
            key={b.id}
            ref={active ? activeRef : null}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(b.id)}
            title={b.name}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-3 transition-colors focus-ring',
              active
                ? 'border-ink/15 bg-ink/[0.06]'
                : 'border-line bg-surface hover:bg-ink/[0.03]',
            )}
          >
            {b.color ? (
              <Avatar name={b.name} color={b.color} size="sm" />
            ) : (
              // Вкладка «Все» — без бренда, поэтому вместо аватара иконка.
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-ink-soft">
                <LayoutGrid size={15} />
              </span>
            )}
            <span
              className={cn(
                'max-w-[140px] truncate text-[13px] font-medium',
                active ? 'text-ink' : 'text-ink-soft',
              )}
            >
              {b.name}
            </span>
            <span
              className={cn(
                'rounded-full px-1.5 text-[11px] tnum',
                active ? 'bg-ink/10 text-ink' : 'bg-ink/[0.06] text-ink-muted',
              )}
            >
              {b.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
