import { NavLink } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { NAV } from '@/lib/nav.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { Logo } from '@/components/Logo.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { cn } from '@/lib/cn.js'

export function Sidebar({ onNavigate, collapsed = false }) {
  const { user, isViewer } = useAuth()
  const { advertiserById } = useData()
  const items = NAV.filter((n) => !n.hidden && n.roles.includes(user.role))
  const adv = user.advertiserId ? advertiserById(user.advertiserId) : null

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-line bg-surface py-5 transition-[width] duration-200',
        collapsed ? 'w-[84px] px-3' : 'w-[252px] px-4',
      )}
    >
      {/* Хедер */}
      <div
        className={cn(
          'flex items-center pb-5',
          collapsed ? 'justify-center' : 'px-2',
        )}
      >
        <Logo withWord={!collapsed} />
      </div>
      <div className="h-px bg-line" />

      {/* Навигация */}
      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {!collapsed && (
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Меню
          </p>
        )}
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
            title={collapsed ? it.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center px-0' : 'px-3',
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
                    'shrink-0 transition-colors',
                    isActive
                      ? 'text-ink'
                      : 'text-ink-muted group-hover:text-ink-soft',
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1">{it.label}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Профиль */}
      <div
        className={cn(
          'mt-4 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3',
          collapsed && 'justify-center px-0',
        )}
        title={collapsed ? (adv ? adv.name : user.name) : undefined}
      >
        <Avatar
          name={adv ? adv.name : user.name}
          color={adv ? adv.color : '#FFD106'}
          src={adv?.logo}
          size="md"
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">
              {adv ? adv.name : user.name}
            </p>
            {/* Наблюдателю сразу видно, что правки недоступны. */}
            {isViewer ? (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                <Eye size={11} />
                Только просмотр
              </span>
            ) : (
              <p className="truncate text-[11px] text-ink-muted">
                {adv ? adv.email : user.email}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
