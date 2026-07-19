import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react'
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
        <div className="absolute inset-0 bg-aurora opacity-90" />
        <div className="absolute inset-0 bg-grid-fade [background-size:26px_26px] opacity-40" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2 text-white/70">
            <Sparkles size={18} className="text-lime-300" />
            <span className="text-sm font-medium">Платформа медиабаинга</span>
          </div>

          <div className="space-y-8">
            {/* Плавающие превью-карточки */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-sm rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Расход за месяц</span>
                <span className="rounded-full bg-lime-300/90 px-2 py-0.5 text-[11px] font-semibold text-ink">
                  +18,4%
                </span>
              </div>
              <div className="mt-2 font-display text-4xl font-semibold text-white tnum">
                24,8 млн
              </div>
              <div className="mt-4">
                <Sparkline
                  data={[40, 52, 48, 61, 58, 72, 69, 84, 92]}
                  color="#C2E834"
                  width={280}
                  height={56}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="ml-10 flex max-w-xs items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-lime-300">
                <TrendingUp size={22} />
              </span>
              <div>
                <div className="font-display text-2xl font-semibold text-white tnum">
                  3,42%
                </div>
                <div className="text-xs text-white/60">Средний CTR портфеля</div>
              </div>
            </motion.div>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-2xl font-semibold leading-tight text-white">
              Управляйте кампаниями, площадками и бюджетами в одном месте.
            </h2>
          </div>
        </div>
      </div>
    </div>
  )
}
