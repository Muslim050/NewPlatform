import { Link } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import { NAV } from '@/lib/nav.js'
import { useAuth } from '@/features/auth/useAuth'
// Бренд рекламодателя берём с сервера:
import { useAdvertiser } from '@/features/advertisers/queries'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { userSubtitle, userTitle } from '@/features/auth/user'
import { cn } from '@/lib/cn.js'

export function Sidebar({ onNavigate, collapsed = false }) {
  const { user, isViewer } = useAuth()
  const { data: adv } = useAdvertiser(user?.advertiserId)
  const items = NAV.filter((n) => !n.hidden && n.roles.includes(user?.role))

  // Рекламодателя подписываем его брендом, остальных — данными учётной записи.
  const title = adv ? adv.name : userTitle(user)
  const subtitle = adv ? adv.email : userSubtitle(user)

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
          <Link
            key={it.to}
            to={it.to}
            activeOptions={{ exact: it.end ?? false }}
            onClick={onNavigate}
            title={collapsed ? it.label : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200',
              collapsed ? 'justify-center px-0' : 'px-3',
            )}
            activeProps={{
              className:
                'bg-indigo-500 text-ink shadow-[0_10px_24px_-10px_rgba(255,209,6,0.72)]',
            }}
            inactiveProps={{
              className: 'text-ink-soft hover:bg-paper hover:text-ink',
            }}
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
          </Link>
        ))}
      </nav>

      {/* Профиль */}
      <div
        className={cn(
          'mt-4 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3',
          collapsed && 'justify-center px-0',
        )}
        title={collapsed ? title : undefined}
      >
        <Avatar
          name={title}
          color={adv ? adv.color : '#FFD106'}
          src={adv?.logo}
          size="md"
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">
              {title}
            </p>
            {/* Наблюдателю сразу видно, что правки недоступны. */}
            {isViewer ? (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-ink/6 px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                <Eye size={11} />
                Только просмотр
              </span>
            ) : (
              subtitle && (
                <p className="truncate text-[11px] text-ink-muted">
                  {subtitle}
                </p>
              )
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
