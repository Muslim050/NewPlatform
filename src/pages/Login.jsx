import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, TrendingUp, Eye } from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { Logo } from '@/components/Logo.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input } from '@/components/ui/Field.jsx'
import { Sparkline } from '@/components/charts/Sparkline.jsx'

export default function Login() {
  const { login } = useAuth()
  const { advertisers } = useData()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const login_ = username.trim().toLowerCase()

    if (login_ === 'admin' && password === 'admin') {
      login({ role: 'admin', name: 'admin', email: 'admin@bloom.io' })
      navigate('/app')
      return
    }

    if (login_ === 'adv' && password === 'adv') {
      const a = advertisers[0]
      login({
        role: 'advertiser',
        advertiserId: a.id,
        name: a.contact,
        email: a.email,
      })
      navigate('/app')
      return
    }

    setError('Неверный логин или пароль')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Левая колонка — вход */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Logo size={40} />

          <div className="mt-10">
            <h1 className="text-display-md text-ink sm:text-display-lg">
              С возвращением
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Войдите в платформу. Это демо — данные хранятся локально в вашем
              браузере.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Логин">
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                placeholder="admin"
                autoComplete="username"
                autoFocus
              />
            </Field>

            <Field label="Пароль" error={error}>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="••••••"
                autoComplete="current-password"
              />
            </Field>

            <Button size="lg" variant="primary" type="submit" className="w-full">
              Войти в платформу
              <ArrowRight size={18} />
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-muted">
            Демо-доступы: <span className="font-medium text-ink-soft">admin / admin</span>{' '}
            или <span className="font-medium text-ink-soft">adv / adv</span>
          </p>
        </motion.div>
      </div>

      {/* Правая колонка — витрина */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        {/* Фоновая глубина: брендовое свечение и мягкие блики */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(115% 80% at 12% -5%, rgba(79,70,229,0.34), transparent 55%), radial-gradient(90% 75% at 106% 108%, rgba(194,232,52,0.15), transparent 55%)',
          }}
        />
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-indigo-500/25 blur-[120px]" />
        <div className="absolute -right-16 bottom-4 h-72 w-72 rounded-full bg-lime-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid-fade [background-size:22px_22px] opacity-[0.35] [mask-image:radial-gradient(130%_100%_at_20%_10%,black,transparent_70%)]" />

        <div className="relative flex h-full flex-col justify-between p-12">
          {/* Верх: подпись и тезис */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15">
                <Sparkles size={16} className="text-lime-300" />
              </span>
              <span className="text-sm font-medium text-white/75">
                Платформа медиабаинга
              </span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 max-w-md font-display text-[2.1rem] font-semibold leading-[1.14] text-white"
            >
              Кампании, площадки и бюджеты{' '}
              <span className="text-lime-300">в одном месте</span>
            </motion.h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
              Планируйте медиабаинг, следите за расходом и эффективностью по всем
              каналам в реальном времени.
            </p>
          </div>

          {/* Центр: превью метрик */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl shadow-[0_28px_70px_-30px_rgba(0,0,0,0.75)]"
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Расход за месяц</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-lime-300 px-2.5 py-1 text-[11px] font-semibold text-ink">
                  <TrendingUp size={12} strokeWidth={2.5} />
                  18,4%
                </span>
              </div>
              <div className="mt-3 font-display text-[2.75rem] font-semibold leading-none text-white tnum">
                24,8 млн
              </div>
              <div className="mt-5">
                <Sparkline
                  data={[40, 52, 48, 61, 58, 72, 69, 84, 92]}
                  color="#C2E834"
                  width={400}
                  height={64}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.6 }}
              className="grid max-w-md grid-cols-2 gap-4"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300/15 text-lime-300">
                  <TrendingUp size={18} />
                </span>
                <div className="mt-3 font-display text-2xl font-semibold text-white tnum">
                  3,42%
                </div>
                <div className="mt-0.5 text-xs text-white/55">Средний CTR</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/25 text-indigo-200">
                  <Eye size={18} />
                </span>
                <div className="mt-3 font-display text-2xl font-semibold text-white tnum">
                  61 млн
                </div>
                <div className="mt-0.5 text-xs text-white/55">Показов за месяц</div>
              </div>
            </motion.div>
          </div>

          {/* Низ: каналы */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Все каналы в одном окне
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['CTV', 'ТВ', 'Web', 'Mobile', 'Social', 'Audio'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
