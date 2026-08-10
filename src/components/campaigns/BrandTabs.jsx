import { useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { cn } from '@/lib/cn.js'

/**
 * Вкладки брендов над таблицей кампаний: переносятся по строкам, чтобы все
 * бренды были на виду. На узких экранах — лента с прокруткой.
 * items: [{ id, name, color, count, sent }], value, onChange
 */
export function BrandTabs({ items, value, onChange, className }) {
  const listRef = useRef(null)
  const activeRef = useRef(null)
  // Выбранный бренд может уехать за край — подтягиваем его в кадр.
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
        'no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-2.5 md:flex-wrap md:overflow-visible',
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
              'flex shrink-0 relative items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-3 transition-colors focus-ring',
              active
                ? 'border-ink/15 bg-ink/[0.06]'
                : 'border-line bg-surface hover:bg-ink/[0.03]',
            )}
          >
            {/* На месте инициалов — счётчик кампаний бренда. */}
            {b.color ? (
              <Avatar name={b.name} color={b.color} size="sm" className="tnum">
                {b.count}
              </Avatar>
            ) : (
              // Вкладка «Все» — без бренда, поэтому подложка нейтральная.
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-[11px] font-semibold text-ink-soft tnum">
                {b.count}
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
            {/* Зелёная метка — сколько кампаний бренда идёт прямо сейчас. */}
            {b.active > 0 && (
              <span
                className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 text-[11px] font-medium text-emerald-700 tnum"
                title={`Активных кампаний: ${b.active}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {b.active}
              </span>
            )}
            {/* Синяя метка со счётчиком — у бренда есть неразобранные заявки. */}
            {b.sent > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4"
                title={`Новых заявок: ${b.sent}`}
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-paper tnum">
                  {b.sent}
                </span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
