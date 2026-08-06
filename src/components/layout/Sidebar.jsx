import { NavLink } from 'react-router-dom'
import { NAV } from '@/lib/nav.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { Logo } from '@/components/Logo.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { cn } from '@/lib/cn.js'

export function Sidebar({ onNavigate }) {
  const { user } = useAuth()
  const { advertiserById } = useData()
  const items = NAV.filter((n) => n.roles.includes(user.role))
  const adv = user.advertiserId ? advertiserById(user.advertiserId) : null

  return (
    <aside className="flex h-full w-[252px] flex-col border-r border-line bg-surface px-4 py-5">
      {/* Хедер */}
      <div className="px-2 pb-5">
        <Logo />
      </div>
      <div className="h-px bg-line" />

      {/* Навигация */}
      <nav className="mt-6 flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Меню
        </p>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-indigo-500 text-ink shadow-[0_10px_24px_-10px_rgba(255,209,6,0.72)]'
                  : 'text-ink-soft hover:bg-paper hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <it.icon
                  size={18}
                  strokeWidth={2}
                  className={cn(
                    'transition-colors',
                    isActive
                      ? 'text-ink'
                      : 'text-ink-muted group-hover:text-ink-soft',
                  )}
                />
                <span className="flex-1">{it.label}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Профиль */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3">
        <Avatar
          name={adv ? adv.name : user.name}
          color={adv ? adv.color : '#FFD106'}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">
            {adv ? adv.name : user.name}
          </p>
          <p className="truncate text-[11px] text-ink-muted">
            {adv ? adv.email : user.email}
          </p>
        </div>
      </div>
    </aside>
  )
}
