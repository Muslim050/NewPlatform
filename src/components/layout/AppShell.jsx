import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'

export function AppShell() {
  const [mobileNav, setMobileNav] = useState(false)
  const loc = useLocation()

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Десктопный сайдбар */}
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar />
      </div>

      {/* Мобильный выезжающий сайдбар */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-ink/40 backdrop-blur-[3px]"
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              className="absolute inset-y-0 left-0 bg-paper shadow-lift"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            >
              <Sidebar onNavigate={() => setMobileNav(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onBurger={() => setMobileNav(true)} />
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-[1240px]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
