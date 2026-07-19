import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn.js'

/**
 * items: [{ label, icon, onClick, tone? }]
 */
export function DropdownMenu({ items, trigger, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink focus-ring',
          open && 'bg-ink/[0.06] text-ink',
        )}
      >
        {trigger || <MoreHorizontal size={18} />}
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-lift',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOpen(false)
                it.onClick()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                it.tone === 'danger'
                  ? 'text-danger hover:bg-danger/[0.08]'
                  : 'text-ink-soft hover:bg-ink/[0.05] hover:text-ink',
              )}
            >
              {it.icon && <it.icon size={15} />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
