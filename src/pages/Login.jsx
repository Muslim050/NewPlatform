import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, Radio, Sparkles, TrendingUp, VolumeX } from 'lucide-react'
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
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#090b13] lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_64%,rgba(79,70,229,0.42),transparent_27%),radial-gradient(circle_at_93%_12%,rgba(194,232,52,0.12),transparent_24%),radial-gradient(circle_at_5%_88%,rgba(79,70,229,0.20),transparent_30%)]" />
      <div className="absolute inset-0 bg-grid-fade [background-size:24px_24px] opacity-[0.22] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <div className="absolute left-1/2 top-[48%] h-[46vw] max-h-[720px] w-[46vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/10" />
      <div className="absolute left-1/2 top-[48%] h-[34vw] max-h-[530px] w-[34vw] max-w-[530px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/[0.07]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-40 px-10 pt-10 xl:px-14 xl:pt-12"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/70 shadow-soft backdrop-blur-md">
          <Sparkles size={14} className="text-lime-300" />
          Bloom CTV
        </div>
        <h2 className="mt-5 max-w-xl font-display text-[clamp(2rem,3vw,3.35rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-white">
          Реклама, которую{' '}
          <span className="text-lime-300">видят вместе.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50 xl:text-[15px]">
          Управляйте размещениями на ТВ и digital-площадках из одного кабинета.
        </p>
        <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-white/35">
          <Radio size={14} className="text-indigo-300" />
          <span>CTV</span>
          <i className="h-1 w-1 rounded-full bg-white/20" />
          <span>YouTube</span>
          <i className="h-1 w-1 rounded-full bg-white/20" />
          <span>Digital</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0, y: [0, -5, 0] }}
        transition={{ opacity: { delay: 0.7, duration: 0.5 }, x: { delay: 0.7, duration: 0.5 }, y: { delay: 1.2, duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
        className="absolute left-[5%] top-[39%] z-40 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#111522]/75 px-4 py-3 shadow-[0_20px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl 2xl:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
          <Eye size={17} />
        </span>
        <div>
          <div className="font-display text-lg font-semibold leading-none text-white tnum">61 млн</div>
          <div className="mt-1 text-[10px] text-white/40">показов за месяц</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0, y: [0, 5, 0] }}
        transition={{ opacity: { delay: 0.8, duration: 0.5 }, x: { delay: 0.8, duration: 0.5 }, y: { delay: 1.5, duration: 5.5, repeat: Infinity, ease: 'easeInOut' } }}
        className="absolute right-[5%] top-[46%] z-40 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#111522]/75 px-4 py-3 shadow-[0_20px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl 2xl:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300/15 text-lime-300">
          <TrendingUp size={17} />
        </span>
        <div>
          <div className="font-display text-lg font-semibold leading-none text-white tnum">3,42%</div>
          <div className="mt-1 text-[10px] text-white/40">средний CTR</div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-1/2 z-20 aspect-[1672/941] w-[132%] -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 1.025, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-full w-full"
        >
          <img
            src="/family-tv-cutout.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 z-10 h-full w-full select-none object-contain"
            draggable="false"
          />

          <div
            className="absolute z-20 overflow-hidden bg-[#050607] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            style={{ left: '33.5%', top: '20.2%', width: '32.5%', height: '31.25%' }}
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
          <img
            src="/family-sofa-cutout.png"
            alt="Семья смотрит телевизор"
            className="pointer-events-none absolute inset-0 z-30 h-full w-full select-none object-contain"
            draggable="false"
          />
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 h-16 bg-gradient-to-t from-black/30 to-transparent" />
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
      <section className="relative z-50 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_18%,rgba(79,70,229,0.09),transparent_31%),linear-gradient(145deg,#faf9f6,#f3f1ec)] px-6 py-12 shadow-[18px_0_55px_rgba(0,0,0,0.18)] sm:px-10">
        <div className="pointer-events-none absolute -left-28 top-[18%] h-64 w-64 rounded-full border border-indigo-500/[0.06]" />
        <div className="pointer-events-none absolute -left-16 top-[23%] h-40 w-40 rounded-full border border-indigo-500/[0.08]" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[520px] lg:rounded-[32px] lg:border lg:border-white/90 lg:bg-white/65 lg:p-10 lg:shadow-[0_32px_90px_-48px_rgba(34,27,80,0.42)] lg:backdrop-blur-xl"
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
