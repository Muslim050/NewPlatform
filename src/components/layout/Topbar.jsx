import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { NAV } from '@/lib/nav.js'
import { Avatar } from '@/components/ui/Avatar.jsx'

export function Topbar({ onBurger }) {
  const { user, logout } = useAuth()
  const { advertiserById } = useData()
  const loc = useLocation()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const active =
    [...NAV]
      .filter((n) =>
        n.to === '/app' ? loc.pathname === '/app' : loc.pathname.startsWith(n.to),
      )
      .sort((a, b) => b.to.length - a.to.length)[0] || NAV[0]

  const adv = user.advertiserId ? advertiserById(user.advertiserId) : null

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line glass px-5 sm:px-8">
      <button
        onClick={onBurger}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-ink/[0.05] lg:hidden focus-ring"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <h2 className="truncate font-display text-base font-semibold text-ink">
          {active.label}
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-ink/[0.05] focus-ring">
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-lime-400 ring-2 ring-paper" />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenu((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-transparent p-1 pr-2 transition-colors hover:bg-ink/[0.04] focus-ring"
          >
            <Avatar
              name={adv ? adv.name : user.name}
              color={adv ? adv.color : '#FFD106'}
              size="sm"
            />
            <ChevronDown size={15} className="text-ink-muted" />
          </button>

          {menu && (
            <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-ink">
                  {adv ? adv.name : user.name}
                </p>
                <p className="truncate text-xs text-ink-muted">{user.email}</p>
              </div>
              <div className="my-1 h-px bg-line" />
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/[0.08]"
              >
                <LogOut size={15} />
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
