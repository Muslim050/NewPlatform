import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, VolumeX } from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { Logo } from '@/components/Logo.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input } from '@/components/ui/Field.jsx'

const TV_SPOTS = [
  '/creatives/bloom-reach.mp4',
  '/creatives/bloom-channels.mp4',
  '/creatives/bloom-results.mp4',
]

function TvShowcase() {
  const [activeSpot, setActiveSpot] = useState(0)

  const playNextSpot = () => {
    setActiveSpot((current) => (current + 1) % TV_SPOTS.length)
  }

  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#f7eadf] lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_9%,rgba(255,255,255,0.92),transparent_29%),radial-gradient(circle_at_7%_52%,rgba(79,70,229,0.10),transparent_31%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/80" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-40 px-10 pt-10 xl:px-14 xl:pt-12"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/55 px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-soft backdrop-blur-md">
          <Sparkles size={14} className="text-indigo-600" />
          Bloom CTV
        </div>
        <h2 className="mt-5 max-w-xl font-display text-[clamp(2rem,3vw,3.35rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink">
          Реклама, которую{' '}
          <span className="text-indigo-600">видят вместе.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft/80 xl:text-[15px]">
          Управляйте размещениями на ТВ и digital-площадках из одного кабинета.
        </p>
      </motion.div>

      <div className="absolute bottom-0 left-1/2 z-20 aspect-[1672/941] w-[112%] max-w-[1120px] -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 1.025, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-full w-full"
        >
          <img
            src="/family-tv-console.png"
            alt="Семья смотрит телевизор"
            className="absolute inset-0 h-full w-full select-none object-contain"
            draggable="false"
          />

          <div
            className="absolute z-10 overflow-hidden bg-[#111214] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            style={{ left: '32.05%', top: '13.2%', width: '36.13%', height: '34.22%' }}
          >
            <motion.video
              key={TV_SPOTS[activeSpot]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
              src={TV_SPOTS[activeSpot]}
              className="h-full w-full object-cover"
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={playNextSpot}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.12),transparent_25%,transparent_72%,rgba(0,0,0,0.16))]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/45 to-transparent px-[3.5%] pb-[3%] pt-[9%] text-white">
              <span className="flex items-center gap-1.5 text-[clamp(5px,0.62vw,10px)] font-semibold uppercase tracking-[0.16em]">
                <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" />
                В эфире
              </span>
              <span className="flex items-center gap-1 text-white/70">
                <VolumeX className="h-[clamp(7px,0.8vw,12px)] w-[clamp(7px,0.8vw,12px)]" />
                <span className="text-[clamp(5px,0.58vw,9px)] tabular-nums">
                  {String(activeSpot + 1).padStart(2, '0')} / {String(TV_SPOTS.length).padStart(2, '0')}
                </span>
              </span>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[16%] bg-gradient-to-b from-[#f7eadf] to-transparent opacity-35" />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 h-20 bg-gradient-to-t from-[#b98868]/20 to-transparent" />
    </aside>
  )
}

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
    <main className="grid min-h-screen bg-paper lg:grid-cols-[minmax(420px,0.84fr)_minmax(0,1.16fr)]">
      <section className="relative z-50 flex items-center justify-center px-6 py-12 shadow-[18px_0_55px_rgba(45,30,20,0.06)] sm:px-10 lg:bg-paper">
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
      </section>

      <TvShowcase />
    </main>
  )
}
